/**
 * @jest-environment jsdom
 */

import { csv } from 'd3-fetch';
import * as dataInput from '../ui/data-input-ui';
import { appState } from '../core/state';

jest.mock('d3-fetch', () => ({
  csv: jest.fn(),
}));

describe('handleCostToggle', () => {
  beforeEach(() => {
    appState.reset();
    appState.setEnableCost(true);
    document.body.innerHTML = `
      <div id="simulationCostResultsWrapper" style="display: block;"></div>
      <div id="dataTableWrapper"></div>
    `;
  });

  test('disables cost when checkbox is unchecked', () => {
    const mockEvent = { target: { checked: false } };
    dataInput.handleCostToggle(mockEvent);
    expect(appState.getEnableCost()).toBe(false);
  });

  test('enables cost when checkbox is checked', () => {
    appState.setEnableCost(false);
    const mockEvent = { target: { checked: true } };
    dataInput.handleCostToggle(mockEvent);
    expect(appState.getEnableCost()).toBe(true);
  });

  test('hides cost results wrapper when cost disabled', () => {
    const costResults = document.getElementById('simulationCostResultsWrapper');
    const mockEvent = { target: { checked: false } };
    dataInput.handleCostToggle(mockEvent);
    expect(costResults.style.display).toBe('none');
  });

  test('shows cost results wrapper when cost enabled', () => {
    const costResults = document.getElementById('simulationCostResultsWrapper');
    costResults.style.display = 'none';
    const mockEvent = { target: { checked: true } };
    dataInput.handleCostToggle(mockEvent);
    expect(costResults.style.display).toBe('block');
  });
});

describe('handleModeChange', () => {
  beforeEach(() => {
    appState.reset();
    document.body.innerHTML = `
      <div id="fibonacciConfigWrapper" style="display: none;"></div>
      <div id="tshirtMappingWrapper" style="display: none;"></div>
      <a class="link-sample" href="#"></a>
      <div id="dataTableWrapper"></div>
    `;
  });

  test('sets estimation mode on appState', () => {
    const mockEvent = { target: { value: 'fibonacci' } };
    dataInput.handleModeChange(mockEvent);
    expect(appState.estimationMode).toBe('fibonacci');
  });

  test('shows fibonacci config and hides tshirt mapping in fibonacci mode', () => {
    const fibConfig = document.getElementById('fibonacciConfigWrapper');
    const tshirtMapping = document.getElementById('tshirtMappingWrapper');

    dataInput.handleModeChange({ target: { value: 'fibonacci' } });

    expect(fibConfig.style.display).toBe('block');
    expect(tshirtMapping.style.display).toBe('none');
  });

  test('shows tshirt mapping and hides fibonacci config in tshirt mode', () => {
    const fibConfig = document.getElementById('fibonacciConfigWrapper');
    const tshirtMapping = document.getElementById('tshirtMappingWrapper');

    dataInput.handleModeChange({ target: { value: 'tshirt' } });

    expect(fibConfig.style.display).toBe('none');
    expect(tshirtMapping.style.display).toBe('block');
  });

  test('hides both config panels in hours mode', () => {
    const fibConfig = document.getElementById('fibonacciConfigWrapper');
    const tshirtMapping = document.getElementById('tshirtMappingWrapper');
    fibConfig.style.display = 'block';
    tshirtMapping.style.display = 'block';

    dataInput.handleModeChange({ target: { value: 'hours' } });

    expect(fibConfig.style.display).toBe('none');
    expect(tshirtMapping.style.display).toBe('none');
  });

  test('updates sample link text and download for fibonacci mode', () => {
    const sampleLink = document.querySelector('.link-sample');
    dataInput.handleModeChange({ target: { value: 'fibonacci' } });
    expect(sampleLink.textContent).toBe('Sample Fibonacci CSV File');
    expect(sampleLink.download).toBe('sample-fib.csv');
  });

  test('updates sample link text and download for tshirt mode', () => {
    const sampleLink = document.querySelector('.link-sample');
    dataInput.handleModeChange({ target: { value: 'tshirt' } });
    expect(sampleLink.textContent).toBe('Sample T-Shirt CSV File');
    expect(sampleLink.download).toBe('sample-tshirt.csv');
  });

  test('updates sample link text and download for hours mode', () => {
    const sampleLink = document.querySelector('.link-sample');
    dataInput.handleModeChange({ target: { value: 'fibonacci' } });
    dataInput.handleModeChange({ target: { value: 'hours' } });
    expect(sampleLink.textContent).toBe('Sample CSV File');
    expect(sampleLink.download).toBe('sample.csv');
  });

  test('handles missing sample link without throwing', () => {
    document.body.innerHTML = `
      <div id="fibonacciConfigWrapper" style="display: none;"></div>
      <div id="tshirtMappingWrapper" style="display: none;"></div>
      <div id="dataTableWrapper"></div>
    `;
    expect(() => {
      dataInput.handleModeChange({ target: { value: 'fibonacci' } });
    }).not.toThrow();
  });
});

describe('importCsvFile', () => {
  let mockReader;

  beforeEach(() => {
    appState.reset();
    csv.mockResolvedValue([]);
    mockReader = {
      readAsDataURL: jest.fn(function mockRead() {
        this.onloadend({ target: { result: 'data:text/csv;base64,test' } });
      }),
    };
    global.FileReader = jest.fn(() => mockReader);
    document.body.innerHTML = `
      <input type="file" id="csvFileInput" />
      <div id="dataAreaWrapper"></div>
      <div id="dataTableWrapper"></div>
    `;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('calls event.preventDefault', () => {
    const mockEvent = { preventDefault: jest.fn() };
    Object.defineProperty(document.getElementById('csvFileInput'), 'files', {
      value: [],
      configurable: true,
    });
    dataInput.importCsvFile(mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  test('does nothing when no file is selected', () => {
    const mockEvent = { preventDefault: jest.fn() };
    Object.defineProperty(document.getElementById('csvFileInput'), 'files', {
      value: [],
      configurable: true,
    });
    dataInput.importCsvFile(mockEvent);
    expect(global.FileReader).not.toHaveBeenCalled();
  });

  test('creates a FileReader when a file is selected', () => {
    const mockEvent = { preventDefault: jest.fn() };
    Object.defineProperty(document.getElementById('csvFileInput'), 'files', {
      value: [{ name: 'test.csv' }],
      configurable: true,
    });
    dataInput.importCsvFile(mockEvent);
    expect(global.FileReader).toHaveBeenCalled();
  });

  test('loads valid CSV data without showing an error', async () => {
    const validData = [{
      Task: 'Test', Min: 1, Max: 5, Confidence: 90,
    }];
    csv.mockResolvedValueOnce(validData);
    Object.defineProperty(document.getElementById('csvFileInput'), 'files', {
      value: [{ name: 'test.csv' }],
      configurable: true,
    });
    const mockEvent = { preventDefault: jest.fn() };
    dataInput.importCsvFile(mockEvent);
    await Promise.resolve();
    await Promise.resolve();
    expect(document.querySelector('.error-message')).toBeNull();
  });

  test('shows error message when CSV parsing rejects', async () => {
    csv.mockRejectedValueOnce(new Error('Parse error'));
    Object.defineProperty(document.getElementById('csvFileInput'), 'files', {
      value: [{ name: 'test.csv' }],
      configurable: true,
    });
    const mockEvent = { preventDefault: jest.fn() };
    dataInput.importCsvFile(mockEvent);
    await Promise.resolve();
    await Promise.resolve();
    const errorDiv = document.querySelector('.error-message');
    expect(errorDiv).not.toBeNull();
    expect(errorDiv.textContent).toBe('Parse error');
  });

  test('shows generic error when error message contains undefined', async () => {
    csv.mockRejectedValueOnce(new Error('undefined'));
    Object.defineProperty(document.getElementById('csvFileInput'), 'files', {
      value: [{ name: 'test.csv' }],
      configurable: true,
    });
    const mockEvent = { preventDefault: jest.fn() };
    dataInput.importCsvFile(mockEvent);
    await Promise.resolve();
    await Promise.resolve();
    const errorDiv = document.querySelector('.error-message');
    expect(errorDiv).not.toBeNull();
    expect(errorDiv.textContent).toContain('Failed to parse CSV file');
  });

  test('replaces an existing error message', async () => {
    const dataWrapper = document.getElementById('dataAreaWrapper');
    const existingError = document.createElement('div');
    existingError.classList.add('error-message');
    existingError.textContent = 'Old error';
    dataWrapper.appendChild(existingError);
    csv.mockRejectedValueOnce(new Error('New error'));
    Object.defineProperty(document.getElementById('csvFileInput'), 'files', {
      value: [{ name: 'test.csv' }],
      configurable: true,
    });
    const mockEvent = { preventDefault: jest.fn() };
    dataInput.importCsvFile(mockEvent);
    await Promise.resolve();
    await Promise.resolve();
    const errorDivs = document.querySelectorAll('.error-message');
    expect(errorDivs).toHaveLength(1);
    expect(errorDivs[0].textContent).toBe('New error');
  });

  test('shows validation error when CSV data is missing required columns', async () => {
    // Missing Min and Max columns for hours mode
    csv.mockResolvedValueOnce([{ Task: 'Test', Confidence: 90 }]);
    Object.defineProperty(document.getElementById('csvFileInput'), 'files', {
      value: [{ name: 'test.csv' }],
      configurable: true,
    });
    const mockEvent = { preventDefault: jest.fn() };
    dataInput.importCsvFile(mockEvent);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    const errorDiv = document.querySelector('.error-message');
    expect(errorDiv).not.toBeNull();
    expect(errorDiv.textContent).toContain('Missing required columns');
  });
});

describe('createModeSelector', () => {
  beforeEach(() => {
    appState.reset();
    document.body.innerHTML = '<div id="dataTableWrapper"></div>';
  });

  test('returns a div with section and wrapper-mode-selector classes', () => {
    const element = dataInput.createModeSelector();
    expect(element.tagName).toBe('DIV');
    expect(element.classList.contains('section')).toBe(true);
    expect(element.classList.contains('wrapper-mode-selector')).toBe(true);
  });

  test('contains an h2 header with correct text', () => {
    const element = dataInput.createModeSelector();
    const header = element.querySelector('h2');
    expect(header).not.toBeNull();
    expect(header.textContent).toBe('Estimation Mode');
  });

  test('contains three radio buttons for mode selection', () => {
    const element = dataInput.createModeSelector();
    const radios = element.querySelectorAll('input[type="radio"][name="estimationMode"]');
    expect(radios).toHaveLength(3);
  });

  test('hours radio button is checked by default', () => {
    const element = dataInput.createModeSelector();
    const hoursRadio = element.querySelector('#modeHours');
    expect(hoursRadio).not.toBeNull();
    expect(hoursRadio.checked).toBe(true);
  });

  test('fibonacci radio has value fibonacci', () => {
    const element = dataInput.createModeSelector();
    const fibRadio = element.querySelector('#modeFibonacci');
    expect(fibRadio).not.toBeNull();
    expect(fibRadio.value).toBe('fibonacci');
  });

  test('tshirt radio has value tshirt', () => {
    const element = dataInput.createModeSelector();
    const tshirtRadio = element.querySelector('#modeTshirt');
    expect(tshirtRadio).not.toBeNull();
    expect(tshirtRadio.value).toBe('tshirt');
  });

  test('contains EnableCost checkbox that is checked by default', () => {
    const element = dataInput.createModeSelector();
    const costCheckbox = element.querySelector('#EnableCost');
    expect(costCheckbox).not.toBeNull();
    expect(costCheckbox.type).toBe('checkbox');
    expect(costCheckbox.checked).toBe(true);
  });
});

describe('createFileLoader', () => {
  test('returns a div with section and wrapper-file-load classes', () => {
    const element = dataInput.createFileLoader();
    expect(element.tagName).toBe('DIV');
    expect(element.classList.contains('section')).toBe(true);
    expect(element.classList.contains('wrapper-file-load')).toBe(true);
  });

  test('contains an h2 header with correct text', () => {
    const element = dataInput.createFileLoader();
    const header = element.querySelector('h2');
    expect(header).not.toBeNull();
    expect(header.textContent).toBe('Upload Task CSV File');
  });

  test('contains a file input with correct id and accept attribute', () => {
    const element = dataInput.createFileLoader();
    const fileInput = element.querySelector('#csvFileInput');
    expect(fileInput).not.toBeNull();
    expect(fileInput.type).toBe('file');
    expect(fileInput.accept).toBe('.csv');
  });

  test('contains a load button with correct id', () => {
    const element = dataInput.createFileLoader();
    const button = element.querySelector('#fileLoadButton');
    expect(button).not.toBeNull();
    expect(button.type).toBe('button');
  });

  test('contains a sample link with link-sample class', () => {
    const element = dataInput.createFileLoader();
    const link = element.querySelector('.link-sample');
    expect(link).not.toBeNull();
    expect(link.textContent).toBe('Sample CSV File');
    expect(link.download).toBe('sample.csv');
  });
});

describe('createDataEntrySection', () => {
  beforeEach(() => {
    appState.reset();
    document.body.innerHTML = '<div id="dataTableWrapper"></div>';
  });

  test('returns a div with section and wrapper-direct-load classes', () => {
    const element = dataInput.createDataEntrySection();
    expect(element.tagName).toBe('DIV');
    expect(element.classList.contains('section')).toBe(true);
    expect(element.classList.contains('wrapper-direct-load')).toBe(true);
  });

  test('contains an h2 header with correct text', () => {
    const element = dataInput.createDataEntrySection();
    const header = element.querySelector('h2');
    expect(header).not.toBeNull();
    expect(header.textContent).toBe('Add Tasks By Hand');
  });

  test('contains at least two child elements (header and table)', () => {
    const element = dataInput.createDataEntrySection();
    expect(element.children.length).toBeGreaterThanOrEqual(2);
  });

  test('subscribes to modeChanged and costToggled events on appState', () => {
    const subscribeSpy = jest.spyOn(appState, 'subscribe');
    dataInput.createDataEntrySection();
    const events = subscribeSpy.mock.calls.map(([event]) => event);
    expect(events).toContain('modeChanged');
    expect(events).toContain('costToggled');
    subscribeSpy.mockRestore();
  });
});
