/**
 * @jest-environment jsdom
 */

import {
  createTextElement,
  createLabeledInput,
  createDivWithIdAndClasses,
  showError,
} from '../dom-helpers';

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
  });

  test('creates element with correct message content', () => {
    const el = showError(container, 'Something went wrong');
    expect(el.textContent).toBe('Something went wrong');
  });

  test('sets role="alert" on the created element', () => {
    const el = showError(container, 'Error');
    expect(el.getAttribute('role')).toBe('alert');
  });

  test('sets aria-live="assertive" on the created element', () => {
    const el = showError(container, 'Error');
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  test('applies error-message class to the created element', () => {
    const el = showError(container, 'Error');
    expect(el.classList.contains('error-message')).toBe(true);
  });

  test('appends the error element to the container', () => {
    const el = showError(container, 'Error');
    expect(container.contains(el)).toBe(true);
  });

  test('returns the created element', () => {
    const el = showError(container, 'Error');
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.tagName).toBe('DIV');
  });

  test('removes a pre-existing .error-message child before appending', () => {
    const old = document.createElement('div');
    old.classList.add('error-message');
    old.textContent = 'Old error';
    container.appendChild(old);

    showError(container, 'New error');

    const errorMessages = container.querySelectorAll('.error-message');
    expect(errorMessages).toHaveLength(1);
    expect(errorMessages[0].textContent).toBe('New error');
  });

  test('auto-removes the element after the specified timeout', () => {
    jest.useFakeTimers();
    const el = showError(container, 'Timed error', 3000);

    expect(container.contains(el)).toBe(true);
    jest.advanceTimersByTime(3000);
    expect(container.contains(el)).toBe(false);

    jest.useRealTimers();
  });

  test('does not auto-remove the element when timeoutMs is 0', () => {
    jest.useFakeTimers();
    const el = showError(container, 'Persistent error', 0);

    jest.advanceTimersByTime(10000);
    expect(container.contains(el)).toBe(true);

    jest.useRealTimers();
  });

  test('uses default timeout of 5000ms', () => {
    jest.useFakeTimers();
    const el = showError(container, 'Default timeout error');

    jest.advanceTimersByTime(4999);
    expect(container.contains(el)).toBe(true);
    jest.advanceTimersByTime(1);
    expect(container.contains(el)).toBe(false);

    jest.useRealTimers();
  });
});
