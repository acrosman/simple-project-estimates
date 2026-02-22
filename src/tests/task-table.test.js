/**
 * @jest-environment jsdom
 */

import {
  isRowEmpty,
  generateDataField,
  generateDataRow,
  createEntryTable,
} from '../task-table';
import { appState } from '../state';

describe('isRowEmpty', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('returns true when all fields are empty', () => {
    document.body.innerHTML = `
      <input data-row-id="1" type="text" value="" />
      <input data-row-id="1" type="number" value="" />
      <input data-row-id="1" type="number" value="" />
      <input data-row-id="1" type="button" value="Clear" />
    `;
    expect(isRowEmpty('1')).toBe(true);
  });

  test('returns false when at least one field has a value', () => {
    document.body.innerHTML = `
      <input data-row-id="2" type="text" value="Task Name" />
      <input data-row-id="2" type="number" value="" />
      <input data-row-id="2" type="number" value="" />
      <input data-row-id="2" type="button" value="Clear" />
    `;
    expect(isRowEmpty('2')).toBe(false);
  });

  test('returns false when all fields have values', () => {
    document.body.innerHTML = `
      <input data-row-id="3" type="text" value="Task" />
      <input data-row-id="3" type="number" value="10" />
      <input data-row-id="3" type="number" value="20" />
      <input data-row-id="3" type="number" value="90" />
      <input data-row-id="3" type="button" value="Clear" />
    `;
    expect(isRowEmpty('3')).toBe(false);
  });

  test('returns true when fields contain only whitespace', () => {
    document.body.innerHTML = `
      <input data-row-id="4" type="text" value="   " />
      <input data-row-id="4" type="number" value="  " />
      <input data-row-id="4" type="button" value="Clear" />
    `;
    expect(isRowEmpty('4')).toBe(true);
  });

  test('ignores button inputs when checking', () => {
    document.body.innerHTML = `
      <input data-row-id="5" type="text" value="" />
      <input data-row-id="5" type="number" value="" />
      <input data-row-id="5" type="button" value="Clear" />
    `;
    expect(isRowEmpty('5')).toBe(true);
  });

  test('returns true when row has no input fields', () => {
    document.body.innerHTML = `
      <div data-row-id="6"></div>
    `;
    expect(isRowEmpty('6')).toBe(true);
  });

  test('correctly identifies different rows independently', () => {
    document.body.innerHTML = `
      <input data-row-id="7" type="text" value="Filled" />
      <input data-row-id="8" type="text" value="" />
    `;
    expect(isRowEmpty('7')).toBe(false);
    expect(isRowEmpty('8')).toBe(true);
  });

  test('returns false when any numeric field has value', () => {
    document.body.innerHTML = `
      <input data-row-id="9" type="text" value="" />
      <input data-row-id="9" type="number" value="5" />
      <input data-row-id="9" type="number" value="" />
    `;
    expect(isRowEmpty('9')).toBe(false);
  });
});

describe('generateDataField', () => {
  test('creates data field cell with input', () => {
    const cell = generateDataField('Task', 'Test Task', 'text', 1);

    expect(cell.tagName).toBe('DIV');
    expect(cell.classList.contains('td')).toBe(true);
    expect(cell.children).toHaveLength(1);
  });

  test('input has correct attributes', () => {
    const cell = generateDataField('Min Time', '10', 'number', 2);
    const input = cell.querySelector('input');

    expect(input.type).toBe('number');
    expect(input.value).toBe('10');
    expect(input.name).toBe('Min Time');
    expect(input['aria-label']).toBe('Min Time');
    expect(input.dataset.rowId).toBe('2');
  });

  test('creates button type field', () => {
    const cell = generateDataField('Clear', 'Clear', 'button', 3);
    const input = cell.querySelector('input');

    expect(input.type).toBe('button');
    expect(input.value).toBe('Clear');
    expect(input.dataset.rowId).toBe('3');
  });

  test('creates text input field', () => {
    const cell = generateDataField('Task', 'Setup', 'text', 1);
    const input = cell.querySelector('input');

    expect(input.type).toBe('text');
    expect(input.value).toBe('Setup');
  });

  test('rowId is stored as data attribute', () => {
    const cell = generateDataField('Cost', '120', 'number', 99);
    const input = cell.querySelector('input');

    expect(input.dataset.rowId).toBe('99');
  });

  test('sets required attributes when isRequired is true', () => {
    const cell = generateDataField('Task', 'My Task', 'text', 1, true);
    const input = cell.querySelector('input');

    expect(input['aria-required']).toBe('true');
    expect(input.required).toBe(true);
  });

  test('does not set required when isRequired is false', () => {
    const cell = generateDataField('Cost', '50', 'number', 1, false);
    const input = cell.querySelector('input');

    expect(input.required).toBe(false);
  });
});

describe('generateDataRow', () => {
  beforeEach(() => {
    appState.reset();
  });

  test('creates a row div with correct classes and role', () => {
    const row = generateDataRow(1, 'Task A', 10, 20, 90, 100);

    expect(row.tagName).toBe('DIV');
    expect(row.classList.contains('tr')).toBe(true);
    expect(row.classList.contains('data-row')).toBe(true);
    expect(row.getAttribute('role')).toBe('row');
    expect(row.dataset.rowId).toBe('1');
  });

  test('contains min and max fields in hours mode', () => {
    appState.setEstimationMode('hours');
    const row = generateDataRow(1, 'Task', 5, 10, 90, 0);

    const inputs = row.querySelectorAll('input');
    const names = Array.from(inputs).map((i) => i.name);
    expect(names).toContain('Min Time');
    expect(names).toContain('Max Time');
  });

  test('contains Fibonacci field in fibonacci mode', () => {
    appState.setEstimationMode('fibonacci');
    const row = generateDataRow(1, 'Task', '', '', 90, 0, 5);

    const inputs = row.querySelectorAll('input');
    const names = Array.from(inputs).map((i) => i.name);
    expect(names).toContain('Fibonacci');
    expect(names).not.toContain('Min Time');
    expect(names).not.toContain('Max Time');
  });

  test('contains T-Shirt field in tshirt mode', () => {
    appState.setEstimationMode('tshirt');
    const row = generateDataRow(1, 'Task', '', '', 90, 0, '', 'M');

    const inputs = row.querySelectorAll('input');
    const names = Array.from(inputs).map((i) => i.name);
    expect(names).toContain('T-Shirt');
    expect(names).not.toContain('Min Time');
    expect(names).not.toContain('Max Time');
  });

  test('includes cost field when enableCost is true', () => {
    appState.setEnableCost(true);
    const row = generateDataRow(1, 'Task', 5, 10, 90, 100);

    const inputs = row.querySelectorAll('input');
    const names = Array.from(inputs).map((i) => i.name);
    expect(names).toContain('Cost');
  });

  test('excludes cost field when enableCost is false', () => {
    appState.setEnableCost(false);
    const row = generateDataRow(1, 'Task', 5, 10, 90, 0);

    const inputs = row.querySelectorAll('input');
    const names = Array.from(inputs).map((i) => i.name);
    expect(names).not.toContain('Cost');
  });

  test('includes a task graph cell', () => {
    const row = generateDataRow(1, 'Task', 5, 10, 90, 0);
    const graphCell = row.querySelector('.task-row-graph');

    expect(graphCell).not.toBeNull();
    expect(graphCell.dataset.rowId).toBe('1');
  });
});

describe('createEntryTable', () => {
  beforeEach(() => {
    appState.reset();
    document.body.innerHTML = '';
  });

  test('creates a wrapper with correct id', () => {
    const wrapper = createEntryTable();

    expect(wrapper.id).toBe('dataTableWrapper');
  });

  test('creates an empty table with one blank row when no data provided', () => {
    const wrapper = createEntryTable();
    const rows = wrapper.querySelectorAll('.data-row');

    expect(rows).toHaveLength(1);
  });

  test('creates rows for each data item', () => {
    const data = [
      {
        Task: 'Task 1', Min: 5, Max: 10, Confidence: 0.9, Cost: 100,
      },
      {
        Task: 'Task 2', Min: 3, Max: 8, Confidence: 0.8, Cost: 80,
      },
    ];
    const wrapper = createEntryTable(data);
    const rows = wrapper.querySelectorAll('.data-row');

    expect(rows).toHaveLength(2);
  });

  test('includes Add Task button', () => {
    const wrapper = createEntryTable();
    const addBtn = wrapper.querySelector('#addTaskBtn');

    expect(addBtn).not.toBeNull();
    expect(addBtn.value).toBe('Add Task');
  });

  test('reuses existing wrapper if already in DOM', () => {
    document.body.innerHTML = '<div id="dataTableWrapper"></div>';
    const existing = document.getElementById('dataTableWrapper');
    document.body.appendChild(existing);

    const wrapper = createEntryTable();
    expect(wrapper.id).toBe('dataTableWrapper');
    expect(document.querySelectorAll('#dataTableWrapper')).toHaveLength(1);
  });
});
