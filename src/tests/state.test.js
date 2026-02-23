/**
 * @jest-environment jsdom
 */

import { appState, tshirtMappings } from '../core/state';

describe('Fibonacci Configuration', () => {
  test('appState has Fibonacci mode configuration', () => {
    expect(appState).toHaveProperty('fibonacciMode');
    expect(appState.getFibonacciMode).toBeDefined();
    expect(appState.setFibonacciMode).toBeDefined();
  });

  test('appState has Fibonacci calendar mappings', () => {
    expect(appState).toHaveProperty('fibonacciCalendarMappings');
    expect(appState.getFibonacciCalendarMappings).toBeDefined();
  });

  test('default Fibonacci mode is calendar-days', () => {
    appState.reset();
    expect(appState.getFibonacciMode()).toBe('calendar-days');
  });

  test('can change Fibonacci mode to velocity-based', () => {
    appState.setFibonacciMode('velocity-based');
    expect(appState.getFibonacciMode()).toBe('velocity-based');
    appState.reset();
  });

  test('fibonacci calendar mappings have correct default values', () => {
    appState.reset();
    const mappings = appState.getFibonacciCalendarMappings();
    expect(mappings[1]).toEqual({ min: 1, max: 1 });
    expect(mappings[8]).toEqual({ min: 5, max: 8 });
    expect(mappings[21]).toEqual({ min: 13, max: 21 });
  });

  test('appState has velocity configuration', () => {
    expect(appState).toHaveProperty('velocityConfig');
    expect(appState.getVelocityConfig).toBeDefined();
    expect(appState.setVelocityConfig).toBeDefined();
  });

  test('default velocity configuration is 25 points per 10 days', () => {
    appState.reset();
    const config = appState.getVelocityConfig();
    expect(config.pointsPerSprint).toBe(25);
    expect(config.sprintLengthDays).toBe(10);
  });

  test('can update velocity configuration', () => {
    appState.setVelocityConfig(30, 14);
    const config = appState.getVelocityConfig();
    expect(config.pointsPerSprint).toBe(30);
    expect(config.sprintLengthDays).toBe(14);
    appState.reset();
  });

  test('velocity configuration validates and defaults on invalid input', () => {
    appState.setVelocityConfig('invalid', null);
    const config = appState.getVelocityConfig();
    expect(config.pointsPerSprint).toBe(25);
    expect(config.sprintLengthDays).toBe(10);
    appState.reset();
  });
});

describe('Estimation Mode', () => {
  test('defaults to hours mode', () => {
    appState.reset();
    expect(appState.getEstimationMode()).toBe('hours');
  });
});

describe('getTimeUnit()', () => {
  test('returns Hours in hours mode', () => {
    appState.reset();
    appState.setEstimationMode('hours');
    expect(appState.getTimeUnit()).toBe('Hours');
  });

  test('returns Days in fibonacci mode', () => {
    appState.reset();
    appState.setEstimationMode('fibonacci');
    expect(appState.getTimeUnit()).toBe('Days');
  });

  test('returns Days in tshirt mode', () => {
    appState.reset();
    appState.setEstimationMode('tshirt');
    expect(appState.getTimeUnit()).toBe('Days');
  });

  test('returns Hours for unrecognized/default mode', () => {
    appState.reset();
    appState.setEstimationMode('unknown');
    expect(appState.getTimeUnit()).toBe('Hours');
  });
});

describe('getHoursPerTimeUnit()', () => {
  test('returns 1 in hours mode', () => {
    appState.reset();
    appState.setEstimationMode('hours');
    expect(appState.getHoursPerTimeUnit()).toBe(1);
  });

  test('returns 8 in fibonacci mode', () => {
    appState.reset();
    appState.setEstimationMode('fibonacci');
    expect(appState.getHoursPerTimeUnit()).toBe(8);
  });

  test('returns 8 in tshirt mode', () => {
    appState.reset();
    appState.setEstimationMode('tshirt');
    expect(appState.getHoursPerTimeUnit()).toBe(8);
  });

  test('returns 1 for unrecognized/default mode', () => {
    appState.reset();
    appState.setEstimationMode('unknown');
    expect(appState.getHoursPerTimeUnit()).toBe(1);
  });
});

describe('Cost Tracking', () => {
  test('cost tracking is enabled by default', () => {
    appState.reset();
    expect(appState.getEnableCost()).toBe(true);
  });
});

describe('AppState reset()', () => {
  test('reset() mutates existing objects instead of creating new ones', () => {
    // Store reference to the original t-shirt mappings object
    const tshirtRef = tshirtMappings;

    // Modify the mapping
    tshirtMappings.XS = 888;

    // Verify modification
    expect(tshirtMappings.XS).toBe(888);

    // Call reset
    appState.reset();

    // Verify the values are reset
    expect(tshirtMappings.XS).toBe(1);

    // Verify the object still references the same memory address
    expect(tshirtRef).toBe(tshirtMappings);
  });

  test('reset() clears all existing keys before reassigning', () => {
    // Add an extra t-shirt size
    tshirtMappings.XXXL = 34;
    expect(tshirtMappings).toHaveProperty('XXXL');

    // Reset should remove the extra key
    appState.reset();

    // Verify the extra key is gone
    expect(tshirtMappings).not.toHaveProperty('XXXL');

    // Verify default keys are present
    expect(tshirtMappings).toHaveProperty('XS');
    expect(tshirtMappings).toHaveProperty('XXL');
  });

  test('reset() resets all state properties', () => {
    // Modify all state properties
    appState.setEstimationMode('fibonacci');
    appState.setEnableCost(false);
    appState.setFibonacciMode('velocity-based');
    appState.setVelocityConfig(40, 14);
    tshirtMappings.XS = 100;

    // Reset
    appState.reset();

    // Verify all properties are reset
    expect(appState.getEstimationMode()).toBe('hours');
    expect(appState.getEnableCost()).toBe(true);
    expect(appState.getFibonacciMode()).toBe('calendar-days');
    expect(appState.getVelocityConfig()).toEqual({ pointsPerSprint: 25, sprintLengthDays: 10 });
    expect(tshirtMappings.XS).toBe(1);
  });
});
