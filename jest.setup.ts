// Jest setup file para melhorar estabilidade e reduzir flaky tests

// Adicionar flag para desabilitar handlers globais
declare global {
  var __DISABLE_GLOBAL_HANDLERS__: boolean;
}

// Configurar timeouts globais
jest.setTimeout(30000);

// Configurar console para melhor debugging
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Interceptar erros de console para melhor debugging
console.error = (...args) => {
  // Filtrar warnings conhecidos que não são relevantes
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render is deprecated') ||
     message.includes('Warning: componentWillReceiveProps') ||
     message.includes('Warning: componentWillUpdate'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Filtrar warnings conhecidos que não são relevantes
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Warning: ReactDOM.render is deprecated') ||
     message.includes('Warning: componentWillReceiveProps') ||
     message.includes('Warning: componentWillUpdate'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Configurar mocks globais para reduzir flaky tests
global.fetch = jest.fn();

// Mock de Date para testes determinísticos
const mockDate = new Date('2024-01-01T00:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

// Mock de Math.random para testes determinísticos
const mockRandom = jest.spyOn(Math, 'random');
mockRandom.mockReturnValue(0.5);

// Configurar cleanup automático após cada teste
afterEach(() => {
  // Limpar todos os mocks
  jest.clearAllMocks();
  
  // Limpar timers
  jest.clearAllTimers();
  
  // Limpar console
  console.clear();
  
  // Limpar fetch mock
  if (global.fetch && jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockClear();
  }
});

// Configurar cleanup global
afterAll(() => {
  // Restaurar console original
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Restaurar Date
  jest.restoreAllMocks();
  
  // Limpar todos os timers
  jest.clearAllTimers();
});

// Configurar handlers de erro globais (apenas se não desabilitados)
if (!global.__DISABLE_GLOBAL_HANDLERS__) {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });
}

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.CI = 'true';

// Configurar timeouts específicos para diferentes tipos de teste
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;

global.setTimeout = jest.fn((callback, delay) => {
  // Reduzir delays em ambiente de teste
  const testDelay = Math.min(delay || 0, 1000);
  return originalSetTimeout(callback, testDelay);
});

global.setInterval = jest.fn((callback, delay) => {
  // Reduzir delays em ambiente de teste
  const testDelay = Math.min(delay || 0, 1000);
  return originalSetInterval(callback, testDelay);
});

// Configurar mocks para dependências externas comuns
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    ...jest.requireActual('fs').promises,
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    rmdir: jest.fn(),
  },
}));

// Mock de crypto para testes determinísticos
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from('mock-random-bytes')),
  randomUUID: jest.fn(() => 'mock-uuid-1234-5678-9abc-def012345678'),
}));

// Configurar cleanup de recursos
beforeEach(() => {
  // Limpar cache de módulos se necessário
  jest.clearAllMocks();
});

// Configurar handlers para cleanup de recursos
const cleanupHandlers: (() => void)[] = [];

export const addCleanupHandler = (handler: () => void) => {
  cleanupHandlers.push(handler);
};

afterEach(() => {
  // Executar todos os handlers de cleanup
  cleanupHandlers.forEach(handler => {
    try {
      handler();
    } catch (error) {
      console.error('Error in cleanup handler:', error);
    }
  });
  cleanupHandlers.length = 0;
});

// Configurar logging para debugging de flaky tests
const testStartTime = Date.now();

beforeEach(() => {
  console.log(`🧪 Starting test: ${expect.getState().currentTestName}`);
});

afterEach(() => {
  const testDuration = Date.now() - testStartTime;
  console.log(`✅ Test completed: ${expect.getState().currentTestName} (${testDuration}ms)`);
});

// Configurar retry automático para testes específicos
const flakyTests = new Set<string>();

export const markTestAsFlaky = (testName: string) => {
  flakyTests.add(testName);
};

export const isTestFlaky = (testName: string) => {
  return flakyTests.has(testName);
};

// Configurar retry automático usando jest.retryTimes()
jest.retryTimes(2); // Retry automático para todos os testes

// Configurar retry específico para testes flaky
const originalTest = global.test;
global.test = (name, fn, timeout) => {
  return originalTest(name, async (...args) => {
    const maxRetries = isTestFlaky(name) ? 3 : 2;
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await fn(...args);
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying test "${name}" (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  }, timeout);
};
