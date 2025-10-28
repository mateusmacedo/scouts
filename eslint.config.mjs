// eslint.config.mjs
import nx from '@nx/eslint-plugin';

export default [
  // Presets do Nx (parser + TS flat config prontos)
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],

  // Ignorar tudo que o Biome já cobre à parte ou que não deve afetar Boundaries
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/coverage',
      '**/support/**',
      // Testes (deixe o Biome avaliar qualidade neles; aqui não precisamos Boundaries)
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.e2e-spec.ts',
      '**/__test__/**',
      '**/__mocks__/**',
      // Arquivos de tooling/config (já liberados no "allow" abaixo)
      '**/*.config.{js,cjs,mjs,ts}',
      '**/jest.config.{js,ts}',
      '**/jest.preset.{js,ts}',
      '**/jest.setup.{js,ts}',
      // artefatos gerados pelos targets de graph
      'graph.json',
      'affected-graph.json'
    ],
  },

  // Único objetivo: Boundaries
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: { '@nx': nx },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,

          // Permite tooling/configs comuns sem quebrar Boundaries
          allow: [
            String.raw`^.*/eslint(\.base)?\.config\.[cm]?js$`,
            String.raw`^.*/eslint\.config\.[cm]?js$`,
            String.raw`^.*/jest\.config\.[cmjt]s$`,
            String.raw`^.*/vitest\.config\.[cmjt]s$`,
            String.raw`^.*/webpack\.config\.[cmjt]s$`,
            String.raw`^.*/rspack\.config\.[cmjt]s$`,
            String.raw`^.*/vite\.config\.[cmjt]s$`,
            String.raw`^tools/.*`,
            String.raw`^scripts/.*`
          ],

          // Restrição mínima e útil: Clean Architecture + Runtime
          depConstraints: [
            // Camadas
            { sourceTag: 'layer:presentation',   onlyDependOnLibsWithTags: ['layer:application', 'layer:domain'] },
            { sourceTag: 'layer:application',    onlyDependOnLibsWithTags: ['layer:domain', 'layer:infrastructure'] },
            { sourceTag: 'layer:domain',         onlyDependOnLibsWithTags: [] },
            { sourceTag: 'layer:infrastructure', onlyDependOnLibsWithTags: ['layer:domain'] },

            // Runtime
            { sourceTag: 'runtime:node',    onlyDependOnLibsWithTags: ['runtime:node', 'runtime:universal'] },
            { sourceTag: 'runtime:go',      onlyDependOnLibsWithTags: ['runtime:go', 'runtime:universal'] },
            { sourceTag: 'runtime:browser', onlyDependOnLibsWithTags: ['runtime:browser', 'runtime:node', 'runtime:universal'] }
          ]
        }
      ],

      // Tudo o resto é responsabilidade do Biome (mantemos desligado aqui)
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
      'no-var': 'off'
    }
  }
];
