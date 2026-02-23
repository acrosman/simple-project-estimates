/**
 * @jest-environment jsdom
 */

import {
  handleFibonacciModeChange,
  handleVelocityConfigChange,
  updateFibonacciCalendarMapping,
  createFibonacciCalendarMappingTable,
  createFibonacciConfigPanel,
} from '../ui/fibonacci-config';
import { appState, fibonacciCalendarMappings } from '../core/state';

describe('handleFibonacciModeChange', () => {
  beforeEach(() => {
    appState.reset();
    document.body.innerHTML = `
      <div id="fibonacciCalendarMappingWrapper"></div>
      <div id="velocityConfigWrapper"></div>
    `;
  });

  test('updates appState when mode changes', () => {
    const mockEvent = { target: { value: 'velocity-based' } };

    handleFibonacciModeChange(mockEvent);
    expect(appState.getFibonacciMode()).toBe('velocity-based');
  });

  test('shows calendar mapping wrapper for calendar-days mode', () => {
    const calendarWrapper = document.getElementById('fibonacciCalendarMappingWrapper');
    const mockEvent = { target: { value: 'calendar-days' } };

    handleFibonacciModeChange(mockEvent);
    expect(calendarWrapper.style.display).toBe('block');
  });

  test('hides calendar mapping wrapper for velocity-based mode', () => {
    const calendarWrapper = document.getElementById('fibonacciCalendarMappingWrapper');
    const mockEvent = { target: { value: 'velocity-based' } };

    handleFibonacciModeChange(mockEvent);
    expect(calendarWrapper.style.display).toBe('none');
  });

  test('shows velocity config wrapper for velocity-based mode', () => {
    const wrapper = document.getElementById('velocityConfigWrapper');
    const mockEvent = { target: { value: 'velocity-based' } };

    handleFibonacciModeChange(mockEvent);
    expect(wrapper.style.display).toBe('block');
  });

  test('hides velocity config wrapper for calendar-days mode', () => {
    const wrapper = document.getElementById('velocityConfigWrapper');
    const mockEvent = { target: { value: 'calendar-days' } };

    handleFibonacciModeChange(mockEvent);
    expect(wrapper.style.display).toBe('none');
  });

  test('handles missing DOM elements gracefully', () => {
    document.body.innerHTML = '';
    const mockEvent = { target: { value: 'velocity-based' } };

    expect(() => handleFibonacciModeChange(mockEvent)).not.toThrow();
  });
});

describe('handleVelocityConfigChange', () => {
  beforeEach(() => {
    appState.reset();
    document.body.innerHTML = `
      <input id="velocityPoints" value="30" />
      <input id="velocityDays" value="14" />
    `;
  });

  test('updates velocity configuration from input fields', () => {
    handleVelocityConfigChange();
    const config = appState.getVelocityConfig();
    expect(config.pointsPerSprint).toBe(30);
    expect(config.sprintLengthDays).toBe(14);
  });

  test('handles missing input fields gracefully', () => {
    document.body.innerHTML = '';
    expect(() => handleVelocityConfigChange()).not.toThrow();
  });

  test('uses default values for invalid inputs', () => {
    document.body.innerHTML = `
      <input id="velocityPoints" value="invalid" />
      <input id="velocityDays" value="also-invalid" />
    `;

    handleVelocityConfigChange();
    const config = appState.getVelocityConfig();
    expect(config.pointsPerSprint).toBe(25);
    expect(config.sprintLengthDays).toBe(10);
  });
});

describe('updateFibonacciCalendarMapping', () => {
  beforeEach(() => {
    fibonacciCalendarMappings[1] = { min: 0.5, max: 1 };
    fibonacciCalendarMappings[2] = { min: 1, max: 2 };
    fibonacciCalendarMappings[3] = { min: 2, max: 3 };
    fibonacciCalendarMappings[5] = { min: 3, max: 5 };
    fibonacciCalendarMappings[8] = { min: 5, max: 8 };
    fibonacciCalendarMappings[13] = { min: 8, max: 13 };
    fibonacciCalendarMappings[21] = { min: 13, max: 21 };
  });

  test('updates min value when min input changes', () => {
    const mockEvent = {
      target: { dataset: { fib: '5', type: 'min' }, value: '2.5' },
    };

    updateFibonacciCalendarMapping(mockEvent);

    expect(fibonacciCalendarMappings[5].min).toBe(2.5);
    expect(fibonacciCalendarMappings[5].max).toBe(5);
  });

  test('updates max value when max input changes', () => {
    const mockEvent = {
      target: { dataset: { fib: '8', type: 'max' }, value: '10' },
    };

    updateFibonacciCalendarMapping(mockEvent);

    expect(fibonacciCalendarMappings[8].max).toBe(10);
    expect(fibonacciCalendarMappings[8].min).toBe(5);
  });

  test('handles decimal values correctly', () => {
    const mockEvent = {
      target: { dataset: { fib: '1', type: 'min' }, value: '0.25' },
    };

    updateFibonacciCalendarMapping(mockEvent);

    expect(fibonacciCalendarMappings[1].min).toBe(0.25);
    expect(typeof fibonacciCalendarMappings[1].min).toBe('number');
  });

  test('updates correct Fibonacci number mapping', () => {
    const mockEvent = {
      target: { dataset: { fib: '13', type: 'max' }, value: '15' },
    };

    updateFibonacciCalendarMapping(mockEvent);

    expect(fibonacciCalendarMappings[13].max).toBe(15);
    expect(fibonacciCalendarMappings[8].max).toBe(8);
    expect(fibonacciCalendarMappings[21].max).toBe(21);
  });

  test('does not crash for non-existent Fibonacci number', () => {
    const mockEvent = {
      target: { dataset: { fib: '99', type: 'min' }, value: '50' },
    };

    expect(() => updateFibonacciCalendarMapping(mockEvent)).not.toThrow();
  });

  test('updates multiple values sequentially', () => {
    const event1 = { target: { dataset: { fib: '5', type: 'min' }, value: '2' } };
    const event2 = { target: { dataset: { fib: '5', type: 'max' }, value: '6' } };

    updateFibonacciCalendarMapping(event1);
    updateFibonacciCalendarMapping(event2);

    expect(fibonacciCalendarMappings[5].min).toBe(2);
    expect(fibonacciCalendarMappings[5].max).toBe(6);
  });

  test('does nothing when event is null', () => {
    expect(() => updateFibonacciCalendarMapping(null)).not.toThrow();
  });

  test('does nothing when fib or type dataset keys are missing', () => {
    const mockEvent = {
      target: { dataset: {}, value: '5' },
    };
    expect(() => updateFibonacciCalendarMapping(mockEvent)).not.toThrow();
  });
});

describe('createFibonacciCalendarMappingTable', () => {
  beforeEach(() => {
    appState.reset();
  });

  test('returns an HTMLElement', () => {
    const table = createFibonacciCalendarMappingTable();
    expect(table).toBeInstanceOf(HTMLElement);
  });

  test('has id fibonacciCalendarMappingWrapper', () => {
    const table = createFibonacciCalendarMappingTable();
    expect(table.id).toBe('fibonacciCalendarMappingWrapper');
  });

  test('contains inputs for each fibonacci number', () => {
    const table = createFibonacciCalendarMappingTable();
    const inputs = table.querySelectorAll('input[data-fib]');
    expect(inputs.length).toBeGreaterThan(0);
  });
});

describe('createFibonacciConfigPanel', () => {
  beforeEach(() => {
    appState.reset();
  });

  test('returns an HTMLElement', () => {
    const panel = createFibonacciConfigPanel();
    expect(panel).toBeInstanceOf(HTMLElement);
  });

  test('has id fibonacciConfigWrapper', () => {
    const panel = createFibonacciConfigPanel();
    expect(panel.id).toBe('fibonacciConfigWrapper');
  });

  test('is hidden by default', () => {
    const panel = createFibonacciConfigPanel();
    expect(panel.style.display).toBe('none');
  });

  test('contains mode radio buttons', () => {
    const panel = createFibonacciConfigPanel();
    const calendarRadio = panel.querySelector('#fibModeCalendar');
    const velocityRadio = panel.querySelector('#fibModeVelocity');

    expect(calendarRadio).not.toBeNull();
    expect(velocityRadio).not.toBeNull();
  });
});
