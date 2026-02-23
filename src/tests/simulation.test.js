/**
 * @jest-environment jsdom
 */

import * as sim from '../simulation';

test('Validate simulation module exports', () => {
  // Simulation engine
  expect(sim).toHaveProperty('runSimulation');
  expect(sim).toHaveProperty('runSimulationProgressive');
  expect(sim).toHaveProperty('fibonacciToCalendarDays');
  expect(sim).toHaveProperty('fibonacciToVelocityDays');

  // Re-exports from charts
  expect(sim).toHaveProperty('buildHistogram');
  expect(sim).toHaveProperty('buildTaskRowHistogram');
  expect(sim).toHaveProperty('buildHistogramPreview');
  expect(sim).toHaveProperty('GRAPH_CONFIG');
  expect(sim).toHaveProperty('GRAPH_CONFIG_DEFAULTS');

  // Re-exports from stats
  expect(sim).toHaveProperty('getRandom');
  expect(sim).toHaveProperty('getValueCount');
  expect(sim).toHaveProperty('getMedian');
  expect(sim).toHaveProperty('getStandardDeviation');
  expect(sim).toHaveProperty('calculateKDE');
  expect(sim).toHaveProperty('taskUpperBound');
  expect(sim).toHaveProperty('taskLowerBound');
});

test('RunSimulation: Single Task', () => {
  const tasks = [
    {
      RowId: '1',
      Name: 'Test Task',
      Min: 36,
      Max: 73,
      Confidence: 0.9,
      Cost: 200,
    },
  ];
  const results = sim.runSimulation(10000, tasks);

  expect(results.times.median).toBeGreaterThan(0);
  expect(results.times.sd).not.toBeNaN();
  expect(results.costs.sd).not.toBeNaN();
  expect(results.times.likelyMin).not.toBeNaN();
  expect(results.times.likelyMax).not.toBeNaN();
  expect(results.costs.likelyMin).not.toBeNaN();
  expect(results.costs.likelyMax).not.toBeNaN();

  expect(Array.isArray(results.taskResults)).toBe(true);
  expect(results.taskResults).toHaveLength(1);
  expect(results.taskResults[0].rowId).toBe('1');
  expect(results.taskResults[0].name).toBe('Test Task');
  expect(results.taskResults[0].times.list).toBeDefined();
  expect(results.taskResults[0].times.min).toBeGreaterThanOrEqual(0);
  expect(results.taskResults[0].times.max).toBeGreaterThanOrEqual(results.taskResults[0].times.min);
  expect(results.taskResults[0].times.sd).not.toBeNaN();
});

test('RunSimulation: Fractional Max values do not throw RangeError', () => {
  const tasks = [
    {
      RowId: '1',
      Name: 'Fractional Task',
      Min: 1.5,
      Max: 3.7,
      Confidence: 0.8,
      Cost: 100.5,
    },
  ];
  expect(() => sim.runSimulation(100, tasks)).not.toThrow();
  const results = sim.runSimulation(100, tasks);
  expect(results.times.median).toBeGreaterThanOrEqual(0);
  expect(Number.isInteger(results.times.list.length)).toBe(true);
  expect(Number.isInteger(results.costs.list.length)).toBe(true);
  expect(Number.isInteger(results.taskResults[0].times.list.length)).toBe(true);
  expect(Number.isInteger(results.taskResults[0].costs.list.length)).toBe(true);
});

// Tests for runSimulationProgressive function
describe('runSimulationProgressive', () => {
  const sampleTasks = [
    {
      RowId: '1',
      Name: 'Task 1',
      Min: 10,
      Max: 20,
      Confidence: 0.9,
      Cost: 100,
    },
    {
      RowId: '2',
      Name: 'Task 2',
      Min: 5,
      Max: 15,
      Confidence: 0.8,
      Cost: 150,
    },
  ];

  test('Returns a Promise', () => {
    const result = sim.runSimulationProgressive(100, sampleTasks);
    expect(result).toBeInstanceOf(Promise);
  });

  test('Final results match runSimulation behavior', async () => {
    const passes = 1000;
    const progressiveResults = await sim.runSimulationProgressive(passes, sampleTasks);
    const standardResults = sim.runSimulation(passes, sampleTasks);

    expect(progressiveResults).toHaveProperty('times');
    expect(progressiveResults).toHaveProperty('costs');
    expect(progressiveResults).toHaveProperty('taskResults');
    expect(progressiveResults).toHaveProperty('estimateDetails');
    expect(progressiveResults).toHaveProperty('runningTime');

    expect(progressiveResults.times.list).toHaveLength(standardResults.times.list.length);
    expect(progressiveResults.costs.list).toHaveLength(standardResults.costs.list.length);
    expect(progressiveResults.taskResults).toHaveLength(standardResults.taskResults.length);

    expect(progressiveResults.times.median).toBeGreaterThan(0);
    expect(progressiveResults.times.sd).not.toBeNaN();
    expect(progressiveResults.costs.median).toBeGreaterThan(0);
    expect(progressiveResults.costs.sd).not.toBeNaN();
  });

  test('Progress callback is invoked correctly with default interval', async () => {
    const progressUpdates = [];
    const onProgress = jest.fn((update) => {
      progressUpdates.push(update);
    });

    await sim.runSimulationProgressive(3000, sampleTasks, onProgress);

    expect(onProgress).toHaveBeenCalled();

    progressUpdates.forEach((update) => {
      expect(update).toHaveProperty('processedPasses');
      expect(update).toHaveProperty('totalPasses');
      expect(update).toHaveProperty('times');
      expect(update).toHaveProperty('costs');
      expect(update.times).toHaveProperty('list');
      expect(update.times).toHaveProperty('min');
      expect(update.times).toHaveProperty('max');
    });

    const lastUpdate = progressUpdates[progressUpdates.length - 1];
    expect(lastUpdate.processedPasses).toBe(3000);
    expect(lastUpdate.totalPasses).toBe(3000);
  });

  test('Progress callback respects custom interval', async () => {
    const progressUpdates = [];
    const onProgress = jest.fn((update) => {
      progressUpdates.push(update);
    });
    const customInterval = 500;

    await sim.runSimulationProgressive(2000, sampleTasks, onProgress, customInterval);

    expect(onProgress).toHaveBeenCalled();

    // Expected: 500, 1000, 1500, 2000 = 4 calls
    expect(progressUpdates.length).toBeGreaterThanOrEqual(4);
    expect(progressUpdates.length).toBeLessThanOrEqual(5);

    progressUpdates.slice(0, -1).forEach((update) => {
      expect(update.processedPasses % customInterval).toBe(0);
    });
  });

  test('Works without progress callback', async () => {
    const result = await sim.runSimulationProgressive(500, sampleTasks, null);

    expect(result).toHaveProperty('times');
    expect(result.times.median).toBeGreaterThan(0);
    expect(result.times.sd).not.toBeNaN();
  });

  test('Handles invalid progress interval gracefully', async () => {
    const progressUpdates = [];
    const onProgress = jest.fn((update) => {
      progressUpdates.push(update);
    });

    await sim.runSimulationProgressive(500, sampleTasks, onProgress, 0);
    expect(onProgress).toHaveBeenCalled();

    await sim.runSimulationProgressive(500, sampleTasks, onProgress, -100);
    expect(onProgress).toHaveBeenCalled();
  });

  test('Produces histogram data during progress', async () => {
    const progressUpdates = [];
    const onProgress = jest.fn((update) => {
      progressUpdates.push(update);
    });

    await sim.runSimulationProgressive(1000, sampleTasks, onProgress, 500);

    progressUpdates.forEach((update) => {
      expect(Array.isArray(update.times.list)).toBe(true);
      expect(update.times.list.length).toBeGreaterThan(0);
      expect(update.times.min).toBeGreaterThanOrEqual(0);
      expect(update.times.max).toBeGreaterThan(0);
    });
  });

  test('Task results have correct structure', async () => {
    const result = await sim.runSimulationProgressive(1000, sampleTasks);

    expect(result.taskResults).toHaveLength(2);
    result.taskResults.forEach((task) => {
      expect(task).toHaveProperty('rowId');
      expect(task).toHaveProperty('name');
      expect(task.times).toHaveProperty('list');
      expect(task.times).toHaveProperty('median');
      expect(task.times).toHaveProperty('sd');
      expect(task.times).toHaveProperty('min');
      expect(task.times).toHaveProperty('max');
      expect(task.times).toHaveProperty('likelyMin');
      expect(task.times).toHaveProperty('likelyMax');
    });
  });
});

// ============= Fibonacci Mapping Tests ================

describe('fibonacciToCalendarDays', () => {
  const testMappings = {
    1: { min: 0.5, max: 1 },
    2: { min: 1, max: 2 },
    3: { min: 2, max: 3 },
    5: { min: 3, max: 5 },
    8: { min: 5, max: 8 },
    13: { min: 8, max: 13 },
    21: { min: 13, max: 21 },
    34: { min: 21, max: 34 },
  };

  test('maps 1 point correctly with provided mappings', () => {
    const result = sim.fibonacciToCalendarDays(1, testMappings);
    expect(result.min).toBe(0.5);
    expect(result.max).toBe(1);
  });

  test('maps 2 points correctly with provided mappings', () => {
    const result = sim.fibonacciToCalendarDays(2, testMappings);
    expect(result.min).toBe(1);
    expect(result.max).toBe(2);
  });

  test('maps 3 points correctly with provided mappings', () => {
    const result = sim.fibonacciToCalendarDays(3, testMappings);
    expect(result.min).toBe(2);
    expect(result.max).toBe(3);
  });

  test('maps 5 points correctly with provided mappings', () => {
    const result = sim.fibonacciToCalendarDays(5, testMappings);
    expect(result.min).toBe(3);
    expect(result.max).toBe(5);
  });

  test('maps 8 points correctly with provided mappings', () => {
    const result = sim.fibonacciToCalendarDays(8, testMappings);
    expect(result.min).toBe(5);
    expect(result.max).toBe(8);
  });

  test('maps 13 points correctly with provided mappings', () => {
    const result = sim.fibonacciToCalendarDays(13, testMappings);
    expect(result.min).toBe(8);
    expect(result.max).toBe(13);
  });

  test('maps 21 points correctly with provided mappings', () => {
    const result = sim.fibonacciToCalendarDays(21, testMappings);
    expect(result.min).toBe(13);
    expect(result.max).toBe(21);
  });

  test('maps 34 points correctly with provided mappings', () => {
    const result = sim.fibonacciToCalendarDays(34, testMappings);
    expect(result.min).toBe(21);
    expect(result.max).toBe(34);
  });

  test('handles non-standard Fibonacci values with fallback', () => {
    const result = sim.fibonacciToCalendarDays(10, testMappings);
    expect(result.min).toBe(8);
    expect(result.max).toBe(10);
  });

  test('handles string input by parsing', () => {
    const result = sim.fibonacciToCalendarDays('8', testMappings);
    expect(result.min).toBe(5);
    expect(result.max).toBe(8);
  });

  test('uses custom mappings when provided', () => {
    const customMappings = {
      8: { min: 10, max: 20 },
    };
    const result = sim.fibonacciToCalendarDays(8, customMappings);
    expect(result.min).toBe(10);
    expect(result.max).toBe(20);
  });

  test('returns fallback when mappings are null', () => {
    const result = sim.fibonacciToCalendarDays(10, null);
    expect(result.min).toBe(8);
    expect(result.max).toBe(10);
  });
});

describe('fibonacciToVelocityDays', () => {
  test('calculates correctly with typical velocity (25 points per 10 days)', () => {
    const result = sim.fibonacciToVelocityDays(8, 25, 10);
    expect(result.min).toBe(2);
    expect(result.max).toBe(4);
  });

  test('calculates correctly with low velocity (15 points per 10 days)', () => {
    const result = sim.fibonacciToVelocityDays(5, 15, 10);
    expect(result.min).toBe(2);
    expect(result.max).toBe(4);
  });

  test('calculates correctly with high velocity (40 points per 10 days)', () => {
    const result = sim.fibonacciToVelocityDays(13, 40, 10);
    expect(result.min).toBe(2);
    expect(result.max).toBe(4);
  });

  test('calculates correctly with different sprint length (14 days)', () => {
    const result = sim.fibonacciToVelocityDays(8, 35, 14);
    expect(result.min).toBe(2);
    expect(result.max).toBe(4);
  });

  test('handles small story points (1 point)', () => {
    const result = sim.fibonacciToVelocityDays(1, 25, 10);
    expect(result.min).toBe(0);
    expect(result.max).toBe(1);
  });

  test('handles large story points (34 points)', () => {
    const result = sim.fibonacciToVelocityDays(34, 25, 10);
    expect(result.min).toBe(10);
    expect(result.max).toBe(18);
  });

  test('returns zero for invalid inputs (negative fibonacci)', () => {
    const result = sim.fibonacciToVelocityDays(-5, 25, 10);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
  });

  test('returns zero for invalid inputs (zero velocity)', () => {
    const result = sim.fibonacciToVelocityDays(8, 0, 10);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
  });

  test('returns zero for invalid inputs (negative sprint length)', () => {
    const result = sim.fibonacciToVelocityDays(8, 25, -10);
    expect(result.min).toBe(0);
    expect(result.max).toBe(0);
  });

  test('handles string inputs by parsing', () => {
    const result = sim.fibonacciToVelocityDays('5', '20', '10');
    expect(result.min).toBe(2);
    expect(result.max).toBe(3);
  });
});
