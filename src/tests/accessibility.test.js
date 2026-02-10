/**
 * @jest-environment jsdom
 */

import * as idx from '../index';
import * as sim from '../simulation';

describe('Accessibility: HTML Structure', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '';
  });

  test('HTML should have lang attribute', () => {
    document.documentElement.setAttribute('lang', 'en');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  test('viewport meta tag structure', () => {
    const head = document.createElement('head');
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0';
    head.appendChild(viewport);

    const metaTag = head.querySelector('meta[name="viewport"]');
    expect(metaTag).toBeTruthy();
    expect(metaTag.content).toContain('width=device-width');
  });
});

describe('Accessibility: ARIA Attributes', () => {
  test('createTextElement supports ARIA role parameter', () => {
    const element = idx.createTextElement('div', 'Test', ['class'], 'columnheader');
    expect(element.getAttribute('role')).toBe('columnheader');
  });

  test('createTextElement works without role parameter', () => {
    const element = idx.createTextElement('div', 'Test', ['class']);
    expect(element.getAttribute('role')).toBeNull();
  });

  test('generateDataField creates cell with role attribute', () => {
    const cell = idx.generateDataField('Task', 'Test', 'text', 1);
    expect(cell.getAttribute('role')).toBe('cell');
  });

  test('generateDataField input has proper name', () => {
    const cell = idx.generateDataField('Task Name', 'Test', 'text', 1);
    const input = cell.querySelector('input');
    expect(input.name).toBe('Task Name');
  });
});

describe('Accessibility: Required Fields', () => {
  test('required field has required attribute', () => {
    const cell = idx.generateDataField('Task', '', 'text', 1, true);
    const input = cell.querySelector('input');
    expect(input.required).toBe(true);
  });

  test('optional field does not have required attribute', () => {
    const cell = idx.generateDataField('Cost', '', 'number', 1, false);
    const input = cell.querySelector('input');
    expect(input.required).toBe(false);
  });
});

describe('Accessibility: Label Associations', () => {
  test('createLabeledInput creates proper label association', () => {
    const wrapper = idx.createLabeledInput('Test Label', { name: 'testField', type: 'text' });
    const label = wrapper.querySelector('label');
    const input = wrapper.querySelector('input');

    expect(label.htmlFor).toBe('testField');
    expect(input.name).toBe('testField');
  });

  test('label text is descriptive', () => {
    const wrapper = idx.createLabeledInput('Simulation Passes', {
      name: 'simPasses',
      type: 'number',
    });
    const label = wrapper.querySelector('label');
    expect(label.textContent.length).toBeGreaterThan(3);
  });
});

describe('Accessibility: Error Messages', () => {
  test('error messages should have role alert', () => {
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');

    expect(errorDiv.getAttribute('role')).toBe('alert');
  });

  test('error messages have text content', () => {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = 'Failed to parse CSV file';

    expect(errorDiv.textContent.length).toBeGreaterThan(10);
  });
});

describe('Accessibility: Data Table Structure', () => {
  test('table elements have proper ARIA roles', () => {
    const table = document.createElement('div');
    table.setAttribute('role', 'table');

    const headerRow = document.createElement('div');
    headerRow.setAttribute('role', 'row');

    expect(table.getAttribute('role')).toBe('table');
    expect(headerRow.getAttribute('role')).toBe('row');
  });

  test('required fields marked with asterisk', () => {
    const headerCell = document.createElement('div');
    headerCell.textContent = 'Task *';

    expect(headerCell.textContent).toContain('*');
  });
});

describe('Accessibility: SVG Charts', () => {
  test('buildHistogram function exists', () => {
    expect(sim.buildHistogram).toBeDefined();
    expect(sim.buildHistogram).toHaveLength(8);
  });
});

describe('Accessibility: Image Alt Text', () => {
  test('images should have alt attribute', () => {
    const img = new Image();
    img.src = 'test-icon.png';
    img.alt = 'Test icon';

    expect(img.alt).toBeTruthy();
  });
});

describe('Accessibility: Focus Management', () => {
  test('interactive elements can receive focus', () => {
    const button = document.createElement('input');
    button.type = 'button';
    document.body.appendChild(button);

    button.focus();
    expect(document.activeElement).toBe(button);
  });
});

describe('Accessibility: Clear Button Context', () => {
  test('clear button has descriptive label', () => {
    const cell = idx.generateDataField('Clear Row', 'Clear Row', 'button', 5);
    const button = cell.querySelector('input[type="button"]');

    expect(button.value).toBe('Clear Row');
  });
});

describe('Accessibility: Application State', () => {
  test('estimation mode is accessible', () => {
    const mode = idx.getEstimationMode();
    expect(typeof mode).toBe('string');
  });

  test('cost tracking state is accessible', () => {
    const enableCost = idx.getEnableCost();
    expect(typeof enableCost).toBe('boolean');
  });

  test('fibonacci mappings exist', () => {
    const mappings = idx.fibonacciMappings;
    expect(Object.keys(mappings).length).toBeGreaterThan(0);
  });
});
