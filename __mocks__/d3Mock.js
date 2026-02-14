// Mock D3 for testing
const createScale = () => {
  const scale = (value) => value;
  scale.domain = jest.fn().mockReturnThis();
  scale.range = jest.fn().mockReturnThis();
  scale.ticks = jest.fn().mockReturnValue([]);
  return scale;
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
    data: jest.fn().mockReturnThis(),
    enter: jest.fn().mockReturnThis(),
    exit: jest.fn().mockReturnThis(),
    join: jest.fn((enterFn, updateFn, exitFn) => {
      if (enterFn) enterFn(createSelection());
      if (updateFn) updateFn(createSelection());
      if (exitFn) exitFn(createSelection());
      return createSelection();
    }),
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
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
};
