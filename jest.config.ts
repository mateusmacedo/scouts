import { getJestProjectsAsync } from '@nx/jest';
import type { Config } from 'jest';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const COVERAGE_PATTERNS = [
  '<rootDir>/src/**/*.ts',
  '!<rootDir>/src/**/*.spec.ts',
  '!<rootDir>/src/**/*.e2e.spec.ts',
  '!<rootDir>/src/**/index.ts',
  '!<rootDir>/src/**/__test__/**',
  '!<rootDir>/src/**/__tests__/**',
  '!<rootDir>/src/**/draft/**',
  '!<rootDir>/src/**/dto/**',
  '!<rootDir>/src/**/*.dto.ts',
];

const createThreshold = (minValue: number): NonNullable<Config['coverageThreshold']>['global'] => ({
  branches: minValue,
  functions: minValue,
  lines: minValue,
  statements: minValue,
});

const isLibraryProject = (projectPath: string): boolean => {
  const normalized = projectPath.split(sep).join('/');
  return normalized.includes('/libs/');
};

export default async (): Promise<Config> => {
  const projectPaths = await getJestProjectsAsync();

  const projects = await Promise.all(
    projectPaths.map(async (projectPath) => {
      const moduleConfig = await import(pathToFileURL(resolve(projectPath)).href);
      const projectConfig = (moduleConfig.default ?? moduleConfig) as Config;
      const coverageTarget = isLibraryProject(projectPath) ? 80 : 70;

      return {
        ...projectConfig,
        collectCoverageFrom: COVERAGE_PATTERNS,
        coverageThreshold: {
          ...projectConfig.coverageThreshold,
          global: createThreshold(coverageTarget),
        },
      } satisfies Config;
    }),
  );

  return {
    projects,
    maxWorkers: '50%',
    cache: true,
  } satisfies Config;
};
