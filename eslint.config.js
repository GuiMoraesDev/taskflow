import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['.claude-plugin/types/**', 'node_modules/**'] },
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
      'eqeqeq': 'error',
    },
  },
)
