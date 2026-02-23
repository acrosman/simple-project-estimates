import { appState } from './state';
import { createTextElement, createDivWithIdAndClasses } from './dom-helpers';

/**
 * Checks if a row is empty (all input fields are empty except the button).
 * @param {string} rowId The row ID to check
 * @returns {boolean} True if the row is empty
 */
function isRowEmpty(rowId) {
  const cells = document.querySelectorAll(`input[data-row-id="${rowId}"]:not([type=button])`);
  for (const control of cells) {
    if (control.value.trim() !== '') {
      return false;
    }
  }
  return true;
}

/**
 * Creates an input field for a specific input control
 * @param {string} label
 * @param {string} fieldValue
 * @param {string} fieldType
 * @param {string|number} rowId
 * @param {boolean} isRequired
 * @returns HTMLElement
 */
function generateDataField(label, fieldValue, fieldType, rowId, isRequired = false) {
  const cell = document.createElement('div');
  cell.classList.add('td');
  cell.setAttribute('role', 'cell');
  const element = document.createElement('input');
  const values = {
    type: fieldType,
    value: fieldValue,
    name: label,
  };
  Object.assign(element, values);
  element.setAttribute('aria-label', label);
  if (isRequired) {
    element.setAttribute('aria-required', 'true');
    element.required = true;
  }
  element.dataset.rowId = rowId;

  cell.appendChild(element);
  return cell;
}

/**
 * Generates a row for the data input.
 * @param {*} rowId
 * @param {*} taskName
 * @param {*} minTime
 * @param {*} maxTime
 * @param {*} confidence
 * @param {*} hourlyCost
 * @param {*} fibNumber
 * @param {*} tshirtSize
 * @returns HTMLElement
 */
function generateDataRow(
  rowId,
  taskName,
  minTime,
  maxTime,
  confidence,
  hourlyCost,
  fibNumber = '',
  tshirtSize = '',
) {
  const row = document.createElement('div');
  row.classList.add('tr', 'data-row');
  row.setAttribute('role', 'row');
  row.dataset.rowId = rowId;

  const task = generateDataField('Task', taskName, 'text', rowId, true);

  let min;
  let max;
  let fib;
  let tshirt;

  if (appState.estimationMode === 'fibonacci') {
    fib = generateDataField('Fibonacci', fibNumber, 'number', rowId, true);
  } else if (appState.estimationMode === 'tshirt') {
    tshirt = generateDataField('T-Shirt', tshirtSize, 'text', rowId, true);
  } else {
    min = generateDataField('Min Time', minTime, 'number', rowId, true);
    max = generateDataField('Max Time', maxTime, 'number', rowId, true);
  }

  const conf = generateDataField('Confidence', confidence, 'number', rowId, true);
  const cost = generateDataField('Cost', hourlyCost, 'number', rowId);
  const rmButton = generateDataField('Clear Row', 'Clear Row', 'button', rowId);
  const taskGraphCell = document.createElement('div');
  taskGraphCell.classList.add('td', 'task-row-graph-cell');
  taskGraphCell.setAttribute('role', 'cell');
  const taskGraph = document.createElement('div');
  taskGraph.classList.add('task-row-graph');
  taskGraph.dataset.rowId = rowId;
  taskGraphCell.appendChild(taskGraph);

  // Add statistics display for min, max, median
  const taskStats = document.createElement('div');
  taskStats.classList.add('task-row-stats');
  taskStats.dataset.rowId = rowId;
  taskGraphCell.appendChild(taskStats);

  // Add click event handler for the clear button.
  /**
   * Click Event Handler for the clear row button.
   * @param {Event} event Fired event.
   */
  const rowClearClickHandler = (event) => {
    event.preventDefault();
    const thisRowId = event.target.dataset.rowId;

    // Get all data rows
    const allRows = document.querySelectorAll('#DataEntryTable .tr.data-row');
    const totalRows = allRows.length;

    // Find the current row element to check its position
    const rowElement = document.querySelector(`.data-row[data-row-id="${thisRowId}"]`);

    // Check if this row is between two other rows
    const hasRowBefore = rowElement.previousElementSibling
      && rowElement.previousElementSibling.classList.contains('data-row');
    const hasRowAfter = rowElement.nextElementSibling
      && rowElement.nextElementSibling.classList.contains('data-row');
    const isBetweenRows = hasRowBefore && hasRowAfter;

    // Count empty rows (excluding the current one)
    let emptyRowCount = 0;
    for (const dataRow of allRows) {
      const checkRowId = dataRow.dataset.rowId;
      if (checkRowId !== thisRowId && isRowEmpty(checkRowId)) {
        emptyRowCount += 1;
      }
    }

    // Remove the row if it's between two other rows OR there's already another empty row
    // AND we'd have at least 2 rows left
    const shouldRemove = (isBetweenRows || emptyRowCount > 0) && totalRows > 2;

    if (shouldRemove) {
      if (rowElement) {
        rowElement.remove();
      }
    } else {
      // Otherwise, just clear the fields
      const cells = document.querySelectorAll(`input[data-row-id="${thisRowId}"]:not([type=button])`);
      for (const control of cells) {
        control.value = '';
      }
    }
  };
  rmButton.firstElementChild.addEventListener('click', rowClearClickHandler);

  // Add keyboard event handler for accessibility
  rmButton.firstElementChild.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      rowClearClickHandler(e);
    }
  });

  row.appendChild(task);

  if (appState.estimationMode === 'fibonacci') {
    row.appendChild(fib);
  } else if (appState.estimationMode === 'tshirt') {
    row.appendChild(tshirt);
  } else {
    row.appendChild(min);
    row.appendChild(max);
  }

  row.appendChild(conf);

  if (appState.enableCost) {
    row.appendChild(cost);
  }

  row.appendChild(taskGraphCell);
  row.appendChild(rmButton);

  return row;
}

/**
 * Creates the table of data for feeding the simulator.
 * @param {*} data
 * @returns HTMLElement
 */
function createEntryTable(data = []) {
  // If there is an existing table remove it.
  let wrapper = document.getElementById('dataTableWrapper');
  if (wrapper !== null) {
    wrapper.textContent = '';
  } else {
    wrapper = createDivWithIdAndClasses('dataTableWrapper', ['wrapper-entry-table', 'section']);
  }

  // Generate new table.
  const form = document.createElement('div');
  form.classList.add('table', 'data-entry');
  form.setAttribute('role', 'table');
  form.setAttribute('aria-label', 'Task data entry');
  form.id = 'DataEntryTable';
  form.dataset.currentMaxRow = 1;
  const header = document.createElement('div');
  header.classList.add('tr', 'table-header-row');
  header.setAttribute('role', 'row');
  header.appendChild(createTextElement('div', 'Task *', ['th'], 'columnheader'));

  if (appState.estimationMode === 'fibonacci') {
    header.appendChild(createTextElement('div', 'Fibonacci # *', ['th'], 'columnheader'));
  } else if (appState.estimationMode === 'tshirt') {
    header.appendChild(createTextElement('div', 'T-Shirt Size *', ['th'], 'columnheader'));
  } else {
    header.appendChild(createTextElement('div', 'Min Time *', ['th'], 'columnheader'));
    header.appendChild(createTextElement('div', 'Max Time *', ['th'], 'columnheader'));
  }

  header.appendChild(createTextElement('div', 'Confidence (%) *', ['th'], 'columnheader'));

  if (appState.enableCost) {
    header.appendChild(createTextElement('div', 'Hourly Cost', ['th'], 'columnheader'));
  }

  header.appendChild(createTextElement('div', 'Task Outcomes', ['th'], 'columnheader'));
  header.appendChild(createTextElement('div', '', ['th'], 'columnheader'));

  form.appendChild(header);

  if (data.length < 1) {
    form.appendChild(generateDataRow(1, '', '', '', '', ''));
  } else {
    let count = 0;
    let confidence = 0;
    for (const row of data) {
      count += 1;
      confidence = row.Confidence;
      if (confidence < 1) {
        confidence *= 100;
      }

      if (appState.estimationMode === 'fibonacci') {
        form.appendChild(generateDataRow(count, row.Task, '', '', confidence, row.Cost, row.Fibonacci));
      } else if (appState.estimationMode === 'tshirt') {
        form.appendChild(generateDataRow(
          count,
          row.Task,
          '',
          '',
          confidence,
          row.Cost,
          '',
          row.TShirt,
        ));
      } else {
        form.appendChild(generateDataRow(count, row.Task, row.Min, row.Max, confidence, row.Cost, ''));
      }
      form.dataset.currentMaxRow = count;
    }
  }

  const addBtn = document.createElement('input');
  const btnAttr = {
    type: 'button',
    name: 'Add Task Button',
    id: 'addTaskBtn',
    value: 'Add Task',
  };
  Object.assign(addBtn, btnAttr);
  /**
   * Click event handler for add task button.
   * @param {Event} event fired event
   */
  const addTaskClickHandler = (event) => {
    event.preventDefault();
    const table = document.querySelector('#DataEntryTable');
    const currentRowId = parseInt(table.dataset.currentMaxRow, 10) + 1;

    const newRow = generateDataRow(currentRowId, '', '', '', '', '');
    table.appendChild(newRow);
    table.dataset.currentMaxRow = currentRowId;

    // Focus the first input field (Task name) in the new row
    const firstInput = newRow.querySelector('input[type="text"]');
    if (firstInput) {
      firstInput.focus();
    }
  };
  addBtn.addEventListener('click', addTaskClickHandler);

  wrapper.appendChild(form);
  wrapper.appendChild(addBtn);

  return wrapper;
}

export {
  isRowEmpty,
  generateDataField,
  generateDataRow,
  createEntryTable,
};
