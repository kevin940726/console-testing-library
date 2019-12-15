import { Console } from 'console';
import { Writable } from 'stream';
import util from 'util';
import { toMatchInlineSnapshot } from 'jest-snapshot';
import prettyFormat from 'pretty-format';

// Keep an instance of the original console and export it
const originalConsole = global.console;
global.originalConsole = originalConsole;
export { originalConsole };

const INSPECT_SYMBOL = util.inspect.custom;

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

export function createConsole({ isSilent: defaultIsSilent = true } = {}) {
  let logs = [];
  let records = {};
  let levels = {
    log: '',
    info: '',
    warn: '',
    error: '',
  };
  let currentLevel = undefined;
  let currentMethod = undefined;
  let isSilent = defaultIsSilent;
  let targetConsole = undefined;

  const writable = new Writable({
    write(chunk, encoding, callback) {
      const message = chunk
        .toString('utf8')
        // Strip out the new line character in the end
        .slice(0, -1);
      logs.push([currentLevel, message]);
      if (currentLevel && currentLevel in levels) {
        levels[currentLevel] = [levels[currentLevel], message]
          .filter(Boolean)
          .join('\n');
      }
      records[currentMethod] = [records[currentMethod], message]
        .filter(Boolean)
        .join('\n');
      callback();
    },
  });

  const testingConsole = new Console(writable, writable);

  testingConsole.clear = function clear() {
    logs = [];
    records = {};
    levels = {
      log: '',
      info: '',
      warn: '',
      error: '',
    };
    currentLevel = undefined;
    currentMethod = undefined;
  };

  Object.getOwnPropertyNames(testingConsole).forEach(property => {
    if (
      typeof testingConsole[property] === 'function' &&
      // Internal properties like `_stdoutErrorHandler` and `_stderrErrorHandler`
      !property.startsWith('_')
    ) {
      if (property !== 'clear') {
        const originalFunction = testingConsole[property];

        testingConsole[property] = function(...args) {
          currentLevel = undefined;
          currentMethod = property;
          Object.keys(LEVELS).forEach(level => {
            if (LEVELS[level].includes(property)) {
              currentLevel = level;
            }
          });

          const prettiedArguments = args.map(argv => {
            if (
              (typeof argv === 'object' || typeof argv === 'function') &&
              argv !== null
            ) {
              // We return an object with inspect symbol here because string substitutions requires objects
              return { [INSPECT_SYMBOL]: () => prettyFormat(argv) };
            }

            return argv;
          });

          const returnValue = originalFunction.apply(this, prettiedArguments);

          if (!isSilent && targetConsole) {
            targetConsole[property].apply(this, args);
          }

          return returnValue;
        };
      }

      Object.defineProperty(testingConsole[property], 'name', {
        value: property,
      });
      testingConsole[property].testingConsole = testingConsole;

      if (typeof jest === 'object' && typeof jest.spyOn === 'function') {
        jest.spyOn(testingConsole, property);

        Object.defineProperty(testingConsole[property], 'name', {
          value: property,
        });
        testingConsole[property].testingConsole = testingConsole;
      }
    }
  });

  instances.set(testingConsole, {
    get log() {
      return logs.map(log => log[1]).join('\n');
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
    getRecord(method) {
      return records[method] || '';
    },
    get silence() {
      return isSilent;
    },
    set silence(shouldSilent = true) {
      isSilent = !!shouldSilent;
    },
    get _targetConsole() {
      return targetConsole;
    },
    set _targetConsole(target) {
      targetConsole = target;
    },
  });

  return testingConsole;
}

export function mockConsole(
  testingConsole,
  targetConsoleParent = global,
  targetConsoleKey = 'console'
) {
  const targetConsole = targetConsoleParent[targetConsoleKey];

  targetConsoleParent[targetConsoleKey] = testingConsole;

  const instance = instances.get(testingConsole);
  instance._targetConsole = targetConsole;

  return () => {
    targetConsoleParent[targetConsoleKey] = targetConsole;

    instance._targetConsole = undefined;
  };
}

export function getLog(testingConsole = global.console) {
  return instances.get(testingConsole);
}

export function silenceConsole(
  testingConsole = global.console,
  shouldSilent = true
) {
  if (typeof arguments[0] === 'boolean') {
    testingConsole = global.console;
    shouldSilent = arguments[0];
  }

  instances.get(testingConsole).silence = !!shouldSilent;
}

export function restore() {
  global.console = originalConsole;
}

if (typeof beforeEach === 'function' && typeof afterEach === 'function') {
  let restore = () => {};

  beforeEach(() => {
    restore = mockConsole(createConsole());
  });

  afterEach(() => restore());
}

if (typeof expect === 'function' && typeof expect.extend === 'function') {
  expect.extend({
    toMatchInlineSnapshot(received, ...args) {
      /* ------- Workaround for custom inline snapshot matchers ------- */
      const error = new Error();
      const stacks = error.stack.split('\n');

      for (let i = 1; i < stacks.length; i += 1) {
        if (stacks[i].includes(__filename)) {
          stacks.splice(1, i);
          break;
        }
      }

      error.stack = stacks.join('\n');

      const context = Object.assign(this, { error });
      /* -------------------------------------------------------------- */

      const testingConsoleInstance =
        (received && received.testingConsole) || received;

      if (!testingConsoleInstance || !instances.has(testingConsoleInstance)) {
        return toMatchInlineSnapshot.call(context, received, ...args);
      }

      if (typeof received === 'function') {
        return toMatchInlineSnapshot.call(
          context,
          getLog().getRecord(received.name),
          ...args
        );
      } else if (typeof received === 'object') {
        return toMatchInlineSnapshot.call(
          context,
          getLog(received).log,
          ...args
        );
      }
    },
  });
}
