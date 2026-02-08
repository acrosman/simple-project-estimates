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
  });

  test('Validate exported state exists', () => {
    expect(idx).toHaveProperty('getEstimationMode');
    expect(idx).toHaveProperty('fibonacciMappings');
    expect(idx).toHaveProperty('getEnableCost');
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
    expect(element.classList.length).toBe(0);
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
    expect(wrapper.children.length).toBe(2);
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
    expect(div.classList.length).toBe(0);
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
    expect(div.classList.length).toBe(3);
  });

  test('handles empty classList array', () => {
    const div = idx.createDivWithIdAndClasses('emptyClasses', []);

    expect(div.id).toBe('emptyClasses');
    expect(div.classList.length).toBe(0);
  });
});

describe('generateDataField', () => {
  test('creates data field cell with input', () => {
    const cell = idx.generateDataField('Task', 'Test Task', 'text', 1);

    expect(cell.tagName).toBe('DIV');
    expect(cell.classList.contains('td')).toBe(true);
    expect(cell.children.length).toBe(1);
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
