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
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
            {
              sourceTag: 'type:lib',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
            {
              sourceTag: 'scope:user-node',
              onlyDependOnLibsWithTags: ['scope:user-node', 'scope:logger'],
            },
            {
              sourceTag: 'scope:user-go',
              onlyDependOnLibsWithTags: ['scope:user-go'],
            },
            {
              sourceTag: 'scope:logger',
              onlyDependOnLibsWithTags: ['scope:logger'],
            },
            {
              sourceTag: 'scope:tooling',
              onlyDependOnLibsWithTags: ['scope:tooling'],
            },
          ],
        },
      ],
      // Desabilitar regras que serão cobertas pelo Biome
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-imports': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-unused-vars': 'off',
      'no-console': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
    },
  },
];
