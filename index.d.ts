export declare const originalConsole: Console;

type Options = {
  isSilent?: boolean;
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
  stderr: string;
  stdout: string;
  getRecord: (method: string) => string;
  silence: boolean;
};

export function createConsole(options?: Options): TestingConsole;

export function mockConsole(
  testingConsole: TestingConsole,
  targetConsoleParent?: typeof globalThis,
  targetConsoleKey?: string
): () => void;

export function getLog(testingConsole?: TestingConsole): TestingConsoleInstance;

export function silenceConsole(
  testingConsole?: TestingConsole,
  shouldSilent?: boolean
): void;

export function restore(): void;
