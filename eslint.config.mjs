import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  {
    ignores: [
      '**/dist',
      '**/node_modules',
      '**/coverage',
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.e2e-spec.ts'
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Manter apenas a regra de boundaries do Nx
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [String.raw`^.*/eslint(\.base)?\.config\.[cm]?js$`],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
      // Desabilitar regras que serão cobertas pelo Biome
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-imports': 'off',
      'no-unused-vars': 'off',
      'no-console': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
    },
  },
];
