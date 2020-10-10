export const originalConsole = Console;

type Options = {
  isSilent?: boolean;
  stripsAnsi?: boolean;
};

export enum ConsoleLevels {
  log,
  info,
  warn,
  error,
}

export type TestingConsole = Console;

export type TestingConsoleInstance = {
  log: string;
  logs: [ConsoleLevels, string][];
  levels: {
    log: string;
    info: string;
    warn: string;
    error: string;
  };
  getRecord: (method: string) => string;
  silence: boolean;
  private _targetConsole: TestingConsole | Console;
};

export function createConsole(options?: Options): TestingConsole;

export function mockConsole(
  testingConsole: TestingConsole,
  targetConsoleParent?: {} = global,
  targetConsoleKey?: string
): () => void;

export function getLog(testingConsole?: TestingConsole): TestingConsoleInstance;

export function silenceConsole(
  testingConsole?: TestingConsole,
  shouldSilent?: boolean
): void;

export function restore(): void;
