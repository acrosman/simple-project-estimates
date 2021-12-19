import './style.css';
import Icon from './EstimateIcon.png';
import sampleData from './data/sample.csv';
import * as sim from './simulation.js';

// ============= Interface Behaviors ================

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
          taskDetail.Min = i.value;
          break;
        case 'Max Time':
          taskDetail.Max = i.value;
          break;
        case 'Confidence':
          taskDetail.Confidence = i.value;
          break;
        case 'Cost':
          taskDetail.Cost = i.value;
          break;
        default:
          break;
      }
    }
    data.push(taskDetail);
  }

  const settings = {
    passes: passCount,
    limitGraph: graphSetting,
    data,
  };
  sim.runSimulation(settings, finishSimulation);
}

/**
 * Callback for after simulation has run.
 * @param {*} results
 */
function finishSimulation(results) {

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
  const wrapper = document.createElement('div');
  wrapper.classList.add('wrapper-entry-table', 'section');
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
  form.appendChild(generateDataRow(1, '', '', '', '', ''));

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
  const fileInput = document.createElement('input');
  Object.assign(fileInput, {
    type: 'file',
    name: 'File Upload',
    id: 'csvFileInput',
    accept: '.csv',
  });
  fileInput.classList.add('input-file-csv');
  const sampleLink = createTextElement('a', 'Sample CSV File', ['link-sample']);
  sampleLink.href = sampleData;

  // Add fieldset elements.
  fieldSet.appendChild(createTextElement('legend', 'Select prepared file', []));
  fieldSet.appendChild(fileInput);
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
  const simWrapper = document.createElement('div');
  simWrapper.classList.add('section', 'container');
  simWrapper.id = 'simulationAreaWrapper';
  const simHeader = createTextElement('H2', 'Simulator', ['header', 'simulation'])

  const simControls = document.createElement('div');
  simControls.classList.add('section', 'controls-simulation');

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

  // Simulation Results elements
  const simResultWrapper = createDivWithIdAndClasses('simulationResultsWrapper', ['section', 'wrap-simulation-results']);
  simResultWrapper.appendChild(createDivWithIdAndClasses("simulationRunningTime", ['simulation-result', 'text']));
  simResultWrapper.appendChild(createDivWithIdAndClasses("simulationMedian", ['simulation-result', 'text']));
  simResultWrapper.appendChild(createDivWithIdAndClasses("simulationAverage", ['simulation-result', 'text']));
  simResultWrapper.appendChild(createDivWithIdAndClasses("simulationStandRange", ['simulation-result', 'text']));
  simResultWrapper.appendChild(createDivWithIdAndClasses("simulationMax", ['simulation-result', 'text']));
  simResultWrapper.appendChild(createDivWithIdAndClasses("simulationMin", ['simulation-result', 'text']));
  simResultWrapper.appendChild(createDivWithIdAndClasses("simulationStandDev", ['simulation-result', 'text']));
  simResultWrapper.appendChild(createDivWithIdAndClasses("histoGram", ['simulation-result', 'graph']));

  // Add simulator elements to wrapper.
  simWrapper.appendChild(simHeader);
  simWrapper.appendChild(simControls);
  simWrapper.appendChild(simResultWrapper);

  // Add all elements to the main application wrapper.
  mainElement.appendChild(headerDiv);
  mainElement.appendChild(dataWrapper);
  mainElement.appendChild(simWrapper);

  return mainElement;
}

document.body.appendChild(setupUi());
