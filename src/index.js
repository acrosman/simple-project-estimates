import './style.css';
import Icon from './EstimateIcon.png';

function createTextElement(wrapperTag, text, classList) {
  const el = document.createElement(wrapperTag);
  el.appendChild(document.createTextNode(text));
  el.classList.add(...classList);
  return el
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

  // Add CSV File Loader Section
  const fileDiv = document.createElement('div');
  const csvHeader = createTextElement('H2', 'Upload Task CSV File', ['header', 'csv-file']);
  let fieldSet = document.createElement('fieldset');
  fieldSet.appendChild(createTextElement('legend', 'Select prepared file', []));
  const fileInput = document.createElement('input');
  fileInput.classList.add('input-file-csv');
  fileInput.type = 'file';
  fileInput.name = 'File Upload';
  fileInput.id = 'csvFileInput';
  fileInput.accept = '.csv';
  fieldSet.appendChild(fileInput);

  // Add segments to section
  fileDiv.appendChild(csvHeader);
  fileDiv.appendChild(fieldSet);
  dataWrapper.appendChild(fileDiv);

  // <legend>Upload your CSV File</legend>
  // <input type="file" name="File Upload" id="csvFileInput" accept=".csv" />
  // <a href="data/sample.csv">View sample data</a>

  // Add all elements to the main application wrapper.
  mainElement.appendChild(headerDiv);
  mainElement.appendChild(dataWrapper);

  return mainElement;
}

document.body.appendChild(setupUi());
