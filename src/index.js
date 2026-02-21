import { csv } from 'd3-fetch';
import './style.css';
import Icon from './logo.jpg';
import sampleData from './data/sample.csv';
import sampleFibData from './data/sample-fib.csv';
import sampleTshirtData from './data/sample-tshirt.csv';
import * as sim from './simulation';

// ============= Application State Management =================
/**
 * Manages application state in a testable, encapsulated way.
 */
class AppState {
  constructor() {
    this.estimationMode = 'hours'; // 'hours', 'fibonacci', or 'tshirt'
    this.enableCost = true; // Track cost by default
    this.fibonacciMode = 'calendar-days'; // 'calendar-days' or 'velocity-based'
    this.fibonacciCalendarMappings = {
      1: { min: 0, max: 1 },
      2: { min: 1, max: 2 },
      3: { min: 2, max: 3 },
      5: { min: 3, max: 5 },
      8: { min: 5, max: 8 },
      13: { min: 8, max: 13 },
      21: { min: 13, max: 21 },
      34: { min: 21, max: 34 },
    };
    this.velocityConfig = {
      pointsPerSprint: 25,
      sprintLengthDays: 10,
    };
    this.tshirtMappings = {
      XS: 1,
      S: 2,
      M: 3,
      L: 5,
      XL: 8,
      XXL: 13,
    };
  }

  setEstimationMode(mode) {
    this.estimationMode = mode;
  }

  getEstimationMode() {
    return this.estimationMode;
  }

  setEnableCost(enabled) {
    this.enableCost = enabled;
  }

  getEnableCost() {
    return this.enableCost;
  }

  setFibonacciMode(mode) {
    this.fibonacciMode = mode;
  }

  getFibonacciMode() {
    return this.fibonacciMode;
  }

  setVelocityConfig(pointsPerSprint, sprintLengthDays) {
    this.velocityConfig = {
      pointsPerSprint: parseFloat(pointsPerSprint) || 25,
      sprintLengthDays: parseFloat(sprintLengthDays) || 10,
    };
  }

  getVelocityConfig() {
    return this.velocityConfig;
  }

  getFibonacciCalendarMappings() {
    return this.fibonacciCalendarMappings;
  }

  getTshirtMappings() {
    return this.tshirtMappings;
  }

  /**
   * Resets state to default values (useful for testing).
   */
  reset() {
    this.estimationMode = 'hours';
    this.enableCost = true;
    this.fibonacciMode = 'calendar-days';
    this.velocityConfig = {
      pointsPerSprint: 25,
      sprintLengthDays: 10,
    };

    // Clear existing fibonacci calendar mappings
    Object.keys(this.fibonacciCalendarMappings).forEach((key) => {
      delete this.fibonacciCalendarMappings[key];
    });

    // Clear existing tshirt mappings
    Object.keys(this.tshirtMappings).forEach((key) => {
      delete this.tshirtMappings[key];
    });

    // Reassign default values to the same objects
    Object.assign(this.fibonacciCalendarMappings, {
      1: { min: 1, max: 1 },
      2: { min: 1, max: 2 },
      3: { min: 2, max: 3 },
      5: { min: 3, max: 5 },
      8: { min: 5, max: 8 },
      13: { min: 8, max: 13 },
      21: { min: 13, max: 21 },
      34: { min: 21, max: 34 },
    });
    Object.assign(this.tshirtMappings, {
      XS: 1,
      S: 2,
      M: 3,
      L: 5,
      XL: 8,
      XXL: 13,
    });
  }
}

const appState = new AppState();

// Maintain backward compatibility with existing code
const { fibonacciCalendarMappings, tshirtMappings } = appState;

// ============= Interface Element Helpers =================
/**
 * Create a text element with it's internal text node.
 * @param {string} wrapperTag Tag name
 * @param {string} text Tag content
 * @param {array} classList List of classes.
 * @param {string} role Optional ARIA role
 * @returns HTMLElement
 */
function createTextElement(wrapperTag, text, classList = [], role = null) {
  const el = document.createElement(wrapperTag);
  el.appendChild(document.createTextNode(text));
  el.classList.add(...classList);
  if (role) {
    el.setAttribute('role', role);
  }
  return el;
}

/**
 * Create a labeled input.
 * @param {string} labelText Text for input label.
 * @param {*} inputAttributes A collection of attributes to set on the input.
 * @param {boolean} labelFirst when true, puts the label before the input and vice versa.
 * @returns HTMLElement
 */
function createLabeledInput(labelText, inputAttributes, labelFirst = true) {
  const wrapper = document.createElement('div');
  const fldLabel = createTextElement('label', labelText);
  fldLabel.htmlFor = inputAttributes.id || inputAttributes.name;
  const field = document.createElement('input');
  Object.assign(field, inputAttributes);

  if (labelFirst) {
    wrapper.appendChild(fldLabel);
    wrapper.appendChild(field);
  } else {
    wrapper.appendChild(field);
    wrapper.appendChild(fldLabel);
  }
  return wrapper;
}

/**
 * Creates an HTML div with the ID and classes set.
 * @param {*} id The id for the div
 * @param {*} classList list of classes to add.
 * @returns HTMLElement
 */
function createDivWithIdAndClasses(id, classList = []) {
  const el = document.createElement('div');
  el.id = id;
  el.classList.add(...classList);

  return el;
}

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
 * Normalizes t-shirt size values for mapping lookup.
 * @param {string} size Raw t-shirt size input.
 * @returns {string} Normalized uppercase size.
 */
function normalizeTshirtSize(size) {
  if (typeof size !== 'string') {
    return '';
  }
  return size.trim().toUpperCase();
}

/**
 * Handles tab navigation inside mapping tables so focus moves min->max per column.
 * @param {KeyboardEvent} event Keyboard event from mapping input.
 * @param {string} keyField Data attribute key name (fib|tshirt).
 * @param {Array<string|number>} orderedKeys Ordered mapping keys.
 */
function handleMappingTabNavigation(event, keyField, orderedKeys) {
  if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  const target = event && event.target ? event.target : null;
  const dataset = target && target.dataset ? target.dataset : null;
  const currentKey = dataset ? dataset[keyField] : null;
  const currentType = dataset ? dataset.type : null;
  if (!currentKey || !currentType) {
    return;
  }

  const normalizedCurrentKey = keyField === 'tshirt' ? normalizeTshirtSize(currentKey) : currentKey;
  const sequence = [];
  for (const key of orderedKeys) {
    const normalizedKey = keyField === 'tshirt' ? normalizeTshirtSize(String(key)) : String(key);
    sequence.push({ key: normalizedKey, type: 'min' });
    sequence.push({ key: normalizedKey, type: 'max' });
  }

  const currentIndex = sequence.findIndex((item) => (
    item.key === normalizedCurrentKey && item.type === currentType
  ));

  if (currentIndex < 0) {
    return;
  }

  const direction = event.shiftKey ? -1 : 1;
  const nextIndex = currentIndex + direction;

  if (nextIndex < 0 || nextIndex >= sequence.length) {
    return;
  }

  const next = sequence[nextIndex];
  const selector = `input[data-${keyField}="${next.key}"][data-type="${next.type}"]`;
  const nextInput = document.querySelector(selector);

  if (nextInput) {
    event.preventDefault();
    nextInput.focus();
  }
}

/**
 * Creates an input field for a specific input control
 * @param {string} label
 * @param {string} fieldValue
 * @param {string} fieldType
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
    'aria-label': label,
    name: label,
  };
  if (isRequired) {
    values['aria-required'] = 'true';
    values.required = true;
  }
  Object.assign(element, values);
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

/**
 * Handles Fibonacci mode changes (calendar-days vs velocity-based)
 * @param {Event} event
 */
function handleFibonacciModeChange(event) {
  const mode = event.target.value;
  appState.setFibonacciMode(mode);

  // Show/hide calendar mapping table based on mode
  const calendarMapping = document.getElementById('fibonacciCalendarMappingWrapper');
  if (calendarMapping) {
    calendarMapping.style.display = mode === 'calendar-days' ? 'block' : 'none';
  }

  // Show/hide velocity configuration based on mode
  const velocityConfig = document.getElementById('velocityConfigWrapper');
  if (velocityConfig) {
    velocityConfig.style.display = mode === 'velocity-based' ? 'block' : 'none';
  }
}

/**
 * Updates velocity configuration when user changes values.
 */
function handleVelocityConfigChange() {
  const pointsInput = document.getElementById('velocityPoints');
  const daysInput = document.getElementById('velocityDays');

  if (pointsInput && daysInput) {
    const points = parseFloat(pointsInput.value) || 25;
    const days = parseFloat(daysInput.value) || 10;
    appState.setVelocityConfig(points, days);
  }
}

/**
 * Updates the Fibonacci calendar day mapping when user changes values.
 * @param {Event} event
 */
function updateFibonacciCalendarMapping(event) {
  if (!event || !event.target || !event.target.dataset) {
    return;
  }

  const { fib, type } = event.target.dataset;
  const rawValue = event.target.value;

  if (!fib || !type) {
    return;
  }

  const fibNum = Number.parseInt(fib, 10);
  const value = Number.parseFloat(rawValue);

  if (!Number.isFinite(fibNum) || !Number.isFinite(value)) {
    return;
  }

  if (!fibonacciCalendarMappings[fibNum] || !(type in fibonacciCalendarMappings[fibNum])) {
    return;
  }

  fibonacciCalendarMappings[fibNum][type] = value;

  // Validate that min <= max (only if we have a real DOM element)
  if (fibonacciCalendarMappings[fibNum].min > fibonacciCalendarMappings[fibNum].max) {
    if (event.target.setCustomValidity) {
      event.target.setCustomValidity('Min must be less than or equal to Max');
      if (event.target.reportValidity) {
        event.target.reportValidity();
      }
    }
  } else if (event.target.setCustomValidity) {
    event.target.setCustomValidity('');
  }
}

/**
 * Creates the Fibonacci calendar days mapping configuration table.
 * @returns HTMLElement
 */
function createFibonacciCalendarMappingTable() {
  const wrapper = createDivWithIdAndClasses('fibonacciCalendarMappingWrapper', ['config-section', 'calendar-mapping']);
  wrapper.style.display = appState.getFibonacciMode() === 'calendar-days' ? 'block' : 'none';

  const header = createTextElement('h4', 'Story Points to Calendar Days Mapping', ['config-subheader']);
  wrapper.appendChild(header);

  const helpText = createTextElement('p', 'Customize how many calendar days each story point value represents:', ['help-text']);
  wrapper.appendChild(helpText);

  const table = document.createElement('div');
  table.classList.add('table', 'fib-mapping-table');

  // Get Fibonacci numbers dynamically from the mappings object
  const fibNumbers = Object.keys(fibonacciCalendarMappings)
    .map((n) => parseInt(n, 10))
    .sort((a, b) => a - b);

  // Row 1: Fibonacci Numbers
  const fibRow = document.createElement('div');
  fibRow.classList.add('tr', 'fib-mapping-row');
  fibRow.appendChild(createTextElement('div', 'Story Points', ['th']));

  for (const fibNum of fibNumbers) {
    const fibCell = document.createElement('div');
    fibCell.classList.add('td');
    fibCell.appendChild(createTextElement('span', fibNum.toString(), []));
    fibRow.appendChild(fibCell);
  }
  table.appendChild(fibRow);

  // Row 2: Min Days
  const minRow = document.createElement('div');
  minRow.classList.add('tr', 'fib-mapping-row');
  minRow.appendChild(createTextElement('div', 'Min Days', ['th']));

  for (const fibNum of fibNumbers) {
    const minCell = document.createElement('div');
    minCell.classList.add('td');
    const minInput = document.createElement('input');
    Object.assign(minInput, {
      type: 'number',
      value: fibonacciCalendarMappings[fibNum].min,
      name: `fib-cal-min-${fibNum}`,
      step: '0.5',
      min: '0',
      'aria-label': `Minimum days for ${fibNum} story points`,
    });
    minInput.dataset.fib = fibNum;
    minInput.dataset.type = 'min';
    minInput.addEventListener('change', updateFibonacciCalendarMapping);
    minCell.appendChild(minInput);
    minRow.appendChild(minCell);
  }
  table.appendChild(minRow);

  // Row 3: Max Days
  const maxRow = document.createElement('div');
  maxRow.classList.add('tr', 'fib-mapping-row');
  maxRow.appendChild(createTextElement('div', 'Max Days', ['th']));

  for (const fibNum of fibNumbers) {
    const maxCell = document.createElement('div');
    maxCell.classList.add('td');
    const maxInput = document.createElement('input');
    Object.assign(maxInput, {
      type: 'number',
      value: fibonacciCalendarMappings[fibNum].max,
      name: `fib-cal-max-${fibNum}`,
      step: '0.5',
      min: '0',
      'aria-label': `Maximum days for ${fibNum} story points`,
    });
    maxInput.dataset.fib = fibNum;
    maxInput.dataset.type = 'max';
    maxInput.addEventListener('change', updateFibonacciCalendarMapping);
    maxCell.appendChild(maxInput);
    maxRow.appendChild(maxCell);
  }
  table.appendChild(maxRow);

  wrapper.appendChild(table);

  return wrapper;
}

/**
 * Updates the t-shirt mapping when user changes values.
 * @param {Event} event
 */
function updateTshirtMapping(event) {
  if (!event || !event.target || !event.target.dataset) {
    return;
  }

  const { tshirt } = event.target.dataset;
  const rawValue = event.target.value;

  if (!tshirt) {
    return;
  }

  const size = normalizeTshirtSize(tshirt);
  const value = Number.parseInt(rawValue, 10);

  if (!size || !Number.isFinite(value) || value < 0) {
    return;
  }

  if (!Object.hasOwn(tshirtMappings, size)) {
    return;
  }

  tshirtMappings[size] = value;
}

/**
 * Creates the Fibonacci configuration interface (mode selector + velocity config)
 * @returns HTMLElement
 */
function createFibonacciConfigPanel() {
  const wrapper = createDivWithIdAndClasses('fibonacciConfigWrapper', ['section', 'fibonacci-config']);
  const header = createTextElement('H3', 'Fibonacci Estimation Configuration', ['header', 'fib-config']);

  // Mode selector
  const modeSection = document.createElement('div');
  modeSection.classList.add('config-section');

  const modeLabel = createTextElement('label', 'Fibonacci Mapping Mode:', ['config-label']);
  modeSection.appendChild(modeLabel);

  const modeDescription = createTextElement('p', 'Choose how Fibonacci story points are converted to time estimates:', ['help-text']);
  modeSection.appendChild(modeDescription);

  const modeSelector = document.createElement('div');
  modeSelector.classList.add('radio-group');

  // Calendar Days option
  const calendarOption = document.createElement('div');
  calendarOption.classList.add('radio-option');
  const calendarRadio = document.createElement('input');
  Object.assign(calendarRadio, {
    type: 'radio',
    id: 'fibModeCalendar',
    name: 'fibonacciMode',
    value: 'calendar-days',
    checked: appState.getFibonacciMode() === 'calendar-days',
  });
  calendarRadio.addEventListener('change', handleFibonacciModeChange);

  const calendarLabel = createTextElement('label', 'Calendar Days (Customizable Mapping)', []);
  calendarLabel.htmlFor = 'fibModeCalendar';

  const calendarHelp = createTextElement('span', 'Configure story point to calendar day mappings below', ['option-help']);

  calendarOption.appendChild(calendarRadio);
  calendarOption.appendChild(calendarLabel);
  calendarOption.appendChild(calendarHelp);
  modeSelector.appendChild(calendarOption);

  // Velocity-Based option
  const velocityOption = document.createElement('div');
  velocityOption.classList.add('radio-option');
  const velocityRadio = document.createElement('input');
  Object.assign(velocityRadio, {
    type: 'radio',
    id: 'fibModeVelocity',
    name: 'fibonacciMode',
    value: 'velocity-based',
    checked: appState.getFibonacciMode() === 'velocity-based',
  });
  velocityRadio.addEventListener('change', handleFibonacciModeChange);

  const velocityLabel = createTextElement('label', 'Velocity-Based (Team-Specific)', []);
  velocityLabel.htmlFor = 'fibModeVelocity';

  const velocityHelp = createTextElement('span', 'Based on your team\'s historical velocity', ['option-help']);

  velocityOption.appendChild(velocityRadio);
  velocityOption.appendChild(velocityLabel);
  velocityOption.appendChild(velocityHelp);
  modeSelector.appendChild(velocityOption);

  modeSection.appendChild(modeSelector);
  wrapper.appendChild(header);
  wrapper.appendChild(modeSection);

  // Calendar days mapping table (shown only for calendar-days mode)
  const calendarMappingTable = createFibonacciCalendarMappingTable();
  wrapper.appendChild(calendarMappingTable);

  // Velocity configuration (shown only for velocity-based mode)
  const velocityConfigWrapper = createDivWithIdAndClasses('velocityConfigWrapper', ['config-section', 'velocity-config']);
  velocityConfigWrapper.style.display = appState.getFibonacciMode() === 'velocity-based' ? 'block' : 'none';

  const velocityConfigHeader = createTextElement('h4', 'Team Velocity Configuration', ['config-subheader']);
  velocityConfigWrapper.appendChild(velocityConfigHeader);

  const velocityConfigHelp = createTextElement('p', 'Enter your team\'s average velocity to calculate realistic time estimates:', ['help-text']);
  velocityConfigWrapper.appendChild(velocityConfigHelp);

  // Points per sprint input
  const pointsGroup = document.createElement('div');
  pointsGroup.classList.add('input-group');
  const pointsLabel = createTextElement('label', 'Points Per Sprint:', ['config-label']);
  pointsLabel.htmlFor = 'velocityPoints';
  const pointsInput = document.createElement('input');
  Object.assign(pointsInput, {
    type: 'number',
    id: 'velocityPoints',
    name: 'velocityPoints',
    value: appState.getVelocityConfig().pointsPerSprint,
    min: 1,
    step: 1,
    'aria-label': 'Points completed per sprint',
  });
  pointsInput.addEventListener('change', handleVelocityConfigChange);
  pointsGroup.appendChild(pointsLabel);
  pointsGroup.appendChild(pointsInput);
  velocityConfigWrapper.appendChild(pointsGroup);

  // Sprint length input
  const daysGroup = document.createElement('div');
  daysGroup.classList.add('input-group');
  const daysLabel = createTextElement('label', 'Sprint Length (Working Days):', ['config-label']);
  daysLabel.htmlFor = 'velocityDays';
  const daysInput = document.createElement('input');
  Object.assign(daysInput, {
    type: 'number',
    id: 'velocityDays',
    name: 'velocityDays',
    value: appState.getVelocityConfig().sprintLengthDays,
    min: 1,
    step: 1,
    'aria-label': 'Sprint duration in working days',
  });
  daysInput.addEventListener('change', handleVelocityConfigChange);
  daysGroup.appendChild(daysLabel);
  daysGroup.appendChild(daysInput);
  velocityConfigWrapper.appendChild(daysGroup);

  const velocityExample = createTextElement(
    'p',
    'Example: 25 points in 10 days = 2.5 points/day. An 8-point story would be estimated at 2.24-4.16 days.',
    ['help-text', 'example'],
  );
  velocityConfigWrapper.appendChild(velocityExample);

  wrapper.appendChild(velocityConfigWrapper);
  wrapper.style.display = 'none'; // Hidden by default

  return wrapper;
}

/**
 * Creates the t-shirt mapping configuration interface.
 * @returns HTMLElement
 */
function createTshirtMappingTable() {
  const wrapper = createDivWithIdAndClasses('tshirtMappingWrapper', ['section', 'fibonacci-mapping']);
  const header = createTextElement('H3', 'T-Shirt Size to Fibonacci Mapping', ['header', 'fib-mapping']);
  const helpText = createTextElement('p', 'Map t-shirt sizes to Fibonacci story points. These will be converted to days using the Fibonacci calendar day mappings.', ['help-text']);

  const table = document.createElement('div');
  table.classList.add('table', 'fib-mapping-table');

  const sizes = Object.keys(tshirtMappings);

  const sizeRow = document.createElement('div');
  sizeRow.classList.add('tr', 'fib-mapping-row');
  sizeRow.appendChild(createTextElement('div', 'T-Shirt Size', ['th']));

  for (const size of sizes) {
    const sizeCell = document.createElement('div');
    sizeCell.classList.add('td');
    sizeCell.appendChild(createTextElement('span', size, []));
    sizeRow.appendChild(sizeCell);
  }
  table.appendChild(sizeRow);

  const fibRow = document.createElement('div');
  fibRow.classList.add('tr', 'fib-mapping-row');
  fibRow.appendChild(createTextElement('div', 'Fibonacci Points', ['th']));

  for (const size of sizes) {
    const fibCell = document.createElement('div');
    fibCell.classList.add('td');
    const fibInput = document.createElement('input');
    Object.assign(fibInput, {
      type: 'number',
      value: tshirtMappings[size],
      name: `tshirt-fib-${size}`,
      min: 0,
      step: 1,
      'aria-label': `Fibonacci points for t-shirt size ${size}`,
    });
    fibInput.dataset.tshirt = size;
    fibInput.addEventListener('change', updateTshirtMapping);
    fibInput.addEventListener('keydown', (event) => {
      handleMappingTabNavigation(event, 'tshirt', sizes);
    });
    fibCell.appendChild(fibInput);
    fibRow.appendChild(fibCell);
  }
  table.appendChild(fibRow);

  wrapper.appendChild(header);
  wrapper.appendChild(helpText);
  wrapper.appendChild(table);
  wrapper.style.display = 'none';

  return wrapper;
}

/**
 * Handles cost tracking toggle
 * @param {Event} event
 */
function handleCostToggle(event) {
  appState.setEnableCost(event.target.checked);

  const costResults = document.getElementById('simulationCostResultsWrapper');

  if (costResults) {
    costResults.style.display = appState.enableCost ? 'block' : 'none';
  }

  // Recreate the data entry table with the new cost setting
  createEntryTable();
}

/**
 * Handles estimation mode changes
 * @param {Event} event
 */
function handleModeChange(event) {
  appState.setEstimationMode(event.target.value);

  const fibConfig = document.getElementById('fibonacciConfigWrapper');
  const tshirtMapping = document.getElementById('tshirtMappingWrapper');
  const sampleLink = document.querySelector('.link-sample');

  if (appState.estimationMode === 'fibonacci') {
    fibConfig.style.display = 'block';
    tshirtMapping.style.display = 'none';
    if (sampleLink) {
      sampleLink.href = sampleFibData;
      sampleLink.textContent = 'Sample Fibonacci CSV File';
      sampleLink.download = 'sample-fib.csv';
    }
  } else if (appState.estimationMode === 'tshirt') {
    fibConfig.style.display = 'none';
    tshirtMapping.style.display = 'block';
    if (sampleLink) {
      sampleLink.href = sampleTshirtData;
      sampleLink.textContent = 'Sample T-Shirt CSV File';
      sampleLink.download = 'sample-tshirt.csv';
    }
  } else {
    fibConfig.style.display = 'none';
    tshirtMapping.style.display = 'none';
    if (sampleLink) {
      sampleLink.href = sampleData;
      sampleLink.textContent = 'Sample CSV File';
      sampleLink.download = 'sample.csv';
    }
  }

  // Recreate the data entry table with the new mode
  createEntryTable();
}

// ============= Interface Behaviors ================
/**
 * Validates CSV data structure and content. Pure function for testing.
 * @param {Array} data Parsed CSV data as array of objects
 * @param {string} estimationMode Current estimation mode ('hours', 'fibonacci', 'tshirt')
 * @param {boolean} enableCost Whether cost tracking is enabled
 * @returns {Array} Validated data array
 * @throws {Error} If validation fails
 */
function validateCsvData(data, estimationMode, enableCost) {
  // Validate CSV data has required structure
  if (!data || data.length === 0) {
    throw new Error('CSV file is empty or contains no data rows.');
  }

  // Check for required columns based on current estimation mode
  const requiredColumns = ['Task', 'Confidence'];
  if (estimationMode === 'hours') {
    requiredColumns.push('Min', 'Max');
  } else if (estimationMode === 'fibonacci') {
    requiredColumns.push('Fibonacci');
  } else if (estimationMode === 'tshirt') {
    requiredColumns.push('TShirt');
  }

  const firstRow = data[0];
  const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Expected columns: ${requiredColumns.join(', ')}${enableCost ? ', Cost (optional)' : ''}.`);
  }

  // Validate data types for first few rows
  for (let i = 0; i < Math.min(3, data.length); i += 1) {
    const row = data[i];
    if (estimationMode === 'hours') {
      if (row.Min && Number.isNaN(Number(row.Min))) {
        throw new Error(`Invalid Min value "${row.Min}" in row ${i + 1}. Must be a number.`);
      }
      if (row.Max && Number.isNaN(Number(row.Max))) {
        throw new Error(`Invalid Max value "${row.Max}" in row ${i + 1}. Must be a number.`);
      }
    }
    const confidence = Number(row.Confidence);
    if (row.Confidence && (Number.isNaN(confidence)
      || confidence < 0 || confidence > 100)) {
      throw new Error(`Invalid Confidence value "${row.Confidence}" in row ${i + 1}. Must be a number between 0 and 100.`);
    }
  }

  return data;
}

/**
 * Client event handler for the import button
 * @param {Event} event Fired event.
 */
function importCsvFile(event) {
  event.preventDefault();
  const fileInput = document.getElementById('csvFileInput');
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = (evt) => {
      const dataUrl = evt.target.result;
      // The following call results in an "Access denied" error in IE.
      csv(dataUrl).then((data) => {
        // Validate CSV data using pure function
        const validatedData = validateCsvData(data, appState.estimationMode, appState.enableCost);
        createEntryTable(validatedData);
      }).catch((error) => {
        const errorDiv = document.createElement('div');
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'assertive');
        errorDiv.classList.add('error-message');

        // Provide specific error message or fallback to generic one
        let errorMessage = error.message;
        if (!errorMessage || errorMessage.includes('undefined')) {
          errorMessage = 'Failed to parse CSV file. Please check that the file is properly formatted with columns separated by commas.';
        }
        errorDiv.textContent = errorMessage;

        const dataWrapper = document.getElementById('dataAreaWrapper');
        const existingError = dataWrapper.querySelector('.error-message');
        if (existingError) {
          existingError.remove();
        }
        dataWrapper.insertBefore(errorDiv, dataWrapper.firstChild);
      });
    };
    reader.readAsDataURL(file);
  }
}

/**
 * Helper function to replace all of a node's content with new text.
 * @param {*} id Element ID for search.
 * @param {*} content A string to place into the element.
 */
function updateElementText(id, content) {
  const el = document.getElementById(id);
  el.textContent = content;
}

/**
 * Renders mini histograms for all task rows from simulation output.
 * @param {Array} taskResults Per-task simulation results.
 */
function renderTaskRowHistograms(taskResults) {
  const rowGraphs = document.querySelectorAll('.task-row-graph');
  for (const graphNode of rowGraphs) {
    graphNode.innerHTML = '';
  }

  if (!taskResults || taskResults.length < 1) {
    return;
  }

  for (const taskResult of taskResults) {
    const graphNode = document.querySelector(`.task-row-graph[data-row-id="${taskResult.rowId}"]`);
    if (graphNode) {
      sim.buildTaskRowHistogram(
        graphNode,
        taskResult.times.list,
        taskResult.times.min,
        taskResult.times.max,
        taskResult.name,
      );
    }
  }
}

/**
 * Saves an SVG element as a PNG or JPEG image
 * @param {string} svgContainerId ID of the element containing the SVG
 * @param {string} filename Name for the downloaded file
 * @param {string} format 'png' or 'jpeg'
 */
function saveSvgAsImage(svgContainerId, filename, format = 'png') {
  const container = document.getElementById(svgContainerId);
  const svg = container.querySelector('svg');

  if (!svg) {
    // Create accessible error message instead of alert
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = 'No graph to save. Please run a simulation first.';

    const existingError = container.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    container.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
    return;
  }

  // Clone the SVG to avoid modifying the original
  const svgClone = svg.cloneNode(true);

  // Inline styles to preserve colors
  const allElements = svgClone.querySelectorAll('*');
  const originalElements = svg.querySelectorAll('*');

  allElements.forEach((element, index) => {
    const originalElement = originalElements[index];
    if (originalElement) {
      const computedStyle = window.getComputedStyle(originalElement);
      const styleString = Array.from(computedStyle).reduce((acc, key) => {
        const value = computedStyle.getPropertyValue(key);
        if (value && key !== 'all') {
          return `${acc}${key}:${value};`;
        }
        return acc;
      }, '');
      if (styleString) {
        element.setAttribute('style', styleString);
      }
    }
  });

  // Get SVG data
  const svgData = new XMLSerializer().serializeToString(svgClone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Create an image to load the SVG
  const img = new Image();
  img.onload = () => {
    // Create a canvas with bottom margin
    const canvas = document.createElement('canvas');
    const svgSize = svg.getBoundingClientRect();
    const bottomMargin = 20;
    canvas.width = svgSize.width;
    canvas.height = svgSize.height + bottomMargin;

    // Draw the image onto the canvas
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, `image/${format}`, 0.95);

    URL.revokeObjectURL(url);
  };

  img.src = url;
}

/**
 * Triggers the start of the simulation run with the current values.
 * @param {Event} event
 */
async function startSimulation(event) {
  event.preventDefault();
  const passCount = document.getElementById('simulationPasses').value;
  const graphSetting = document.getElementById('LimitGraph').checked;
  const data = [];

  // Clear any previous task-level graphs immediately for this run.
  renderTaskRowHistograms([]);

  // Gather the task information.
  const tasks = document.querySelectorAll('#DataEntryTable .tr.data-row');
  let inputs;
  let taskDetail;
  for (const t of tasks) {
    taskDetail = {};
    taskDetail.RowId = t.dataset.rowId;
    inputs = t.getElementsByTagName('input');
    for (const i of inputs) {
      switch (i.name) {
        case 'Task':
          taskDetail.Name = i.value;
          break;
        case 'Min Time':
          taskDetail.Min = parseInt(i.value, 10);
          break;
        case 'Max Time':
          taskDetail.Max = parseInt(i.value, 10);
          break;
        case 'Fibonacci':
          taskDetail.Fibonacci = parseInt(i.value, 10);
          break;
        case 'T-Shirt':
          taskDetail.TShirt = normalizeTshirtSize(i.value);
          break;
        case 'Confidence':
          taskDetail.Confidence = parseFloat(i.value) / 100;
          break;
        case 'Cost':
          taskDetail.Cost = parseInt(i.value, 10);
          // Default to 0 if parseInt returns NaN (empty or invalid input)
          if (Number.isNaN(taskDetail.Cost)) {
            taskDetail.Cost = 0;
          }
          break;
        default:
          break;
      }
    }

    // Convert Fibonacci numbers to min/max if in Fibonacci mode
    if (appState.estimationMode === 'fibonacci' && taskDetail.Fibonacci) {
      const fibMode = appState.getFibonacciMode();
      let mapping;

      if (fibMode === 'calendar-days') {
        mapping = sim.fibonacciToCalendarDays(taskDetail.Fibonacci, fibonacciCalendarMappings);
      } else if (fibMode === 'velocity-based') {
        const { pointsPerSprint, sprintLengthDays } = appState.getVelocityConfig();
        mapping = sim.fibonacciToVelocityDays(
          taskDetail.Fibonacci,
          pointsPerSprint,
          sprintLengthDays,
        );
      }

      if (mapping) {
        taskDetail.Min = mapping.min;
        taskDetail.Max = mapping.max;
      }
    } else if (appState.estimationMode === 'tshirt' && taskDetail.TShirt) {
      const fibonacciValue = tshirtMappings[taskDetail.TShirt];
      if (fibonacciValue) {
        // Convert T-shirt size to Fibonacci, then Fibonacci to days
        const mapping = sim.fibonacciToCalendarDays(fibonacciValue, fibonacciCalendarMappings);
        if (mapping) {
          taskDetail.Min = mapping.min;
          taskDetail.Max = mapping.max;
        }
      }
    }

    // Set default cost to 0 if cost tracking is disabled
    if (!appState.enableCost && !taskDetail.Cost) {
      taskDetail.Cost = 0;
    }

    // Validate that task has required fields and they are valid numbers
    const hasName = taskDetail.Name && taskDetail.Name.trim() !== '';
    const hasValidMin = !Number.isNaN(taskDetail.Min) && taskDetail.Min !== undefined;
    const hasValidMax = !Number.isNaN(taskDetail.Max) && taskDetail.Max !== undefined;
    const hasValidConfidence = !Number.isNaN(taskDetail.Confidence)
      && taskDetail.Confidence !== undefined;

    // Additional validation for value ranges
    const minIsPositive = hasValidMin && taskDetail.Min >= 0;
    const maxIsValid = hasValidMax && taskDetail.Max >= taskDetail.Min;
    const confidenceInRange = hasValidConfidence
      && taskDetail.Confidence >= 0
      && taskDetail.Confidence <= 1;

    if (hasName && minIsPositive && maxIsValid && confidenceInRange) {
      data.push(taskDetail);
    }
  }

  // Validate we have at least one task
  if (data.length === 0) {
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = 'No valid tasks found. Please ensure all tasks have valid values: name, min >= 0, max >= min, and confidence between 0-100%.';

    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
      const existingError = resultsDiv.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      resultsDiv.insertBefore(errorDiv, resultsDiv.firstChild);
    }
    return;
  }

  // Determine the correct time unit based on estimation mode
  const timeUnit = (appState.estimationMode === 'fibonacci' || appState.estimationMode === 'tshirt') ? 'Days' : 'Hours';
  // When using days, need to multiply hourly cost by 8 hours/day
  const hoursPerTimeUnit = timeUnit === 'Days' ? 8 : 1;

  const runButton = document.getElementById('startSimulationButton');
  const runStartTime = Date.now();
  const updateRunningTimeDisplay = (runningTime) => {
    updateElementText('simulationRunningTime', `Simulation Running Time (ms): ${runningTime}`);
  };
  const stopwatchInterval = setInterval(() => {
    updateRunningTimeDisplay(Date.now() - runStartTime);
  }, 100);

  if (runButton) {
    runButton.disabled = true;
    runButton.value = 'Running...';
  }

  updateRunningTimeDisplay(0);

  // Clear previous statistics at the start of a new simulation
  updateElementText('simulationTimeMedian', '');
  updateElementText('simulationTimeStandRange', '');
  updateElementText('simulationTimeMax', '');
  updateElementText('simulationTimeMin', '');
  updateElementText('simulationTimeStandDev', '');
  updateElementText('simulationCostMedian', '');
  updateElementText('simulationCostStandRange', '');
  updateElementText('simulationCostMax', '');
  updateElementText('simulationCostMin', '');
  updateElementText('simulationCostStandDev', '');

  try {
    // Run main simulator with progressive graph updates.
    document.getElementById('costHistoGram').innerHTML = '';
    document.getElementById('costEstimateHeader').style.display = 'none';
    document.getElementById('costSaveButtons').style.display = 'none';

    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    const graphProgressInterval = 1000;
    const results = await sim.runSimulationProgressive(
      passCount,
      data,
      (progress) => {
        if (progress.times.min > -1 && progress.times.max >= progress.times.min) {
          // Update time histogram preview
          sim.buildHistogramPreview(
            document.getElementById('timeHistoGram'),
            progress.times.list,
            progress.times.min,
            progress.times.max,
            timeUnit,
          );
          document.getElementById('timeEstimateHeader').style.display = 'block';
          document.getElementById('timeSaveButtons').style.display = 'block';

          // Update time statistics during progressive updates
          updateElementText('simulationTimeMedian', `Median Time: ${progress.times.median} ${timeUnit.toLowerCase()}`);
          updateElementText('simulationTimeStandRange', `Likely Range: ${progress.times.likelyMin} - ${progress.times.likelyMax} ${timeUnit.toLowerCase()}`);
          updateElementText('simulationTimeMax', `Max Time: ${progress.times.max} ${timeUnit.toLowerCase()}`);
          updateElementText('simulationTimeMin', `Min Time: ${progress.times.min} ${timeUnit.toLowerCase()}`);
          updateElementText('simulationTimeStandDev', `Standard Deviation: ${progress.times.sd}`);

          // Update cost statistics during progressive updates if enabled
          if (appState.enableCost && progress.costs.min > -1) {
            updateElementText('simulationCostMedian', `Median cost: ${currencyFormatter.format(progress.costs.median)}`);
            updateElementText('simulationCostStandRange', `Likely Range: ${currencyFormatter.format(progress.costs.likelyMin)} - ${currencyFormatter.format(progress.costs.likelyMax)}`);
            updateElementText('simulationCostMax', `Max cost: ${currencyFormatter.format(progress.costs.max)}`);
            updateElementText('simulationCostMin', `Min cost: ${currencyFormatter.format(progress.costs.min)}`);
            updateElementText('simulationCostStandDev', `Standard Deviation: ${progress.costs.sd}`);
          }
        }
      },
      graphProgressInterval,
      hoursPerTimeUnit,
    );

    // Display final summary data (one last update with complete results)
    updateElementText('simulationRunningTime', `Simulation Running Time (ms): ${results.runningTime}`);
    updateElementText('simulationTimeMedian', `Median Time: ${results.times.median} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeStandRange', `Likely Range: ${results.times.likelyMin} - ${results.times.likelyMax} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeMax', `Max Time: ${results.times.max} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeMin', `Min Time: ${results.times.min} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeStandDev', `Standard Deviation: ${results.times.sd}`);

    // Only display cost results if cost tracking is enabled
    if (appState.enableCost) {
      updateElementText('simulationCostMedian', `Median cost: ${currencyFormatter.format(results.costs.median)}`);
      updateElementText('simulationCostStandRange', `Likely Range: ${currencyFormatter.format(results.costs.likelyMin)} - ${currencyFormatter.format(results.costs.likelyMax)}`);
      updateElementText('simulationCostMax', `Max cost: ${currencyFormatter.format(results.costs.max)}`);
      updateElementText('simulationCostMin', `Min cost: ${currencyFormatter.format(results.costs.min)}`);
      updateElementText('simulationCostStandDev', `Standard Deviation: ${results.costs.sd}`);
    }

    // Render row-level task distributions as soon as simulation data is available.
    renderTaskRowHistograms(results.taskResults);

    // Build and display histograms.
    sim.buildHistogram(
      document.getElementById('timeHistoGram'),
      results.times.list,
      results.times.min,
      results.times.max,
      results.times.median,
      results.times.sd,
      timeUnit,
      graphSetting,
    );
    // Show time estimate header and save buttons now that graph is generated
    document.getElementById('timeEstimateHeader').style.display = 'block';
    document.getElementById('timeSaveButtons').style.display = 'block';

    // Only build cost histogram if cost tracking is enabled
    if (appState.enableCost) {
      sim.buildHistogram(
        document.getElementById('costHistoGram'),
        results.costs.list,
        results.costs.min,
        results.costs.max,
        results.costs.median,
        results.costs.sd,
        'Cost',
        graphSetting,
      );
      // Show cost estimate header and save buttons now that graph is generated
      document.getElementById('costEstimateHeader').style.display = 'block';
      document.getElementById('costSaveButtons').style.display = 'block';
    } else {
      // Hide cost estimate header and save buttons if cost tracking is disabled
      document.getElementById('costEstimateHeader').style.display = 'none';
      document.getElementById('costSaveButtons').style.display = 'none';
    }
  } catch (error) {
    // Display user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = 'Simulation failed. Please verify your input data is valid and try again. If the problem persists, check the browser console for details.';

    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
      const existingError = resultsDiv.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      resultsDiv.insertBefore(errorDiv, resultsDiv.firstChild);
    }
  } finally {
    clearInterval(stopwatchInterval);
    if (runButton) {
      runButton.disabled = false;
      runButton.value = 'Run Simulation';
    }
  }
}

/**
 * Creates the page header with icon, title, and GitHub ribbon.
 * @returns {HTMLElement} Header section
 */
function createHeader() {
  const headerDiv = document.createElement('div');
  headerDiv.classList.add('page-header', 'section');

  // Insert project Icon
  const simIcon = new Image();
  simIcon.src = Icon;
  simIcon.alt = 'Project Estimate Simulator icon';
  simIcon.width = 100;
  simIcon.height = 100;
  simIcon.classList.add('project-icon');
  headerDiv.appendChild(simIcon);

  // Fork Me ribbon
  const githubRibbon = createDivWithIdAndClasses('forkOnGithub', ['github-ribbon']);
  const githubLink = document.createElement('a');
  githubLink.href = 'https://github.com/acrosman/simple-project-estimates';
  githubLink.textContent = 'Fork me on GitHub';
  githubRibbon.appendChild(githubLink);
  headerDiv.appendChild(githubRibbon);

  return headerDiv;
}

/**
 * Creates the estimation mode selector with radio buttons and cost toggle.
 * @returns {HTMLElement} Mode selector section
 */
function createModeSelector() {
  const modeSelectorDiv = document.createElement('div');
  modeSelectorDiv.classList.add('section', 'wrapper-mode-selector');
  const modeHeader = createTextElement('H2', 'Estimation Mode', ['header', 'mode-selector']);

  const modeFieldset = document.createElement('fieldset');
  modeFieldset.appendChild(createTextElement('legend', 'Select estimation type', []));

  const hoursRadio = document.createElement('input');
  Object.assign(hoursRadio, {
    type: 'radio',
    id: 'modeHours',
    name: 'estimationMode',
    value: 'hours',
    checked: true,
  });
  hoursRadio.addEventListener('change', handleModeChange);
  const hoursLabel = createTextElement('label', 'Hours (Min/Max)', []);
  hoursLabel.htmlFor = 'modeHours';

  const fibRadio = document.createElement('input');
  Object.assign(fibRadio, {
    type: 'radio',
    id: 'modeFibonacci',
    name: 'estimationMode',
    value: 'fibonacci',
  });
  fibRadio.addEventListener('change', handleModeChange);
  const fibLabel = createTextElement('label', 'Fibonacci Numbers', []);
  fibLabel.htmlFor = 'modeFibonacci';

  const tshirtRadio = document.createElement('input');
  Object.assign(tshirtRadio, {
    type: 'radio',
    id: 'modeTshirt',
    name: 'estimationMode',
    value: 'tshirt',
  });
  tshirtRadio.addEventListener('change', handleModeChange);
  const tshirtLabel = createTextElement('label', 'T-Shirt Sizes', []);
  tshirtLabel.htmlFor = 'modeTshirt';

  modeFieldset.appendChild(hoursRadio);
  modeFieldset.appendChild(hoursLabel);
  modeFieldset.appendChild(document.createElement('br'));
  modeFieldset.appendChild(fibRadio);
  modeFieldset.appendChild(fibLabel);
  modeFieldset.appendChild(document.createElement('br'));
  modeFieldset.appendChild(tshirtRadio);
  modeFieldset.appendChild(tshirtLabel);

  // Add cost tracking toggle
  modeFieldset.appendChild(document.createElement('br'));
  modeFieldset.appendChild(document.createElement('br'));
  const enableCostCheckbox = document.createElement('input');
  Object.assign(enableCostCheckbox, {
    type: 'checkbox',
    id: 'EnableCost',
    value: '1',
    checked: true,
  });
  enableCostCheckbox.addEventListener('change', handleCostToggle);
  const enableCostLabel = createTextElement('label', 'Track costs', []);
  enableCostLabel.htmlFor = 'EnableCost';
  modeFieldset.appendChild(enableCostCheckbox);
  modeFieldset.appendChild(enableCostLabel);

  modeSelectorDiv.appendChild(modeHeader);
  modeSelectorDiv.appendChild(modeFieldset);

  // Add Fibonacci configuration panel and t-shirt mapping
  const fibConfigPanel = createFibonacciConfigPanel();
  const tshirtMappingTable = createTshirtMappingTable();
  modeSelectorDiv.appendChild(fibConfigPanel);
  modeSelectorDiv.appendChild(tshirtMappingTable);

  return modeSelectorDiv;
}

/**
 * Creates the CSV file loader section.
 * @returns {HTMLElement} File loader section
 */
function createFileLoader() {
  const fileDiv = document.createElement('div');
  fileDiv.classList.add('section', 'wrapper-file-load');
  const csvHeader = createTextElement('H2', 'Upload Task CSV File', ['header', 'csv-file']);
  const fieldSet = document.createElement('fieldset');

  // File Input.
  const fileLabel = createTextElement('label', 'Choose CSV file:', []);
  fileLabel.htmlFor = 'csvFileInput';
  const fileInput = document.createElement('input');
  Object.assign(fileInput, {
    type: 'file',
    name: 'File Upload',
    id: 'csvFileInput',
    accept: '.csv',
  });
  fileInput.classList.add('input-file-csv');
  // File load button.
  const fileLoadTrigger = document.createElement('input');
  Object.assign(fileLoadTrigger, {
    type: 'button',
    id: 'fileLoadButton',
    value: 'Load Tasks',
  });
  fileLoadTrigger.addEventListener('click', importCsvFile);
  // Sample file link.
  const sampleLink = createTextElement('a', 'Sample CSV File', ['link-sample']);
  sampleLink.id = 'sampleCsvLink';
  sampleLink.href = sampleData;
  sampleLink.download = 'sample.csv';

  // Add fieldset elements.
  fieldSet.appendChild(createTextElement('legend', 'Select prepared file', []));
  fieldSet.appendChild(fileLabel);
  fieldSet.appendChild(fileInput);
  fieldSet.appendChild(fileLoadTrigger);
  fieldSet.appendChild(sampleLink);

  // Add segments to section
  fileDiv.appendChild(csvHeader);
  fileDiv.appendChild(fieldSet);

  return fileDiv;
}

/**
 * Creates the direct data entry section.
 * @returns {HTMLElement} Data entry section
 */
function createDataEntrySection() {
  const dataEntryDiv = document.createElement('div');
  dataEntryDiv.classList.add('section', 'wrapper-direct-load');
  const dataEntryHeader = createTextElement('H2', 'Add Tasks By Hand', ['header', 'data-input']);
  const dataEntryTable = createEntryTable();

  // Add segments to section.
  dataEntryDiv.appendChild(dataEntryHeader);
  dataEntryDiv.appendChild(dataEntryTable);

  return dataEntryDiv;
}

/**
 * Applies user-modified graph settings to GRAPH_CONFIG.
 */
function applyGraphSettings() {
  sim.GRAPH_CONFIG.histogram.width = parseInt(document.getElementById('histogramWidth').value, 10);
  sim.GRAPH_CONFIG.histogram.height = parseInt(document.getElementById('histogramHeight').value, 10);
  sim.GRAPH_CONFIG.histogram.barCutoff = parseInt(document.getElementById('histogramBarCutoff').value, 10);
  sim.GRAPH_CONFIG.histogram.maxBuckets = parseInt(document.getElementById('histogramMaxBuckets').value, 10);
  sim.GRAPH_CONFIG.miniGraph.width = parseInt(document.getElementById('miniGraphWidth').value, 10);
  sim.GRAPH_CONFIG.miniGraph.height = parseInt(document.getElementById('miniGraphHeight').value, 10);
  sim.GRAPH_CONFIG.miniGraph.maxBuckets = parseInt(document.getElementById('miniGraphMaxBuckets').value, 10);
  sim.GRAPH_CONFIG.miniGraph.gap = parseFloat(document.getElementById('miniGraphGap').value);

  // Show confirmation
  const details = document.getElementById('advancedSettings');
  const originalSummary = details.querySelector('summary').textContent;
  details.querySelector('summary').textContent = 'Advanced Graph Settings ✓ Applied';
  setTimeout(() => {
    details.querySelector('summary').textContent = originalSummary;
  }, 2000);
}

/**
 * Resets graph settings to default values.
 */
function resetGraphSettings() {
  // Reset to defaults
  sim.GRAPH_CONFIG.histogram.width = 800;
  sim.GRAPH_CONFIG.histogram.height = 500;
  sim.GRAPH_CONFIG.histogram.barCutoff = 600;
  sim.GRAPH_CONFIG.histogram.maxBuckets = 120;
  sim.GRAPH_CONFIG.miniGraph.width = 140;
  sim.GRAPH_CONFIG.miniGraph.height = 26;
  sim.GRAPH_CONFIG.miniGraph.maxBuckets = 24;
  sim.GRAPH_CONFIG.miniGraph.gap = 1;

  // Update form fields
  document.getElementById('histogramWidth').value = '800';
  document.getElementById('histogramHeight').value = '500';
  document.getElementById('histogramBarCutoff').value = '600';
  document.getElementById('histogramMaxBuckets').value = '120';
  document.getElementById('miniGraphWidth').value = '140';
  document.getElementById('miniGraphHeight').value = '26';
  document.getElementById('miniGraphMaxBuckets').value = '24';
  document.getElementById('miniGraphGap').value = '1';

  // Show confirmation
  const details = document.getElementById('advancedSettings');
  const originalSummary = details.querySelector('summary').textContent;
  details.querySelector('summary').textContent = 'Advanced Graph Settings ✓ Reset';
  setTimeout(() => {
    details.querySelector('summary').textContent = originalSummary;
  }, 2000);
}

/**
 * Creates the advanced graph settings panel for power users.
 * @returns HTMLElement Details element with graph configuration controls.
 */
function createAdvancedSettings() {
  const details = document.createElement('details');
  details.classList.add('advanced-settings');
  details.id = 'advancedSettings';

  const summary = document.createElement('summary');
  summary.textContent = 'Advanced Graph Settings';
  details.appendChild(summary);

  const settingsWrapper = createDivWithIdAndClasses('advancedSettingsContent', ['settings-grid']);

  // Main histogram settings
  const histogramHeader = createTextElement('h3', 'Main Histogram Settings', ['settings-header']);
  settingsWrapper.appendChild(histogramHeader);

  const histogramWidthAttr = {
    type: 'number',
    min: '400',
    max: '2000',
    step: '50',
    id: 'histogramWidth',
    value: String(sim.GRAPH_CONFIG.histogram.width),
    name: 'Histogram Width',
  };
  settingsWrapper.appendChild(createLabeledInput('Width (px):', histogramWidthAttr, true));

  const histogramHeightAttr = {
    type: 'number',
    min: '300',
    max: '1000',
    step: '50',
    id: 'histogramHeight',
    value: String(sim.GRAPH_CONFIG.histogram.height),
    name: 'Histogram Height',
  };
  settingsWrapper.appendChild(createLabeledInput('Height (px):', histogramHeightAttr, true));

  const histogramBarCutoffAttr = {
    type: 'number',
    min: '100',
    max: '2000',
    step: '50',
    id: 'histogramBarCutoff',
    value: String(sim.GRAPH_CONFIG.histogram.barCutoff),
    name: 'Bar Cutoff',
  };
  settingsWrapper.appendChild(createLabeledInput('Bar/Scatter Cutoff:', histogramBarCutoffAttr, true));

  const histogramMaxBucketsAttr = {
    type: 'number',
    min: '20',
    max: '500',
    step: '10',
    id: 'histogramMaxBuckets',
    value: String(sim.GRAPH_CONFIG.histogram.maxBuckets),
    name: 'Max Preview Buckets',
  };
  settingsWrapper.appendChild(createLabeledInput('Max Preview Buckets:', histogramMaxBucketsAttr, true));

  // Mini graph settings
  const miniGraphHeader = createTextElement('h3', 'Task Row Mini Graph Settings', ['settings-header']);
  settingsWrapper.appendChild(miniGraphHeader);

  const miniWidthAttr = {
    type: 'number',
    min: '50',
    max: '300',
    step: '10',
    id: 'miniGraphWidth',
    value: String(sim.GRAPH_CONFIG.miniGraph.width),
    name: 'Mini Graph Width',
  };
  settingsWrapper.appendChild(createLabeledInput('Width (px):', miniWidthAttr, true));

  const miniHeightAttr = {
    type: 'number',
    min: '10',
    max: '100',
    step: '2',
    id: 'miniGraphHeight',
    value: String(sim.GRAPH_CONFIG.miniGraph.height),
    name: 'Mini Graph Height',
  };
  settingsWrapper.appendChild(createLabeledInput('Height (px):', miniHeightAttr, true));

  const miniMaxBucketsAttr = {
    type: 'number',
    min: '5',
    max: '50',
    step: '1',
    id: 'miniGraphMaxBuckets',
    value: String(sim.GRAPH_CONFIG.miniGraph.maxBuckets),
    name: 'Mini Max Buckets',
  };
  settingsWrapper.appendChild(createLabeledInput('Max Buckets:', miniMaxBucketsAttr, true));

  const miniGapAttr = {
    type: 'number',
    min: '0',
    max: '5',
    step: '0.5',
    id: 'miniGraphGap',
    value: String(sim.GRAPH_CONFIG.miniGraph.gap),
    name: 'Mini Graph Gap',
  };
  settingsWrapper.appendChild(createLabeledInput('Bar Gap (px):', miniGapAttr, true));

  // Reset and Apply buttons
  const buttonWrapper = document.createElement('div');
  buttonWrapper.classList.add('settings-buttons');

  const applyButton = document.createElement('input');
  Object.assign(applyButton, {
    type: 'button',
    value: 'Apply Settings',
    id: 'applyGraphSettings',
  });
  applyButton.addEventListener('click', applyGraphSettings);

  const resetButton = document.createElement('input');
  Object.assign(resetButton, {
    type: 'button',
    value: 'Reset to Defaults',
    id: 'resetGraphSettings',
  });
  resetButton.addEventListener('click', resetGraphSettings);

  buttonWrapper.appendChild(applyButton);
  buttonWrapper.appendChild(resetButton);
  settingsWrapper.appendChild(buttonWrapper);

  details.appendChild(settingsWrapper);
  return details;
}

/**
 * Creates the simulation control panel and results display.
 * @returns {HTMLElement} Simulation panel section
 */
function createSimulationPanel() {
  const simWrapper = createDivWithIdAndClasses('simulationAreaWrapper', ['section', 'container']);
  const simHeader = createTextElement('H2', 'Simulator', ['header', 'simulation']);

  const simControls = createDivWithIdAndClasses('simulatorControlsWrapper', ['section', 'controls-simulation']);

  const simCountFldAttr = {
    type: 'number',
    min: '1000',
    max: '9999999',
    step: '1000',
    id: 'simulationPasses',
    value: '100000',
    name: 'Simulation Passes',
  };
  const simCountCtl = createLabeledInput('Number of times to run the simulation:', simCountFldAttr, true);

  const simLimitFldAttr = {
    type: 'checkbox',
    value: '1',
    id: 'LimitGraph',
  };
  const simLimitCtl = createLabeledInput('Limit graph outliers', simLimitFldAttr, false);

  const simRun = document.createElement('input');
  simRun.type = 'button';
  simRun.id = 'startSimulationButton';
  simRun.value = 'Run Simulation';
  simRun.addEventListener('click', startSimulation);

  simControls.appendChild(simCountCtl);
  simControls.appendChild(simLimitCtl);
  simControls.appendChild(simRun);

  // Simulation Time Results elements
  const simResultWrapper = createDivWithIdAndClasses('simulationResultsWrapper', ['section', 'wrap-simulation-results']);
  simResultWrapper.appendChild(createDivWithIdAndClasses('simulationRunningTime', ['simulation-result', 'text']));
  const simTimeResultWrapper = createDivWithIdAndClasses('simulationTimeResultsWrapper', ['section', 'wrap-simulation-time-results']);
  const timeHeader = createTextElement('H3', 'Time Estimates', ['result-display', 'time-info']);
  timeHeader.id = 'timeEstimateHeader';
  timeHeader.style.display = 'none';
  simTimeResultWrapper.appendChild(timeHeader);
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeMedian', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeStandRange', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeMax', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeMin', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeStandDev', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('timeHistoGram', ['simulation-result', 'time-info', 'graph']));

  // Add save buttons for time histogram
  const timeSaveButtonsDiv = document.createElement('div');
  timeSaveButtonsDiv.id = 'timeSaveButtons';
  timeSaveButtonsDiv.classList.add('save-buttons', 'no-print');
  timeSaveButtonsDiv.style.display = 'none';

  const saveTimePng = document.createElement('input');
  Object.assign(saveTimePng, {
    type: 'button',
    value: 'Save Time Graph as PNG',
    id: 'saveTimePngBtn',
  });
  saveTimePng.addEventListener('click', () => saveSvgAsImage('timeHistoGram', 'time-estimates', 'png'));

  const saveTimeJpeg = document.createElement('input');
  Object.assign(saveTimeJpeg, {
    type: 'button',
    value: 'Save Time Graph as JPEG',
    id: 'saveTimeJpegBtn',
  });
  saveTimeJpeg.addEventListener('click', () => saveSvgAsImage('timeHistoGram', 'time-estimates', 'jpeg'));

  timeSaveButtonsDiv.appendChild(saveTimePng);
  timeSaveButtonsDiv.appendChild(saveTimeJpeg);
  simTimeResultWrapper.appendChild(timeSaveButtonsDiv);

  simResultWrapper.appendChild(simTimeResultWrapper);

  // Simulation Cost Results elements
  const simCostResultWrapper = createDivWithIdAndClasses('simulationCostResultsWrapper', ['section', 'wrap-simulation-cost-results']);
  const costHeader = createTextElement('H3', 'Cost Estimates', ['result-display', 'cost-info']);
  costHeader.id = 'costEstimateHeader';
  costHeader.style.display = 'none';
  simCostResultWrapper.appendChild(costHeader);
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostMedian', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostStandRange', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostMax', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostMin', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostStandDev', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('costHistoGram', ['simulation-result', 'cost-info', 'graph']));

  // Add save buttons for cost histogram
  const costSaveButtonsDiv = document.createElement('div');
  costSaveButtonsDiv.id = 'costSaveButtons';
  costSaveButtonsDiv.classList.add('save-buttons', 'no-print');
  costSaveButtonsDiv.style.display = 'none';

  const saveCostPng = document.createElement('input');
  Object.assign(saveCostPng, {
    type: 'button',
    value: 'Save Cost Graph as PNG',
    id: 'saveCostPngBtn',
  });
  saveCostPng.addEventListener('click', () => saveSvgAsImage('costHistoGram', 'cost-estimates', 'png'));

  const saveCostJpeg = document.createElement('input');
  Object.assign(saveCostJpeg, {
    type: 'button',
    value: 'Save Cost Graph as JPEG',
    id: 'saveCostJpegBtn',
  });
  saveCostJpeg.addEventListener('click', () => saveSvgAsImage('costHistoGram', 'cost-estimates', 'jpeg'));

  costSaveButtonsDiv.appendChild(saveCostPng);
  costSaveButtonsDiv.appendChild(saveCostJpeg);
  simCostResultWrapper.appendChild(costSaveButtonsDiv);

  simResultWrapper.appendChild(simCostResultWrapper);

  // Add simulator elements to wrapper.
  simWrapper.appendChild(simHeader);
  simWrapper.appendChild(simControls);
  simWrapper.appendChild(createAdvancedSettings());
  simWrapper.appendChild(simResultWrapper);

  return simWrapper;
}

/**
 * Setup the Main application UI
 * @returns HTMLElement
 */
function setupUi() {
  // === Main page structures ===
  const mainElement = document.createElement('div');

  // Setup data entry section wrapper
  const dataWrapper = document.createElement('div');
  dataWrapper.classList.add('section');
  dataWrapper.id = 'dataAreaWrapper';

  // Build UI sections
  const header = createHeader();
  const modeSelector = createModeSelector();
  const fileLoader = createFileLoader();
  const dataEntry = createDataEntrySection();
  const simulationPanel = createSimulationPanel();

  // Assemble data area
  dataWrapper.appendChild(modeSelector);
  dataWrapper.appendChild(fileLoader);
  dataWrapper.appendChild(dataEntry);

  // Add all elements to the main application wrapper.
  mainElement.appendChild(header);
  mainElement.appendChild(dataWrapper);
  mainElement.appendChild(simulationPanel);

  return mainElement;
}

// Initialize app if DOM element exists
const projectSimulator = document.getElementById('project-simulator');
if (projectSimulator) {
  projectSimulator.appendChild(setupUi());
}

// Export functions for testing
export {
  createTextElement,
  createLabeledInput,
  createDivWithIdAndClasses,
  generateDataField,
  updateElementText,
  renderTaskRowHistograms,
  handleFibonacciModeChange,
  handleVelocityConfigChange,
  updateFibonacciCalendarMapping,
  updateTshirtMapping,
  fibonacciCalendarMappings,
  tshirtMappings,
  normalizeTshirtSize,
  saveSvgAsImage,
  isRowEmpty,
  appState,
  validateCsvData,
  applyGraphSettings,
  resetGraphSettings,
};

// Export getter functions for mutable state
export const getEstimationMode = () => appState.estimationMode;
export const getEnableCost = () => appState.enableCost;
