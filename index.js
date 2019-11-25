import { Console } from 'console';
import { Writable } from 'stream';

// Keep an instance of the original console and export it
const originalConsole = global.console;

export { originalConsole };

const instances = new WeakMap();

const LEVELS = {
  log: [
    'log',
    'trace',
    'dir',
    'dirxml',
    'group',
    'groupCollapsed',
    'debug',
    'timeLog',
  ],
  info: ['count', 'info', 'timeEnd'],
  warn: ['warn', 'countReset'],
  error: ['error', 'assert'],
};

export function createConsole() {
  let logs = [];
  let levels = {
    log: '',
    info: '',
    warn: '',
    error: '',
  };
  let currentLevel = undefined;

  const writable = new Writable({
    write(chunk, encoding, callback) {
      logs.push([currentLevel, chunk.toString('utf8')]);
      if (currentLevel && currentLevel in levels) {
        levels[currentLevel] += chunk;
      }
      callback();
    },
  });

  const jestConsole = new Console({
    stdout: writable,
    stderr: writable,
  });

  Object.getOwnPropertyNames(jestConsole).forEach(property => {
    if (typeof jestConsole[property] === 'function') {
      const originalFunction = jestConsole[property];
      jestConsole[property] = function() {
        currentLevel = undefined;
        Object.keys(LEVELS).forEach(level => {
          if (LEVELS[level].includes(property)) {
            currentLevel = level;
          }
        });

        return originalFunction.apply(this, arguments);
      };

      if (typeof jest === 'object' && typeof jest.spyOn === 'function') {
        jest.spyOn(jestConsole, property);
      }
    }
  });

  instances.set(jestConsole, {
    get log() {
      return logs.map(log => log[1]).join('');
    },
    get logs() {
      return logs;
    },
    levels: {
      get log() {
        return levels.log;
      },
      get info() {
        return levels.info;
      },
      get warn() {
        return levels.warn;
      },
      get error() {
        return levels.error;
      },
    },
  });

  return jestConsole;
}

export function mockConsole(jestConsole) {
  const originalConsole = global.console;

  global.console = jestConsole;

  return () => {
    global.console = originalConsole;
  };
}

export function getLog(jestConsole = global.console) {
  return instances.get(jestConsole);
}

if (typeof beforeEach === 'function' && typeof afterEach === 'function') {
  let cleanup = () => {};

  beforeEach(() => {
    cleanup = mockConsole(createConsole());
  });

  afterEach(cleanup);
}
