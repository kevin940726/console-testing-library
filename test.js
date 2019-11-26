const { getLog } = require('./');

expect(jest.isMockFunction(console.log)).toBe(false);

test('simple', () => {
  console.log('Hello %s!', 'World');

  expect(getLog().log).toMatchInlineSnapshot(`"Hello World!"`);
});

test('advanced', () => {
  console.log(
    'It works with inline value: %s, as well as floating point value: %f. Pretty cool!',
    'foobar',
    3.14
  );
  console.log(
    'Map: %o,\nSet: %o,\nSymbol: %o,\nobject: %o,\nfunction: %o',
    new Map([['foo', 42]]),
    new Set([42]),
    Symbol('symbol'),
    { foo: 42 },
    function foo() {
      return 42;
    }
  );
  console.error('It works with error too');
  console.warn('It works with warning too');

  expect(getLog().log).toMatchInlineSnapshot(`
    "It works with inline value: foobar, as well as floating point value: 3.14. Pretty cool!
    Map: Map {
      \\"foo\\" => 42,
    },
    Set: Set {
      42,
    },
    Symbol: Symbol(symbol),
    object: Object {
      \\"foo\\": 42,
    },
    function: [Function foo]
    It works with error too
    It works with warning too"
  `);
  expect(getLog().logs).toMatchInlineSnapshot(`
    Array [
      Array [
        "log",
        "It works with inline value: foobar, as well as floating point value: 3.14. Pretty cool!",
      ],
      Array [
        "log",
        "Map: Map {
      \\"foo\\" => 42,
    },
    Set: Set {
      42,
    },
    Symbol: Symbol(symbol),
    object: Object {
      \\"foo\\": 42,
    },
    function: [Function foo]",
      ],
      Array [
        "error",
        "It works with error too",
      ],
      Array [
        "warn",
        "It works with warning too",
      ],
    ]
  `);
  expect(getLog().levels.log).toMatchInlineSnapshot(`
    "It works with inline value: foobar, as well as floating point value: 3.14. Pretty cool!
    Map: Map {
      \\"foo\\" => 42,
    },
    Set: Set {
      42,
    },
    Symbol: Symbol(symbol),
    object: Object {
      \\"foo\\": 42,
    },
    function: [Function foo]"
  `);
  expect(getLog().levels.warn).toMatchInlineSnapshot(
    `"It works with warning too"`
  );
  expect(getLog().levels.error).toMatchInlineSnapshot(
    `"It works with error too"`
  );
});

test('they are also mock functions', () => {
  console.log.mockImplementationOnce(() => {});

  console.log('Will not output');

  expect(console.log).toHaveBeenCalledTimes(1);
  expect(getLog().log).toBe('');
  expect(getLog().logs).toMatchInlineSnapshot(`Array []`);
});

test('custom toMatchInlineSnapshot on console', () => {
  console.log('Hello %s!', 'log');
  console.info('Hello %s!', 'info');
  console.warn('Hello %s!', 'warn');
  console.error('Hello %s!', 'error');
  console.debug('Hello %s!', 'debug');

  expect(console.log).toMatchInlineSnapshot(`"Hello log!"`);
  expect(console.info).toMatchInlineSnapshot(`"Hello info!"`);
  expect(console.warn).toMatchInlineSnapshot(`"Hello warn!"`);
  expect(console.error).toMatchInlineSnapshot(`"Hello error!"`);
  expect(console.debug).toMatchInlineSnapshot(`"Hello debug!"`);
  expect(console).toMatchInlineSnapshot(`
    "Hello log!
    Hello info!
    Hello warn!
    Hello error!
    Hello debug!"
  `);
});

test('indent', () => {
  console.log(
    `This
shouldn't be
  properly
    indent %o,
instead
  we have to
    do this manually
%o
or serialize ourselves`,
    { foo: 42 },
    { foo: 42 }
  );

  expect(console.log).toMatchInlineSnapshot(`
    "This
    shouldn't be
      properly
        indent Object {
      \\"foo\\": 42,
    },
    instead
      we have to
        do this manually
    Object {
      \\"foo\\": 42,
    }
    or serialize ourselves"
  `);
});
