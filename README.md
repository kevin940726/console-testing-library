# `console-testing-library`

Testing console the right way.

## Why

It's rare to have `console` in your code, it's more often seen in libraries to provide helpful debugging warnings. When trying to mock `console` in tests, we often just `spyOn` the methods being used and observe the mock calls. This works great if your message is simple, but it can also have false-negative.

Consider a situation where we want to log inspectable objects, to make it prettily printed in TTY environments, and interactable in browser's console. There are only 2 options we can do in order to achieve with the current console API. Either by string substitution or with arguments concatenation.

```js
// string substitution
console.error('I want to log this object: %o, and make it inspectable', obj);

// arguments concatenation
console.error('I want to log this object:', obj, ', and make it inspectable');
```

We could use Jest's `toHaveBeenCalledWith` here, but the tests would look like this.

```js
// string substitution
expect(console.error).toHaveBeenCalledWith(
  'I want to log this object: %o, and make it inspectable',
  obj
);

// arguments concatenation
expect(console.error).toHaveBeenCalledWith(
  'I want to log this object:',
  obj,
  ', and make it inspectable'
);
```

Either way is not ideal, we are just repeating the source code here, we're not testing what the user really sees, but what the code looks like. Every time when the message changed, we have to update the test too, which makes it a fragile test. In addition, what if `obj` is not inspectable? Or not valid? Or simply not what we want? We cannot be sure without actually logging the message.

A better solution would be to get the actual output of the logs and test it against the expected output.

```js
expect(actualLog).toBe(
  'I want to log this object: { "foo": 42 }, and make it inspectable'
);
```

With `console-testing-library`, we can easily do that without extra hassles.

```js
import { getLog } from 'console-testing-library';

expect(getLog().log).toBe(
  'I want to log this object: { "foo": 42 }, and make it inspectable'
);
```

With the help of Jest's `toMatchInlineSnapshot`, we can even let it generate the log snapshot inline.

```js
import { getLog } from 'console-testing-library';

expect(getLog().log).toMatchInlineSnapshot();
// or
expect(console.log).toMatchInlineSnapshot();
```

## Installation

```sh
yarn add -D console-testing-library
```

## Usage

Just import it before calling `console.log` or the family.

```js
import 'console-testing-library';

test('testing console.log', () => {
  // No logs will be output to the console
  console.log('Hello %s!', 'World');
});
```

If you want to get the current logs, import the `getLog` helper.

```js
import { getLog } from 'console-testing-library';

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
import { originalConsole } from 'console-testing-library';

console.log('Oops, this will not show since console.log is mocked.');
originalConsole.log(
  'However, this is the un-mocked console and will output the logs'
);
```

## Usage without Jest

It is possible to use `console-testing-library` without Jest, just that you have to manually mock the console yourself. We provide `createConsole` and `mockConsole` API for this.

```js
import { createConsole, mockConsole } from 'console-testing-library';

// Create a testingConsole instance. It's possible to create multiple instances if needed
const testingConsole = createConsole();

// Mock the global.console with the testingConsole we just created
// It returns a restore function, which will swap back to the original console
const restore = mockConsole(testingConsole);

console.log('Mocked console.log');

// Calls restore function when it's done to restore it back to the original console
restore();
```

## Custom matchers

It's often recommended to use `console-testing-library` with Jest's [`toMatchInlineSnapshot`](https://jestjs.io/docs/en/expect#tomatchinlinesnapshotpropertymatchers-inlinesnapshot) matcher. It makes it really easy to test the console output with confidence.

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

## Silent / Log the output

By default, the console is mocked to be silent. That is, calling `console.log` would not output any actual log to the console, but swallowed into `getLog()`. If you still want to log the output, you can call `silenceConsole`.

```js
import { silenceConsole } from 'console-testing-library';

console.log('It should be silent.'); // No output

silenceConsole(false); // Set to be not silent

console.log('It should now output the log to console'); // Has output

silenceConsole(true); // Can set it back to be silent

console.log('It should be silent.'); // No output
```

If the `console` is created by `createConsole`, `silenceConsole` can be called like below.

```js
const someConsole = createConsole();

mockConsole(someConsole);

silenceConsole(someConsole, false);
```

## License

MIT
