/**
 * @jest-environment jsdom
 */

import { applyGraphSettings, resetGraphSettings, createAdvancedSettings } from '../ui/graph-settings';
import { GRAPH_CONFIG, GRAPH_CONFIG_DEFAULTS } from '../visualization/charts';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resets GRAPH_CONFIG back to the default values before/after each test.
 */
const resetGraphConfig = () => {
  GRAPH_CONFIG.histogram.width = 800;
  GRAPH_CONFIG.histogram.height = 500;
  GRAPH_CONFIG.histogram.barCutoff = 600;
  GRAPH_CONFIG.histogram.maxBuckets = 120;
  GRAPH_CONFIG.miniGraph.width = 140;
  GRAPH_CONFIG.miniGraph.height = 26;
  GRAPH_CONFIG.miniGraph.maxBuckets = 24;
  GRAPH_CONFIG.miniGraph.gap = 1;
};

/**
 * Builds a minimal DOM with the graph-settings form inputs and the
 * advancedSettings <details> element. Accepts optional value overrides.
 * @param {object} overrides - Field values to override from defaults.
 */
const setupGraphSettingsDOM = (overrides = {}) => {
  const defaults = {
    histogramWidth: '800',
    histogramHeight: '500',
    histogramBarCutoff: '600',
    histogramMaxBuckets: '120',
    miniGraphWidth: '140',
    miniGraphHeight: '26',
    miniGraphMaxBuckets: '24',
    miniGraphGap: '1',
  };

  const values = { ...defaults, ...overrides };

  document.body.innerHTML = `
    <input id="histogramWidth" value="${values.histogramWidth}" />
    <input id="histogramHeight" value="${values.histogramHeight}" />
    <input id="histogramBarCutoff" value="${values.histogramBarCutoff}" />
    <input id="histogramMaxBuckets" value="${values.histogramMaxBuckets}" />
    <input id="miniGraphWidth" value="${values.miniGraphWidth}" />
    <input id="miniGraphHeight" value="${values.miniGraphHeight}" />
    <input id="miniGraphMaxBuckets" value="${values.miniGraphMaxBuckets}" />
    <input id="miniGraphGap" value="${values.miniGraphGap}" />
    <details id="advancedSettings">
      <summary>Advanced Graph Settings</summary>
    </details>
  `;
};

// ── createAdvancedSettings ───────────────────────────────────────────────────

describe('createAdvancedSettings', () => {
  test('returns a <details> element', () => {
    const panel = createAdvancedSettings();
    expect(panel.tagName.toLowerCase()).toBe('details');
  });

  test('has id "advancedSettings"', () => {
    const panel = createAdvancedSettings();
    expect(panel.id).toBe('advancedSettings');
  });

  test('contains a <summary> child with the correct text', () => {
    const panel = createAdvancedSettings();
    const summary = panel.querySelector('summary');
    expect(summary).not.toBeNull();
    expect(summary.textContent).toBe('Advanced Graph Settings');
  });

  test('contains all required histogram input fields', () => {
    const panel = createAdvancedSettings();
    expect(panel.querySelector('#histogramWidth')).not.toBeNull();
    expect(panel.querySelector('#histogramHeight')).not.toBeNull();
    expect(panel.querySelector('#histogramBarCutoff')).not.toBeNull();
    expect(panel.querySelector('#histogramMaxBuckets')).not.toBeNull();
  });

  test('contains all required mini-graph input fields', () => {
    const panel = createAdvancedSettings();
    expect(panel.querySelector('#miniGraphWidth')).not.toBeNull();
    expect(panel.querySelector('#miniGraphHeight')).not.toBeNull();
    expect(panel.querySelector('#miniGraphMaxBuckets')).not.toBeNull();
    expect(panel.querySelector('#miniGraphGap')).not.toBeNull();
  });

  test('histogram inputs are of type number', () => {
    const panel = createAdvancedSettings();
    ['#histogramWidth', '#histogramHeight', '#histogramBarCutoff', '#histogramMaxBuckets'].forEach((id) => {
      expect(panel.querySelector(id).type).toBe('number');
    });
  });

  test('mini-graph inputs are of type number', () => {
    const panel = createAdvancedSettings();
    ['#miniGraphWidth', '#miniGraphHeight', '#miniGraphMaxBuckets', '#miniGraphGap'].forEach((id) => {
      expect(panel.querySelector(id).type).toBe('number');
    });
  });

  test('input values reflect current GRAPH_CONFIG defaults', () => {
    const panel = createAdvancedSettings();
    expect(panel.querySelector('#histogramWidth').value).toBe(String(GRAPH_CONFIG_DEFAULTS.histogram.width));
    expect(panel.querySelector('#histogramHeight').value).toBe(String(GRAPH_CONFIG_DEFAULTS.histogram.height));
    expect(panel.querySelector('#miniGraphGap').value).toBe(String(GRAPH_CONFIG_DEFAULTS.miniGraph.gap));
  });
});

// ── applyGraphSettings ───────────────────────────────────────────────────────

describe('applyGraphSettings', () => {
  beforeEach(() => { resetGraphConfig(); });
  afterEach(() => { resetGraphConfig(); });

  test('writes DOM input values into GRAPH_CONFIG', () => {
    setupGraphSettingsDOM({
      histogramWidth: '1000',
      histogramHeight: '600',
      histogramBarCutoff: '800',
      histogramMaxBuckets: '150',
      miniGraphWidth: '200',
      miniGraphHeight: '30',
      miniGraphMaxBuckets: '30',
      miniGraphGap: '2',
    });

    applyGraphSettings();

    expect(GRAPH_CONFIG.histogram.width).toBe(1000);
    expect(GRAPH_CONFIG.histogram.height).toBe(600);
    expect(GRAPH_CONFIG.histogram.barCutoff).toBe(800);
    expect(GRAPH_CONFIG.histogram.maxBuckets).toBe(150);
    expect(GRAPH_CONFIG.miniGraph.width).toBe(200);
    expect(GRAPH_CONFIG.miniGraph.height).toBe(30);
    expect(GRAPH_CONFIG.miniGraph.maxBuckets).toBe(30);
    expect(GRAPH_CONFIG.miniGraph.gap).toBe(2);
  });

  test('parseInt is used for integer fields (truncates decimals)', () => {
    setupGraphSettingsDOM({ histogramWidth: '1000.9', histogramMaxBuckets: '120.7' });

    applyGraphSettings();

    expect(GRAPH_CONFIG.histogram.width).toBe(1000);
    expect(GRAPH_CONFIG.histogram.maxBuckets).toBe(120);
  });

  test('parseFloat is used for miniGraphGap (preserves decimals)', () => {
    setupGraphSettingsDOM({ miniGraphGap: '1.5' });

    applyGraphSettings();

    expect(GRAPH_CONFIG.miniGraph.gap).toBe(1.5);
  });

  test('produces NaN for empty string inputs', () => {
    setupGraphSettingsDOM({ histogramWidth: '', histogramHeight: '' });

    applyGraphSettings();

    expect(Number.isNaN(GRAPH_CONFIG.histogram.width)).toBe(true);
    expect(Number.isNaN(GRAPH_CONFIG.histogram.height)).toBe(true);
  });

  test('shows confirmation summary text and restores it after 2 seconds', () => {
    jest.useFakeTimers();
    setupGraphSettingsDOM();

    const summary = document.getElementById('advancedSettings').querySelector('summary');
    const original = summary.textContent;

    applyGraphSettings();
    expect(summary.textContent).toBe('Advanced Graph Settings ✓ Applied');

    jest.advanceTimersByTime(2001);
    expect(summary.textContent).toBe(original);

    jest.useRealTimers();
  });
});

// ── resetGraphSettings ───────────────────────────────────────────────────────

describe('resetGraphSettings', () => {
  beforeEach(() => { resetGraphConfig(); });
  afterEach(() => { resetGraphConfig(); });

  test('restores GRAPH_CONFIG to GRAPH_CONFIG_DEFAULTS values', () => {
    setupGraphSettingsDOM();

    // Mutate before resetting
    GRAPH_CONFIG.histogram.width = 9999;
    GRAPH_CONFIG.miniGraph.gap = 99;

    resetGraphSettings();

    const { histogram: h, miniGraph: m } = GRAPH_CONFIG_DEFAULTS;
    expect(GRAPH_CONFIG.histogram.width).toBe(h.width);
    expect(GRAPH_CONFIG.histogram.height).toBe(h.height);
    expect(GRAPH_CONFIG.histogram.barCutoff).toBe(h.barCutoff);
    expect(GRAPH_CONFIG.histogram.maxBuckets).toBe(h.maxBuckets);
    expect(GRAPH_CONFIG.miniGraph.width).toBe(m.width);
    expect(GRAPH_CONFIG.miniGraph.height).toBe(m.height);
    expect(GRAPH_CONFIG.miniGraph.maxBuckets).toBe(m.maxBuckets);
    expect(GRAPH_CONFIG.miniGraph.gap).toBe(m.gap);
  });

  test('restores DOM input values to GRAPH_CONFIG_DEFAULTS values', () => {
    setupGraphSettingsDOM({
      histogramWidth: '9999',
      histogramHeight: '9999',
      histogramBarCutoff: '9999',
      histogramMaxBuckets: '9999',
      miniGraphWidth: '9999',
      miniGraphHeight: '9999',
      miniGraphMaxBuckets: '9999',
      miniGraphGap: '9999',
    });

    resetGraphSettings();

    const { histogram: h, miniGraph: m } = GRAPH_CONFIG_DEFAULTS;
    expect(document.getElementById('histogramWidth').value).toBe(String(h.width));
    expect(document.getElementById('histogramHeight').value).toBe(String(h.height));
    expect(document.getElementById('histogramBarCutoff').value).toBe(String(h.barCutoff));
    expect(document.getElementById('histogramMaxBuckets').value).toBe(String(h.maxBuckets));
    expect(document.getElementById('miniGraphWidth').value).toBe(String(m.width));
    expect(document.getElementById('miniGraphHeight').value).toBe(String(m.height));
    expect(document.getElementById('miniGraphMaxBuckets').value).toBe(String(m.maxBuckets));
    expect(document.getElementById('miniGraphGap').value).toBe(String(m.gap));
  });

  test('resets GRAPH_CONFIG and DOM fields in a single call', () => {
    setupGraphSettingsDOM({ histogramWidth: '9999', miniGraphGap: '99' });
    GRAPH_CONFIG.histogram.width = 9999;
    GRAPH_CONFIG.miniGraph.gap = 99;

    resetGraphSettings();

    expect(GRAPH_CONFIG.histogram.width).toBe(GRAPH_CONFIG_DEFAULTS.histogram.width);
    expect(document.getElementById('histogramWidth').value).toBe(
      String(GRAPH_CONFIG_DEFAULTS.histogram.width),
    );
    expect(GRAPH_CONFIG.miniGraph.gap).toBe(GRAPH_CONFIG_DEFAULTS.miniGraph.gap);
    expect(document.getElementById('miniGraphGap').value).toBe(
      String(GRAPH_CONFIG_DEFAULTS.miniGraph.gap),
    );
  });

  test('shows confirmation summary text and restores it after 2 seconds', () => {
    jest.useFakeTimers();
    setupGraphSettingsDOM();

    const summary = document.getElementById('advancedSettings').querySelector('summary');
    const original = summary.textContent;

    resetGraphSettings();
    expect(summary.textContent).toBe('Advanced Graph Settings ✓ Reset');

    jest.advanceTimersByTime(2001);
    expect(summary.textContent).toBe(original);

    jest.useRealTimers();
  });
});
