/**
 * @jest-environment jsdom
 */

import * as idx from '../index';

describe('Index Module Exports', () => {
  test('Validate exported functions exist', () => {
    expect(idx).toHaveProperty('createTextElement');
    expect(idx).toHaveProperty('createLabeledInput');
    expect(idx).toHaveProperty('createDivWithIdAndClasses');
    expect(idx).toHaveProperty('generateDataField');
    expect(idx).toHaveProperty('updateElementText');
    expect(idx).toHaveProperty('buildTaskRowHistogram');
    expect(idx).toHaveProperty('renderTaskRowHistograms');
    expect(idx).toHaveProperty('isRowEmpty');
    expect(idx).toHaveProperty('normalizeTshirtSize');
    expect(idx).toHaveProperty('updateTshirtMapping');
    expect(idx).toHaveProperty('getNextFibonacci');
    expect(idx).toHaveProperty('addFibonacciNumber');
  });

  test('Validate exported state exists', () => {
    expect(idx).toHaveProperty('getEstimationMode');
    expect(idx).toHaveProperty('fibonacciMappings');
    expect(idx).toHaveProperty('tshirtMappings');
    expect(idx).toHaveProperty('getEnableCost');
  });
});

describe('isRowEmpty', () => {
  beforeEach(() => {
    // Create a test container
    document.body.innerHTML = '';
  });

  test('returns true when all fields are empty', () => {
    document.body.innerHTML = `
      <input data-row-id="1" type="text" value="" />
      <input data-row-id="1" type="number" value="" />
      <input data-row-id="1" type="number" value="" />
      <input data-row-id="1" type="button" value="Clear" />
    `;
    expect(idx.isRowEmpty('1')).toBe(true);
  });

  test('returns false when at least one field has a value', () => {
    document.body.innerHTML = `
      <input data-row-id="2" type="text" value="Task Name" />
      <input data-row-id="2" type="number" value="" />
      <input data-row-id="2" type="number" value="" />
      <input data-row-id="2" type="button" value="Clear" />
    `;
    expect(idx.isRowEmpty('2')).toBe(false);
  });

  test('returns false when all fields have values', () => {
    document.body.innerHTML = `
      <input data-row-id="3" type="text" value="Task" />
      <input data-row-id="3" type="number" value="10" />
      <input data-row-id="3" type="number" value="20" />
      <input data-row-id="3" type="number" value="90" />
      <input data-row-id="3" type="button" value="Clear" />
    `;
    expect(idx.isRowEmpty('3')).toBe(false);
  });

  test('returns true when fields contain only whitespace', () => {
    document.body.innerHTML = `
      <input data-row-id="4" type="text" value="   " />
      <input data-row-id="4" type="number" value="  " />
      <input data-row-id="4" type="button" value="Clear" />
    `;
    expect(idx.isRowEmpty('4')).toBe(true);
  });

  test('ignores button inputs when checking', () => {
    document.body.innerHTML = `
      <input data-row-id="5" type="text" value="" />
      <input data-row-id="5" type="number" value="" />
      <input data-row-id="5" type="button" value="Clear" />
    `;
    expect(idx.isRowEmpty('5')).toBe(true);
  });

  test('returns true when row has no input fields', () => {
    document.body.innerHTML = `
      <div data-row-id="6"></div>
    `;
    expect(idx.isRowEmpty('6')).toBe(true);
  });

  test('correctly identifies different rows independently', () => {
    document.body.innerHTML = `
      <input data-row-id="7" type="text" value="Filled" />
      <input data-row-id="8" type="text" value="" />
    `;
    expect(idx.isRowEmpty('7')).toBe(false);
    expect(idx.isRowEmpty('8')).toBe(true);
  });

  test('returns false when any numeric field has value', () => {
    document.body.innerHTML = `
      <input data-row-id="9" type="text" value="" />
      <input data-row-id="9" type="number" value="5" />
      <input data-row-id="9" type="number" value="" />
    `;
    expect(idx.isRowEmpty('9')).toBe(false);
  });
});

describe('createTextElement', () => {
  test('creates element with text content', () => {
    const element = idx.createTextElement('div', 'Test Text');
    expect(element.tagName).toBe('DIV');
    expect(element.textContent).toBe('Test Text');
  });

  test('creates element with single class', () => {
    const element = idx.createTextElement('span', 'Text', ['test-class']);
    expect(element.tagName).toBe('SPAN');
    expect(element.classList.contains('test-class')).toBe(true);
  });

  test('creates element with multiple classes', () => {
    const element = idx.createTextElement('p', 'Paragraph', ['class1', 'class2', 'class3']);
    expect(element.tagName).toBe('P');
    expect(element.classList.contains('class1')).toBe(true);
    expect(element.classList.contains('class2')).toBe(true);
    expect(element.classList.contains('class3')).toBe(true);
  });

  test('creates element with empty classList by default', () => {
    const element = idx.createTextElement('h1', 'Header');
    expect(element.classList).toHaveLength(0);
  });

  test('creates different HTML tags correctly', () => {
    const div = idx.createTextElement('div', 'Div');
    const span = idx.createTextElement('span', 'Span');
    const h2 = idx.createTextElement('h2', 'Heading');

    expect(div.tagName).toBe('DIV');
    expect(span.tagName).toBe('SPAN');
    expect(h2.tagName).toBe('H2');
  });
});

describe('createLabeledInput', () => {
  test('creates labeled input with label first', () => {
    const attributes = { name: 'testInput', type: 'text', value: 'test' };
    const wrapper = idx.createLabeledInput('Test Label', attributes, true);

    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.children).toHaveLength(2);
    expect(wrapper.children[0].tagName).toBe('LABEL');
    expect(wrapper.children[1].tagName).toBe('INPUT');
  });

  test('creates labeled input with input first', () => {
    const attributes = { name: 'testInput', type: 'checkbox', value: '1' };
    const wrapper = idx.createLabeledInput('Checkbox Label', attributes, false);

    expect(wrapper.children[0].tagName).toBe('INPUT');
    expect(wrapper.children[1].tagName).toBe('LABEL');
  });

  test('label has correct text and htmlFor attribute', () => {
    const attributes = { name: 'testField', type: 'text' };
    const wrapper = idx.createLabeledInput('Field Label', attributes);
    const label = wrapper.querySelector('label');

    expect(label.textContent).toBe('Field Label');
    expect(label.htmlFor).toBe('testField');
  });

  test('input has correct attributes', () => {
    const attributes = {
      name: 'numberField', type: 'number', value: '42', min: '0', max: '100',
    };
    const wrapper = idx.createLabeledInput('Number', attributes);
    const input = wrapper.querySelector('input');

    expect(input.name).toBe('numberField');
    expect(input.type).toBe('number');
    expect(input.value).toBe('42');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
  });

  test('defaults to label first when labelFirst not specified', () => {
    const attributes = { name: 'test', type: 'text' };
    const wrapper = idx.createLabeledInput('Label', attributes);

    expect(wrapper.children[0].tagName).toBe('LABEL');
    expect(wrapper.children[1].tagName).toBe('INPUT');
  });
});

describe('createDivWithIdAndClasses', () => {
  test('creates div with id and no classes', () => {
    const div = idx.createDivWithIdAndClasses('testId');

    expect(div.tagName).toBe('DIV');
    expect(div.id).toBe('testId');
    expect(div.classList).toHaveLength(0);
  });

  test('creates div with id and single class', () => {
    const div = idx.createDivWithIdAndClasses('myDiv', ['class1']);

    expect(div.id).toBe('myDiv');
    expect(div.classList.contains('class1')).toBe(true);
  });

  test('creates div with id and multiple classes', () => {
    const div = idx.createDivWithIdAndClasses('complexDiv', ['class1', 'class2', 'class3']);

    expect(div.id).toBe('complexDiv');
    expect(div.classList.contains('class1')).toBe(true);
    expect(div.classList.contains('class2')).toBe(true);
    expect(div.classList.contains('class3')).toBe(true);
    expect(div.classList).toHaveLength(3);
  });

  test('handles empty classList array', () => {
    const div = idx.createDivWithIdAndClasses('emptyClasses', []);

    expect(div.id).toBe('emptyClasses');
    expect(div.classList).toHaveLength(0);
  });
});

describe('generateDataField', () => {
  test('creates data field cell with input', () => {
    const cell = idx.generateDataField('Task', 'Test Task', 'text', 1);

    expect(cell.tagName).toBe('DIV');
    expect(cell.classList.contains('td')).toBe(true);
    expect(cell.children).toHaveLength(1);
  });

  test('input has correct attributes', () => {
    const cell = idx.generateDataField('Min Time', '10', 'number', 2);
    const input = cell.querySelector('input');

    expect(input.type).toBe('number');
    expect(input.value).toBe('10');
    expect(input.name).toBe('Min Time');
    // aria-label is set via Object.assign which sets it as a property
    expect(input['aria-label']).toBe('Min Time');
    expect(input.dataset.rowId).toBe('2');
  });

  test('creates button type field', () => {
    const cell = idx.generateDataField('Clear', 'Clear', 'button', 3);
    const input = cell.querySelector('input');

    expect(input.type).toBe('button');
    expect(input.value).toBe('Clear');
    expect(input.dataset.rowId).toBe('3');
  });

  test('creates text input field', () => {
    const cell = idx.generateDataField('Task', 'Setup', 'text', 1);
    const input = cell.querySelector('input');

    expect(input.type).toBe('text');
    expect(input.value).toBe('Setup');
  });

  test('rowId is stored as data attribute', () => {
    const cell = idx.generateDataField('Cost', '120', 'number', 99);
    const input = cell.querySelector('input');

    expect(input.dataset.rowId).toBe('99');
  });
});

describe('updateElementText', () => {
  beforeEach(() => {
    // Clear document body before each test
    document.body.innerHTML = '';
  });

  test('updates element text content', () => {
    const div = document.createElement('div');
    div.id = 'testElement';
    document.body.appendChild(div);

    idx.updateElementText('testElement', 'New Content');

    expect(div.textContent).toBe('New Content');
  });

  test('replaces existing text content', () => {
    const span = document.createElement('span');
    span.id = 'updateMe';
    span.textContent = 'Old Text';
    document.body.appendChild(span);

    idx.updateElementText('updateMe', 'Updated Text');

    expect(span.textContent).toBe('Updated Text');
  });

  test('clears text when empty string provided', () => {
    const p = document.createElement('p');
    p.id = 'paragraph';
    p.textContent = 'Some text';
    document.body.appendChild(p);

    idx.updateElementText('paragraph', '');

    expect(p.textContent).toBe('');
  });

  test('handles numeric content', () => {
    const div = document.createElement('div');
    div.id = 'numericDiv';
    document.body.appendChild(div);

    idx.updateElementText('numericDiv', 'Median: 42');

    expect(div.textContent).toBe('Median: 42');
  });
});

describe('buildTaskRowHistogram', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('renders compact histogram svg for valid task distribution', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const histogram = [0, 3, 0, 5, 2, 1];

    idx.buildTaskRowHistogram(wrapper, histogram, 1, 5, 'Task A');

    const svg = wrapper.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('height')).toBe('26');
    expect(svg.querySelectorAll('rect').length).toBeGreaterThan(0);
  });

  test('does not render when min and max are invalid', () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<span>old</span>';
    document.body.appendChild(wrapper);

    idx.buildTaskRowHistogram(wrapper, [0, 1, 2], 5, 2, 'Task B');

    expect(wrapper.querySelector('svg')).toBeNull();
    expect(wrapper.innerHTML).toBe('');
  });
});

describe('renderTaskRowHistograms', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('renders histogram only for matching task row ids', () => {
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"></div>
      <div class="task-row-graph" data-row-id="2"></div>
    `;

    idx.renderTaskRowHistograms([
      {
        rowId: '1',
        name: 'Task 1',
        times: {
          list: [0, 2, 4, 2],
          min: 1,
          max: 3,
        },
      },
    ]);

    const row1Svg = document.querySelector('.task-row-graph[data-row-id="1"] svg');
    const row2Svg = document.querySelector('.task-row-graph[data-row-id="2"] svg');

    expect(row1Svg).not.toBeNull();
    expect(row2Svg).toBeNull();
  });

  test('clears existing graphs when no task results are provided', () => {
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"><svg></svg></div>
    `;

    idx.renderTaskRowHistograms([]);

    expect(document.querySelector('.task-row-graph[data-row-id="1"]').innerHTML).toBe('');
  });
});

describe('Fibonacci Mappings', () => {
  test('has correct Fibonacci numbers as keys', () => {
    const fibKeys = Object.keys(idx.fibonacciMappings).map(Number);
    expect(fibKeys).toEqual([1, 2, 3, 5, 8, 13, 21, 34]);
  });

  test('each mapping has min and max properties', () => {
    Object.values(idx.fibonacciMappings).forEach((mapping) => {
      expect(mapping).toHaveProperty('min');
      expect(mapping).toHaveProperty('max');
    });
  });

  test('min values follow Fibonacci sequence pattern', () => {
    expect(idx.fibonacciMappings[1].min).toBe(0);
    expect(idx.fibonacciMappings[2].min).toBe(1);
    expect(idx.fibonacciMappings[3].min).toBe(2);
    expect(idx.fibonacciMappings[5].min).toBe(3);
    expect(idx.fibonacciMappings[8].min).toBe(5);
    expect(idx.fibonacciMappings[13].min).toBe(8);
    expect(idx.fibonacciMappings[21].min).toBe(13);
  });

  test('max values match Fibonacci keys', () => {
    expect(idx.fibonacciMappings[1].max).toBe(1);
    expect(idx.fibonacciMappings[2].max).toBe(2);
    expect(idx.fibonacciMappings[3].max).toBe(3);
    expect(idx.fibonacciMappings[5].max).toBe(5);
    expect(idx.fibonacciMappings[8].max).toBe(8);
    expect(idx.fibonacciMappings[13].max).toBe(13);
    expect(idx.fibonacciMappings[21].max).toBe(21);
  });

  test('min is always less than or equal to max', () => {
    Object.values(idx.fibonacciMappings).forEach((mapping) => {
      expect(mapping.min).toBeLessThanOrEqual(mapping.max);
    });
  });
});

describe('T-Shirt Mappings', () => {
  test('has expected t-shirt sizes as keys', () => {
    const tshirtKeys = Object.keys(idx.tshirtMappings);
    expect(tshirtKeys).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  });

  test('each t-shirt mapping has min and max properties', () => {
    Object.values(idx.tshirtMappings).forEach((mapping) => {
      expect(mapping).toHaveProperty('min');
      expect(mapping).toHaveProperty('max');
    });
  });

  test('t-shirt mappings follow expected hour ranges', () => {
    expect(idx.tshirtMappings.XS).toEqual({ min: 1, max: 2 });
    expect(idx.tshirtMappings.S).toEqual({ min: 2, max: 3 });
    expect(idx.tshirtMappings.M).toEqual({ min: 3, max: 5 });
    expect(idx.tshirtMappings.L).toEqual({ min: 5, max: 8 });
    expect(idx.tshirtMappings.XL).toEqual({ min: 8, max: 13 });
    expect(idx.tshirtMappings.XXL).toEqual({ min: 13, max: 21 });
  });

  test('normalizes lowercase t-shirt input for mapping lookup', () => {
    expect(idx.normalizeTshirtSize('xl')).toBe('XL');
    expect(idx.tshirtMappings[idx.normalizeTshirtSize('xl')]).toEqual({ min: 8, max: 13 });
  });

  test('trims and normalizes t-shirt input for mapping lookup', () => {
    expect(idx.normalizeTshirtSize('  xxl  ')).toBe('XXL');
    expect(idx.tshirtMappings[idx.normalizeTshirtSize('  xxl  ')]).toEqual({ min: 13, max: 21 });
  });
});

describe('updateFibonacciMapping', () => {
  beforeEach(() => {
    // Reset mappings to default values before each test
    idx.fibonacciMappings[1] = { min: 0, max: 1 };
    idx.fibonacciMappings[2] = { min: 1, max: 2 };
    idx.fibonacciMappings[3] = { min: 2, max: 3 };
    idx.fibonacciMappings[5] = { min: 3, max: 5 };
    idx.fibonacciMappings[8] = { min: 5, max: 8 };
    idx.fibonacciMappings[13] = { min: 8, max: 13 };
    idx.fibonacciMappings[21] = { min: 13, max: 21 };
  });

  test('updates min value when min input changes', () => {
    const mockEvent = {
      target: {
        dataset: { fib: '5', type: 'min' },
        value: '10',
      },
    };

    idx.updateFibonacciMapping(mockEvent);

    expect(idx.fibonacciMappings[5].min).toBe(10);
    expect(idx.fibonacciMappings[5].max).toBe(5); // max should remain unchanged
  });

  test('updates max value when max input changes', () => {
    const mockEvent = {
      target: {
        dataset: { fib: '8', type: 'max' },
        value: '20',
      },
    };

    idx.updateFibonacciMapping(mockEvent);

    expect(idx.fibonacciMappings[8].max).toBe(20);
    expect(idx.fibonacciMappings[8].min).toBe(5); // min should remain unchanged
  });

  test('updates correct Fibonacci number mapping', () => {
    const mockEvent = {
      target: {
        dataset: { fib: '13', type: 'max' },
        value: '25',
      },
    };

    idx.updateFibonacciMapping(mockEvent);

    expect(idx.fibonacciMappings[13].max).toBe(25);
    expect(idx.fibonacciMappings[8].max).toBe(8); // other mappings unchanged
    expect(idx.fibonacciMappings[21].max).toBe(21); // other mappings unchanged
  });

  test('handles string numbers correctly', () => {
    const mockEvent = {
      target: {
        dataset: { fib: '21', type: 'min' },
        value: '15',
      },
    };

    idx.updateFibonacciMapping(mockEvent);

    expect(idx.fibonacciMappings[21].min).toBe(15);
    expect(typeof idx.fibonacciMappings[21].min).toBe('number');
  });

  test('does not crash for non-existent Fibonacci number', () => {
    const mockEvent = {
      target: {
        dataset: { fib: '99', type: 'min' },
        value: '50',
      },
    };

    expect(() => idx.updateFibonacciMapping(mockEvent)).not.toThrow();
  });

  test('updates multiple values sequentially', () => {
    const event1 = {
      target: {
        dataset: { fib: '5', type: 'min' },
        value: '4',
      },
    };
    const event2 = {
      target: {
        dataset: { fib: '5', type: 'max' },
        value: '10',
      },
    };

    idx.updateFibonacciMapping(event1);
    idx.updateFibonacciMapping(event2);

    expect(idx.fibonacciMappings[5].min).toBe(4);
    expect(idx.fibonacciMappings[5].max).toBe(10);
  });
});

describe('updateTshirtMapping', () => {
  beforeEach(() => {
    idx.tshirtMappings.XS = { min: 1, max: 2 };
    idx.tshirtMappings.S = { min: 2, max: 3 };
    idx.tshirtMappings.M = { min: 3, max: 5 };
    idx.tshirtMappings.L = { min: 5, max: 8 };
    idx.tshirtMappings.XL = { min: 8, max: 13 };
    idx.tshirtMappings.XXL = { min: 13, max: 21 };
  });

  test('updates min value when min input changes', () => {
    const mockEvent = {
      target: {
        dataset: { tshirt: 'XL', type: 'min' },
        value: '9',
      },
    };

    idx.updateTshirtMapping(mockEvent);

    expect(idx.tshirtMappings.XL.min).toBe(9);
    expect(idx.tshirtMappings.XL.max).toBe(13);
  });

  test('updates max value when max input changes', () => {
    const mockEvent = {
      target: {
        dataset: { tshirt: 'M', type: 'max' },
        value: '6',
      },
    };

    idx.updateTshirtMapping(mockEvent);

    expect(idx.tshirtMappings.M.max).toBe(6);
    expect(idx.tshirtMappings.M.min).toBe(3);
  });

  test('normalizes lowercase size key before updating', () => {
    const mockEvent = {
      target: {
        dataset: { tshirt: 'xxl', type: 'min' },
        value: '12',
      },
    };

    idx.updateTshirtMapping(mockEvent);

    expect(idx.tshirtMappings.XXL.min).toBe(12);
  });

  test('does not crash for unknown size', () => {
    const mockEvent = {
      target: {
        dataset: { tshirt: 'XXXL', type: 'min' },
        value: '20',
      },
    };

    expect(() => idx.updateTshirtMapping(mockEvent)).not.toThrow();
  });
});

describe('getNextFibonacci', () => {
  beforeEach(() => {
    // Reset mappings to default state
    Object.keys(idx.fibonacciMappings).forEach((key) => {
      if (parseInt(key, 10) > 34) {
        delete idx.fibonacciMappings[key];
      }
    });
    idx.fibonacciMappings[1] = { min: 0, max: 1 };
    idx.fibonacciMappings[2] = { min: 1, max: 2 };
    idx.fibonacciMappings[3] = { min: 2, max: 3 };
    idx.fibonacciMappings[5] = { min: 3, max: 5 };
    idx.fibonacciMappings[8] = { min: 5, max: 8 };
    idx.fibonacciMappings[13] = { min: 8, max: 13 };
    idx.fibonacciMappings[21] = { min: 13, max: 21 };
    idx.fibonacciMappings[34] = { min: 21, max: 34 };
  });

  test('calculates next Fibonacci number correctly', () => {
    expect(idx.getNextFibonacci()).toBe(55);
  });

  test('continues sequence after multiple additions', () => {
    idx.fibonacciMappings[55] = { min: 34, max: 55 };
    expect(idx.getNextFibonacci()).toBe(89);
  });

  test('handles extended sequence', () => {
    idx.fibonacciMappings[55] = { min: 34, max: 55 };
    idx.fibonacciMappings[89] = { min: 55, max: 89 };
    expect(idx.getNextFibonacci()).toBe(144);
  });

  test('works with unordered keys in object', () => {
    // Add a new number out of order
    idx.fibonacciMappings[55] = { min: 34, max: 55 };
    // Function should still calculate correctly by sorting
    expect(idx.getNextFibonacci()).toBe(89);
  });
});

describe('addFibonacciNumber', () => {
  beforeEach(() => {
    // Reset mappings and DOM
    Object.keys(idx.fibonacciMappings).forEach((key) => {
      if (parseInt(key, 10) > 34) {
        delete idx.fibonacciMappings[key];
      }
    });
    idx.fibonacciMappings[1] = { min: 0, max: 1 };
    idx.fibonacciMappings[2] = { min: 1, max: 2 };
    idx.fibonacciMappings[3] = { min: 2, max: 3 };
    idx.fibonacciMappings[5] = { min: 3, max: 5 };
    idx.fibonacciMappings[8] = { min: 5, max: 8 };
    idx.fibonacciMappings[13] = { min: 8, max: 13 };
    idx.fibonacciMappings[21] = { min: 13, max: 21 };
    idx.fibonacciMappings[34] = { min: 21, max: 34 };

    document.body.innerHTML = '';
  });

  test('adds next Fibonacci number to mappings', () => {
    idx.addFibonacciNumber();
    expect(idx.fibonacciMappings).toHaveProperty('55');
  });

  test('sets correct min value from previous max', () => {
    idx.addFibonacciNumber();
    expect(idx.fibonacciMappings[55].min).toBe(34);
  });

  test('sets correct max value as new Fibonacci number', () => {
    idx.addFibonacciNumber();
    expect(idx.fibonacciMappings[55].max).toBe(55);
  });

  test('can add multiple numbers sequentially', () => {
    idx.addFibonacciNumber();
    expect(idx.fibonacciMappings).toHaveProperty('55');

    idx.addFibonacciNumber();
    expect(idx.fibonacciMappings).toHaveProperty('89');

    idx.addFibonacciNumber();
    expect(idx.fibonacciMappings).toHaveProperty('144');
  });

  test('maintains proper sequence relationships', () => {
    idx.addFibonacciNumber(); // Add 55
    idx.addFibonacciNumber(); // Add 89

    expect(idx.fibonacciMappings[89].min).toBe(55);
    expect(idx.fibonacciMappings[89].max).toBe(89);
  });

  test('does not modify existing mappings', () => {
    const originalMapping = { ...idx.fibonacciMappings[34] };
    idx.addFibonacciNumber();

    expect(idx.fibonacciMappings[34]).toEqual(originalMapping);
  });

  test('updates DOM when wrapper exists', () => {
    // Create a mock parent element with the Fibonacci wrapper
    const parent = document.createElement('div');
    const wrapper = document.createElement('div');
    wrapper.id = 'fibonacciMappingWrapper';
    parent.appendChild(wrapper);
    document.body.appendChild(parent);

    idx.addFibonacciNumber();

    // Check that wrapper still exists (was replaced, not removed)
    const updatedWrapper = document.getElementById('fibonacciMappingWrapper');
    expect(updatedWrapper).not.toBeNull();
  });

  test('does not crash when DOM wrapper is missing', () => {
    expect(() => idx.addFibonacciNumber()).not.toThrow();
  });
});

describe('Estimation Mode', () => {
  test('defaults to hours mode', () => {
    expect(idx.getEstimationMode()).toBe('hours');
  });
});

describe('Cost Tracking', () => {
  test('cost tracking is enabled by default', () => {
    expect(idx.getEnableCost()).toBe(true);
  });
});

describe('saveSvgAsImage', () => {
  let mockContainer;
  let mockSvg;
  let mockCanvas;
  let mockContext;
  let mockImage;
  let originalCreateElement;
  let originalGetComputedStyle;
  let originalURL;
  let originalAlert;

  beforeEach(() => {
    // Mock DOM elements
    mockContext = {
      fillRect: jest.fn(),
      drawImage: jest.fn(),
    };

    mockCanvas = {
      getContext: jest.fn(() => mockContext),
      toBlob: jest.fn((callback) => callback(new Blob(['test'], { type: 'image/png' }))),
      width: 0,
      height: 0,
    };

    mockSvg = {
      cloneNode: jest.fn(() => ({
        querySelectorAll: jest.fn(() => []),
      })),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 })),
    };

    mockContainer = {
      querySelector: jest.fn(() => mockSvg),
    };

    // Mock Image constructor
    mockImage = {
      onload: null,
      src: '',
    };

    // Mock document methods
    document.getElementById = jest.fn(() => mockContainer);
    originalCreateElement = document.createElement;
    document.createElement = jest.fn((tag) => {
      if (tag === 'canvas') return mockCanvas;
      if (tag === 'a') {
        return {
          click: jest.fn(),
          download: '',
          href: '',
        };
      }
      return originalCreateElement.call(document, tag);
    });

    // Mock Image constructor globally
    global.Image = jest.fn(() => mockImage);

    // Mock XMLSerializer
    global.XMLSerializer = jest.fn(() => ({
      serializeToString: jest.fn(() => '<svg></svg>'),
    }));

    // Mock Blob
    global.Blob = jest.fn((content, options) => ({
      content,
      options,
      type: options.type,
    }));

    // Mock window.getComputedStyle
    originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = jest.fn(() => ({
      getPropertyValue: jest.fn(() => 'blue'),
      [Symbol.iterator]: function* iterator() {
        yield 'fill';
        yield 'stroke';
      },
    }));

    // Mock URL methods
    originalURL = global.URL;
    global.URL = {
      createObjectURL: jest.fn(() => 'blob:mock-url'),
      revokeObjectURL: jest.fn(),
    };

    // Mock alert
    originalAlert = global.alert;
    global.alert = jest.fn();
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    window.getComputedStyle = originalGetComputedStyle;
    global.URL = originalURL;
    global.alert = originalAlert;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('shows error message when no SVG found', () => {
    mockContainer.querySelector = jest.fn(() => null);
    mockContainer.appendChild = jest.fn();
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    expect(mockContainer.appendChild).toHaveBeenCalled();
    const errorDiv = mockContainer.appendChild.mock.calls[0][0];
    expect(errorDiv.getAttribute('role')).toBe('alert');
    expect(errorDiv.textContent).toBe('No graph to save. Please run a simulation first.');
  });

  test('clones SVG to avoid modifying original', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    expect(mockSvg.cloneNode).toHaveBeenCalledWith(true);
  });

  test('creates canvas with correct dimensions including bottom margin', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    // Trigger onload
    mockImage.onload();
    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(620); // 600 + 20 margin
  });

  test('draws white background before image', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    mockImage.onload();
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 620);
    expect(mockContext.drawImage).toHaveBeenCalledWith(mockImage, 0, 0);
  });

  test('generates PNG by default', () => {
    idx.saveSvgAsImage('testId', 'test-file');
    mockImage.onload();
    expect(mockCanvas.toBlob).toHaveBeenCalled();
    const toBlobCall = mockCanvas.toBlob.mock.calls[0];
    expect(toBlobCall[1]).toBe('image/png');
  });

  test('generates JPEG when specified', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'jpeg');
    mockImage.onload();
    const toBlobCall = mockCanvas.toBlob.mock.calls[0];
    expect(toBlobCall[1]).toBe('image/jpeg');
  });

  test('uses XMLSerializer to serialize SVG', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    expect(global.XMLSerializer).toHaveBeenCalled();
  });

  test('creates blob URL and sets as image source', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockImage.src).toBe('blob:mock-url');
  });

  test('revokes blob URL after image loads', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    mockImage.onload();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  test('gets computed styles from original elements', () => {
    const mockElements = [
      { setAttribute: jest.fn() },
      { setAttribute: jest.fn() },
    ];
    const mockOriginalElements = [{}, {}];

    const clonedSvg = {
      querySelectorAll: jest.fn(() => mockElements),
    };

    mockSvg.cloneNode = jest.fn(() => clonedSvg);
    mockSvg.querySelectorAll = jest.fn(() => mockOriginalElements);

    idx.saveSvgAsImage('testId', 'test-file', 'png');

    expect(window.getComputedStyle).toHaveBeenCalled();
    expect(mockElements[0].setAttribute).toHaveBeenCalled();
  });
});
describe('validateCsvData', () => {
  test('throws error when data is null', () => {
    expect(() => idx.validateCsvData(null, 'hours', false)).toThrow('CSV file is empty or contains no data rows.');
  });

  test('throws error when data is empty array', () => {
    expect(() => idx.validateCsvData([], 'hours', false)).toThrow('CSV file is empty or contains no data rows.');
  });

  test('throws error when required columns are missing - hours mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => idx.validateCsvData(data, 'hours', false)).toThrow('Missing required columns: Min, Max');
  });

  test('throws error when required columns are missing - fibonacci mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => idx.validateCsvData(data, 'fibonacci', false)).toThrow('Missing required columns: Fibonacci');
  });

  test('throws error when required columns are missing - tshirt mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => idx.validateCsvData(data, 'tshirt', false)).toThrow('Missing required columns: TShirt');
  });

  test('throws error when Min value is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 'abc', Max: 10, Confidence: 90,
      },
    ];
    expect(() => idx.validateCsvData(data, 'hours', false)).toThrow('Invalid Min value "abc" in row 1. Must be a number.');
  });

  test('throws error when Max value is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 'xyz', Confidence: 90,
      },
    ];
    expect(() => idx.validateCsvData(data, 'hours', false)).toThrow('Invalid Max value "xyz" in row 1. Must be a number.');
  });

  test('throws error when Confidence is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: 'high',
      },
    ];
    expect(() => idx.validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "high" in row 1. Must be a number between 0 and 100.');
  });

  test('throws error when Confidence is below 0', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: -10,
      },
    ];
    expect(() => idx.validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "-10" in row 1. Must be a number between 0 and 100.');
  });

  test('throws error when Confidence is above 100', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: 150,
      },
    ];
    expect(() => idx.validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "150" in row 1. Must be a number between 0 and 100.');
  });

  test('accepts valid hours mode data', () => {
    const data = [
      {
        Task: 'Task 1', Min: 5, Max: 10, Confidence: 90,
      },
      {
        Task: 'Task 2', Min: 3, Max: 8, Confidence: 80,
      },
    ];
    expect(() => idx.validateCsvData(data, 'hours', false)).not.toThrow();
    const result = idx.validateCsvData(data, 'hours', false);
    expect(result).toEqual(data);
  });

  test('accepts valid fibonacci mode data', () => {
    const data = [
      {
        Task: 'Task 1', Fibonacci: 5, Confidence: 90,
      },
      {
        Task: 'Task 2', Fibonacci: 8, Confidence: 80,
      },
    ];
    expect(() => idx.validateCsvData(data, 'fibonacci', false)).not.toThrow();
    const result = idx.validateCsvData(data, 'fibonacci', false);
    expect(result).toEqual(data);
  });

  test('accepts valid tshirt mode data', () => {
    const data = [
      {
        Task: 'Task 1', TShirt: 'M', Confidence: 90,
      },
      {
        Task: 'Task 2', TShirt: 'L', Confidence: 80,
      },
    ];
    expect(() => idx.validateCsvData(data, 'tshirt', false)).not.toThrow();
    const result = idx.validateCsvData(data, 'tshirt', false);
    expect(result).toEqual(data);
  });

  test('validates only first 3 rows for large datasets', () => {
    const data = [
      {
        Task: 'Task 1', Min: 5, Max: 10, Confidence: 90,
      },
      {
        Task: 'Task 2', Min: 3, Max: 8, Confidence: 80,
      },
      {
        Task: 'Task 3', Min: 2, Max: 6, Confidence: 70,
      },
      {
        Task: 'Task 4', Min: 'invalid', Max: 15, Confidence: 85,
      }, // Invalid but in 4th row
    ];
    // Should not throw since only first 3 rows are validated
    expect(() => idx.validateCsvData(data, 'hours', false)).not.toThrow();
  });

  test('includes Cost message when enableCost is true', () => {
    const data = [
      {
        Task: 'Test Task', Confidence: 90,
      },
    ];
    expect(() => idx.validateCsvData(data, 'hours', true)).toThrow('Cost (optional)');
  });

  test('handles string numbers for Min and Max', () => {
    const data = [
      {
        Task: 'Test', Min: '5', Max: '10', Confidence: '90',
      },
    ];
    expect(() => idx.validateCsvData(data, 'hours', false)).not.toThrow();
  });
});
