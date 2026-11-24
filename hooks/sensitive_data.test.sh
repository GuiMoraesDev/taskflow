#!/usr/bin/env bash
# Calls sensitive_data.redact on fixtures and checks the placeholders, counts and timing.
# Token-looking fixtures are built by concatenation so this file holds no scannable secret.

HOOKS="$(cd "$(dirname "$0")" && pwd)"
failures=0

PRELUDE=$(cat <<'PYEOF'
import sys, time
sys.path.insert(0, sys.argv[1])
from sensitive_data import redact

def hit(text, kind, raws, keep=(), n=1):
    out, counts = redact(text)
    assert "[%s_%d]" % (kind, n) in out, "no [%s_%d] in %r" % (kind, n, out)
    for r in raws:
        assert r not in out, "raw value left in output: %r" % r
    for k in keep:
        assert k in out, "expected %r kept in %r" % (k, out)
    assert counts.get(kind, 0) >= 1, "counts lacks %s: %r" % (kind, counts)

def same(text):
    out, counts = redact(text)
    assert out == text, "changed %r -> %r" % (text, out)
    assert not counts, "counts not empty: %r" % (counts,)
PYEOF
)

# case <AC> <label> <python body>
case_() {
  local out last
  out=$(python3 -c "$PRELUDE"$'\n'"$3" "$HOOKS" 2>&1)
  last=$(printf '%s' "$out" | tail -n 1)
  if [ -z "$out" ]; then echo "PASS $1 $2"; else echo "FAIL $1 $2: $last"; failures=$((failures + 1)); fi
}

# AC-1: every type is detected, replaced by its numbered placeholder, and counted
b64='QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo'
for kind in "OPENSSH PRIVATE KEY" "RSA PRIVATE KEY" "EC PRIVATE KEY" "PGP PRIVATE KEY BLOCK"; do
  case_ AC-1 "private_key $kind block replaced whole" "
body = 'b3BlbnNzaC1rZXktdjEAAAAA' + 'ABG5vbmUAAAAEbm9uZQAAAAAAAAAB'
blk = '-----BEGIN ' + '$kind' + '-----\n' + body + '\n' + body[::-1] + '\n-----END ' + '$kind' + '-----'
out, counts = redact('before\n' + blk + '\nafter')
assert '[private_key_1]' in out, out
assert body not in out and body[::-1] not in out and 'BEGIN' not in out and 'END ' not in out, out
assert out.startswith('before\n') and out.endswith('\nafter'), out
assert counts.get('private_key') == 1, counts
"
done

case_ AC-1 "aws_key AKIA id" "hit('id ' + 'AKIA' + 'IOSFODNN7EXAMPLE', 'aws_key', ['AKIA' + 'IOSFODNN7EXAMPLE'])"
case_ AC-1 "aws_key ASIA id" "hit('id ' + 'ASIA' + 'ZXCVBNMASDFGHJKL', 'aws_key', ['ASIA' + 'ZXCVBNMASDFGHJKL'])"
case_ AC-1 "aws_key secret access key" "
v = 'wJalrXUtnFEMI/K7MDENG' + '/bPxRfiCYEXAMPLEKEY'
assert len(v) == 40
hit('aws_secret_access_key = ' + v, 'aws_key', [v])
"
case_ AC-1 "cloud_credential GCP private_key_id" "
v = 'a1b2c3d4e5' * 4
hit('{\"type\": \"service_account\", \"private_key_id\": \"' + v + '\"}', 'cloud_credential', [v])
"
case_ AC-1 "cloud_credential Azure AccountKey" "
v = 'QUJD' * 21 + 'QQ=='
hit('DefaultEndpointsProtocol=https;AccountName=x;AccountKey=' + v + ';EndpointSuffix=core.windows.net', 'cloud_credential', [v])
"

token() { # label, python expression for the raw token
  case_ AC-1 "api_token $1" "t = $2
hit('use ' + t + ' here', 'api_token', [t])"
}
token ghp_       "'ghp' + '_' + 'A1b2C3d4E5' * 3 + 'A1b2C3'"
token gho_       "'gho' + '_' + 'A1b2C3d4E5' * 3 + 'A1b2C3'"
token github_pat_ "'github' + '_pat_' + 'A1b2C3d4E5f6G7h8I9j0K1' + '_' + 'a1B2c3D4e5' * 5 + 'a1B2c3D4e'"
token glpat-     "'glpat' + '-' + 'abcDEF123456ghiJKL78'"
token xoxb-      "'xoxb' + '-123456789012-123456789012-' + 'AbCdEfGhIjKlMnOpQrStUvWx'"
token xoxp-      "'xoxp' + '-123456789012-123456789012-' + 'AbCdEfGhIjKlMnOpQrStUvWx'"
token sk_live_   "'sk' + '_live_' + 'A1b2C3d4E5f6G7h8I9j0K1l2'"
token rk_live_   "'rk' + '_live_' + 'A1b2C3d4E5f6G7h8I9j0K1l2'"
token sk-ant-    "'sk' + '-ant-' + 'api03-' + 'A1b2C3d4E5' * 4 + '_-A1b2C3d4'"
token sk-proj-   "'sk' + '-proj-' + 'A1b2C3d4E5' * 4 + 'A1b2C3d4'"
token sk-        "'sk' + '-' + 'A1b2C3d4E5' * 4 + 'A1b2C3d4'"
token npm_       "'npm' + '_' + 'A1b2C3d4E5' * 3 + 'A1b2C3'"
token pypi-      "'pypi' + '-' + 'AgEIcHlwaS5vcmc' + 'A1b2C3d4E5' * 5"
token SG.        "'SG' + '.' + 'A1b2C3d4E5f6G7h8I9j0K1' + '.' + 'A1b2C3d4E5' * 4 + 'A1b'"
token SK-twilio  "'S' + 'K' + '0123456789abcdef' * 2"

case_ AC-1 "jwt three base64url segments" "
t = 'eyJhbGciOiJIUzI1NiJ9' + '.' + 'eyJzdWIiOiIxMjM0NTY3ODkwIn0' + '.' + 'dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk'
hit('Authorization: Bearer ' + t, 'jwt', [t])
"
case_ AC-1 "db_url postgres whole URL replaced" "
u = 'postgres://' + 'admin:s3cr3tPass' + '@db.internal.example.com:5432/app'
hit('DATABASE: ' + u + ' end', 'db_url', ['s3cr3tPass', 'db.internal.example.com', 'admin'])
"
case_ AC-1 "db_url mongodb+srv whole URL replaced" "
u = 'mongodb+srv://' + 'svc:p4ssW0rdXyz' + '@cluster0.example.net/db'
hit('uri ' + u, 'db_url', ['p4ssW0rdXyz', 'cluster0.example.net'])
"

case_ AC-1 "env_secret API_KEY= keeps the key" "
v = 'x9Zq7Lm2Pw4Rt8Vb'
out, counts = redact('API_KEY=' + v)
assert out == 'API_KEY=[env_secret_1]', out
assert counts.get('env_secret') == 1, counts
"
case_ AC-1 "env_secret quoted DB_PASSWORD" "
v = 'x9Zq7Lm2Pw4Rt8Vb'
hit('DB_PASSWORD=\"' + v + '\"', 'env_secret', [v], keep=['DB_PASSWORD='])
"
case_ AC-1 "env_secret *_SECRET" "
v = 'x9Zq7Lm2Pw4Rt8Vb'
hit('STRIPE_SECRET=' + v, 'env_secret', [v], keep=['STRIPE_SECRET='])
"
case_ AC-1 "env_secret *_TOKEN in a multi-line .env" "
v = 'x9Zq7Lm2Pw4Rt8Vb'
hit('PORT=3000\nDEPLOY_TOKEN=' + v + '\nDEBUG=true\n', 'env_secret', [v], keep=['PORT=3000', 'DEPLOY_TOKEN=', 'DEBUG=true'])
"

case_ AC-1 "lowercase keys with literal values are redacted" "
for text, key, v in [
    ('password: hunter2xyz', 'password: ', 'hunter2xyz'),
    ('api_key = \"sk123realvalue\"', 'api_key = \"', 'sk123realvalue'),
    ('{\"clientSecret\": \"abcd1234efgh\"}', '\"clientSecret\": \"', 'abcd1234efgh'),
    ('SECRET=s3cr3tvalue', 'SECRET=', 's3cr3tvalue'),
    ('TOKEN=abcdef123', 'TOKEN=', 'abcdef123'),
    ('APIKEY=abcd1234ef', 'APIKEY=', 'abcd1234ef'),
    ('password=\"ab' + chr(92) + '\"cdefgh\"', 'password=\"', 'ab' + chr(92) + '\"cdefgh'),
]:
    out, counts = redact(text)
    assert v not in out, 'value not redacted: %r' % out
    assert key + '[env_secret_1]' in out, out
    assert counts.get('env_secret') == 1, counts
    if '\"' in text:
        assert '[env_secret_1]' + text[text.index(v) + len(v)] in out, out
"
case_ AC-1 "auth_config .npmrc _authToken" "
v = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
hit('//registry.npmjs.org/:_authToken=' + v, 'auth_config', [v], keep=['//registry.npmjs.org/:_authToken='])
"
case_ AC-1 "auth_config .netrc password" "
v = 'Tr0ub4dor3xyz'
hit('machine example.com login bob password ' + v, 'auth_config', [v], keep=['machine example.com login bob password '])
"
case_ AC-1 "auth_config docker config auth" "
v = 'ZGVwbG95OnMzY3IzdFBhc3M='
hit('{\"auths\": {\"ghcr.io\": {\"auth\": \"' + v + '\"}}}', 'auth_config', [v], keep=['\"auth\": '])
"
case_ AC-1 "auth_config kubeconfig client-key-data" "
v = 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQ' + 'pNSUlFb3dJQkFBS0NBUUVB'
hit('users:\n- name: u\n  user:\n    client-key-data: ' + v + '\n', 'auth_config', [v], keep=['client-key-data: '])
"

case_ AC-1 "card spaced 4111 1111 1111 1111" "hit('pay 4111 1111 1111 1111 now', 'card', ['4111 1111 1111 1111'])"
case_ AC-1 "card dashed" "hit('pay 4111-1111-1111-1111 now', 'card', ['4111-1111-1111-1111'])"
case_ AC-1 "card plain 16 digits" "hit('pay 5555555555554444 now', 'card', ['5555555555554444'])"
case_ AC-1 "card plain 15 digits (amex)" "hit('pay 378282246310005 now', 'card', ['378282246310005'])"
case_ AC-1 "ssn 123-45-6789" "hit('SSN 123-45-6789.', 'ssn', ['123-45-6789'])"
case_ AC-1 "cpf punctuated" "hit('CPF 529.982.247-25 ok', 'cpf', ['529.982.247-25'])"
case_ AC-1 "cpf unpunctuated" "hit('CPF 52998224725 ok', 'cpf', ['52998224725'])"
case_ AC-1 "cnpj punctuated" "hit('CNPJ 11.222.333/0001-81 ok', 'cnpj', ['11.222.333/0001-81'])"
case_ AC-1 "cnpj unpunctuated" "hit('CNPJ 11222333000181 ok', 'cnpj', ['11222333000181'])"
case_ AC-1 "iban spaced GB82 WEST ..." "hit('IBAN GB82 WEST 1234 5698 7654 32 ok', 'iban', ['GB82 WEST 1234 5698 7654 32'])"
case_ AC-1 "iban compact DE89..." "hit('IBAN DE89370400440532013000 ok', 'iban', ['DE89370400440532013000'])"

# AC-3: one value, one number, within a call
case_ AC-3 "same CPF twice maps to [cpf_1], counted once" "
out, counts = redact('a 529.982.247-25 b 529.982.247-25 c')
assert out == 'a [cpf_1] b [cpf_1] c', out
assert counts == {'cpf': 1}, counts
"
case_ AC-3 "two CPFs map to [cpf_1] and [cpf_2]" "
out, counts = redact('a 529.982.247-25 b 111.444.777-35 c')
assert out == 'a [cpf_1] b [cpf_2] c', out
assert counts == {'cpf': 2}, counts
"
case_ AC-3 "numbering is per type and per call" "
out, counts = redact('529.982.247-25 and 4111 1111 1111 1111')
assert out == '[cpf_1] and [card_1]', out
out2, _ = redact('111.444.777-35')
assert out2 == '[cpf_1]', out2
"

# AC-7: false positives are left alone
case_ AC-7 "Luhn-invalid card" "same('4111 1111 1111 1112')"
case_ AC-7 "CPF with bad check digit" "same('529.982.247-26')"
case_ AC-7 "CNPJ with bad check digit" "same('11.222.333/0001-82')"
case_ AC-7 "IBAN with bad mod-97" "same('GB82 WEST 1234 5698 7654 33')"
case_ AC-7 "SSN area 000" "same('000-12-3456')"
case_ AC-7 "SSN area 666" "same('666-12-3456')"
case_ AC-7 "SSN area 9xx" "same('900-12-3456')"
case_ AC-7 "SSN group 00" "same('123-00-6789')"
case_ AC-7 "SSN serial 0000" "same('123-45-0000')"
case_ AC-7 "API_KEY= with no value" "same('API_KEY=')"
case_ AC-7 "API_KEY=changeme dummy" "same('API_KEY=changeme')"
case_ AC-7 "API_KEY=your-key-here dummy" "same('API_KEY=your-key-here')"
case_ AC-7 "PASSWORD=<placeholder> dummy" "same('PASSWORD=<placeholder>')"
case_ AC-7 "plain prose" "same('The quick brown fox jumps over the lazy dog. We shipped it on Tuesday, after review.')"
case_ AC-7 "git SHA (40 hex)" "same('commit ' + 'da39a3ee5e6b4b0d3255' + 'bfef95601890afd80709')"
case_ AC-7 "UUID" "same('id 123e4567-e89b-12d3-a456-426614174000')"
case_ AC-7 "email and phone off by default" "same('Mail jane.doe@example.com or call +1 415 555 0132 or (415) 555-0132')"
case_ AC-7 "code expressions are not flagged" "
for t in ['token = get_token()', 'password = self.password', 'api_key = os.environ[\"API_KEY\"]',
          'secret: \${SECRET}', 'const apiKey = process.env.API_KEY',
          'password = secret_var', 'api_key=apiKeyFromEnv', 'token = cfg_token;']:
    same(t)
"

# AC-9: ~1 MB adversarial input redacts in under 2 seconds
perf() { # label, python expression for one repeated unit
  case_ AC-9 "1 MB of $1 in under 2s" "
unit = $2
text = unit * (1000000 // len(unit))
t0 = time.monotonic()
out, counts = redact(text)
dt = time.monotonic() - t0
assert isinstance(out, str) and isinstance(counts, dict)
assert dt < 2.0, 'took %.2fs' % dt
"
}
perf "digits"                 "'9'"
perf "digits and spaces"      "'1 '"
perf "digits and dashes"      "'4111-'"
perf "letter a"               "'a'"
perf "equals"                 "'='"
perf "colons"                 "':'"
perf "at signs"               "'@'"
perf "eyJ repeated"           "'eyJ'"
perf "eyJ dotted"             "'eyJa.'"
perf "unterminated PEM header" "'-----BEGIN ' + 'PRIVATE KEY-----\n'"
perf "scheme and at"          "'a://b:c@'"
perf "KEY= with long runs"    "'API_' + 'KEY=' + '=' * 50 + ' '"
perf "AKIA prefixes"          "'AKIA'"
perf "IBAN-like"              "'GB82 WEST '"

[ "$failures" -eq 0 ]; exit $?
