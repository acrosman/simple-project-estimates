/**
 * @jest-environment jsdom
 */

import {
  createTextElement,
  createLabeledInput,
  createDivWithIdAndClasses,
  showError,
  getIntegerInputValue,
  getFloatInputValue,
  updateElementText,
} from '../utils/dom-helpers';

describe('createTextElement', () => {
  test('creates element with text content', () => {
    const element = createTextElement('div', 'Test Text');
    expect(element.tagName).toBe('DIV');
    expect(element.textContent).toBe('Test Text');
  });

  test('creates element with single class', () => {
    const element = createTextElement('span', 'Text', ['test-class']);
    expect(element.tagName).toBe('SPAN');
    expect(element.classList.contains('test-class')).toBe(true);
  });

  test('creates element with multiple classes', () => {
    const element = createTextElement('p', 'Paragraph', ['class1', 'class2', 'class3']);
    expect(element.tagName).toBe('P');
    expect(element.classList.contains('class1')).toBe(true);
    expect(element.classList.contains('class2')).toBe(true);
    expect(element.classList.contains('class3')).toBe(true);
  });

  test('creates element with empty classList by default', () => {
    const element = createTextElement('h1', 'Header');
    expect(element.classList).toHaveLength(0);
  });

  test('creates different HTML tags correctly', () => {
    const div = createTextElement('div', 'Div');
    const span = createTextElement('span', 'Span');
    const h2 = createTextElement('h2', 'Heading');

    expect(div.tagName).toBe('DIV');
    expect(span.tagName).toBe('SPAN');
    expect(h2.tagName).toBe('H2');
  });

  test('sets ARIA role when provided', () => {
    const element = createTextElement('div', 'Cell', ['td'], 'cell');
    expect(element.getAttribute('role')).toBe('cell');
  });

  test('does not set role attribute when not provided', () => {
    const element = createTextElement('div', 'No Role');
    expect(element.getAttribute('role')).toBeNull();
  });
});

describe('createLabeledInput', () => {
  test('creates labeled input with label first', () => {
    const attributes = { name: 'testInput', type: 'text', value: 'test' };
    const wrapper = createLabeledInput('Test Label', attributes, true);

    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.children).toHaveLength(2);
    expect(wrapper.children[0].tagName).toBe('LABEL');
    expect(wrapper.children[1].tagName).toBe('INPUT');
  });

  test('creates labeled input with input first', () => {
    const attributes = { name: 'testInput', type: 'checkbox', value: '1' };
    const wrapper = createLabeledInput('Checkbox Label', attributes, false);

    expect(wrapper.children[0].tagName).toBe('INPUT');
    expect(wrapper.children[1].tagName).toBe('LABEL');
  });

  test('label has correct text and htmlFor attribute', () => {
    const attributes = { name: 'testField', type: 'text' };
    const wrapper = createLabeledInput('Field Label', attributes);
    const label = wrapper.querySelector('label');

    expect(label.textContent).toBe('Field Label');
    expect(label.htmlFor).toBe('testField');
  });

  test('input has correct attributes', () => {
    const attributes = {
      name: 'numberField', type: 'number', value: '42', min: '0', max: '100',
    };
    const wrapper = createLabeledInput('Number', attributes);
    const input = wrapper.querySelector('input');

    expect(input.name).toBe('numberField');
    expect(input.type).toBe('number');
    expect(input.value).toBe('42');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
  });

  test('defaults to label first when labelFirst not specified', () => {
    const attributes = { name: 'test', type: 'text' };
    const wrapper = createLabeledInput('Label', attributes);

    expect(wrapper.children[0].tagName).toBe('LABEL');
    expect(wrapper.children[1].tagName).toBe('INPUT');
  });

  test('uses id for htmlFor when id is provided', () => {
    const attributes = { id: 'myId', name: 'myField', type: 'text' };
    const wrapper = createLabeledInput('Label', attributes);
    const label = wrapper.querySelector('label');

    expect(label.htmlFor).toBe('myId');
  });

  test('sets aria attributes via setAttribute when ariaAttributes provided', () => {
    const attributes = { name: 'myField', type: 'text' };
    const ariaAttributes = { 'aria-label': 'My Field', 'aria-required': 'true' };
    const wrapper = createLabeledInput('Label', attributes, true, ariaAttributes);
    const input = wrapper.querySelector('input');

    expect(input.getAttribute('aria-label')).toBe('My Field');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  test('does not set aria attributes when ariaAttributes is empty', () => {
    const attributes = { name: 'myField', type: 'text' };
    const wrapper = createLabeledInput('Label', attributes);
    const input = wrapper.querySelector('input');

    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.getAttribute('aria-required')).toBeNull();
  });
});

describe('createDivWithIdAndClasses', () => {
  test('creates div with id and no classes', () => {
    const div = createDivWithIdAndClasses('testId');

    expect(div.tagName).toBe('DIV');
    expect(div.id).toBe('testId');
    expect(div.classList).toHaveLength(0);
  });

  test('creates div with id and single class', () => {
    const div = createDivWithIdAndClasses('myDiv', ['class1']);

    expect(div.id).toBe('myDiv');
    expect(div.classList.contains('class1')).toBe(true);
  });

  test('creates div with id and multiple classes', () => {
    const div = createDivWithIdAndClasses('complexDiv', ['class1', 'class2', 'class3']);

    expect(div.id).toBe('complexDiv');
    expect(div.classList.contains('class1')).toBe(true);
    expect(div.classList.contains('class2')).toBe(true);
    expect(div.classList.contains('class3')).toBe(true);
    expect(div.classList).toHaveLength(3);
  });

  test('handles empty classList array', () => {
    const div = createDivWithIdAndClasses('emptyClasses', []);

    expect(div.id).toBe('emptyClasses');
    expect(div.classList).toHaveLength(0);
  });
});

describe('showError', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'messages';
    document.body.appendChild(container);
  });

  test('creates element with correct message content', () => {
    const el = showError('Something went wrong', container, 5000);
    expect(el.textContent).toBe('Something went wrong');
  });

  test('sets role="alert" on the created element', () => {
    const el = showError('Error', container, 5000);
    expect(el.getAttribute('role')).toBe('alert');
  });

  test('sets aria-live="assertive" on the created element', () => {
    const el = showError('Error', container, 5000);
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  test('applies error-message class to the created element', () => {
    const el = showError('Error', container, 5000);
    expect(el.classList.contains('error-message')).toBe(true);
  });

  test('returns the created element', () => {
    const el = showError('Error', container, 5000);
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.tagName).toBe('DIV');
  });

  test('auto-removes the element after the specified timeout', () => {
    jest.useFakeTimers();
    const el = showError('Timed error', container, 3000);

    expect(container.contains(el)).toBe(true);
    jest.advanceTimersByTime(3000);
    expect(container.contains(el)).toBe(false);

    jest.useRealTimers();
  });

  test('does not auto-remove the element when timeoutMs is 0', () => {
    jest.useFakeTimers();
    const el = showError('Persistent error', container, 0);

    expect(container.contains(el)).toBe(true);
    jest.advanceTimersByTime(10000);
    expect(container.contains(el)).toBe(true);

    jest.useRealTimers();
  });
});

describe('getIntegerInputValue', () => {
  let input;

  beforeEach(() => {
    input = document.createElement('input');
    input.type = 'number';
    input.id = 'testIntInput';
    document.body.appendChild(input);
  });

  afterEach(() => {
    input.remove();
  });

  test('returns parsed integer for a valid numeric string', () => {
    input.value = '42';
    expect(getIntegerInputValue('testIntInput', 0)).toBe(42);
  });

  test('returns fallback when element does not exist', () => {
    expect(getIntegerInputValue('nonExistentId', 99)).toBe(99);
  });

  test('returns fallback when value is non-numeric', () => {
    input.value = 'abc';
    expect(getIntegerInputValue('testIntInput', 10)).toBe(10);
  });

  test('returns fallback when value is empty string', () => {
    input.value = '';
    expect(getIntegerInputValue('testIntInput', 5)).toBe(5);
  });

  test('truncates float string to integer', () => {
    input.value = '3.9';
    expect(getIntegerInputValue('testIntInput', 0)).toBe(3);
  });
});

describe('getFloatInputValue', () => {
  let input;

  beforeEach(() => {
    input = document.createElement('input');
    input.type = 'number';
    input.id = 'testFloatInput';
    document.body.appendChild(input);
  });

  afterEach(() => {
    input.remove();
  });

  test('returns parsed float for a valid decimal string', () => {
    input.value = '1.5';
    expect(getFloatInputValue('testFloatInput', 0)).toBe(1.5);
  });

  test('returns parsed float for an integer string', () => {
    input.value = '3';
    expect(getFloatInputValue('testFloatInput', 0)).toBe(3);
  });

  test('returns fallback when element does not exist', () => {
    expect(getFloatInputValue('nonExistentId', 2.5)).toBe(2.5);
  });

  test('returns fallback when value is non-numeric', () => {
    input.value = 'xyz';
    expect(getFloatInputValue('testFloatInput', 0.5)).toBe(0.5);
  });

  test('returns fallback when value is empty string', () => {
    input.value = '';
    expect(getFloatInputValue('testFloatInput', 1.0)).toBe(1.0);
  });
});

describe('updateElementText', () => {
  test('sets text content of an element by id', () => {
    const el = document.createElement('span');
    el.id = 'uet-test-span';
    document.body.appendChild(el);
    updateElementText('uet-test-span', 'Hello World');
    expect(el.textContent).toBe('Hello World');
    el.remove();
  });

  test('does not throw when element does not exist', () => {
    expect(() => updateElementText('no-such-element', 'Text')).not.toThrow();
  });

  test('overwrites existing text content', () => {
    const el = document.createElement('div');
    el.id = 'uet-overwrite';
    el.textContent = 'old';
    document.body.appendChild(el);
    updateElementText('uet-overwrite', 'new');
    expect(el.textContent).toBe('new');
    el.remove();
  });
});
