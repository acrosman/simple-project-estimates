// Minimal test: ensure index.js loads without errors
describe('index.js', () => {
  beforeAll(() => {
    global.document = {
      getElementById: jest.fn(() => null),
    };
  });

  afterAll(() => {
    delete global.document;
  });

  test('should load without errors', () => {
    expect(() => {
      // eslint-disable-next-line global-require
      require('../index');
    }).not.toThrow();
  });
});
