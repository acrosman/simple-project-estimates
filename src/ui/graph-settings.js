import { GRAPH_CONFIG, GRAPH_CONFIG_DEFAULTS } from './charts';
import { createDivWithIdAndClasses, createTextElement, createLabeledInput } from './dom-helpers';

/**
 * Applies user-modified graph settings to GRAPH_CONFIG.
 */
function applyGraphSettings() {
  GRAPH_CONFIG.histogram.width = parseInt(document.getElementById('histogramWidth').value, 10);
  GRAPH_CONFIG.histogram.height = parseInt(document.getElementById('histogramHeight').value, 10);
  GRAPH_CONFIG.histogram.barCutoff = parseInt(document.getElementById('histogramBarCutoff').value, 10);
  GRAPH_CONFIG.histogram.maxBuckets = parseInt(document.getElementById('histogramMaxBuckets').value, 10);
  GRAPH_CONFIG.miniGraph.width = parseInt(document.getElementById('miniGraphWidth').value, 10);
  GRAPH_CONFIG.miniGraph.height = parseInt(document.getElementById('miniGraphHeight').value, 10);
  GRAPH_CONFIG.miniGraph.maxBuckets = parseInt(document.getElementById('miniGraphMaxBuckets').value, 10);
  GRAPH_CONFIG.miniGraph.gap = parseFloat(document.getElementById('miniGraphGap').value);

  // Show confirmation
  const details = document.getElementById('advancedSettings');
  const originalSummary = details.querySelector('summary').textContent;
  details.querySelector('summary').textContent = 'Advanced Graph Settings ✓ Applied';
  setTimeout(() => {
    details.querySelector('summary').textContent = originalSummary;
  }, 2000);
}

/**
 * Resets graph settings to default values.
 */
function resetGraphSettings() {
  const { histogram: h, miniGraph: m } = GRAPH_CONFIG_DEFAULTS;

  // Reset GRAPH_CONFIG to original defaults.
  GRAPH_CONFIG.histogram.width = h.width;
  GRAPH_CONFIG.histogram.height = h.height;
  GRAPH_CONFIG.histogram.barCutoff = h.barCutoff;
  GRAPH_CONFIG.histogram.maxBuckets = h.maxBuckets;
  GRAPH_CONFIG.miniGraph.width = m.width;
  GRAPH_CONFIG.miniGraph.height = m.height;
  GRAPH_CONFIG.miniGraph.maxBuckets = m.maxBuckets;
  GRAPH_CONFIG.miniGraph.gap = m.gap;

  // Sync form fields to match the reset values.
  document.getElementById('histogramWidth').value = String(h.width);
  document.getElementById('histogramHeight').value = String(h.height);
  document.getElementById('histogramBarCutoff').value = String(h.barCutoff);
  document.getElementById('histogramMaxBuckets').value = String(h.maxBuckets);
  document.getElementById('miniGraphWidth').value = String(m.width);
  document.getElementById('miniGraphHeight').value = String(m.height);
  document.getElementById('miniGraphMaxBuckets').value = String(m.maxBuckets);
  document.getElementById('miniGraphGap').value = String(m.gap);

  // Show confirmation
  const details = document.getElementById('advancedSettings');
  const originalSummary = details.querySelector('summary').textContent;
  details.querySelector('summary').textContent = 'Advanced Graph Settings ✓ Reset';
  setTimeout(() => {
    details.querySelector('summary').textContent = originalSummary;
  }, 2000);
}

/**
 * Creates the advanced graph settings panel for power users.
 * @returns {HTMLElement} Details element with graph configuration controls.
 */
function createAdvancedSettings() {
  const details = document.createElement('details');
  details.classList.add('advanced-settings');
  details.id = 'advancedSettings';

  const summary = document.createElement('summary');
  summary.textContent = 'Advanced Graph Settings';
  details.appendChild(summary);

  const settingsWrapper = createDivWithIdAndClasses('advancedSettingsContent', ['settings-grid']);

  // Main histogram settings
  const histogramHeader = createTextElement('h3', 'Main Histogram Settings', ['settings-header']);
  settingsWrapper.appendChild(histogramHeader);

  const histogramWidthAttr = {
    type: 'number',
    min: '400',
    max: '2000',
    step: '50',
    id: 'histogramWidth',
    value: String(GRAPH_CONFIG.histogram.width),
    name: 'Histogram Width',
  };
  settingsWrapper.appendChild(createLabeledInput('Width (px):', histogramWidthAttr, true));

  const histogramHeightAttr = {
    type: 'number',
    min: '300',
    max: '1000',
    step: '50',
    id: 'histogramHeight',
    value: String(GRAPH_CONFIG.histogram.height),
    name: 'Histogram Height',
  };
  settingsWrapper.appendChild(createLabeledInput('Height (px):', histogramHeightAttr, true));

  const histogramBarCutoffAttr = {
    type: 'number',
    min: '100',
    max: '2000',
    step: '50',
    id: 'histogramBarCutoff',
    value: String(GRAPH_CONFIG.histogram.barCutoff),
    name: 'Bar Cutoff',
  };
  settingsWrapper.appendChild(createLabeledInput('Bar/Scatter Cutoff:', histogramBarCutoffAttr, true));

  const histogramMaxBucketsAttr = {
    type: 'number',
    min: '20',
    max: '500',
    step: '10',
    id: 'histogramMaxBuckets',
    value: String(GRAPH_CONFIG.histogram.maxBuckets),
    name: 'Max Preview Buckets',
  };
  settingsWrapper.appendChild(createLabeledInput('Max Preview Buckets:', histogramMaxBucketsAttr, true));

  // Mini graph settings
  const miniGraphHeader = createTextElement('h3', 'Task Row Mini Graph Settings', ['settings-header']);
  settingsWrapper.appendChild(miniGraphHeader);

  const miniWidthAttr = {
    type: 'number',
    min: '50',
    max: '300',
    step: '10',
    id: 'miniGraphWidth',
    value: String(GRAPH_CONFIG.miniGraph.width),
    name: 'Mini Graph Width',
  };
  settingsWrapper.appendChild(createLabeledInput('Width (px):', miniWidthAttr, true));

  const miniHeightAttr = {
    type: 'number',
    min: '10',
    max: '100',
    step: '2',
    id: 'miniGraphHeight',
    value: String(GRAPH_CONFIG.miniGraph.height),
    name: 'Mini Graph Height',
  };
  settingsWrapper.appendChild(createLabeledInput('Height (px):', miniHeightAttr, true));

  const miniMaxBucketsAttr = {
    type: 'number',
    min: '5',
    max: '50',
    step: '1',
    id: 'miniGraphMaxBuckets',
    value: String(GRAPH_CONFIG.miniGraph.maxBuckets),
    name: 'Mini Max Buckets',
  };
  settingsWrapper.appendChild(createLabeledInput('Max Buckets:', miniMaxBucketsAttr, true));

  const miniGapAttr = {
    type: 'number',
    min: '0',
    max: '5',
    step: '0.5',
    id: 'miniGraphGap',
    value: String(GRAPH_CONFIG.miniGraph.gap),
    name: 'Mini Graph Gap',
  };
  settingsWrapper.appendChild(createLabeledInput('Bar Gap (px):', miniGapAttr, true));

  // Reset and Apply buttons
  const buttonWrapper = document.createElement('div');
  buttonWrapper.classList.add('settings-buttons');

  const applyButton = document.createElement('input');
  Object.assign(applyButton, {
    type: 'button',
    value: 'Apply Settings',
    id: 'applyGraphSettings',
  });
  applyButton.addEventListener('click', applyGraphSettings);

  const resetButton = document.createElement('input');
  Object.assign(resetButton, {
    type: 'button',
    value: 'Reset to Defaults',
    id: 'resetGraphSettings',
  });
  resetButton.addEventListener('click', resetGraphSettings);

  buttonWrapper.appendChild(applyButton);
  buttonWrapper.appendChild(resetButton);
  settingsWrapper.appendChild(buttonWrapper);

  details.appendChild(settingsWrapper);
  return details;
}

export { applyGraphSettings, resetGraphSettings, createAdvancedSettings };
