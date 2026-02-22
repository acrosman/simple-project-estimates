import { appState, fibonacciCalendarMappings } from './state';
import { createTextElement, createDivWithIdAndClasses } from './dom-helpers';

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
 * Creates the Fibonacci configuration interface (mode selector + velocity config)
 * @returns HTMLElement
 */
function createFibonacciConfigPanel() {
  const wrapper = createDivWithIdAndClasses('fibonacciConfigWrapper', ['section', 'fibonacci-config']);
  const header = createTextElement('h3', 'Fibonacci Estimation Configuration', ['header', 'fib-config']);

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

export {
  handleFibonacciModeChange,
  handleVelocityConfigChange,
  updateFibonacciCalendarMapping,
  createFibonacciCalendarMappingTable,
  createFibonacciConfigPanel,
};
