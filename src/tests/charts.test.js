/**
 * @jest-environment jsdom
 */

import * as d3 from 'd3';
import {
  GRAPH_CONFIG,
  GRAPH_CONFIG_DEFAULTS,
  buildHistogram,
  buildHistogramPreview,
  buildTaskRowHistogram,
} from '../visualization/charts';

test('Validate GRAPH_CONFIG structure', () => {
  expect(GRAPH_CONFIG).toHaveProperty('histogram');
  expect(GRAPH_CONFIG).toHaveProperty('miniGraph');
  expect(GRAPH_CONFIG.histogram).toHaveProperty('width');
  expect(GRAPH_CONFIG.histogram).toHaveProperty('height');
  expect(GRAPH_CONFIG.histogram).toHaveProperty('barCutoff');
  expect(GRAPH_CONFIG.histogram).toHaveProperty('maxBuckets');
  expect(GRAPH_CONFIG.miniGraph).toHaveProperty('width');
  expect(GRAPH_CONFIG.miniGraph).toHaveProperty('height');
  expect(GRAPH_CONFIG.miniGraph).toHaveProperty('maxBuckets');
  expect(GRAPH_CONFIG.miniGraph).toHaveProperty('gap');
});

test('GRAPH_CONFIG_DEFAULTS matches GRAPH_CONFIG initial structure', () => {
  expect(GRAPH_CONFIG_DEFAULTS).toHaveProperty('histogram');
  expect(GRAPH_CONFIG_DEFAULTS).toHaveProperty('miniGraph');
  expect(GRAPH_CONFIG_DEFAULTS.histogram.width).toBe(800);
  expect(GRAPH_CONFIG_DEFAULTS.histogram.height).toBe(500);
  expect(GRAPH_CONFIG_DEFAULTS.histogram.barCutoff).toBe(600);
  expect(GRAPH_CONFIG_DEFAULTS.histogram.maxBuckets).toBe(120);
  expect(GRAPH_CONFIG_DEFAULTS.histogram).toHaveProperty('margin');
  expect(GRAPH_CONFIG_DEFAULTS.histogram.margin.top).toBe(10);
  expect(GRAPH_CONFIG_DEFAULTS.histogram.margin.right).toBe(30);
  expect(GRAPH_CONFIG_DEFAULTS.histogram.margin.bottom).toBe(50);
  expect(GRAPH_CONFIG_DEFAULTS.histogram.margin.left).toBe(60);
  expect(GRAPH_CONFIG_DEFAULTS.miniGraph.width).toBe(140);
  expect(GRAPH_CONFIG_DEFAULTS.miniGraph.height).toBe(26);
  expect(GRAPH_CONFIG_DEFAULTS.miniGraph.maxBuckets).toBe(24);
  expect(GRAPH_CONFIG_DEFAULTS.miniGraph.gap).toBe(1);
});

describe('Accessibility: SVG Charts', () => {
  test('buildHistogram function exists and has expected signature', () => {
    expect(buildHistogram).toBeDefined();
    expect(buildHistogram).toHaveLength(8);
  });
});

describe('buildHistogram', () => {
  let mockTargetNode;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTargetNode = {
      innerHTML: '',
      querySelector: jest.fn(),
      appendChild: jest.fn(),
    };
  });

  test('renders with bar chart when range is below barCutoff', () => {
    const list = new Array(100).fill(0);
    list[10] = 50;
    list[20] = 80;
    list[30] = 60;
    buildHistogram(mockTargetNode, list, 10, 30, 20, 5, 'Hours', false);
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('renders scatter plot when range exceeds barCutoff', () => {
    const list = new Array(2000).fill(0);
    list[500] = 100;
    list[1000] = 80;
    buildHistogram(mockTargetNode, list, 1, 1500, 750, 200, 'Days', false);
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
    expect(d3.line).toHaveBeenCalled();
  });

  test('clips displayed range when limitGraph is true and stdDev fits within bounds', () => {
    const list = new Array(100).fill(0);
    list[10] = 50;
    list[50] = 80;
    list[90] = 20;
    buildHistogram(mockTargetNode, list, 10, 90, 50, 10, 'Hours', true);
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('clamps maxBin to max when median + 2*stdDev exceeds max', () => {
    const list = new Array(50).fill(0);
    list[49] = 10;
    // median (40) + 2*stdDev (2*20=40) = 80 > max (49): maxBin should clamp to 49
    buildHistogram(mockTargetNode, list, 0, 49, 40, 20, 'Hours', true);
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('clamps minBin to min when median - 2*stdDev is below min', () => {
    const list = new Array(50).fill(0);
    list[5] = 10;
    // median (5) - 2*stdDev (2*10=20) = -15 < min (0): minBin should clamp to 0
    buildHistogram(mockTargetNode, list, 0, 49, 5, 10, 'Hours', true);
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('bar class callback assigns median class at median index', () => {
    // Use a uniform array so medianIndex is well-defined and equal bar heights exist
    const list = new Array(30).fill(5);
    buildHistogram(mockTargetNode, list, 0, 29, 15, 5, 'Count', false);
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('bar class callback covers median branch when medianIndex is 0', () => {
    // median === min → medianIndex = 0; attr mock invokes callback with i=0
    // so the 'bar median' return branch is executed
    const list = new Array(30).fill(5);
    buildHistogram(mockTargetNode, list, 0, 29, 0, 5, 'Count', false);
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('bar class callback covers stdDev branch when stdDev spans index 0', () => {
    // medianIndex=5, stdDevOffset=10 → stdDevLowIndex=-5, stdDevHighIndex=15
    // attr mock invokes callback with i=0; 0 > -5 && 0 < 15 → 'bar stdDev'
    const list = new Array(50).fill(5);
    buildHistogram(mockTargetNode, list, 0, 49, 5, 10, 'Count', false);
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('scatter plot class callback covers median branch when medianIndex is 0', () => {
    // Large range → useBars=false; median === min → medianIndex=0
    // attr mock invokes callback with i=0 → 'graphXY median' and r=3 branches
    const list = new Array(2000).fill(0);
    list[500] = 100;
    buildHistogram(mockTargetNode, list, 0, 1500, 0, 200, 'Days', false);
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('scatter plot class callback covers stdDev branch when stdDev spans index 0', () => {
    // Large range → useBars=false; medianIndex=5, stdDevOffset=10
    // attr mock invokes callback with i=0 → 0 > -5 && 0 < 15 → 'graphXY stdDev'
    const list = new Array(2000).fill(0);
    list[1000] = 80;
    buildHistogram(mockTargetNode, list, 0, 1500, 5, 10, 'Days', false);
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });
});

// Tests for buildHistogramPreview function
describe('buildHistogramPreview', () => {
  let mockTargetNode;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTargetNode = {
      innerHTML: '',
      querySelector: jest.fn(),
      appendChild: jest.fn(),
    };
  });

  test('Returns early when min is negative', () => {
    const list = [0, 1, 2, 3, 4];
    buildHistogramPreview(mockTargetNode, list, -1, 4, 'Test');
    expect(d3.select).not.toHaveBeenCalled();
  });

  test('Returns early when max is less than min', () => {
    const list = [0, 1, 2, 3, 4];
    buildHistogramPreview(mockTargetNode, list, 10, 5, 'Test');
    expect(d3.select).not.toHaveBeenCalled();
  });

  test('Handles normal data', () => {
    const list = new Array(10).fill(0);
    list[2] = 5;
    list[3] = 8;
    buildHistogramPreview(mockTargetNode, list, 0, 4, 'Test');
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('Handles large dataset', () => {
    const list = new Array(1000).fill(0);
    list[500] = 100;
    buildHistogramPreview(mockTargetNode, list, 0, 999, 'Hours');
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('Handles single value range', () => {
    const list = new Array(100).fill(0);
    for (let i = 10; i <= 20; i += 1) {
      list[i] = 1;
    }
    buildHistogramPreview(mockTargetNode, list, 0, 99, 'Hours');
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('Handles sparse data with gaps', () => {
    const list = new Array(100).fill(0);
    list[10] = 5;
    list[50] = 10;
    list[90] = 3;
    buildHistogramPreview(mockTargetNode, list, 0, 99, 'Cost');
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('Works with different x-axis labels', () => {
    const list = new Array(50).fill(0);
    list[25] = 20;
    buildHistogramPreview(mockTargetNode, list, 0, 49, 'Hours');
    buildHistogramPreview(mockTargetNode, list, 0, 49, 'Cost ($)');
    buildHistogramPreview(mockTargetNode, list, 0, 49, 'Duration');
    expect(d3.select).toHaveBeenCalledTimes(3);
  });

  test('Handles edge case with min equals max', () => {
    const list = [0, 5];
    buildHistogramPreview(mockTargetNode, list, 1, 1, 'Test');
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('Correctly processes histogram array format', () => {
    // [0, 1, 3, 1] represents: one 1, three 2s, one 3
    const list = [0, 1, 3, 1];
    buildHistogramPreview(mockTargetNode, list, 1, 3, 'Values');
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('Returns early when all list values are zero (yMax < 1)', () => {
    const list = new Array(10).fill(0);
    buildHistogramPreview(mockTargetNode, list, 0, 9, 'Empty');
    expect(d3.select).not.toHaveBeenCalled();
  });

  test('Falls back to 120 buckets when GRAPH_CONFIG maxBuckets is invalid', () => {
    const original = GRAPH_CONFIG.histogram.maxBuckets;
    GRAPH_CONFIG.histogram.maxBuckets = -1;
    const list = new Array(10).fill(0);
    list[5] = 10;
    buildHistogramPreview(mockTargetNode, list, 0, 9, 'Test');
    GRAPH_CONFIG.histogram.maxBuckets = original;
    expect(d3.select).toHaveBeenCalledWith(mockTargetNode);
  });

  test('Creates initial SVG structure when container has no existing preview SVG', () => {
    // Build a chainable mock where svg.empty() returns true to exercise
    // the initial SVG creation code path inside buildHistogramPreview.
    const chainable = {};
    const chainMethods = [
      'append', 'attr', 'style', 'text', 'select', 'selectAll',
      'data', 'transition', 'call', 'remove', 'duration', 'ease',
    ];
    chainMethods.forEach((m) => { chainable[m] = jest.fn().mockReturnThis(); });
    chainable.empty = jest.fn().mockReturnValue(true);
    chainable.join = jest.fn((enterFn, updateFn, exitFn) => {
      if (typeof enterFn === 'function') enterFn(chainable);
      if (typeof updateFn === 'function') updateFn(chainable);
      if (typeof exitFn === 'function') exitFn(chainable);
      return chainable;
    });

    d3.select.mockReturnValueOnce({
      select: jest.fn().mockReturnValue(chainable),
      append: jest.fn().mockReturnValue(chainable),
    });

    const list = new Array(10).fill(0);
    list[5] = 10;
    buildHistogramPreview(mockTargetNode, list, 0, 9, 'Values');

    expect(chainable.empty).toHaveBeenCalled();
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

    buildTaskRowHistogram(wrapper, histogram, 1, 5, 'Task A');

    const svg = wrapper.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('height')).toBe(String(GRAPH_CONFIG.miniGraph.height));
    expect(svg.querySelectorAll('rect').length).toBeGreaterThan(0);
  });

  test('does not render when min and max are invalid', () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<span>old</span>';
    document.body.appendChild(wrapper);

    buildTaskRowHistogram(wrapper, [0, 1, 2], 5, 2, 'Task B');

    expect(wrapper.querySelector('svg')).toBeNull();
    expect(wrapper.innerHTML).toBe('');
  });

  test('does not render when min is negative', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);

    buildTaskRowHistogram(wrapper, [0, 1, 2], -1, 5, 'Task C');

    expect(wrapper.querySelector('svg')).toBeNull();
  });

  test('renders with appropriate accessibility attributes', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const histogram = [0, 2, 3, 1];

    buildTaskRowHistogram(wrapper, histogram, 1, 3, 'Important Task');

    const svg = wrapper.querySelector('svg');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toContain('Important Task');
  });

  test('uses fallback label when taskName is undefined', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const histogram = [0, 2, 3, 1];

    buildTaskRowHistogram(wrapper, histogram, 1, 3, undefined);

    const svg = wrapper.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('aria-label')).toContain('task');
  });

  test('does not render when all simulated values are zero (peak = 0)', () => {
    const wrapper = document.createElement('div');
    document.body.appendChild(wrapper);
    const histogram = new Array(10).fill(0);

    buildTaskRowHistogram(wrapper, histogram, 0, 9, 'Empty Task');

    expect(wrapper.querySelector('svg')).toBeNull();
  });
});
