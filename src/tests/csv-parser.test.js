/**
 * @jest-environment jsdom
 */

import { validateCsvData } from '../utils/csv-parser';

describe('validateCsvData', () => {
  test('throws error when data is null', () => {
    expect(() => validateCsvData(null, 'hours', false)).toThrow('CSV file is empty or contains no data rows.');
  });

  test('throws error when data is empty array', () => {
    expect(() => validateCsvData([], 'hours', false)).toThrow('CSV file is empty or contains no data rows.');
  });

  test('throws error when required columns are missing - hours mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => validateCsvData(data, 'hours', false)).toThrow('Missing required columns: Min, Max');
  });

  test('throws error when required columns are missing - fibonacci mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => validateCsvData(data, 'fibonacci', false)).toThrow('Missing required columns: Fibonacci');
  });

  test('throws error when required columns are missing - tshirt mode', () => {
    const data = [{ Task: 'Test Task', Confidence: 90 }];
    expect(() => validateCsvData(data, 'tshirt', false)).toThrow('Missing required columns: TShirt');
  });

  test('throws error when Min value is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 'abc', Max: 10, Confidence: 90,
      },
    ];
    expect(() => validateCsvData(data, 'hours', false)).toThrow('Invalid Min value "abc" in row 1. Must be a number.');
  });

  test('throws error when Max value is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 'xyz', Confidence: 90,
      },
    ];
    expect(() => validateCsvData(data, 'hours', false)).toThrow('Invalid Max value "xyz" in row 1. Must be a number.');
  });

  test('throws error when Confidence is not a number', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: 'high',
      },
    ];
    expect(() => validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "high" in row 1. Must be a number between 0 and 100.');
  });

  test('throws error when Confidence is below 0', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: -10,
      },
    ];
    expect(() => validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "-10" in row 1. Must be a number between 0 and 100.');
  });

  test('throws error when Confidence is above 100', () => {
    const data = [
      {
        Task: 'Test', Min: 5, Max: 10, Confidence: 150,
      },
    ];
    expect(() => validateCsvData(data, 'hours', false)).toThrow('Invalid Confidence value "150" in row 1. Must be a number between 0 and 100.');
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
    expect(() => validateCsvData(data, 'hours', false)).not.toThrow();
    const result = validateCsvData(data, 'hours', false);
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
    expect(() => validateCsvData(data, 'fibonacci', false)).not.toThrow();
    const result = validateCsvData(data, 'fibonacci', false);
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
    expect(() => validateCsvData(data, 'tshirt', false)).not.toThrow();
    const result = validateCsvData(data, 'tshirt', false);
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
    expect(() => validateCsvData(data, 'hours', false)).not.toThrow();
  });

  test('includes Cost message when enableCost is true', () => {
    const data = [
      {
        Task: 'Test Task', Confidence: 90,
      },
    ];
    expect(() => validateCsvData(data, 'hours', true)).toThrow('Cost (optional)');
  });

  test('handles string numbers for Min and Max', () => {
    const data = [
      {
        Task: 'Test', Min: '5', Max: '10', Confidence: '90',
      },
    ];
    expect(() => validateCsvData(data, 'hours', false)).not.toThrow();
  });
});
