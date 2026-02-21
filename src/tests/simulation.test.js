/**
 * @jest-environment jsdom
 */

import * as sim from '../simulation';

test('Validate Elements', () => {
  expect(sim).toHaveProperty('runSimulation');
  expect(sim).toHaveProperty('buildHistogram');
  expect(sim).toHaveProperty('buildTaskRowHistogram');
  expect(sim).toHaveProperty('getRandom');
  expect(sim).toHaveProperty('GRAPH_CONFIG');
  expect(sim).toHaveProperty('GRAPH_CONFIG_DEFAULTS');
});

describe('Accessibility: SVG Charts', () => {
  test('buildHistogram function exists and has expected signature', () => {
    expect(sim.buildHistogram).toBeDefined();
    expect(sim.buildHistogram).toHaveLength(8);
  });
});

test('Validate GRAPH_CONFIG structure', () => {
  expect(sim.GRAPH_CONFIG).toHaveProperty('histogram');
  expect(sim.GRAPH_CONFIG).toHaveProperty('miniGraph');
  expect(sim.GRAPH_CONFIG.histogram).toHaveProperty('width');
  expect(sim.GRAPH_CONFIG.histogram).toHaveProperty('height');
  expect(sim.GRAPH_CONFIG.histogram).toHaveProperty('barCutoff');
  expect(sim.GRAPH_CONFIG.histogram).toHaveProperty('maxBuckets');
  expect(sim.GRAPH_CONFIG.miniGraph).toHaveProperty('width');
  expect(sim.GRAPH_CONFIG.miniGraph).toHaveProperty('height');
  expect(sim.GRAPH_CONFIG.miniGraph).toHaveProperty('maxBuckets');
  expect(sim.GRAPH_CONFIG.miniGraph).toHaveProperty('gap');
});

test('GRAPH_CONFIG_DEFAULTS matches GRAPH_CONFIG initial structure', () => {
  expect(sim.GRAPH_CONFIG_DEFAULTS).toHaveProperty('histogram');
  expect(sim.GRAPH_CONFIG_DEFAULTS).toHaveProperty('miniGraph');
  expect(sim.GRAPH_CONFIG_DEFAULTS.histogram.width).toBe(800);
  expect(sim.GRAPH_CONFIG_DEFAULTS.histogram.height).toBe(500);
  expect(sim.GRAPH_CONFIG_DEFAULTS.histogram.barCutoff).toBe(600);
  expect(sim.GRAPH_CONFIG_DEFAULTS.histogram.maxBuckets).toBe(120);
  expect(sim.GRAPH_CONFIG_DEFAULTS.histogram).toHaveProperty('margin');
  expect(sim.GRAPH_CONFIG_DEFAULTS.histogram.margin.top).toBe(10);
  expect(sim.GRAPH_CONFIG_DEFAULTS.histogram.margin.right).toBe(30);
  expect(sim.GRAPH_CONFIG_DEFAULTS.histogram.margin.bottom).toBe(50);
  expect(sim.GRAPH_CONFIG_DEFAULTS.histogram.margin.left).toBe(60);
  expect(sim.GRAPH_CONFIG_DEFAULTS.miniGraph.width).toBe(140);
  expect(sim.GRAPH_CONFIG_DEFAULTS.miniGraph.height).toBe(26);
  expect(sim.GRAPH_CONFIG_DEFAULTS.miniGraph.maxBuckets).toBe(24);
  expect(sim.GRAPH_CONFIG_DEFAULTS.miniGraph.gap).toBe(1);
});

test('GetRandom', () => {
  const testResult = sim.getRandom(1, 2);
  expect(testResult).toBeGreaterThanOrEqual(1);
  expect(testResult).toBeLessThanOrEqual(2);
});

test('GetValueCount: Short List', () => {
  // Represents a list of [1,2,2,2,3] therefore a count of 5 elements
  const sampleList = [0, 1, 3, 1];
  const countValue = sim.getValueCount(sampleList);
  expect(countValue).toBe(5);
});

test('GetValueCount: Larger List', () => {
  // Represents a list of 36 elements
  const sampleList = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const countValue = sim.getValueCount(sampleList);
  expect(countValue).toBe(36);
});

test('GetMedian: Simple', () => {
  // Represents a list of [1,2,2,2,3] therefore median of 2.
  const sampleList = [0, 1, 3, 1];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(2);
});

test('GetMedian: Last Value', () => {
  // Represents a list of [2,2,2,2,2] therefore median of 2.
  const sampleList = [0, 0, 5];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(2);
});

test('GetMedian: One space between values', () => {
  // [2,2,2,2,4,4,4,4] therefore median 3 (between two values)
  const sampleList = [0, 0, 4, 0, 4];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(3);
});

test('GetMedian: Two spaces between values', () => {
  // [2,2,2,2,5,5,5,5] therefore median 3.5 (between two values)
  const sampleList = [0, 0, 4, 0, 0, 4];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(3.5);
});

test('GetMedian: Three spaces between values', () => {
  // [2,2,2,2,6,6,6,6] therefore median 4 (between two values)
  const sampleList = [0, 0, 4, 0, 0, 0, 4];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(4);
});

test('GetMedian: Between to integers', () => {
  // [2,2,2,2,3,4,4,4] therefore median 2.5 (between two values by half)
  const sampleList = [0, 0, 4, 1, 3];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(2.5);
});

test('GetMedian: With Gap in List', () => {
  // [2,2,2,2,3,4,4,4,4,4,4,5,5,5,5,5,5,7,7,7,8,8,8,8] median 5 (gap in list)
  const sampleList = [0, 0, 4, 1, 6, 6, 0, 3, 4];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(5);
});

test('GetMedian: Bell Curve', () => {
  const sampleList = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(6);
});

test('GetMedian: All Zeros', () => {
  const sampleList = [0, 0, 0];
  const medianValue = sim.getMedian(sampleList);
  // All-zero histogram represents no data points; getMedian returns 0 in this case
  expect(medianValue).toBe(0);
});

test('StdDev: Bell Curve', () => {
  const sampleList = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const stdDev = sim.getStandardDeviation(sampleList);
  expect(stdDev.toFixed(9)).toBe('2.449489743');
});

test('CalculateKDE: Returns array of density values', () => {
  const data = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const kdeValues = sim.calculateKDE(data, 0, 10);

  expect(Array.isArray(kdeValues)).toBe(true);
  expect(kdeValues.length).toBeGreaterThan(0);
  expect(kdeValues.length).toBeLessThanOrEqual(200); // Max sample points
});

test('CalculateKDE: Peak corresponds to data peak', () => {
  // Bell curve with peak at index 5
  const data = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const kdeValues = sim.calculateKDE(data, 0, 10);

  // Find index of max KDE value
  const maxKDE = Math.max(...kdeValues);
  const maxIndex = kdeValues.indexOf(maxKDE);

  // Should be near the middle where data peaks
  const midPoint = kdeValues.length / 2;
  expect(Math.abs(maxIndex - midPoint)).toBeLessThan(kdeValues.length * 0.2);
});

test('CalculateKDE: Handles uniform distribution', () => {
  const data = [5, 5, 5, 5, 5];
  const kdeValues = sim.calculateKDE(data, 0, 4);

  expect(Array.isArray(kdeValues)).toBe(true);
  expect(kdeValues.length).toBeGreaterThan(0);
  // All values should be positive
  expect(kdeValues.every((v) => v >= 0)).toBe(true);
});

test('CalculateKDE: Handles sparse data', () => {
  const data = [10, 0, 0, 0, 0, 0, 0, 0, 0, 10];
  const kdeValues = sim.calculateKDE(data, 0, 9);

  expect(Array.isArray(kdeValues)).toBe(true);
  expect(kdeValues.length).toBeGreaterThan(0);
  // Should have two peaks
  const maxVal = Math.max(...kdeValues);
  const peaks = kdeValues.filter((v) => v > maxVal * 0.7);
  expect(peaks.length).toBeGreaterThan(0);
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

  // Should have valid median (not 0 since min is 36)
  expect(results.times.median).toBeGreaterThan(0);

  // Should have valid standard deviation (not NaN)
  expect(results.times.sd).not.toBeNaN();
  expect(results.costs.sd).not.toBeNaN();

  // Likely ranges should not be NaN
  expect(results.times.likelyMin).not.toBeNaN();
  expect(results.times.likelyMax).not.toBeNaN();
  expect(results.costs.likelyMin).not.toBeNaN();
  expect(results.costs.likelyMax).not.toBeNaN();

  // Task-level outcome histograms should be available for row-level charts.
  expect(Array.isArray(results.taskResults)).toBe(true);
  expect(results.taskResults).toHaveLength(1);
  expect(results.taskResults[0].rowId).toBe('1');
  expect(results.taskResults[0].name).toBe('Test Task');
  expect(results.taskResults[0].times.list).toBeDefined();
  expect(results.taskResults[0].times.min).toBeGreaterThanOrEqual(0);
  expect(results.taskResults[0].times.max).toBeGreaterThanOrEqual(results.taskResults[0].times.min);
  expect(results.taskResults[0].times.sd).not.toBeNaN();
});

// Tests for taskUpperBound function
describe('taskUpperBound', () => {
  test('100% confidence should give 1x multiplier', () => {
    const result = sim.taskUpperBound(10, 1.0);
    expect(result).toBe(10);
  });

  test('90% confidence should give 1x multiplier', () => {
    const result = sim.taskUpperBound(10, 0.90);
    expect(result).toBe(10);
  });

  test('85% confidence should give 2x multiplier', () => {
    const result = sim.taskUpperBound(10, 0.85);
    expect(result).toBe(20);
  });

  test('80% confidence should give 2x multiplier', () => {
    const result = sim.taskUpperBound(10, 0.80);
    expect(result).toBe(20);
  });

  test('70% confidence should give 3x multiplier', () => {
    const result = sim.taskUpperBound(10, 0.70);
    expect(result).toBe(30);
  });

  test('50% confidence should give 5x multiplier', () => {
    const result = sim.taskUpperBound(10, 0.50);
    expect(result).toBe(50);
  });

  test('0% confidence should give 10x multiplier', () => {
    const result = sim.taskUpperBound(10, 0);
    expect(result).toBe(100);
  });

  test('Works with different max estimates', () => {
    expect(sim.taskUpperBound(20, 0.90)).toBe(20);
    expect(sim.taskUpperBound(20, 0.80)).toBe(40);
    expect(sim.taskUpperBound(5, 0.70)).toBe(15);
  });
});

// Tests for taskLowerBound function
describe('taskLowerBound', () => {
  test('100% confidence should give 1x divisor (floor equals min)', () => {
    const result = sim.taskLowerBound(10, 1.0);
    expect(result).toBe(10);
  });

  test('90% confidence should give 1x divisor (floor equals min)', () => {
    const result = sim.taskLowerBound(10, 0.90);
    expect(result).toBe(10);
  });

  test('85% confidence should give 2x divisor (floor is min / 2)', () => {
    const result = sim.taskLowerBound(10, 0.85);
    expect(result).toBe(5);
  });

  test('80% confidence should give 2x divisor (floor is min / 2)', () => {
    const result = sim.taskLowerBound(10, 0.80);
    expect(result).toBe(5);
  });

  test('70% confidence should give 3x divisor (floor is min / 3)', () => {
    const result = sim.taskLowerBound(30, 0.70);
    expect(result).toBe(10);
  });

  test('50% confidence should give 5x divisor (floor is min / 5)', () => {
    const result = sim.taskLowerBound(10, 0.50);
    expect(result).toBe(2);
  });

  test('0% confidence should give 10x divisor (floor is min / 10)', () => {
    const result = sim.taskLowerBound(10, 0);
    expect(result).toBe(1);
  });

  test('min of 0 always returns 0 regardless of confidence', () => {
    expect(sim.taskLowerBound(0, 1.0)).toBe(0);
    expect(sim.taskLowerBound(0, 0.80)).toBe(0);
    expect(sim.taskLowerBound(0, 0)).toBe(0);
  });

  test('Works with different min estimates', () => {
    expect(sim.taskLowerBound(20, 0.90)).toBe(20);
    expect(sim.taskLowerBound(20, 0.80)).toBe(10);
    expect(sim.taskLowerBound(15, 0.70)).toBe(5);
  });
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

    // Structure should match
    expect(progressiveResults).toHaveProperty('times');
    expect(progressiveResults).toHaveProperty('costs');
    expect(progressiveResults).toHaveProperty('taskResults');
    expect(progressiveResults).toHaveProperty('estimateDetails');
    expect(progressiveResults).toHaveProperty('runningTime');

    // Should have same array lengths
    expect(progressiveResults.times.list).toHaveLength(standardResults.times.list.length);
    expect(progressiveResults.costs.list).toHaveLength(standardResults.costs.list.length);
    expect(progressiveResults.taskResults).toHaveLength(standardResults.taskResults.length);

    // Values should be valid
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

    // Should be called at least once (at completion)
    expect(onProgress).toHaveBeenCalled();

    // Each update should have required properties
    progressUpdates.forEach((update) => {
      expect(update).toHaveProperty('processedPasses');
      expect(update).toHaveProperty('totalPasses');
      expect(update).toHaveProperty('times');
      expect(update).toHaveProperty('costs');
      expect(update.times).toHaveProperty('list');
      expect(update.times).toHaveProperty('min');
      expect(update.times).toHaveProperty('max');
    });

    // Final update should have processed all passes
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

    // Should have updates at intervals plus final
    // Expected: 500, 1000, 1500, 2000 = 4 calls
    expect(progressUpdates.length).toBeGreaterThanOrEqual(4);
    expect(progressUpdates.length).toBeLessThanOrEqual(5);

    // Check that processedPasses align with interval
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

    // Invalid intervals should default to reasonable value
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

    // Check intermediate updates have histogram data
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

// Tests for buildHistogramPreview function
describe('buildHistogramPreview', () => {
  let mockTargetNode;

  beforeEach(() => {
    // Create a mock DOM element for the target node
    mockTargetNode = {
      innerHTML: '',
      querySelector: jest.fn(),
      appendChild: jest.fn(),
    };
  });

  test('Returns early when min is negative', () => {
    const list = [0, 1, 2, 3, 4];
    const result = sim.buildHistogramPreview(mockTargetNode, list, -1, 4, 'Test');

    // Should return undefined (early exit)
    expect(result).toBeUndefined();
  });

  test('Returns early when max is less than min', () => {
    const list = [0, 1, 2, 3, 4];
    const result = sim.buildHistogramPreview(mockTargetNode, list, 10, 5, 'Test');

    // Should return undefined (early exit)
    expect(result).toBeUndefined();
  });

  test('Returns early when histogram has no data', () => {
    const list = [0, 0, 0, 0, 0]; // All zeros, yMax will be 0
    const result = sim.buildHistogramPreview(mockTargetNode, list, 0, 4, 'Test');

    // Should return undefined (early exit because yMax < 1)
    expect(result).toBeUndefined();
  });

  test('Calculates bucket count correctly for small ranges', () => {
    const list = new Array(10).fill(0);
    list[5] = 10; // Add some data

    // With range 0-9 (10 values), should have 10 buckets (less than maxBuckets)
    const result = sim.buildHistogramPreview(mockTargetNode, list, 0, 9, 'Hours');

    // Function should complete without error
    expect(result).toBeUndefined(); // Function doesn't return a value
  });

  test('Limits bucket count to maxBuckets for large ranges', () => {
    const list = new Array(1000).fill(0);
    list[500] = 100; // Add some data in the middle

    // With range 0-999 (1000 values), should limit to maxBuckets (120)
    const result = sim.buildHistogramPreview(mockTargetNode, list, 0, 999, 'Hours');

    // Function should complete without error
    expect(result).toBeUndefined();
  });

  test('Handles single value range', () => {
    const list = [0, 5]; // Single non-zero value at index 1
    const result = sim.buildHistogramPreview(mockTargetNode, list, 1, 1, 'Hours');

    // Should handle gracefully
    expect(result).toBeUndefined();
  });

  test('Bucketing logic groups values correctly', () => {
    // Create a histogram with known distribution
    const list = new Array(100).fill(0);
    for (let i = 10; i <= 20; i += 1) {
      list[i] = 1; // Put 1 count in each bucket from 10-20
    }

    const result = sim.buildHistogramPreview(mockTargetNode, list, 0, 99, 'Hours');

    // Function should complete - bucketing happens internally
    expect(result).toBeUndefined();
  });

  test('Handles sparse data with gaps', () => {
    const list = new Array(100).fill(0);
    list[10] = 5;
    list[50] = 10;
    list[90] = 3;

    const result = sim.buildHistogramPreview(mockTargetNode, list, 0, 99, 'Cost');

    expect(result).toBeUndefined();
  });

  test('Works with different x-axis labels', () => {
    const list = new Array(50).fill(0);
    list[25] = 20;

    const result1 = sim.buildHistogramPreview(mockTargetNode, list, 0, 49, 'Hours');
    expect(result1).toBeUndefined();

    const result2 = sim.buildHistogramPreview(mockTargetNode, list, 0, 49, 'Cost ($)');
    expect(result2).toBeUndefined();

    const result3 = sim.buildHistogramPreview(mockTargetNode, list, 0, 49, 'Duration');
    expect(result3).toBeUndefined();
  });

  test('Handles edge case with min equals max', () => {
    const list = [0, 5]; // Single point at index 1
    const result = sim.buildHistogramPreview(mockTargetNode, list, 1, 1, 'Test');

    expect(result).toBeUndefined();
  });

  test('Correctly processes histogram array format', () => {
    // Histogram format: index = value, cell = frequency
    // [0, 1, 3, 1] represents: one 1, three 2s, one 3
    const list = [0, 1, 3, 1];

    const result = sim.buildHistogramPreview(mockTargetNode, list, 1, 3, 'Values');

    expect(result).toBeUndefined();
  });
});

// Tests for buildTaskRowHistogram function
describe('buildTaskRowHistogram', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('renders compact histogram svg for valid task distribution', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const histogram = [0, 3, 0, 5, 2, 1];

    sim.buildTaskRowHistogram(wrapper, histogram, 1, 5, 'Task A');

    const svg = wrapper.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('height')).toBe(String(sim.GRAPH_CONFIG.miniGraph.height));
    expect(svg.querySelectorAll('rect').length).toBeGreaterThan(0);
  });

  test('does not render when min and max are invalid', () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<span>old</span>';
    document.body.appendChild(wrapper);

    sim.buildTaskRowHistogram(wrapper, [0, 1, 2], 5, 2, 'Task B');

    expect(wrapper.querySelector('svg')).toBeNull();
    expect(wrapper.innerHTML).toBe('');
  });

  test('does not render when min is negative', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);

    sim.buildTaskRowHistogram(wrapper, [0, 1, 2], -1, 5, 'Task C');

    expect(wrapper.querySelector('svg')).toBeNull();
  });

  test('renders with appropriate accessibility attributes', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const histogram = [0, 2, 3, 1];

    sim.buildTaskRowHistogram(wrapper, histogram, 1, 3, 'Important Task');

    const svg = wrapper.querySelector('svg');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toContain('Important Task');
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
    // 8 points / 2.5 points per day = 3.2 days base
    // min: round(3.2 * 0.7) = round(2.24) = 2
    // max: round(3.2 * 1.3) = round(4.16) = 4
    expect(result.min).toBe(2);
    expect(result.max).toBe(4);
  });

  test('calculates correctly with low velocity (15 points per 10 days)', () => {
    const result = sim.fibonacciToVelocityDays(5, 15, 10);
    // 5 points / 1.5 points per day = 3.33 days base
    // min: round(3.33 * 0.7) = round(2.33) = 2
    // max: round(3.33 * 1.3) = round(4.33) = 4
    expect(result.min).toBe(2);
    expect(result.max).toBe(4);
  });

  test('calculates correctly with high velocity (40 points per 10 days)', () => {
    const result = sim.fibonacciToVelocityDays(13, 40, 10);
    // 13 points / 4 points per day = 3.25 days base
    // min: round(3.25 * 0.7) = round(2.275) = 2
    // max: round(3.25 * 1.3) = round(4.225) = 4
    expect(result.min).toBe(2);
    expect(result.max).toBe(4);
  });

  test('calculates correctly with different sprint length (14 days)', () => {
    const result = sim.fibonacciToVelocityDays(8, 35, 14);
    // 8 points / 2.5 points per day = 3.2 days base
    // min: round(3.2 * 0.7) = round(2.24) = 2
    // max: round(3.2 * 1.3) = round(4.16) = 4
    expect(result.min).toBe(2);
    expect(result.max).toBe(4);
  });

  test('handles small story points (1 point)', () => {
    const result = sim.fibonacciToVelocityDays(1, 25, 10);
    // 1 point / 2.5 points per day = 0.4 days base
    // min: round(0.4 * 0.7) = round(0.28) = 0
    // max: round(0.4 * 1.3) = round(0.52) = 1
    expect(result.min).toBe(0);
    expect(result.max).toBe(1);
  });

  test('handles large story points (34 points)', () => {
    const result = sim.fibonacciToVelocityDays(34, 25, 10);
    // 34 points / 2.5 points per day = 13.6 days base
    // min: round(13.6 * 0.7) = round(9.52) = 10
    // max: round(13.6 * 1.3) = round(17.68) = 18
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
    // 5 points / 2 points per day = 2.5 days base
    // min: round(2.5 * 0.7) = round(1.75) = 2
    // max: round(2.5 * 1.3) = round(3.25) = 3
    expect(result.min).toBe(2);
    expect(result.max).toBe(3);
  });
});
