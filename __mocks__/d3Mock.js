// Mock D3 for testing
const createScale = () => {
  const scale = (value) => value;
  scale.domain = jest.fn().mockReturnThis();
  scale.range = jest.fn().mockReturnThis();
  scale.ticks = jest.fn().mockReturnValue([]);
  return scale;
};

const createLineGenerator = () => {
  const lineGen = jest.fn().mockReturnValue('M0,0');
  lineGen.x = jest.fn().mockImplementation(function mockX(fn) {
    if (typeof fn === 'function') { try { fn(1, 0); } catch (e) { /* ignore */ } }
    return this;
  });
  lineGen.y = jest.fn().mockImplementation(function mockY(fn) {
    if (typeof fn === 'function') { try { fn(1, 0); } catch (e) { /* ignore */ } }
    return this;
  });
  lineGen.curve = jest.fn().mockReturnThis();
  return lineGen;
};

const createAxis = () => {
  const axis = jest.fn();
  axis.scale = jest.fn().mockReturnThis();
  axis.ticks = jest.fn().mockReturnThis();
  return axis;
};

const createTransition = () => {
  const transition = jest.fn().mockReturnThis();
  transition.duration = jest.fn().mockReturnThis();
  transition.ease = jest.fn().mockReturnThis();
  return transition;
};

const createSelection = () => {
  const selection = {
    append: jest.fn().mockReturnThis(),
    select: jest.fn(() => {
      const sel = createSelection();
      sel.empty = jest.fn().mockReturnValue(false);
      return sel;
    }),
    selectAll: jest.fn().mockReturnThis(),
    data: jest.fn().mockImplementation(function mockData(values, keyFn) {
      if (typeof keyFn === 'function') { try { keyFn(1, 0); } catch (e) { /* ignore */ } }
      return this;
    }),
    enter: jest.fn().mockReturnThis(),
    exit: jest.fn().mockReturnThis(),
    join: jest.fn((enterFn, updateFn, exitFn) => {
      if (typeof enterFn === 'function') enterFn(createSelection());
      if (typeof updateFn === 'function') updateFn(createSelection());
      if (typeof exitFn === 'function') exitFn(createSelection());
      return createSelection();
    }),
    attr: jest.fn().mockImplementation(function mockAttr(name, value) {
      if (typeof value === 'function') {
        try { value(1, 0); } catch (e) { /* ignore errors from sample invocation */ }
      }
      return this;
    }),
    style: jest.fn().mockImplementation(function mockStyle(name, value) {
      if (typeof value === 'function') {
        try { value(1, 0); } catch (e) { /* ignore */ }
      }
      return this;
    }),
    text: jest.fn().mockReturnThis(),
    call: jest.fn((fn) => {
      if (typeof fn === 'function') {
        fn(selection);
      }
      return selection;
    }),
    transition: jest.fn(() => {
      const trans = createSelection();
      trans.duration = jest.fn().mockReturnThis();
      trans.ease = jest.fn().mockReturnThis();
      return trans;
    }),
    remove: jest.fn().mockReturnThis(),
    empty: jest.fn().mockReturnValue(false),
    datum: jest.fn().mockReturnThis(),
  };
  return selection;
};

module.exports = {
  scaleLinear: jest.fn(createScale),
  axisBottom: jest.fn(createAxis),
  axisLeft: jest.fn(createAxis),
  transition: jest.fn(createTransition),
  easeCubicOut: jest.fn(),
  select: jest.fn(() => createSelection()),
  line: jest.fn(createLineGenerator),
  curveCardinal: { tension: jest.fn().mockReturnValue(jest.fn()) },
};
