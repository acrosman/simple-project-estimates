/**
 * @jest-environment jsdom
 */

import * as dataInput from '../data-input';
import { appState } from '../state';

describe('validateCsvData', () => {
  test('throws error when data is null', () => {
    expect(() => dataInput.validateCsvData(null, 'hours', false)).toThrow('CSV file is empty or contains no data rows.');
  });

  test('throws error when data is empty array', () => {
    expect(() => dataInput.validateCsvData([], 'hours', false)).toThrow('CSV file is empty or contains no data rows.');
  });

  test('throws error when required columns are missing - hours mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Missing required columns: Min, Max');
  });

  test('throws error when required columns are missing - fibonacci mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => dataInput.validateCsvData(data, 'fibonacci', false)).toThrow('Missing required columns: Fibonacci');
  });

  test('throws error when required columns are missing - tshirt mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => dataInput.validateCsvData(data, 'tshirt', false)).toThrow('Missing required columns: TShirt');
  });

  test('throws error when Min value is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 'abc', Max: 10, Confidence: 90,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Invalid Min value "abc" in row 1. Must be a number.');
  });

  test('throws error when Max value is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 'xyz', Confidence: 90,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Invalid Max value "xyz" in row 1. Must be a number.');
  });

  test('throws error when Confidence is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: 'high',
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "high" in row 1. Must be a number between 0 and 100.');
  });

  test('throws error when Confidence is below 0', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: -10,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "-10" in row 1. Must be a number between 0 and 100.');
  });

  test('throws error when Confidence is above 100', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: 150,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "150" in row 1. Must be a number between 0 and 100.');
  });

  test('accepts valid hours mode data', () => {
    const data = [
      {
        Task: 'Task 1', Min: 5, Max: 10, Confidence: 90,
      },
      {
        Task: 'Task 2', Min: 3, Max: 8, Confidence: 80,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).not.toThrow();
    const result = dataInput.validateCsvData(data, 'hours', false);
    expect(result).toEqual(data);
  });

  test('accepts valid fibonacci mode data', () => {
    const data = [
      {
        Task: 'Task 1', Fibonacci: 5, Confidence: 90,
      },
      {
        Task: 'Task 2', Fibonacci: 8, Confidence: 80,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'fibonacci', false)).not.toThrow();
    const result = dataInput.validateCsvData(data, 'fibonacci', false);
    expect(result).toEqual(data);
  });

  test('accepts valid tshirt mode data', () => {
    const data = [
      {
        Task: 'Task 1', TShirt: 'M', Confidence: 90,
      },
      {
        Task: 'Task 2', TShirt: 'L', Confidence: 80,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'tshirt', false)).not.toThrow();
    const result = dataInput.validateCsvData(data, 'tshirt', false);
    expect(result).toEqual(data);
  });

  test('validates only first 3 rows for large datasets', () => {
    const data = [
      {
        Task: 'Task 1', Min: 5, Max: 10, Confidence: 90,
      },
      {
        Task: 'Task 2', Min: 3, Max: 8, Confidence: 80,
      },
      {
        Task: 'Task 3', Min: 2, Max: 6, Confidence: 70,
      },
      {
        Task: 'Task 4', Min: 'invalid', Max: 15, Confidence: 85,
      }, // Invalid but in 4th row
    ];
    // Should not throw since only first 3 rows are validated
    expect(() => dataInput.validateCsvData(data, 'hours', false)).not.toThrow();
  });

  test('includes Cost message when enableCost is true', () => {
    const data = [
      {
        Task: 'Test Task', Confidence: 90,
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', true)).toThrow('Cost (optional)');
  });

  test('handles string numbers for Min and Max', () => {
    const data = [
      {
        Task: 'Test', Min: '5', Max: '10', Confidence: '90',
      },
    ];
    expect(() => dataInput.validateCsvData(data, 'hours', false)).not.toThrow();
  });
});

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
});
