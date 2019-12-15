import { mockConsole, createConsole } from './pure';

// Keep an instance of the original console and export it
const originalConsole = global.console;
global.originalConsole = originalConsole;
export { originalConsole };

if (typeof beforeEach === 'function' && typeof afterEach === 'function') {
  let restore = () => {};

  beforeEach(() => {
    restore = mockConsole(createConsole());
  });

  afterEach(() => restore());
}

export * from './pure';
