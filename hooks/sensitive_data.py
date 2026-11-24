#!/usr/bin/env python3
"""Replace sensitive values in text with numbered placeholders.

redact(text, config) returns the text with each secret or personal identifier
swapped for [<type>_<N>], and a count of distinct values per type. The same
value gets the same number within one call; numbering restarts on every call.

Detection is regex plus a checksum where the format has one (Luhn, CPF, CNPJ,
IBAN mod-97), so look-alikes such as UUIDs, SHAs and bad numbers pass through.
Every pattern is linear: runs are anchored by a lookbehind or a literal, and
nothing nests an unbounded quantifier, so a 1 MB hostile input stays fast.
"""

import json
import os
import re
import sys

# Highest priority first. When two matches overlap, the earlier type keeps the
# text, so a token inside an env assignment becomes api_token, not env_secret.
CONTACT_TYPES = ("email", "phone")

DUMMY = re.compile(
    r"changeme|your-.*|<.*>|xxx.*|example|todo|none|null|test", re.I | re.S
)
ENV_WORDS = ("_KEY", "_SECRET", "_TOKEN", "PASSWORD")


def _is_dummy(value):
    return len(value) < 4 or value.startswith("$") or bool(DUMMY.fullmatch(value))


def _digits(value):
    return re.sub(r"\D", "", value)


def _luhn(digits):
    total = 0
    for i, ch in enumerate(reversed(digits)):
        n = int(ch)
        if i % 2:
            n = n * 2 - 9 if n > 4 else n * 2
        total += n
    return total % 10 == 0


def _card_ok(value):
    d = _digits(value)
    return 13 <= len(d) <= 19 and len(set(d)) > 1 and _luhn(d)


def _cpf_ok(value):
    d = [int(c) for c in _digits(value)]
    if len(set(d)) == 1:
        return False
    for n in (9, 10):
        check = sum(d[i] * (n + 1 - i) for i in range(n)) * 10 % 11 % 10
        if d[n] != check:
            return False
    return True


def _cnpj_ok(value):
    d = [int(c) for c in _digits(value)]
    if len(set(d)) == 1:
        return False
    weights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for n in (12, 13):
        w = weights if n == 12 else [6] + weights
        rest = sum(a * b for a, b in zip(d, w)) % 11
        if d[n] != (0 if rest < 2 else 11 - rest):
            return False
    return True


def _ssn_ok(value):
    area, group, serial = value.split("-")
    return (
        area not in ("000", "666")
        and area[0] != "9"
        and group != "00"
        and serial != "0000"
    )


def _iban_key(value):
    return re.sub(r"[^A-Za-z0-9]", "", value).upper()


def _iban_ok(value):
    s = _iban_key(value)
    if not 15 <= len(s) <= 34:
        return False
    moved = s[4:] + s[:4]
    return int("".join(str(int(c, 36)) for c in moved)) % 97 == 1


def _scan(pattern, group=0, flags=0, check=None, norm=None):
    rx = re.compile(pattern, flags)

    def find(text):
        for m in rx.finditer(text):
            value = m.group(group)
            if check and not check(value):
                continue
            yield m.start(group), m.end(group), norm(value) if norm else value

    return find


_PEM_BEGIN = re.compile(r"-----BEGIN ([A-Z ]*PRIVATE KEY(?: BLOCK)?)-----")


def _private_keys(text):
    # str.find, not a lazy regex: an unterminated header would rescan to the
    # end of the text once per header. A label with no END is remembered.
    missing = set()
    pos = 0
    while True:
        m = _PEM_BEGIN.search(text, pos)
        if not m:
            return
        pos = m.end()
        label = m.group(1)
        if label in missing:
            continue
        tail = "-----END %s-----" % label
        i = text.find(tail, pos)
        if i < 0:
            missing.add(label)
            continue
        end = i + len(tail)
        yield m.start(), end, text[m.start() : end]
        pos = end


# Name is matched as one run and checked in Python: a regex that searched the
# run for a keyword would backtrack quadratically on "_KEY_KEY_KEY...".
# The value is a quoted string, or a bare run to the end of the line.
_ENV = re.compile(
    r"(?<![A-Za-z0-9_-])([A-Za-z0-9_-]+)[\"']?[ \t]*[=:][ \t]*"
    r"(?:\"((?:[^\"\\\n]|\\.)*)\"|'((?:[^'\\\n]|\\.)*)'|([^\n]*))"
)
_NAME_WORDS = ("password", "passwd", "secret", "token")
# Uppercase whole segments of the name: AUTHOR is not AUTH, COMPASS is not PASS.
_NAME_SEGMENTS = frozenset(("PASS", "PWD", "AUTH"))
_SEGMENT_SPLIT = re.compile(r"[_-]")
# A bare value that reads as a variable: snake_case or camelCase.
_REF_SHAPE = re.compile(r"_|[a-z][A-Z]")
_SPACED_EQ = re.compile(r"[ \t]=[ \t]")
_KEY_SUFFIX = re.compile(r"(?:_|[a-z0-9]K|apik)(?:ey|EY)$|_key$|(?i:apikey)$")
# A bare value that is code, not data: a call, an index (checked inline), or a
# dotted reference.
_DOTTED = re.compile(r"[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+")
_IDENT = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


def _secret_name(name):
    name = name.replace("-", "_")
    if not _NAME_SEGMENTS.isdisjoint(_SEGMENT_SPLIT.split(name)):
        return True
    if any(w in name for w in ENV_WORDS):
        return True
    low = name.lower()
    return any(w in low for w in _NAME_WORDS) or bool(
        len(name) > 3 and _KEY_SUFFIX.search(name)
    )


def _upper_name(name):
    return any(w in name for w in ENV_WORDS) or (
        name == name.upper() and name != name.lower()
    )


def _env_secrets(text):
    for m in _ENV.finditer(text):
        if not _secret_name(m.group(1)):
            continue
        g = m.lastindex
        start, end = m.start(g), m.end(g)
        value = m.group(g)
        if g == 4:
            value = value.rstrip(" \t\r;,")
            end = start + len(value)
            if "(" in value or "[" in value or _DOTTED.fullmatch(value):
                continue
            # `password = secret_var`: a variable reference in code. The
            # uppercase .env rule and the `:` separator keep their values, and
            # so does a config line (`Password=hunter22`: no indent, no spaces
            # around `=`) unless the value is shaped like a variable.
            sep = text[m.end(1) : start]
            if (
                not _upper_name(m.group(1))
                and "=" in sep
                and _IDENT.fullmatch(value)
                and (
                    _REF_SHAPE.search(value)
                    or _SPACED_EQ.search(sep)
                    or text[text.rfind("\n", 0, m.start(1)) + 1] in " \t"
                )
            ):
                continue
        if not _is_dummy(value):
            yield start, end, value


def _first(*finders):
    def find(text):
        for f in finders:
            yield from f(text)

    return find


_B = r"(?<![A-Za-z0-9])"

_API_TOKEN = (
    _B + r"(?:gh[pousr]_[A-Za-z0-9]{36,}"
    r"|github_pat_[A-Za-z0-9_]{50,}"
    r"|glpat-[A-Za-z0-9_-]{20,}"
    r"|xox[abprs]-[A-Za-z0-9-]{20,}"
    r"|[sr]k_live_[A-Za-z0-9]{20,}"
    r"|sk-(?:ant|proj)-[A-Za-z0-9_-]{20,}"
    r"|sk-[A-Za-z0-9_-]{32,}"
    r"|npm_[A-Za-z0-9]{36,}"
    r"|pypi-[A-Za-z0-9_-]{50,}"
    r"|SG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}"
    r"|SK[0-9a-f]{32}(?![A-Za-z0-9]))"
)

# (type, literals one of which must appear for the type to be possible, finder)
DETECTORS = [
    ("private_key", ("-----BEGIN",), _private_keys),
    (
        "db_url",
        ("://",),
        _scan(
            r"(?<![A-Za-z0-9+.-])[A-Za-z][A-Za-z0-9+.-]*://[^\s:/@]+:[^\s@/]+"
            r"@[^\s'\"<>)]+"
        ),
    ),
    (
        "aws_key",
        None,
        _first(
            _scan(_B + r"(?:AKIA|ASIA)[A-Z0-9]{16}(?![A-Za-z0-9])"),
            _scan(
                r"aws_?secret_?access_?key[\"']?\s*[:=]\s*[\"']?"
                r"([A-Za-z0-9/+=]{40})(?![A-Za-z0-9/+=])",
                1,
                re.I,
            ),
        ),
    ),
    (
        "cloud_credential",
        None,
        _first(
            _scan(
                r"private_key_id[\"']?\s*[:=]\s*[\"']?([0-9a-f]{40})(?![A-Za-z0-9])",
                1,
                re.I,
            ),
            _scan(r"AccountKey=([A-Za-z0-9+/]{40,}={0,2})", 1),
        ),
    ),
    ("api_token", None, _scan(_API_TOKEN)),
    (
        "jwt",
        ("eyJ",),
        _scan(
            r"(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}"
            r"\.[A-Za-z0-9_-]{5,}"
        ),
    ),
    (
        "auth_config",
        None,
        _first(
            _scan(r"_(?:authToken|auth|password)=([^\s\"'$][^\s\"']*)", 1),
            _scan(r"login[ \t]+\S+\s+password[ \t]+(\S+)", 1),
            _scan(r"\"auth\"\s*:\s*\"([^\"\s]+)\"", 1),
            _scan(r"client-key-data\"?\s*:\s*\"?([A-Za-z0-9+/=]{8,})", 1),
        ),
    ),
    ("env_secret", None, _env_secrets),
    (
        "cnpj",
        None,
        _scan(
            r"(?<!\d)\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}(?!\d)",
            check=_cnpj_ok,
            norm=_digits,
        ),
    ),
    (
        "cpf",
        None,
        _scan(
            r"(?<!\d)\d{3}\.?\d{3}\.?\d{3}-?\d{2}(?!\d)",
            check=_cpf_ok,
            norm=_digits,
        ),
    ),
    (
        "card",
        None,
        _scan(
            r"(?<!\d)(?<!\d[ -])(?:\d{13,19}"
            r"|\d{4}([ -])\d{4}\1\d{4}\1\d{1,7}"
            r"|\d{4}([ -])\d{6}\2\d{4,5})(?!\d)",
            check=_card_ok,
            norm=_digits,
        ),
    ),
    (
        "ssn",
        None,
        _scan(
            r"(?<![\d-])\d{3}-\d{2}-\d{4}(?![\d-])", check=_ssn_ok, norm=_digits
        ),
    ),
    (
        "iban",
        None,
        _scan(
            _B + r"[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?"
            r"(?![A-Za-z0-9])",
            check=_iban_ok,
            norm=_iban_key,
        ),
    ),
    (
        "email",
        ("@",),
        _scan(
            r"(?<![\w.+-])[\w.+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+", flags=re.A
        ),
    ),
    (
        "phone",
        None,
        _scan(
            r"(?<![\w+])(?:\+\d{1,3}[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]?\d{3}"
            r"[ .-]?\d{4}(?!\d)",
            flags=re.A,
        ),
    ),
]


def _wants_contact(config):
    pii = config.get("pii") if isinstance(config, dict) else None
    return isinstance(pii, dict) and bool(pii.get("contact"))


_EXTRA_NAME = re.compile(r"[a-z][a-z0-9_]*")


def _warn(message):
    sys.stderr.write("taskflow sensitive data guard: %s\n" % message)


def _extra_patterns(entries):
    # Compiled once here. A user pattern runs as written, so keeping it linear
    # (no nested unbounded quantifiers) is the user's responsibility.
    compiled = []
    for entry in entries if isinstance(entries, list) else ():
        name = entry.get("name") if isinstance(entry, dict) else None
        pattern = entry.get("pattern") if isinstance(entry, dict) else None
        if not isinstance(name, str) or not _EXTRA_NAME.fullmatch(name):
            _warn("extraPatterns entry skipped, bad name: %r" % (name,))
            continue
        if not isinstance(pattern, str) or not pattern:
            _warn("extraPatterns entry %r skipped, no pattern" % name)
            continue
        try:
            compiled.append((name, re.compile(pattern)))
        except (re.error, RecursionError, OverflowError) as e:
            _warn("extraPatterns entry %r skipped, bad pattern: %s" % (name, e))
    return compiled


def load_config(project_dir):
    """The sensitiveData block of <project_dir>/.claude/workflow.json over the
    defaults. Anything missing, unreadable or of the wrong type is a default."""
    block = {}
    try:
        path = os.path.join(project_dir or "", ".claude", "workflow.json")
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict) and isinstance(data.get("sensitiveData"), dict):
            block = data["sensitiveData"]
    except (OSError, ValueError, TypeError):
        pass
    enabled = block.get("enabled")
    pii = block.get("pii") if isinstance(block.get("pii"), dict) else {}
    contact = pii.get("contact")
    allow = block.get("allowPaths")
    return {
        "enabled": enabled if isinstance(enabled, bool) else True,
        "pii": {"contact": contact if isinstance(contact, bool) else False},
        "extraPatterns": _extra_patterns(block.get("extraPatterns")),
        "allowPaths": [p for p in allow if isinstance(p, str)]
        if isinstance(allow, list)
        else [],
    }


def _detectors(config):
    extras = config.get("extraPatterns") if isinstance(config, dict) else None
    # An empty match would insert a placeholder over nothing; it is skipped.
    extra = [
        (name, None, _scan(rx, check=bool)) for name, rx in (extras or ())
    ]
    return DETECTORS + extra


def redact(text, config=None):
    if isinstance(config, dict) and config.get("enabled") is False:
        return text, {}
    contact = _wants_contact(config)
    found = []
    # Extra patterns rank below every built-in type on overlap.
    for priority, (kind, gate, find) in enumerate(_detectors(config)):
        if kind in CONTACT_TYPES and not contact:
            continue
        if gate and not any(g in text for g in gate):
            continue
        for start, end, key in find(text):
            found.append((priority, start, end, kind, key))
    found.sort()

    taken = bytearray(len(text))
    kept = []
    for _, start, end, kind, key in found:
        if taken.find(1, start, end) != -1:
            continue
        taken[start:end] = b"\x01" * (end - start)
        kept.append((start, end, kind, key))
    kept.sort()

    parts = []
    last = 0
    numbers = {}
    for start, end, kind, key in kept:
        table = numbers.setdefault(kind, {})
        n = table.setdefault(key, len(table) + 1)
        parts.append(text[last:start])
        parts.append("[%s_%d]" % (kind, n))
        last = end
    parts.append(text[last:])
    return "".join(parts), {k: len(v) for k, v in numbers.items()}
