import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['.claude-plugin/types/**', 'node_modules/**'] },
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
      'eqeqeq': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression[params.0.name='$']",
          message:
            "Export a function that takes $ as a `function` declaration: the plugin engine follows $ across an import only into function declarations, and refuses the module otherwise.",
        },
        {
          selector:
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression[params.0.name='$']",
          message:
            "Export a function that takes $ as a `function` declaration: the plugin engine follows $ across an import only into function declarations, and refuses the module otherwise.",
        },
      ],
    },
  },
)
