import { csv } from 'd3-fetch';
import sampleData from './data/sample.csv';
import sampleFibData from './data/sample-fib.csv';
import sampleTshirtData from './data/sample-tshirt.csv';
import { appState } from './core/state';
import { createTextElement } from './utils/dom-helpers';
import { createEntryTable } from './ui/task-table';
import { createFibonacciConfigPanel } from './ui/fibonacci-config';
import { createTshirtMappingTable } from './ui/tshirt-config';

/**
 * Handles cost tracking toggle
 * @param {Event} event
 */
function handleCostToggle(event) {
  appState.setEnableCost(event.target.checked);

  const costResults = document.getElementById('simulationCostResultsWrapper');

  if (costResults) {
    costResults.style.display = appState.getEnableCost() ? 'block' : 'none';
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
 * Creates the estimation mode selector with radio buttons and cost toggle.
 * @returns {HTMLElement} Mode selector section
 */
function createModeSelector() {
  const modeSelectorDiv = document.createElement('div');
  modeSelectorDiv.classList.add('section', 'wrapper-mode-selector');
  const modeHeader = createTextElement('h2', 'Estimation Mode', ['header', 'mode-selector']);

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
  const csvHeader = createTextElement('h2', 'Upload Task CSV File', ['header', 'csv-file']);
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
  const dataEntryHeader = createTextElement('h2', 'Add Tasks By Hand', ['header', 'data-input']);
  const dataEntryTable = createEntryTable();

  // Add segments to section.
  dataEntryDiv.appendChild(dataEntryHeader);
  dataEntryDiv.appendChild(dataEntryTable);

  return dataEntryDiv;
}

export {
  handleCostToggle,
  handleModeChange,
  validateCsvData,
  importCsvFile,
  createModeSelector,
  createFileLoader,
  createDataEntrySection,
};
