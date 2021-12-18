import './style.css';
import Icon from './EstimateIcon.png';
import sampleData from './data/sample.csv';

function createTextElement(wrapperTag, text, classList) {
  const el = document.createElement(wrapperTag);
  el.appendChild(document.createTextNode(text));
  el.classList.add(...classList);
  return el
}

function generateDataField(label, fieldValue, fieldType) {
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

  cell.appendChild(element);
  return cell;
}

function generateDataRow(rowId, taskName, minTime, maxTime, confidence, hourlyCost) {
  const row = document.createElement('div');
  row.classList.add('tr', 'data-row');
  row.dataset.rowId = rowId;

  const task = generateDataField('Task', taskName, 'text');
  const min = generateDataField('Min Time', minTime, 'number');
  const max = generateDataField('Max Time', maxTime, 'number');
  const conf = generateDataField('Confidence', confidence, 'number');
  const cost = generateDataField('Cost', hourlyCost, 'number');
  const rmButton = generateDataField('Remove', 'Remove', 'button');

  row.appendChild(task);
  row.appendChild(min);
  row.appendChild(max);
  row.appendChild(conf);
  row.appendChild(cost);
  row.appendChild(rmButton);

  return row;
}

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

  wrapper.appendChild(form);
  wrapper.appendChild(addBtn);

  return wrapper;
}

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

  // Add all elements to the main application wrapper.
  mainElement.appendChild(headerDiv);
  mainElement.appendChild(dataWrapper);

  return mainElement;
}

document.body.appendChild(setupUi());
