import './style.css';
import Icon from './EstimateIcon.png';
import sampleData from './data/sample.csv';
import * as sim from './simulation.js';
import { Spinner } from 'spin.js';
import { csv } from 'd3-fetch';

// ============= Interface Behaviors ================
/**
 * Client event handler for the import button
 * @param {Event} event Fired event.
 */
function importCsvFile(event) {
  const fileInpput = document.getElementById('csvFileInput');
  const file = fileInpput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = function (evt) {
      const dataUrl = evt.target.result;
      // The following call results in an "Access denied" error in IE.
      csv(dataUrl).then((data) => {
        createEntryTable(data);
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
 * Click Event Handler for the clear row button.
 * @param {Event} event Fired event.
 */
function rowClearClickHandler(event) {
  event.preventDefault();
  const thisRowId = event.target.dataset.rowId;

  const cells = document.querySelectorAll(`input[data-row-id="${thisRowId}"]:not([type=button]`);
  for (let control of cells) {
    control.value = '';
  }
}

/**
 * Click event handler for add task button.
 * @param {Event} event fired event
 */
function addTaskClickHandler(event) {
  const table = document.querySelector('#DataEntryTable');
  const currentRowId = parseInt(table.dataset.currentMaxRow) + 1;

  const newRow = generateDataRow(currentRowId, '', '', '', '', '');
  table.appendChild(newRow);
  table.dataset.currentMaxRow = currentRowId;
}

/**
 * Triggers the start of the simulation run with the current values.
 * @param {Event} event
 */
function startSimulation(event) {
  const passCount = document.getElementById('simulationPasses').value;
  const graphSetting = document.getElementById('LimitGraph').checked;
  const data = [];

  // Start the Spinner
  const spinnerSettings = {
    lines: 17, // The number of lines to draw
    length: 10, // The length of each line
    width: 48, // The line thickness
    radius: 28, // The radius of the inner circle
    scale: 1.05, // Scales overall size of the spinner
    corners: 0.6, // Corner roundness (0..1)
    speed: 0.6, // Rounds per second
    rotate: 0, // The rotation offset
    animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
    direction: -1, // 1: clockwise, -1: counterclockwise
    color: '#63e4ff', // CSS color or array of colors
    fadeColor: 'transparent', // CSS color or array of colors
    top: '50%', // Top position relative to parent
    left: '50%', // Left position relative to parent
    shadow: '0 0 1px transparent', // Box-shadow for the lines
    zIndex: 2000000000, // The z-index (defaults to 2e9)
    className: 'spinner', // The CSS class to assign to the spinner
    position: 'absolute', // Element positioning
  };

  const target = document.getElementById('simulationSpinner');
  const spinner = new Spinner(spinnerSettings).spin(target);

  // Gather the task information.
  const tasks = document.querySelectorAll('#DataEntryTable .tr.data-row');
  let inputs;
  let taskDetail;
  for (let t of tasks) {
    taskDetail = {};
    inputs = t.getElementsByTagName('input');
    for (let i of inputs) {
      switch (i.name) {
        case 'Task':
          taskDetail.Name = i.value;
          break;
        case 'Min Time':
          taskDetail.Min = parseInt(i.value);
          break;
        case 'Max Time':
          taskDetail.Max = parseInt(i.value);
          break;
        case 'Confidence':
          taskDetail.Confidence = parseFloat(i.value) / 100;
          break;
        case 'Cost':
          taskDetail.Cost = parseInt(i.value);
          break;
        default:
          break;
      }
    }
    if (taskDetail.Name) {
      data.push(taskDetail);
    }
  }

  // Run Main simulator.
  const results = sim.runSimulation(passCount, data);

  // Display summary data.
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  updateElementText('simulationRunningTime', `Simulation Running Time (ms): ${results.runningTime}`);
  updateElementText('simulationTimeMedian', `Median Time: ${results.times.median}`);
  updateElementText('simulationTimeStandRange', `Likely Range: ${results.times.likelyMin} - ${results.times.likelyMax}`);
  updateElementText('simulationTimeMax', `Max Time: ${results.times.max}`);
  updateElementText('simulationTimeMin', `Min Time: ${results.times.min}`);
  updateElementText('simulationTimeStandDev', `Standard Deviation: ${results.times.sd}`);
  updateElementText('simulationCostMedian', `Median cost: ${currencyFormatter.format(results.costs.median)}`);
  updateElementText('simulationCostStandRange', `Likely Range: ${currencyFormatter.format(results.costs.likelyMin)} - ${currencyFormatter.format(results.costs.likelyMax)}`);
  updateElementText('simulationCostMax', `Max cost: ${currencyFormatter.format(results.costs.max)}`);
  updateElementText('simulationCostMin', `Min cost: ${currencyFormatter.format(results.costs.min)}`);
  updateElementText('simulationCostStandDev', `Standard Deviation: ${results.costs.sd}`);

  // Build and display histograms.
  const timeGraph = sim.buildHistogram(
    document.getElementById('timeHistoGram'),
    results.times.list,
    results.times.min,
    results.times.max,
    results.times.median,
    results.times.sd,
    "Hours",
    graphSetting
  );
  const costGraph = sim.buildHistogram(
    document.getElementById('costHistoGram'),
    results.costs.list,
    results.costs.min,
    results.costs.max,
    results.costs.median,
    results.costs.sd,
    "Cost",
    graphSetting
  );

  spinner.stop();
}

// ============= Interface Elements =================
/**
 * Create a text element with it's internal text node.
 * @param {string} wrapperTag Tag name
 * @param {string} text Tag content
 * @param {array} classList List of classes.
 * @returns HTMLElement
 */
function createTextElement(wrapperTag, text, classList = []) {
  const el = document.createElement(wrapperTag);
  el.appendChild(document.createTextNode(text));
  el.classList.add(...classList);
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
  const fldLabl = createTextElement('label', labelText);
  fldLabl.htmlFor = inputAttributes.name;
  const field = document.createElement('input');
  Object.assign(field, inputAttributes);

  if (labelFirst) {
    wrapper.appendChild(fldLabl);
    wrapper.appendChild(field);
  } else {
    wrapper.appendChild(field);
    wrapper.appendChild(fldLabl);
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
  el.classList.add(...[]);

  return el
}

/**
 * Creates an input field for a specific input control
 * @param {string} label
 * @param {string} fieldValue
 * @param {string} fieldType
 * @returns HTMLElement
 */
function generateDataField(label, fieldValue, fieldType, rowId) {
  const cell = document.createElement('div');
  cell.classList.add('td');
  const element = document.createElement('input');
  const values = {
    type: fieldType,
    value: fieldValue,
    'aria-label': label,
    name: label,
  };
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
 * @returns HTMLElement
 */
function generateDataRow(rowId, taskName, minTime, maxTime, confidence, hourlyCost) {
  const row = document.createElement('div');
  row.classList.add('tr', 'data-row');
  row.dataset.rowId = rowId;

  const task = generateDataField('Task', taskName, 'text', rowId);
  const min = generateDataField('Min Time', minTime, 'number', rowId);
  const max = generateDataField('Max Time', maxTime, 'number', rowId);
  const conf = generateDataField('Confidence', confidence, 'number', rowId);
  const cost = generateDataField('Cost', hourlyCost, 'number', rowId);
  const rmButton = generateDataField('Clear', 'Clear', 'button', rowId);

  // Add click event handler for the clear button.
  rmButton.firstElementChild.addEventListener('click', rowClearClickHandler);

  row.appendChild(task);
  row.appendChild(min);
  row.appendChild(max);
  row.appendChild(conf);
  row.appendChild(cost);
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
  form.id = 'DataEntryTable';
  form.dataset.currentMaxRow = 1;
  const header = document.createElement('div');
  header.classList.add('tr', 'table-header-row');
  header.appendChild(createTextElement('div', 'Task', ['th']));
  header.appendChild(createTextElement('div', 'Min Time', ['th']));
  header.appendChild(createTextElement('div', 'Max Time', ['th']));
  header.appendChild(createTextElement('div', 'Confidence (%)', ['th']));
  header.appendChild(createTextElement('div', 'Hourly Cost', ['th']));
  header.appendChild(createTextElement('div', '', ['th']));

  form.appendChild(header);

  if (data.length < 1) {
    form.appendChild(generateDataRow(1, '', '', '', '', ''));
  } else {
    let count = 0;
    for (let row of data) {
      count += 1;
      form.appendChild(generateDataRow(count, row.Task, row.Min, row.Max, row.Confidence, row.Cost));
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
  addBtn.addEventListener('click', addTaskClickHandler);

  wrapper.appendChild(form);
  wrapper.appendChild(addBtn);

  return wrapper;
}

/**
 * Setup the Main application UI
 * @returns HTMLElement
 */
function setupUi() {
  const mainElement = document.createElement('div');

  // Setup page header:
  const headerDiv = document.createElement('div');
  headerDiv.classList.add('page-header', 'section');

  // Insert project Icon
  const simIcon = new Image();
  simIcon.src = Icon;
  simIcon.classList.add('project-icon');
  headerDiv.appendChild(simIcon);

  // Set header
  const mainHeader = createTextElement("H1", "Project Estimate Simulator", ['header', 'main']);
  headerDiv.appendChild(mainHeader);

  // Setup data entry section
  const dataWrapper = document.createElement('div');
  dataWrapper.classList.add('section');
  dataWrapper.id = 'dataAreaWrapper';

  // === Add CSV File Loader Section ===
  const fileDiv = document.createElement('div');
  fileDiv.classList.add('section', 'wrapper-file-load');
  const csvHeader = createTextElement('H2', 'Upload Task CSV File', ['header', 'csv-file']);
  let fieldSet = document.createElement('fieldset');

  // File Input.
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
  sampleLink.href = sampleData;

  // Add fieldset elements.
  fieldSet.appendChild(createTextElement('legend', 'Select prepared file', []));
  fieldSet.appendChild(fileInput);
  fieldSet.appendChild(fileLoadTrigger);
  fieldSet.appendChild(sampleLink);

  // Add segments to section
  fileDiv.appendChild(csvHeader);
  fileDiv.appendChild(fieldSet);
  dataWrapper.appendChild(fileDiv);

  // === Add Direct Input Controls ===
  const dataEntryDiv = document.createElement('div');
  dataEntryDiv.classList.add('section', 'wrapper-direct-load');
  const dataEntryHeader = createTextElement('H2', 'Add Tasks By Hand', ['header', 'data-input']);
  const dataEntryTable = createEntryTable();

  // Add segments to section.
  dataEntryDiv.appendChild(dataEntryHeader);
  dataEntryDiv.appendChild(dataEntryTable);
  dataWrapper.append(dataEntryDiv);

  // == Create Output Region ==
  const simWrapper = createDivWithIdAndClasses('simulationAreaWrapper', ['section', 'container']);
  const simHeader = createTextElement('H2', 'Simulator', ['header', 'simulation'])

  const simControls = createDivWithIdAndClasses('simulatorControlsWrapper', ['section', 'controls-simulation']);
  const spinnerContainer = createDivWithIdAndClasses('simulationSpinner', []);

  const simCountFldAttr = {
    type: 'number',
    min: '1000',
    max: '9999999',
    step: '1000',
    id: 'simulationPasses',
    value: '100000',
    name: 'Simulation Passes'
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
  simResultWrapper.appendChild(createDivWithIdAndClasses("simulationRunningTime", ['simulation-result', 'text']));
  const simTimeResultWrapper = createDivWithIdAndClasses('simulationTimeResultsWrapper', ['section', 'wrap-simulation-time-results']);
  simTimeResultWrapper.appendChild(createTextElement('H3', 'Time Estimates', ['result-display', 'time-info']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses("simulationTimeMedian", ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses("simulationTimeStandRange", ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses("simulationTimeMax", ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses("simulationTimeMin", ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses("simulationTimeStandDev", ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses("timeHistoGram", ['simulation-result', 'time-info', 'graph']));
  simResultWrapper.appendChild(simTimeResultWrapper);

  // Simulation Cost Results elements
  const simCostResultWrapper = createDivWithIdAndClasses('simulationCostResultsWrapper', ['section', 'wrap-simulation-cost-results']);
  simCostResultWrapper.appendChild(createTextElement('H3', 'Cost Estimates', ['result-display', 'cost-info']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses("simulationCostMedian", ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses("simulationCostStandRange", ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses("simulationCostMax", ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses("simulationCostMin", ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses("simulationCostStandDev", ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses("costHistoGram", ['simulation-result', 'cost-info', 'graph']));
  simResultWrapper.appendChild(simCostResultWrapper);

  // Add simulator elements to wrapper.
  simWrapper.appendChild(simHeader);
  simWrapper.appendChild(spinnerContainer);
  simWrapper.appendChild(simControls);
  simWrapper.appendChild(simResultWrapper);

  // Add all elements to the main application wrapper.
  mainElement.appendChild(headerDiv);
  mainElement.appendChild(dataWrapper);
  mainElement.appendChild(simWrapper);

  return mainElement;
}

document.body.appendChild(setupUi());
