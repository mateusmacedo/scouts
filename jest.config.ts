import type { Config } from 'jest';
import { getJestProjectsAsync } from '@nx/jest';

export default async (): Promise<Config> => ({
  projects: await getJestProjectsAsync(),
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e.spec.ts',
    '!src/**/index.ts',
    '!src/**/__test__/**',
    '!src/**/draft/**',
  ],
  coverageThreshold: {
    global: {
      lines: 65,
      functions: 65,
      branches: 65,
      statements: 65,
    },
  },
	cache: true,
});
