require('../pure');

test('it should be pure', () => {
  expect(jest.isMockFunction(console.log)).toBe(false);
});
