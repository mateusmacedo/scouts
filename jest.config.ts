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
  // Configurações para reduzir flaky tests
  testTimeout: 30000, // 30 segundos timeout
  bail: false, // Não parar no primeiro teste que falha
  maxWorkers: '50%', // Usar 50% dos cores disponíveis para evitar sobrecarga
  // Configurações de ambiente para estabilidade
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  // Setup para melhor isolamento de testes
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Configurações para detectar e reportar testes flaky
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'jest-report.html',
        expand: true,
      },
    ],
  ],
  // Configurações para melhor performance e estabilidade
  forceExit: true, // Forçar saída após testes
  detectOpenHandles: true, // Detectar handles abertos que podem causar flaky tests
  detectLeaks: true, // Detectar vazamentos de memória
});
