# `jest-console`

Mocking console the right way.

## Why

It's rare to have `console` in your code, it's more often seen in libraries to provide helpful debugging warnings. When trying to mock `console` in tests, we often just `spyOn` the methods being used and observe the mock calls. This works great if your message is simple, but it can also have false-negative.

```js
console.error(
  'The error has a type named "%s", expected "%s".',
  'Oops',
  'Success'
);
```

This is a valid `console.error` call with string substitution, which will output the message `The error has a type named "Oops", expected "Success".`. Normally we would test it using something like `toHaveBeenCalledWith`

```js
expect(console.log).toHaveBeenCalledWith(
  'The error has a type named "%s", expected "%s".',
  'Oops',
  'Success'
);
```

But it's not representing the actual output of the message, we're just repeating what we wrote in the source code. If some typo sneaked into it, we won't be able to easily notice it because of the malfunctioned tests.

Converting it to template literals could solve this issue, but sometimes the values are objects, which cannot be serialized to strings or would loose context when doing so. In some environments (like in browsers' console), they will even be represented as inspect-able and interactive-able results, which is not possible to achieve with strings.

A better option would be to get the actual output of the logs and test it against the expected output.

```js
expect(actualLog).toBe(
  'The error has a type named "Oops", expected "Success".'
);
```

With `jest-console`, we can easily do that without extra hassles.

```js
import { getLog } from 'jest-console';

expect(getLog().log).toBe(
  'The error has a type named "Oops", expected "Success".'
);
```

## Installation

```sh
yarn add -D jest-console
```

## Usage

Just import it before calling `console.log` or the family.

```js
import 'jest-console';

test('testing console.log', () => {
  // No logs will be output to the console
  console.log('Hello %s!', 'World');
});
```

If you want to get the current logs, import the `getLog` helper.

```js
import { getLog } from 'jest-console';

test('testing console.log', () => {
  console.log('Hello %s!', 'World');

  // Note that in real world console.log will output a new line character in the end,
  // but in our case, we remove that since we don't really care about it.
  expect(getLog().log).toBe('Hello World!');
});
```

All the methods in `console` are available and automatically mocked.

```js
console.log('Hello %s!', 'World');

expect(console.log).toHaveBeenCalledTimes(1);
expect(console.log).toHaveBeenCalledWith('Hello %s!', 'World');
expect(getLog().log).toBe('Hello World!');
```

All the methods in `console` will also be automatically cleared and cleaned up after each tests.

```js
test('testing console.log 1', () => {
  console.log('Hello %s!', 'World');

  expect(console.log).toHaveBeenCalledTimes(1);
});

test('testing console.log 2', () => {
  console.log('Hello %s!', 'World');

  expect(console.log).toHaveBeenCalledTimes(1);
});
```

Every log have a corresponding **logging level**, you can access each level's log via `getLog().levels`, or access all of them in a list with `getLog().logs`.

```js
console.info('This is %s level', 'log');
console.info('This is %s level', 'info');
console.warn('This is %s level', 'warn');
console.error('This is %s level', 'error');

expect(getLog().levels).toEqual({
  log: 'This is log level',
  info: 'This is info level',
  warn: 'This is warn level',
  error: 'This is error level',
});

expect(getLog().logs).toEqual([
  ['log', 'This is log level'],
  ['info', 'This is info level'],
  ['warn', 'This is warn level'],
  ['error', 'This is error level'],
]);
```

Since the logs are patched, in order to log or debug in the tests will not output as expected. You can import `originalConsole` to obtain the un-patched, un-mocked `console`.

```js
import { originalConsole } from 'jest-console';

console.log('Oops, this will not show since console.log is mocked.');
originalConsole.log(
  'However, this is the un-mocked console and will output the logs'
);
```

## Usage without Jest

It is possible to use `jest-console` without Jest, just that you have to manually mock the console yourself. We provide `createConsole` and `mockConsole` API for this.

```js
import { createConsole, mockConsole } from 'jest-console';

// Create a jestConsole instance. It's possible to create multiple instances if needed
const jestConsole = createConsole();

// Mock the global.console with the jestConsole we just created
// It returns a restore function, which will swap back to the original console
const restore = mockConsole(jestConsole);

console.log('Mocked console.log');

// Calls restore function when it's done to restore it back to the original console
restore();
```

## Custom matchers

It's often recommended to use `jest-console` with Jest's [`toMatchInlineSnapshot`](https://jestjs.io/docs/en/expect#tomatchinlinesnapshotpropertymatchers-inlinesnapshot) matcher. It makes it really easy to test the console output with confidence.

```js
expect(getLog().log).toMatchInlineSnapshot();
```

We also support custom `toMatchInlineSnapshot` matcher to test against mocked `console[method]` and `console`.

```js
expect(console).toMatchInlineSnapshot();
// is essentially the same as
// expect(getLog().log).toMatchInlineSnapshot();

expect(console.log).toMatchInlineSnapshot();
// is basically `expect(console.log).toHaveBeenCalledWith` for actual output,
// it will only get the logs calling from `log` method.
```

## License

MIT
