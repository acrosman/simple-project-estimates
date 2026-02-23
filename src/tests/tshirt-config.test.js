/**
 * @jest-environment jsdom
 */

import {
  normalizeTshirtSize,
  handleMappingTabNavigation,
  updateTshirtMapping,
  createTshirtMappingTable,
} from '../ui/tshirt-config';
import { tshirtMappings } from '../core/state';

describe('normalizeTshirtSize', () => {
  test('converts lowercase to uppercase', () => {
    expect(normalizeTshirtSize('xl')).toBe('XL');
  });

  test('trims whitespace and uppercases', () => {
    expect(normalizeTshirtSize('  xxl  ')).toBe('XXL');
  });

  test('returns empty string for non-string input', () => {
    expect(normalizeTshirtSize(null)).toBe('');
    expect(normalizeTshirtSize(undefined)).toBe('');
    expect(normalizeTshirtSize(42)).toBe('');
  });

  test('handles already-uppercase input', () => {
    expect(normalizeTshirtSize('XL')).toBe('XL');
  });

  test('handles empty string', () => {
    expect(normalizeTshirtSize('')).toBe('');
  });
});

describe('T-Shirt Mappings', () => {
  test('has expected t-shirt sizes as keys', () => {
    const tshirtKeys = Object.keys(tshirtMappings);
    expect(tshirtKeys).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  });

  test('each t-shirt mapping has a Fibonacci number', () => {
    Object.values(tshirtMappings).forEach((fibValue) => {
      expect(typeof fibValue).toBe('number');
      expect(fibValue).toBeGreaterThan(0);
    });
  });

  test('t-shirt mappings follow expected Fibonacci values', () => {
    expect(tshirtMappings.XS).toBe(1);
    expect(tshirtMappings.S).toBe(2);
    expect(tshirtMappings.M).toBe(3);
    expect(tshirtMappings.L).toBe(5);
    expect(tshirtMappings.XL).toBe(8);
    expect(tshirtMappings.XXL).toBe(13);
  });

  test('normalizes lowercase t-shirt input for mapping lookup', () => {
    expect(normalizeTshirtSize('xl')).toBe('XL');
    expect(tshirtMappings[normalizeTshirtSize('xl')]).toBe(8);
  });

  test('trims and normalizes t-shirt input for mapping lookup', () => {
    expect(normalizeTshirtSize('  xxl  ')).toBe('XXL');
    expect(tshirtMappings[normalizeTshirtSize('  xxl  ')]).toBe(13);
  });
});

describe('updateTshirtMapping', () => {
  beforeEach(() => {
    tshirtMappings.XS = 1;
    tshirtMappings.S = 2;
    tshirtMappings.M = 3;
    tshirtMappings.L = 5;
    tshirtMappings.XL = 8;
    tshirtMappings.XXL = 13;
  });

  test('updates Fibonacci value when input changes', () => {
    const mockEvent = {
      target: { dataset: { tshirt: 'XL' }, value: '13' },
    };

    updateTshirtMapping(mockEvent);

    expect(tshirtMappings.XL).toBe(13);
  });

  test('updates different size value', () => {
    const mockEvent = {
      target: { dataset: { tshirt: 'M' }, value: '5' },
    };

    updateTshirtMapping(mockEvent);

    expect(tshirtMappings.M).toBe(5);
  });

  test('normalizes lowercase size key before updating', () => {
    const mockEvent = {
      target: { dataset: { tshirt: 'xxl' }, value: '21' },
    };

    updateTshirtMapping(mockEvent);

    expect(tshirtMappings.XXL).toBe(21);
  });

  test('does not crash for unknown size', () => {
    const mockEvent = {
      target: { dataset: { tshirt: 'XXXL' }, value: '20' },
    };

    expect(() => updateTshirtMapping(mockEvent)).not.toThrow();
  });

  test('does nothing when event is null', () => {
    expect(() => updateTshirtMapping(null)).not.toThrow();
  });

  test('does nothing when tshirt dataset key is missing', () => {
    const mockEvent = { target: { dataset: {}, value: '5' } };
    expect(() => updateTshirtMapping(mockEvent)).not.toThrow();
  });
});

describe('handleMappingTabNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input data-tshirt="XS" data-type="min" />
      <input data-tshirt="XS" data-type="max" />
      <input data-tshirt="S" data-type="min" />
      <input data-tshirt="S" data-type="max" />
    `;
  });

  test('does nothing for non-Tab keys', () => {
    const mockEvent = {
      key: 'Enter',
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: { dataset: { tshirt: 'XS', type: 'min' } },
      preventDefault: jest.fn(),
    };

    handleMappingTabNavigation(mockEvent, 'tshirt', ['XS', 'S']);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  test('does nothing when Alt is held', () => {
    const mockEvent = {
      key: 'Tab',
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: { dataset: { tshirt: 'XS', type: 'min' } },
      preventDefault: jest.fn(),
    };

    handleMappingTabNavigation(mockEvent, 'tshirt', ['XS', 'S']);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  test('focuses next input on Tab from min field', () => {
    const minInput = document.querySelector('[data-tshirt="XS"][data-type="min"]');
    const maxInput = document.querySelector('[data-tshirt="XS"][data-type="max"]');
    maxInput.focus = jest.fn();

    const mockEvent = {
      key: 'Tab',
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      target: minInput,
      preventDefault: jest.fn(),
    };

    handleMappingTabNavigation(mockEvent, 'tshirt', ['XS', 'S']);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(maxInput.focus).toHaveBeenCalled();
  });
});

describe('createTshirtMappingTable', () => {
  test('returns an HTMLElement', () => {
    const table = createTshirtMappingTable();
    expect(table).toBeInstanceOf(HTMLElement);
  });

  test('has id tshirtMappingWrapper', () => {
    const table = createTshirtMappingTable();
    expect(table.id).toBe('tshirtMappingWrapper');
  });

  test('is hidden by default', () => {
    const table = createTshirtMappingTable();
    expect(table.style.display).toBe('none');
  });

  test('contains inputs for each t-shirt size', () => {
    const table = createTshirtMappingTable();
    const inputs = table.querySelectorAll('input[data-tshirt]');
    expect(inputs).toHaveLength(Object.keys(tshirtMappings).length);
  });
});
