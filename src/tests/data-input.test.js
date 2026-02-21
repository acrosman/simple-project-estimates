/**
 * @jest-environment jsdom
 */

import * as dataInput from '../data-input';
import { appState, fibonacciCalendarMappings, tshirtMappings } from '../state';

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
    expect(dataInput.isRowEmpty('1')).toBe(true);
  });

  test('returns false when at least one field has a value', () => {
    document.body.innerHTML = `
      <input data-row-id="2" type="text" value="Task Name" />
      <input data-row-id="2" type="number" value="" />
      <input data-row-id="2" type="number" value="" />
      <input data-row-id="2" type="button" value="Clear" />
    `;
    expect(dataInput.isRowEmpty('2')).toBe(false);
  });

  test('returns false when all fields have values', () => {
    document.body.innerHTML = `
      <input data-row-id="3" type="text" value="Task" />
      <input data-row-id="3" type="number" value="10" />
      <input data-row-id="3" type="number" value="20" />
      <input data-row-id="3" type="number" value="90" />
      <input data-row-id="3" type="button" value="Clear" />
    `;
    expect(dataInput.isRowEmpty('3')).toBe(false);
  });

  test('returns true when fields contain only whitespace', () => {
    document.body.innerHTML = `
      <input data-row-id="4" type="text" value="   " />
      <input data-row-id="4" type="number" value="  " />
      <input data-row-id="4" type="button" value="Clear" />
    `;
    expect(dataInput.isRowEmpty('4')).toBe(true);
  });

  test('ignores button inputs when checking', () => {
    document.body.innerHTML = `
      <input data-row-id="5" type="text" value="" />
      <input data-row-id="5" type="number" value="" />
      <input data-row-id="5" type="button" value="Clear" />
    `;
    expect(dataInput.isRowEmpty('5')).toBe(true);
  });

  test('returns true when row has no input fields', () => {
    document.body.innerHTML = `
      <div data-row-id="6"></div>
    `;
    expect(dataInput.isRowEmpty('6')).toBe(true);
  });

  test('correctly identifies different rows independently', () => {
    document.body.innerHTML = `
      <input data-row-id="7" type="text" value="Filled" />
      <input data-row-id="8" type="text" value="" />
    `;
    expect(dataInput.isRowEmpty('7')).toBe(false);
    expect(dataInput.isRowEmpty('8')).toBe(true);
  });

  test('returns false when any numeric field has value', () => {
    document.body.innerHTML = `
      <input data-row-id="9" type="text" value="" />
      <input data-row-id="9" type="number" value="5" />
      <input data-row-id="9" type="number" value="" />
    `;
    expect(dataInput.isRowEmpty('9')).toBe(false);
  });
});

describe('createTextElement', () => {
  test('creates element with text content', () => {
    const element = dataInput.createTextElement('div', 'Test Text');
    expect(element.tagName).toBe('DIV');
    expect(element.textContent).toBe('Test Text');
  });

  test('creates element with single class', () => {
    const element = dataInput.createTextElement('span', 'Text', ['test-class']);
    expect(element.tagName).toBe('SPAN');
    expect(element.classList.contains('test-class')).toBe(true);
  });

  test('creates element with multiple classes', () => {
    const element = dataInput.createTextElement('p', 'Paragraph', ['class1', 'class2', 'class3']);
    expect(element.tagName).toBe('P');
    expect(element.classList.contains('class1')).toBe(true);
    expect(element.classList.contains('class2')).toBe(true);
    expect(element.classList.contains('class3')).toBe(true);
  });

  test('creates element with empty classList by default', () => {
    const element = dataInput.createTextElement('h1', 'Header');
    expect(element.classList).toHaveLength(0);
  });

  test('creates different HTML tags correctly', () => {
    const div = dataInput.createTextElement('div', 'Div');
    const span = dataInput.createTextElement('span', 'Span');
    const h2 = dataInput.createTextElement('h2', 'Heading');

    expect(div.tagName).toBe('DIV');
    expect(span.tagName).toBe('SPAN');
    expect(h2.tagName).toBe('H2');
  });
});

describe('createLabeledInput', () => {
  test('creates labeled input with label first', () => {
    const attributes = { name: 'testInput', type: 'text', value: 'test' };
    const wrapper = dataInput.createLabeledInput('Test Label', attributes, true);

    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.children).toHaveLength(2);
    expect(wrapper.children[0].tagName).toBe('LABEL');
    expect(wrapper.children[1].tagName).toBe('INPUT');
  });

  test('creates labeled input with input first', () => {
    const attributes = { name: 'testInput', type: 'checkbox', value: '1' };
    const wrapper = dataInput.createLabeledInput('Checkbox Label', attributes, false);

    expect(wrapper.children[0].tagName).toBe('INPUT');
    expect(wrapper.children[1].tagName).toBe('LABEL');
  });

  test('label has correct text and htmlFor attribute', () => {
    const attributes = { name: 'testField', type: 'text' };
    const wrapper = dataInput.createLabeledInput('Field Label', attributes);
    const label = wrapper.querySelector('label');

    expect(label.textContent).toBe('Field Label');
    expect(label.htmlFor).toBe('testField');
  });

  test('input has correct attributes', () => {
    const attributes = {
      name: 'numberField', type: 'number', value: '42', min: '0', max: '100',
    };
    const wrapper = dataInput.createLabeledInput('Number', attributes);
    const input = wrapper.querySelector('input');

    expect(input.name).toBe('numberField');
    expect(input.type).toBe('number');
    expect(input.value).toBe('42');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
  });

  test('defaults to label first when labelFirst not specified', () => {
    const attributes = { name: 'test', type: 'text' };
    const wrapper = dataInput.createLabeledInput('Label', attributes);

    expect(wrapper.children[0].tagName).toBe('LABEL');
    expect(wrapper.children[1].tagName).toBe('INPUT');
  });
});

describe('createDivWithIdAndClasses', () => {
  test('creates div with id and no classes', () => {
    const div = dataInput.createDivWithIdAndClasses('testId');

    expect(div.tagName).toBe('DIV');
    expect(div.id).toBe('testId');
    expect(div.classList).toHaveLength(0);
  });

  test('creates div with id and single class', () => {
    const div = dataInput.createDivWithIdAndClasses('myDiv', ['class1']);

    expect(div.id).toBe('myDiv');
    expect(div.classList.contains('class1')).toBe(true);
  });

  test('creates div with id and multiple classes', () => {
    const div = dataInput.createDivWithIdAndClasses('complexDiv', ['class1', 'class2', 'class3']);

    expect(div.id).toBe('complexDiv');
    expect(div.classList.contains('class1')).toBe(true);
    expect(div.classList.contains('class2')).toBe(true);
    expect(div.classList.contains('class3')).toBe(true);
    expect(div.classList).toHaveLength(3);
  });

  test('handles empty classList array', () => {
    const div = dataInput.createDivWithIdAndClasses('emptyClasses', []);

    expect(div.id).toBe('emptyClasses');
    expect(div.classList).toHaveLength(0);
  });
});

describe('generateDataField', () => {
  test('creates data field cell with input', () => {
    const cell = dataInput.generateDataField('Task', 'Test Task', 'text', 1);

    expect(cell.tagName).toBe('DIV');
    expect(cell.classList.contains('td')).toBe(true);
    expect(cell.children).toHaveLength(1);
  });

  test('input has correct attributes', () => {
    const cell = dataInput.generateDataField('Min Time', '10', 'number', 2);
    const input = cell.querySelector('input');

    expect(input.type).toBe('number');
    expect(input.value).toBe('10');
    expect(input.name).toBe('Min Time');
    // aria-label is set via Object.assign which sets it as a property
    expect(input['aria-label']).toBe('Min Time');
    expect(input.dataset.rowId).toBe('2');
  });

  test('creates button type field', () => {
    const cell = dataInput.generateDataField('Clear', 'Clear', 'button', 3);
    const input = cell.querySelector('input');

    expect(input.type).toBe('button');
    expect(input.value).toBe('Clear');
    expect(input.dataset.rowId).toBe('3');
  });

  test('creates text input field', () => {
    const cell = dataInput.generateDataField('Task', 'Setup', 'text', 1);
    const input = cell.querySelector('input');

    expect(input.type).toBe('text');
    expect(input.value).toBe('Setup');
  });

  test('rowId is stored as data attribute', () => {
    const cell = dataInput.generateDataField('Cost', '120', 'number', 99);
    const input = cell.querySelector('input');

    expect(input.dataset.rowId).toBe('99');
  });
});

describe('T-Shirt Mappings', () => {
  test('has expected t-shirt sizes as keys', () => {
    const tshirtKeys = Object.keys(tshirtMappings);
    expect(tshirtKeys).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  });

  test('each t-shirt mapping has a Fibonacci number', () => {
    Object.values(tshirtMappings).forEach((fibValue) => {
      expect(typeof fibValue).toBe('number');
      expect(fibValue).toBeGreaterThan(0);
    });
  });

  test('t-shirt mappings follow expected Fibonacci values', () => {
    expect(tshirtMappings.XS).toBe(1);
    expect(tshirtMappings.S).toBe(2);
    expect(tshirtMappings.M).toBe(3);
    expect(tshirtMappings.L).toBe(5);
    expect(tshirtMappings.XL).toBe(8);
    expect(tshirtMappings.XXL).toBe(13);
  });

  test('normalizes lowercase t-shirt input for mapping lookup', () => {
    expect(dataInput.normalizeTshirtSize('xl')).toBe('XL');
    expect(tshirtMappings[dataInput.normalizeTshirtSize('xl')]).toBe(8);
  });

  test('trims and normalizes t-shirt input for mapping lookup', () => {
    expect(dataInput.normalizeTshirtSize('  xxl  ')).toBe('XXL');
    expect(tshirtMappings[dataInput.normalizeTshirtSize('  xxl  ')]).toBe(13);
  });
});

describe('handleFibonacciModeChange', () => {
  beforeEach(() => {
    appState.reset();
    document.body.innerHTML = `
      <div id="fibonacciCalendarMappingWrapper"></div>
      <div id="velocityConfigWrapper"></div>
    `;
  });

  test('updates appState when mode changes', () => {
    const mockEvent = {
      target: {
        value: 'velocity-based',
      },
    };

    dataInput.handleFibonacciModeChange(mockEvent);
    expect(appState.getFibonacciMode()).toBe('velocity-based');
  });

  test('shows calendar mapping wrapper for calendar-days mode', () => {
    const calendarWrapper = document.getElementById('fibonacciCalendarMappingWrapper');
    const mockEvent = {
      target: {
        value: 'calendar-days',
      },
    };

    dataInput.handleFibonacciModeChange(mockEvent);
    expect(calendarWrapper.style.display).toBe('block');
  });

  test('hides calendar mapping wrapper for velocity-based mode', () => {
    const calendarWrapper = document.getElementById('fibonacciCalendarMappingWrapper');
    const mockEvent = {
      target: {
        value: 'velocity-based',
      },
    };

    dataInput.handleFibonacciModeChange(mockEvent);
    expect(calendarWrapper.style.display).toBe('none');
  });

  test('shows velocity config wrapper for velocity-based mode', () => {
    const wrapper = document.getElementById('velocityConfigWrapper');
    const mockEvent = {
      target: {
        value: 'velocity-based',
      },
    };

    dataInput.handleFibonacciModeChange(mockEvent);
    expect(wrapper.style.display).toBe('block');
  });

  test('hides velocity config wrapper for calendar-days mode', () => {
    const wrapper = document.getElementById('velocityConfigWrapper');
    const mockEvent = {
      target: {
        value: 'calendar-days',
      },
    };

    dataInput.handleFibonacciModeChange(mockEvent);
    expect(wrapper.style.display).toBe('none');
  });
});

describe('handleVelocityConfigChange', () => {
  beforeEach(() => {
    appState.reset();
    document.body.innerHTML = `
      <input id="velocityPoints" value="30" />
      <input id="velocityDays" value="14" />
    `;
  });

  test('updates velocity configuration from input fields', () => {
    dataInput.handleVelocityConfigChange({});
    const config = appState.getVelocityConfig();
    expect(config.pointsPerSprint).toBe(30);
    expect(config.sprintLengthDays).toBe(14);
  });

  test('handles missing input fields gracefully', () => {
    document.body.innerHTML = '';
    expect(() => dataInput.handleVelocityConfigChange({})).not.toThrow();
  });

  test('uses default values for invalid inputs', () => {
    document.body.innerHTML = `
      <input id="velocityPoints" value="invalid" />
      <input id="velocityDays" value="also-invalid" />
    `;

    dataInput.handleVelocityConfigChange({});
    const config = appState.getVelocityConfig();
    expect(config.pointsPerSprint).toBe(25);
    expect(config.sprintLengthDays).toBe(10);
  });
});

describe('updateFibonacciCalendarMapping', () => {
  beforeEach(() => {
    // Reset mappings to default values before each test
    fibonacciCalendarMappings[1] = { min: 0.5, max: 1 };
    fibonacciCalendarMappings[2] = { min: 1, max: 2 };
    fibonacciCalendarMappings[3] = { min: 2, max: 3 };
    fibonacciCalendarMappings[5] = { min: 3, max: 5 };
    fibonacciCalendarMappings[8] = { min: 5, max: 8 };
    fibonacciCalendarMappings[13] = { min: 8, max: 13 };
    fibonacciCalendarMappings[21] = { min: 13, max: 21 };
  });

  test('updates min value when min input changes', () => {
    const mockEvent = {
      target: {
        dataset: { fib: '5', type: 'min' },
        value: '2.5',
      },
    };

    dataInput.updateFibonacciCalendarMapping(mockEvent);

    expect(fibonacciCalendarMappings[5].min).toBe(2.5);
    expect(fibonacciCalendarMappings[5].max).toBe(5); // max should remain unchanged
  });

  test('updates max value when max input changes', () => {
    const mockEvent = {
      target: {
        dataset: { fib: '8', type: 'max' },
        value: '10',
      },
    };

    dataInput.updateFibonacciCalendarMapping(mockEvent);

    expect(fibonacciCalendarMappings[8].max).toBe(10);
    expect(fibonacciCalendarMappings[8].min).toBe(5); // min should remain unchanged
  });

  test('handles decimal values correctly', () => {
    const mockEvent = {
      target: {
        dataset: { fib: '1', type: 'min' },
        value: '0.25',
      },
    };

    dataInput.updateFibonacciCalendarMapping(mockEvent);

    expect(fibonacciCalendarMappings[1].min).toBe(0.25);
    expect(typeof fibonacciCalendarMappings[1].min).toBe('number');
  });

  test('updates correct Fibonacci number mapping', () => {
    const mockEvent = {
      target: {
        dataset: { fib: '13', type: 'max' },
        value: '15',
      },
    };

    dataInput.updateFibonacciCalendarMapping(mockEvent);

    expect(fibonacciCalendarMappings[13].max).toBe(15);
    expect(fibonacciCalendarMappings[8].max).toBe(8); // other mappings unchanged
    expect(fibonacciCalendarMappings[21].max).toBe(21); // other mappings unchanged
  });

  test('does not crash for non-existent Fibonacci number', () => {
    const mockEvent = {
      target: {
        dataset: { fib: '99', type: 'min' },
        value: '50',
      },
    };

    expect(() => dataInput.updateFibonacciCalendarMapping(mockEvent)).not.toThrow();
  });

  test('updates multiple values sequentially', () => {
    const event1 = {
      target: {
        dataset: { fib: '5', type: 'min' },
        value: '2',
      },
    };
    const event2 = {
      target: {
        dataset: { fib: '5', type: 'max' },
        value: '6',
      },
    };

    dataInput.updateFibonacciCalendarMapping(event1);
    dataInput.updateFibonacciCalendarMapping(event2);

    expect(fibonacciCalendarMappings[5].min).toBe(2);
    expect(fibonacciCalendarMappings[5].max).toBe(6);
  });
});

describe('updateTshirtMapping', () => {
  beforeEach(() => {
    tshirtMappings.XS = 1;
    tshirtMappings.S = 2;
    tshirtMappings.M = 3;
    tshirtMappings.L = 5;
    tshirtMappings.XL = 8;
    tshirtMappings.XXL = 13;
  });

  test('updates Fibonacci value when input changes', () => {
    const mockEvent = {
      target: {
        dataset: { tshirt: 'XL' },
        value: '13',
      },
    };

    dataInput.updateTshirtMapping(mockEvent);

    expect(tshirtMappings.XL).toBe(13);
  });

  test('updates different size value', () => {
    const mockEvent = {
      target: {
        dataset: { tshirt: 'M' },
        value: '5',
      },
    };

    dataInput.updateTshirtMapping(mockEvent);

    expect(tshirtMappings.M).toBe(5);
  });

  test('normalizes lowercase size key before updating', () => {
    const mockEvent = {
      target: {
        dataset: { tshirt: 'xxl' },
        value: '21',
      },
    };

    dataInput.updateTshirtMapping(mockEvent);

    expect(tshirtMappings.XXL).toBe(21);
  });

  test('does not crash for unknown size', () => {
    const mockEvent = {
      target: {
        dataset: { tshirt: 'XXXL' },
        value: '20',
      },
    };

    expect(() => dataInput.updateTshirtMapping(mockEvent)).not.toThrow();
  });
});

describe('validateCsvData', () => {
  test('throws error when data is null', () => {
    expect(() => dataInput.validateCsvData(null, 'hours', false)).toThrow('CSV file is empty or contains no data rows.');
  });

  test('throws error when data is empty array', () => {
    expect(() => dataInput.validateCsvData([], 'hours', false)).toThrow('CSV file is empty or contains no data rows.');
  });

  test('throws error when required columns are missing - hours mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Missing required columns: Min, Max');
  });

  test('throws error when required columns are missing - fibonacci mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => dataInput.validateCsvData(data, 'fibonacci', false)).toThrow('Missing required columns: Fibonacci');
  });

  test('throws error when required columns are missing - tshirt mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => dataInput.validateCsvData(data, 'tshirt', false)).toThrow('Missing required columns: TShirt');
  });

  test('throws error when Min value is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 'abc', Max: 10, Confidence: 90,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Invalid Min value "abc" in row 1. Must be a number.');
  });

  test('throws error when Max value is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 'xyz', Confidence: 90,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Invalid Max value "xyz" in row 1. Must be a number.');
  });

  test('throws error when Confidence is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: 'high',
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "high" in row 1. Must be a number between 0 and 100.');
  });

  test('throws error when Confidence is below 0', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: -10,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "-10" in row 1. Must be a number between 0 and 100.');
  });

  test('throws error when Confidence is above 100', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: 150,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "150" in row 1. Must be a number between 0 and 100.');
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
    expect(() => dataInput.validateCsvData(data, 'hours', false)).not.toThrow();
    const result = dataInput.validateCsvData(data, 'hours', false);
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
    expect(() => dataInput.validateCsvData(data, 'fibonacci', false)).not.toThrow();
    const result = dataInput.validateCsvData(data, 'fibonacci', false);
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
    expect(() => dataInput.validateCsvData(data, 'tshirt', false)).not.toThrow();
    const result = dataInput.validateCsvData(data, 'tshirt', false);
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
    expect(() => dataInput.validateCsvData(data, 'hours', false)).not.toThrow();
  });

  test('includes Cost message when enableCost is true', () => {
    const data = [
      {
        Task: 'Test Task', Confidence: 90,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', true)).toThrow('Cost (optional)');
  });

  test('handles string numbers for Min and Max', () => {
    const data = [
      {
        Task: 'Test', Min: '5', Max: '10', Confidence: '90',
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).not.toThrow();
  });
});
