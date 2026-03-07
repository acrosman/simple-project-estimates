/**
 * Main application layout builder.
 * Creates the page header, logo, simulation control panel, and root UI structure,
 * then wires them together into the top-level DOM tree returned to index.js.
 * @module ui/layout
 */
import Icon from '../logo.png';
import {
  createModeSelector,
  createFileLoader,
  createDataEntrySection,
} from './data-input-ui';
import { createAdvancedSettings } from './graph-settings';
import saveSvgAsImage from '../utils/export-utils';
import {
  createDivWithIdAndClasses,
  createTextElement,
  createLabeledInput,
} from '../utils/dom-helpers';

/**
 * Creates the project logo image element.
 * @returns {HTMLImageElement} Logo image
 */
function createLogoElement() {
  const simIcon = document.createElement('img');
  Object.assign(simIcon, {
    src: Icon,
    alt: 'Project Estimate Simulator icon',
    width: 100,
    height: 100,
  });
  simIcon.classList.add('project-icon');
  return simIcon;
}

/**
 * Creates the message section for displaying simulation messages.
 * @returns {HTMLElement} Message section
 */
function createMessageSection() {
  return createDivWithIdAndClasses('messages', ['messages-section', 'hidden']);
}

/**
 * Creates the page header with GitHub ribbon.
 * @returns {HTMLElement} Header section
 */
function createHeader() {
  const headerDiv = createDivWithIdAndClasses('pageHeader', ['page-header', 'section']);

  // Fork Me ribbon
  const githubRibbon = createDivWithIdAndClasses('forkOnGithub', ['github-ribbon']);
  const githubLink = createTextElement('a', 'Fork me on GitHub');
  Object.assign(githubLink, { href: 'https://github.com/acrosman/simple-project-estimates' });
  githubRibbon.appendChild(githubLink);
  headerDiv.appendChild(githubRibbon);

  return headerDiv;
}

/**
 * Creates the simulation control panel and results display.
 * @returns {HTMLElement} Simulation panel section
 */
function createSimulationPanel() {
  const simWrapper = createDivWithIdAndClasses('simulationAreaWrapper', ['section', 'container']);
  const simHeader = createTextElement('h2', 'Simulator', ['header', 'simulation']);

  const simControls = createDivWithIdAndClasses('simulatorControlsWrapper', ['section', 'controls-simulation']);

  // Attributes for the simulation pass count input: numeric field controlling how many
  // times the simulation runs, bounded between 1,000 and 9,999,999 in steps of 1,000.
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

  // Attributes for the graph outlier limiter checkbox: toggles whether the histogram
  // clips extreme outliers to keep the graph scale readable.
  const simLimitFldAttr = {
    type: 'checkbox',
    value: '1',
    id: 'LimitGraph',
  };
  const simLimitCtl = createLabeledInput('Limit graph outliers', simLimitFldAttr, false);

  // Create the start simulation button.
  const simRun = document.createElement('input');
  Object.assign(simRun, {
    type: 'button',
    id: 'startSimulationButton',
    value: 'Run Simulation',
  });

  // Add new elements to controls wrapper.
  simControls.appendChild(simCountCtl);
  simControls.appendChild(simLimitCtl);
  simControls.appendChild(simRun);

  // Simulation Time Results elements
  const simResultWrapper = createDivWithIdAndClasses('simulationResultsWrapper', ['section', 'wrap-simulation-results']);
  simResultWrapper.appendChild(createDivWithIdAndClasses('simulationRunningTime', ['simulation-result', 'text']));
  const simTimeResultWrapper = createDivWithIdAndClasses('simulationTimeResultsWrapper', ['section', 'wrap-simulation-time-results']);
  const timeHeader = createTextElement('h3', 'Time Estimates', ['result-display', 'time-info', 'hidden']);
  Object.assign(timeHeader, { id: 'timeEstimateHeader' });
  simTimeResultWrapper.appendChild(timeHeader);
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeMedian', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeStandRange', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeMax', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeMin', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeStandDev', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('timeHistoGram', ['simulation-result', 'time-info', 'graph']));

  // Add save buttons for time histogram
  const timeSaveButtonsDiv = createDivWithIdAndClasses('timeSaveButtons', ['save-buttons', 'no-print', 'hidden']);

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
  const costHeader = createTextElement('h3', 'Cost Estimates', ['result-display', 'cost-info', 'hidden']);
  Object.assign(costHeader, { id: 'costEstimateHeader' });
  simCostResultWrapper.appendChild(costHeader);
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostMedian', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostStandRange', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostMax', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostMin', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostStandDev', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('costHistoGram', ['simulation-result', 'cost-info', 'graph']));

  // Add save buttons for cost histogram
  const costSaveButtonsDiv = createDivWithIdAndClasses('costSaveButtons', ['save-buttons', 'no-print', 'hidden']);

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
 * Creates the side-by-side wrapper with the mode selector on the left and logo on the right.
 * @returns {HTMLElement} Mode selector with logo wrapper
 */
function createModeSelectorWithLogo() {
  const wrapper = document.createElement('div');
  wrapper.classList.add('mode-selector-logo-wrapper');
  wrapper.appendChild(createModeSelector());
  wrapper.appendChild(createLogoElement());
  return wrapper;
}

/**
 * Setup the Main application UI
 * @returns HTMLElement
 */
function setupUi() {
  // Setup data entry section wrapper
  const mainElement = document.createElement('div');
  const dataWrapper = createDivWithIdAndClasses('dataAreaWrapper', ['section']);

  // Build UI sections
  const header = createHeader();
  const fileLoader = createFileLoader();
  const dataEntry = createDataEntrySection();
  const simulationPanel = createSimulationPanel();
  const messagesSection = createMessageSection();

  // Assemble data area
  dataWrapper.appendChild(createModeSelectorWithLogo());
  dataWrapper.appendChild(messagesSection);
  dataWrapper.appendChild(fileLoader);
  dataWrapper.appendChild(dataEntry);

  // Add all elements to the main application wrapper.
  mainElement.appendChild(header);
  mainElement.appendChild(dataWrapper);
  mainElement.appendChild(simulationPanel);

  return mainElement;
}

export {
  createLogoElement,
  createMessageSection,
  createHeader,
  createSimulationPanel,
  createModeSelectorWithLogo,
  setupUi,
};
