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
} from '../charts';

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
});
