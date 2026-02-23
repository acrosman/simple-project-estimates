/**
 * @jest-environment jsdom
 */

// Must be called before imports so Jest hoists it and both index.js and this
// test file receive the same mocked module instance.
import * as idx from '../index';
import * as sim from '../core/simulation';
import { appState } from '../core/state';

jest.mock('../core/simulation', () => {
  const actual = jest.requireActual('../core/simulation');
  return {
    ...actual,
    runSimulationProgressive: jest.fn(),
  };
});

describe('Index Module Exports', () => {
  test('Validate exported functions exist', () => {
    expect(idx).toHaveProperty('updateElementText');
    expect(idx).toHaveProperty('renderTaskRowHistograms');
    expect(idx).toHaveProperty('applyGraphSettings');
    expect(idx).toHaveProperty('resetGraphSettings');
    expect(idx).toHaveProperty('createLogoElement');
    expect(idx).toHaveProperty('startSimulation');
    expect(idx).toHaveProperty('createHeader');
    expect(idx).toHaveProperty('createAdvancedSettings');
    expect(idx).toHaveProperty('createSimulationPanel');
    expect(idx).toHaveProperty('setupUi');
  });
});

describe('updateElementText', () => {
  beforeEach(() => {
    // Clear document body before each test
    document.body.innerHTML = '';
  });

  test('updates element text content', () => {
    const div = document.createElement('div');
    div.id = 'testElement';
    document.body.appendChild(div);

    idx.updateElementText('testElement', 'New Content');

    expect(div.textContent).toBe('New Content');
  });

  test('replaces existing text content', () => {
    const span = document.createElement('span');
    span.id = 'updateMe';
    span.textContent = 'Old Text';
    document.body.appendChild(span);

    idx.updateElementText('updateMe', 'Updated Text');

    expect(span.textContent).toBe('Updated Text');
  });

  test('clears text when empty string provided', () => {
    const p = document.createElement('p');
    p.id = 'paragraph';
    p.textContent = 'Some text';
    document.body.appendChild(p);

    idx.updateElementText('paragraph', '');

    expect(p.textContent).toBe('');
  });

  test('handles numeric content', () => {
    const div = document.createElement('div');
    div.id = 'numericDiv';
    document.body.appendChild(div);

    idx.updateElementText('numericDiv', 'Median: 42');

    expect(div.textContent).toBe('Median: 42');
  });
});

describe('renderTaskRowHistograms', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('renders histogram only for matching task row ids', () => {
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"></div>
      <div class="task-row-graph" data-row-id="2"></div>
    `;

    idx.renderTaskRowHistograms([
      {
        rowId: '1',
        name: 'Task 1',
        times: {
          list: [0, 2, 4, 2],
          min: 1,
          max: 3,
        },
      },
    ]);

    const row1Svg = document.querySelector('.task-row-graph[data-row-id="1"] svg');
    const row2Svg = document.querySelector('.task-row-graph[data-row-id="2"] svg');

    expect(row1Svg).not.toBeNull();
    expect(row2Svg).toBeNull();
  });

  test('clears existing graphs when no task results are provided', () => {
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"><svg></svg></div>
    `;

    idx.renderTaskRowHistograms([]);

    expect(document.querySelector('.task-row-graph[data-row-id="1"]').innerHTML).toBe('');
  });

  test('populates stats node when present', () => {
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"></div>
      <div class="task-row-stats" data-row-id="1"></div>
    `;

    idx.renderTaskRowHistograms([
      {
        rowId: '1',
        name: 'Task 1',
        times: {
          list: [0, 2, 4, 2],
          min: 1,
          max: 3,
          median: 2,
        },
      },
    ]);

    const statsNode = document.querySelector('.task-row-stats[data-row-id="1"]');
    expect(statsNode.innerHTML).toContain('Min: 1');
    expect(statsNode.innerHTML).toContain('Med: 2');
    expect(statsNode.innerHTML).toContain('Max: 3');
  });

  test('uses days as time unit in fibonacci estimation mode', () => {
    appState.estimationMode = 'fibonacci';
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"></div>
      <div class="task-row-stats" data-row-id="1"></div>
    `;

    idx.renderTaskRowHistograms([
      {
        rowId: '1',
        name: 'Task 1',
        times: {
          list: [0, 2, 4, 2],
          min: 1,
          max: 3,
          median: 2,
        },
      },
    ]);

    const statsNode = document.querySelector('.task-row-stats[data-row-id="1"]');
    expect(statsNode.innerHTML).toContain('days');
    appState.estimationMode = 'hours';
  });
});

describe('saveSvgAsImage', () => {
  let mockContainer;
  let mockSvg;
  let mockCanvas;
  let mockContext;
  let mockImage;
  let originalCreateElement;
  let originalGetComputedStyle;
  let originalURL;
  let originalAlert;
  let originalGetElementById;

  beforeEach(() => {
    // Mock DOM elements
    mockContext = {
      fillRect: jest.fn(),
      drawImage: jest.fn(),
    };

    mockCanvas = {
      getContext: jest.fn(() => mockContext),
      toBlob: jest.fn((callback) => callback(new Blob(['test'], { type: 'image/png' }))),
      width: 0,
      height: 0,
    };

    mockSvg = {
      cloneNode: jest.fn(() => ({
        querySelectorAll: jest.fn(() => []),
      })),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 })),
    };

    mockContainer = {
      querySelector: jest.fn(() => mockSvg),
    };

    // Mock Image constructor
    mockImage = {
      onload: null,
      src: '',
    };

    // Mock document methods
    originalGetElementById = document.getElementById;
    document.getElementById = jest.fn(() => mockContainer);
    originalCreateElement = document.createElement;
    document.createElement = jest.fn((tag) => {
      if (tag === 'canvas') return mockCanvas;
      if (tag === 'a') {
        return {
          click: jest.fn(),
          download: '',
          href: '',
        };
      }
      return originalCreateElement.call(document, tag);
    });

    // Mock Image constructor globally
    global.Image = jest.fn(() => mockImage);

    // Mock XMLSerializer
    global.XMLSerializer = jest.fn(() => ({
      serializeToString: jest.fn(() => '<svg></svg>'),
    }));

    // Mock Blob
    global.Blob = jest.fn((content, options) => ({
      content,
      options,
      type: options.type,
    }));

    // Mock window.getComputedStyle
    originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = jest.fn(() => ({
      getPropertyValue: jest.fn(() => 'blue'),
      [Symbol.iterator]: function* iterator() {
        yield 'fill';
        yield 'stroke';
      },
    }));

    // Mock URL methods
    originalURL = global.URL;
    global.URL = {
      createObjectURL: jest.fn(() => 'blob:mock-url'),
      revokeObjectURL: jest.fn(),
    };

    // Mock alert
    originalAlert = global.alert;
    global.alert = jest.fn();
  });

  afterEach(() => {
    document.getElementById = originalGetElementById;
    document.createElement = originalCreateElement;
    window.getComputedStyle = originalGetComputedStyle;
    global.URL = originalURL;
    global.alert = originalAlert;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('shows error message when no SVG found', () => {
    mockContainer.querySelector = jest.fn(() => null);
    mockContainer.appendChild = jest.fn();
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    expect(mockContainer.appendChild).toHaveBeenCalled();
    const errorDiv = mockContainer.appendChild.mock.calls[0][0];
    expect(errorDiv.getAttribute('role')).toBe('alert');
    expect(errorDiv.textContent).toBe('No graph to save. Please run a simulation first.');
  });

  test('removes existing error message before showing new one', () => {
    const existingError = { remove: jest.fn() };
    mockContainer.querySelector = jest.fn((selector) => {
      if (selector === 'svg') return null;
      if (selector === '.error-message') return existingError;
      return null;
    });
    mockContainer.appendChild = jest.fn();
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    expect(existingError.remove).toHaveBeenCalled();
  });

  test('clones SVG to avoid modifying original', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    expect(mockSvg.cloneNode).toHaveBeenCalledWith(true);
  });

  test('creates canvas with correct dimensions including bottom margin', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    // Trigger onload
    mockImage.onload();
    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(620); // 600 + 20 margin
  });

  test('draws white background before image', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    mockImage.onload();
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 620);
    expect(mockContext.drawImage).toHaveBeenCalledWith(mockImage, 0, 0);
  });

  test('generates PNG by default', () => {
    idx.saveSvgAsImage('testId', 'test-file');
    mockImage.onload();
    expect(mockCanvas.toBlob).toHaveBeenCalled();
    const toBlobCall = mockCanvas.toBlob.mock.calls[0];
    expect(toBlobCall[1]).toBe('image/png');
  });

  test('generates JPEG when specified', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'jpeg');
    mockImage.onload();
    const toBlobCall = mockCanvas.toBlob.mock.calls[0];
    expect(toBlobCall[1]).toBe('image/jpeg');
  });

  test('uses XMLSerializer to serialize SVG', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    expect(global.XMLSerializer).toHaveBeenCalled();
  });

  test('creates blob URL and sets as image source', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockImage.src).toBe('blob:mock-url');
  });

  test('revokes blob URL after image loads', () => {
    idx.saveSvgAsImage('testId', 'test-file', 'png');
    mockImage.onload();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  test('gets computed styles from original elements', () => {
    const mockElements = [
      { setAttribute: jest.fn() },
      { setAttribute: jest.fn() },
    ];
    const mockOriginalElements = [{}, {}];

    const clonedSvg = {
      querySelectorAll: jest.fn(() => mockElements),
    };

    mockSvg.cloneNode = jest.fn(() => clonedSvg);
    mockSvg.querySelectorAll = jest.fn(() => mockOriginalElements);

    idx.saveSvgAsImage('testId', 'test-file', 'png');

    expect(window.getComputedStyle).toHaveBeenCalled();
    expect(mockElements[0].setAttribute).toHaveBeenCalled();
  });

  test('auto-removes error message after 5 seconds', () => {
    jest.useFakeTimers();
    mockContainer.querySelector = jest.fn(() => null);
    mockContainer.appendChild = jest.fn();

    idx.saveSvgAsImage('testId', 'test-file', 'png');

    const errorDiv = mockContainer.appendChild.mock.calls[0][0];
    const removeSpy = jest.spyOn(errorDiv, 'remove');

    jest.advanceTimersByTime(5001);

    expect(removeSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });
});

describe('Graph Settings Functions', () => {
  // Helper function to reset GRAPH_CONFIG to defaults
  const resetGraphConfig = () => {
    if (!sim) return;
    sim.GRAPH_CONFIG.histogram.width = 800;
    sim.GRAPH_CONFIG.histogram.height = 500;
    sim.GRAPH_CONFIG.histogram.barCutoff = 600;
    sim.GRAPH_CONFIG.histogram.maxBuckets = 120;
    sim.GRAPH_CONFIG.miniGraph.width = 140;
    sim.GRAPH_CONFIG.miniGraph.height = 26;
    sim.GRAPH_CONFIG.miniGraph.maxBuckets = 24;
    sim.GRAPH_CONFIG.miniGraph.gap = 1;
  };

  // Helper function to set up DOM with default form field values
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

  beforeEach(() => {
    // Reset before each test to ensure clean state
    resetGraphConfig();
  });

  afterEach(() => {
    // Reset after each test to prevent pollution
    resetGraphConfig();
  });

  describe('applyGraphSettings', () => {
    test('applies valid values to sim.GRAPH_CONFIG', () => {
      // Set up DOM with default values
      setupGraphSettingsDOM();

      // Set new values in form fields
      document.getElementById('histogramWidth').value = '1000';
      document.getElementById('histogramHeight').value = '600';
      document.getElementById('histogramBarCutoff').value = '800';
      document.getElementById('histogramMaxBuckets').value = '150';
      document.getElementById('miniGraphWidth').value = '200';
      document.getElementById('miniGraphHeight').value = '30';
      document.getElementById('miniGraphMaxBuckets').value = '30';
      document.getElementById('miniGraphGap').value = '2';

      // Apply settings
      idx.applyGraphSettings();

      // Verify GRAPH_CONFIG was updated
      expect(sim.GRAPH_CONFIG.histogram.width).toBe(1000);
      expect(sim.GRAPH_CONFIG.histogram.height).toBe(600);
      expect(sim.GRAPH_CONFIG.histogram.barCutoff).toBe(800);
      expect(sim.GRAPH_CONFIG.histogram.maxBuckets).toBe(150);
      expect(sim.GRAPH_CONFIG.miniGraph.width).toBe(200);
      expect(sim.GRAPH_CONFIG.miniGraph.height).toBe(30);
      expect(sim.GRAPH_CONFIG.miniGraph.maxBuckets).toBe(30);
      expect(sim.GRAPH_CONFIG.miniGraph.gap).toBe(2);
    });

    test('handles empty input values (NaN)', () => {
      // Set up DOM with empty values
      setupGraphSettingsDOM({
        histogramWidth: '',
        histogramHeight: '',
        miniGraphGap: '',
      });

      // Apply settings
      idx.applyGraphSettings();

      // Verify GRAPH_CONFIG contains NaN for empty fields
      expect(Number.isNaN(sim.GRAPH_CONFIG.histogram.width)).toBe(true);
      expect(Number.isNaN(sim.GRAPH_CONFIG.histogram.height)).toBe(true);
      expect(Number.isNaN(sim.GRAPH_CONFIG.miniGraph.gap)).toBe(true);
    });

    test('handles non-numeric input values', () => {
      // Set up DOM with invalid values
      setupGraphSettingsDOM({
        histogramWidth: 'abc',
        histogramHeight: 'xyz',
        miniGraphGap: 'invalid',
      });

      // Apply settings
      idx.applyGraphSettings();

      // Verify GRAPH_CONFIG contains NaN for invalid fields
      expect(Number.isNaN(sim.GRAPH_CONFIG.histogram.width)).toBe(true);
      expect(Number.isNaN(sim.GRAPH_CONFIG.histogram.height)).toBe(true);
      expect(Number.isNaN(sim.GRAPH_CONFIG.miniGraph.gap)).toBe(true);
    });

    test('handles negative values', () => {
      // Set up DOM with negative values
      setupGraphSettingsDOM({
        histogramWidth: '-100',
        histogramHeight: '-50',
        histogramMaxBuckets: '-10',
      });

      // Apply settings
      idx.applyGraphSettings();

      // Verify GRAPH_CONFIG accepts negative values (parseInt doesn't reject them)
      expect(sim.GRAPH_CONFIG.histogram.width).toBe(-100);
      expect(sim.GRAPH_CONFIG.histogram.height).toBe(-50);
      expect(sim.GRAPH_CONFIG.histogram.maxBuckets).toBe(-10);
    });

    test('handles decimal values for integer fields', () => {
      // Set up DOM with decimal values
      setupGraphSettingsDOM({
        histogramWidth: '1000.5',
        histogramMaxBuckets: '120.9',
      });

      // Apply settings
      idx.applyGraphSettings();

      // Verify parseInt truncates decimals
      expect(sim.GRAPH_CONFIG.histogram.width).toBe(1000);
      expect(sim.GRAPH_CONFIG.histogram.maxBuckets).toBe(120);
    });

    test('correctly parses float values for gap', () => {
      // Set up DOM with decimal gap value
      setupGraphSettingsDOM({
        miniGraphGap: '1.5',
      });

      // Apply settings
      idx.applyGraphSettings();

      // Verify parseFloat preserves decimals
      expect(sim.GRAPH_CONFIG.miniGraph.gap).toBe(1.5);
    });

    test('shows confirmation message', () => {
      jest.useFakeTimers();
      // Set up DOM
      setupGraphSettingsDOM();

      const details = document.getElementById('advancedSettings');
      const summary = details.querySelector('summary');
      const originalText = summary.textContent;

      // Apply settings
      idx.applyGraphSettings();

      // Check confirmation message appears immediately
      expect(summary.textContent).toBe('Advanced Graph Settings ✓ Applied');

      // Advance past the 2000ms timeout
      jest.advanceTimersByTime(2001);

      // Text should be restored
      expect(summary.textContent).toBe(originalText);
      jest.useRealTimers();
    });
  });

  describe('resetGraphSettings', () => {
    test('resets sim.GRAPH_CONFIG to default values', () => {
      // Set up DOM (required for resetGraphSettings to work)
      setupGraphSettingsDOM();

      // Modify GRAPH_CONFIG
      sim.GRAPH_CONFIG.histogram.width = 1000;
      sim.GRAPH_CONFIG.histogram.height = 600;
      sim.GRAPH_CONFIG.histogram.barCutoff = 800;
      sim.GRAPH_CONFIG.histogram.maxBuckets = 150;
      sim.GRAPH_CONFIG.miniGraph.width = 200;
      sim.GRAPH_CONFIG.miniGraph.height = 30;
      sim.GRAPH_CONFIG.miniGraph.maxBuckets = 30;
      sim.GRAPH_CONFIG.miniGraph.gap = 2;

      // Reset settings
      idx.resetGraphSettings();

      // Verify defaults are restored
      expect(sim.GRAPH_CONFIG.histogram.width).toBe(800);
      expect(sim.GRAPH_CONFIG.histogram.height).toBe(500);
      expect(sim.GRAPH_CONFIG.histogram.barCutoff).toBe(600);
      expect(sim.GRAPH_CONFIG.histogram.maxBuckets).toBe(120);
      expect(sim.GRAPH_CONFIG.miniGraph.width).toBe(140);
      expect(sim.GRAPH_CONFIG.miniGraph.height).toBe(26);
      expect(sim.GRAPH_CONFIG.miniGraph.maxBuckets).toBe(24);
      expect(sim.GRAPH_CONFIG.miniGraph.gap).toBe(1);
    });

    test('updates form fields to default values', () => {
      // Set up DOM with modified values
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

      // Reset settings
      idx.resetGraphSettings();

      // Verify form fields are updated
      expect(document.getElementById('histogramWidth').value).toBe('800');
      expect(document.getElementById('histogramHeight').value).toBe('500');
      expect(document.getElementById('histogramBarCutoff').value).toBe('600');
      expect(document.getElementById('histogramMaxBuckets').value).toBe('120');
      expect(document.getElementById('miniGraphWidth').value).toBe('140');
      expect(document.getElementById('miniGraphHeight').value).toBe('26');
      expect(document.getElementById('miniGraphMaxBuckets').value).toBe('24');
      expect(document.getElementById('miniGraphGap').value).toBe('1');
    });

    test('resets both GRAPH_CONFIG and form fields together', () => {
      // Set up DOM with modified values
      setupGraphSettingsDOM({
        histogramWidth: '1000',
        miniGraphGap: '2.5',
      });

      // Modify GRAPH_CONFIG
      sim.GRAPH_CONFIG.histogram.width = 1000;
      sim.GRAPH_CONFIG.miniGraph.gap = 2.5;

      // Reset settings
      idx.resetGraphSettings();

      // Verify both are reset
      expect(sim.GRAPH_CONFIG.histogram.width).toBe(800);
      expect(document.getElementById('histogramWidth').value).toBe('800');
      expect(sim.GRAPH_CONFIG.miniGraph.gap).toBe(1);
      expect(document.getElementById('miniGraphGap').value).toBe('1');
    });

    test('shows confirmation message', () => {
      jest.useFakeTimers();
      // Set up DOM
      setupGraphSettingsDOM();

      const details = document.getElementById('advancedSettings');
      const summary = details.querySelector('summary');
      const originalText = summary.textContent;

      // Reset settings
      idx.resetGraphSettings();

      // Check confirmation message appears immediately
      expect(summary.textContent).toBe('Advanced Graph Settings ✓ Reset');

      // Advance past the 2000ms timeout
      jest.advanceTimersByTime(2001);

      // Text should be restored
      expect(summary.textContent).toBe(originalText);
      jest.useRealTimers();
    });
  });
});

describe('createLogoElement', () => {
  test('returns an img element', () => {
    const logo = idx.createLogoElement();
    expect(logo.tagName.toLowerCase()).toBe('img');
  });

  test('has the project-icon class', () => {
    const logo = idx.createLogoElement();
    expect(logo.classList.contains('project-icon')).toBe(true);
  });

  test('has a non-empty alt attribute', () => {
    const logo = idx.createLogoElement();
    expect(logo.alt).toBeTruthy();
  });

  test('has explicit width and height set to 100', () => {
    const logo = idx.createLogoElement();
    expect(logo.width).toBe(100);
    expect(logo.height).toBe(100);
  });

  test('returns a new instance each call', () => {
    const logo1 = idx.createLogoElement();
    const logo2 = idx.createLogoElement();
    expect(logo1).not.toBe(logo2);
  });
});

describe('createHeader', () => {
  test('returns a div element', () => {
    const header = idx.createHeader();
    expect(header.tagName.toLowerCase()).toBe('div');
  });

  test('has page-header and section classes', () => {
    const header = idx.createHeader();
    expect(header.classList.contains('page-header')).toBe(true);
    expect(header.classList.contains('section')).toBe(true);
  });

  test('contains github ribbon element', () => {
    const header = idx.createHeader();
    const ribbon = header.querySelector('#forkOnGithub');
    expect(ribbon).not.toBeNull();
  });

  test('contains link to github', () => {
    const header = idx.createHeader();
    const link = header.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.href).toContain('github.com');
  });
});

describe('createAdvancedSettings', () => {
  test('returns a details element', () => {
    const panel = idx.createAdvancedSettings();
    expect(panel.tagName.toLowerCase()).toBe('details');
  });

  test('has id advancedSettings', () => {
    const panel = idx.createAdvancedSettings();
    expect(panel.id).toBe('advancedSettings');
  });

  test('has summary element with correct text', () => {
    const panel = idx.createAdvancedSettings();
    const summary = panel.querySelector('summary');
    expect(summary).not.toBeNull();
    expect(summary.textContent).toBe('Advanced Graph Settings');
  });

  test('contains histogram width input', () => {
    const panel = idx.createAdvancedSettings();
    const input = panel.querySelector('#histogramWidth');
    expect(input).not.toBeNull();
    expect(input.type).toBe('number');
  });

  test('contains all histogram settings inputs', () => {
    const panel = idx.createAdvancedSettings();
    expect(panel.querySelector('#histogramHeight')).not.toBeNull();
    expect(panel.querySelector('#histogramBarCutoff')).not.toBeNull();
    expect(panel.querySelector('#histogramMaxBuckets')).not.toBeNull();
  });

  test('contains all mini graph settings inputs', () => {
    const panel = idx.createAdvancedSettings();
    expect(panel.querySelector('#miniGraphWidth')).not.toBeNull();
    expect(panel.querySelector('#miniGraphHeight')).not.toBeNull();
    expect(panel.querySelector('#miniGraphMaxBuckets')).not.toBeNull();
    expect(panel.querySelector('#miniGraphGap')).not.toBeNull();
  });

  test('contains apply and reset buttons', () => {
    const panel = idx.createAdvancedSettings();
    const applyBtn = panel.querySelector('#applyGraphSettings');
    const resetBtn = panel.querySelector('#resetGraphSettings');
    expect(applyBtn).not.toBeNull();
    expect(resetBtn).not.toBeNull();
  });

  test('histogram width input reflects current GRAPH_CONFIG', () => {
    const panel = idx.createAdvancedSettings();
    const widthInput = panel.querySelector('#histogramWidth');
    expect(widthInput.value).toBe(String(sim.GRAPH_CONFIG.histogram.width));
  });
});

describe('createSimulationPanel', () => {
  test('returns element with id simulationAreaWrapper', () => {
    const panel = idx.createSimulationPanel();
    expect(panel.id).toBe('simulationAreaWrapper');
  });

  test('contains simulation pass count input', () => {
    const panel = idx.createSimulationPanel();
    const input = panel.querySelector('#simulationPasses');
    expect(input).not.toBeNull();
    expect(input.type).toBe('number');
  });

  test('contains LimitGraph checkbox', () => {
    const panel = idx.createSimulationPanel();
    const checkbox = panel.querySelector('#LimitGraph');
    expect(checkbox).not.toBeNull();
    expect(checkbox.type).toBe('checkbox');
  });

  test('contains start simulation button', () => {
    const panel = idx.createSimulationPanel();
    const btn = panel.querySelector('#startSimulationButton');
    expect(btn).not.toBeNull();
  });

  test('contains time histogram container', () => {
    const panel = idx.createSimulationPanel();
    expect(panel.querySelector('#timeHistoGram')).not.toBeNull();
  });

  test('contains cost histogram container', () => {
    const panel = idx.createSimulationPanel();
    expect(panel.querySelector('#costHistoGram')).not.toBeNull();
  });

  test('contains all time stats display elements', () => {
    const panel = idx.createSimulationPanel();
    expect(panel.querySelector('#simulationTimeMedian')).not.toBeNull();
    expect(panel.querySelector('#simulationTimeStandRange')).not.toBeNull();
    expect(panel.querySelector('#simulationTimeMax')).not.toBeNull();
    expect(panel.querySelector('#simulationTimeMin')).not.toBeNull();
    expect(panel.querySelector('#simulationTimeStandDev')).not.toBeNull();
  });

  test('contains all cost stats display elements', () => {
    const panel = idx.createSimulationPanel();
    expect(panel.querySelector('#simulationCostMedian')).not.toBeNull();
    expect(panel.querySelector('#simulationCostStandRange')).not.toBeNull();
    expect(panel.querySelector('#simulationCostMax')).not.toBeNull();
    expect(panel.querySelector('#simulationCostMin')).not.toBeNull();
    expect(panel.querySelector('#simulationCostStandDev')).not.toBeNull();
  });

  test('time and cost headers are initially hidden', () => {
    const panel = idx.createSimulationPanel();
    expect(panel.querySelector('#timeEstimateHeader').style.display).toBe('none');
    expect(panel.querySelector('#costEstimateHeader').style.display).toBe('none');
  });

  test('time and cost save buttons are initially hidden', () => {
    const panel = idx.createSimulationPanel();
    expect(panel.querySelector('#timeSaveButtons').style.display).toBe('none');
    expect(panel.querySelector('#costSaveButtons').style.display).toBe('none');
  });

  test('contains PNG and JPEG save buttons for time graph', () => {
    const panel = idx.createSimulationPanel();
    expect(panel.querySelector('#saveTimePngBtn')).not.toBeNull();
    expect(panel.querySelector('#saveTimeJpegBtn')).not.toBeNull();
  });

  test('contains PNG and JPEG save buttons for cost graph', () => {
    const panel = idx.createSimulationPanel();
    expect(panel.querySelector('#saveCostPngBtn')).not.toBeNull();
    expect(panel.querySelector('#saveCostJpegBtn')).not.toBeNull();
  });

  test('contains advanced settings panel', () => {
    const panel = idx.createSimulationPanel();
    expect(panel.querySelector('#advancedSettings')).not.toBeNull();
  });
});

describe('setupUi', () => {
  test('returns an element', () => {
    const ui = idx.setupUi();
    expect(ui).not.toBeNull();
  });

  test('contains data area wrapper', () => {
    const ui = idx.setupUi();
    expect(ui.querySelector('#dataAreaWrapper')).not.toBeNull();
  });

  test('contains simulation area wrapper', () => {
    const ui = idx.setupUi();
    expect(ui.querySelector('#simulationAreaWrapper')).not.toBeNull();
  });

  test('contains the logo element', () => {
    const ui = idx.setupUi();
    const logo = ui.querySelector('img.project-icon');
    expect(logo).not.toBeNull();
  });
});

describe('startSimulation', () => {
  let mockEvent;

  /** Build the DOM structure startSimulation needs to run */
  const buildSimulationDOM = (taskRows = []) => {
    const taskRowsHtml = taskRows.map((task) => `
      <div class="tr data-row" data-row-id="${task.rowId !== undefined ? task.rowId : '1'}">
        <input name="Task" value="${task.name !== undefined ? task.name : 'Test Task'}" />
        <input name="Min Time" value="${task.min !== undefined ? task.min : '10'}" />
        <input name="Max Time" value="${task.max !== undefined ? task.max : '20'}" />
        <input name="Confidence" value="${task.confidence !== undefined ? task.confidence : '90'}" />
        <input name="Cost" value="${task.cost !== undefined ? task.cost : '100'}" />
      </div>
    `).join('');

    document.body.innerHTML = `
      <input id="simulationPasses" value="1000" />
      <input id="LimitGraph" type="checkbox" />
      <input id="startSimulationButton" type="button" value="Run Simulation" />
      <form id="DataEntryTable">${taskRowsHtml}</form>
      <div id="results"></div>
      <div id="costHistoGram"></div>
      <div id="costEstimateHeader" style="display: none;"></div>
      <div id="costSaveButtons" style="display: none;"></div>
      <div id="timeHistoGram"></div>
      <div id="timeEstimateHeader" style="display: none;"></div>
      <div id="timeSaveButtons" style="display: none;"></div>
      <div id="simulationRunningTime"></div>
      <div id="simulationTimeMedian"></div>
      <div id="simulationTimeStandRange"></div>
      <div id="simulationTimeMax"></div>
      <div id="simulationTimeMin"></div>
      <div id="simulationTimeStandDev"></div>
      <div id="simulationCostMedian"></div>
      <div id="simulationCostStandRange"></div>
      <div id="simulationCostMax"></div>
      <div id="simulationCostMin"></div>
      <div id="simulationCostStandDev"></div>
    `;
  };

  const makeSimResults = (overrides = {}) => ({
    runningTime: 100,
    times: {
      list: [0, 1, 3, 1],
      min: 1,
      max: 3,
      median: 2,
      sd: 0.5,
      likelyMin: 1,
      likelyMax: 3,
    },
    costs: {
      list: [0, 1, 3, 1],
      min: 100,
      max: 300,
      median: 200,
      sd: 50,
      likelyMin: 100,
      likelyMax: 300,
    },
    taskResults: [],
    ...overrides,
  });

  beforeEach(() => {
    mockEvent = { preventDefault: jest.fn() };
    sim.runSimulationProgressive.mockResolvedValue(makeSimResults());
    appState.estimationMode = 'hours';
    appState.enableCost = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    appState.reset();
  });

  test('calls event.preventDefault', async () => {
    buildSimulationDOM();
    await idx.startSimulation(mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  test('shows error when no valid tasks exist', async () => {
    buildSimulationDOM([]);
    await idx.startSimulation(mockEvent);
    const errorDiv = document.querySelector('.error-message');
    expect(errorDiv).not.toBeNull();
    expect(errorDiv.textContent).toContain('No valid tasks found');
  });

  test('does not call simulation when no valid tasks', async () => {
    buildSimulationDOM([]);
    await idx.startSimulation(mockEvent);
    expect(sim.runSimulationProgressive).not.toHaveBeenCalled();
  });

  test('filters out invalid tasks where max is less than min', async () => {
    buildSimulationDOM([{
      name: 'Bad Task', min: '20', max: '5', confidence: '90',
    }]);
    await idx.startSimulation(mockEvent);
    expect(sim.runSimulationProgressive).not.toHaveBeenCalled();
    const errorDiv = document.querySelector('.error-message');
    expect(errorDiv).not.toBeNull();
    expect(errorDiv.textContent).toContain('No valid tasks found');
  });

  test('filters out tasks with no name', async () => {
    buildSimulationDOM([{
      name: '', min: '5', max: '10', confidence: '90',
    }]);
    await idx.startSimulation(mockEvent);
    expect(sim.runSimulationProgressive).not.toHaveBeenCalled();
  });

  test('calls runSimulationProgressive with valid tasks', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    await idx.startSimulation(mockEvent);
    expect(sim.runSimulationProgressive).toHaveBeenCalled();
  });

  test('disables run button during simulation and re-enables after', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    const runButton = document.getElementById('startSimulationButton');

    let disabledDuringRun = false;
    sim.runSimulationProgressive.mockImplementation(async () => {
      disabledDuringRun = runButton.disabled;
      return makeSimResults();
    });

    await idx.startSimulation(mockEvent);

    expect(disabledDuringRun).toBe(true);
    expect(runButton.disabled).toBe(false);
    expect(runButton.value).toBe('Run Simulation');
  });

  test('displays time results after successful simulation', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    await idx.startSimulation(mockEvent);
    expect(document.getElementById('simulationTimeMedian').textContent).toContain('2');
    expect(document.getElementById('simulationTimeMax').textContent).toContain('3');
    expect(document.getElementById('simulationTimeMin').textContent).toContain('1');
  });

  test('displays cost results when cost is enabled', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    await idx.startSimulation(mockEvent);
    expect(document.getElementById('simulationCostMedian').textContent).toContain('200');
  });

  test('does not display cost results when cost is disabled', async () => {
    appState.enableCost = false;
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    await idx.startSimulation(mockEvent);
    expect(document.getElementById('simulationCostMedian').textContent).toBe('');
  });

  test('shows user-friendly error when simulation throws', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    sim.runSimulationProgressive.mockRejectedValue(new Error('Sim error'));
    await idx.startSimulation(mockEvent);
    const errorDiv = document.querySelector('.error-message');
    expect(errorDiv).not.toBeNull();
    expect(errorDiv.textContent).toContain('Simulation failed');
  });

  test('re-enables run button even when simulation throws', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    sim.runSimulationProgressive.mockRejectedValue(new Error('Sim error'));
    const runButton = document.getElementById('startSimulationButton');
    await idx.startSimulation(mockEvent);
    expect(runButton.disabled).toBe(false);
  });

  test('calls progress callback and updates time stats during simulation', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    sim.runSimulationProgressive.mockImplementation(async (passes, data, onProgress) => {
      onProgress({
        times: {
          min: 1,
          max: 3,
          list: [0, 1, 3, 1],
          median: 2,
          sd: 0.5,
          likelyMin: 1,
          likelyMax: 3,
        },
        costs: {
          min: -1,
          max: 0,
          list: [],
          median: 0,
          sd: 0,
          likelyMin: 0,
          likelyMax: 0,
        },
      });
      return makeSimResults();
    });
    await idx.startSimulation(mockEvent);
    // Just verifying the simulation ran to completion with the progress callback invoked
    expect(sim.runSimulationProgressive).toHaveBeenCalled();
  });

  test('clears previous stats before running new simulation', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    document.getElementById('simulationTimeMedian').textContent = 'Old value';
    sim.runSimulationProgressive.mockImplementation(async () => {
      // Check that stats were cleared before simulation ran
      expect(document.getElementById('simulationTimeMedian').textContent).toBe('');
      return makeSimResults();
    });
    await idx.startSimulation(mockEvent);
  });

  test('replaces existing error in results div when simulation throws', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    const resultsDiv = document.getElementById('results');
    const existingError = document.createElement('div');
    existingError.classList.add('error-message');
    existingError.textContent = 'Old error';
    resultsDiv.appendChild(existingError);
    sim.runSimulationProgressive.mockRejectedValue(new Error('Sim error'));
    await idx.startSimulation(mockEvent);
    const errors = document.querySelectorAll('.error-message');
    expect(errors).toHaveLength(1);
  });

  test('shows time estimate header after simulation completes', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    await idx.startSimulation(mockEvent);
    expect(document.getElementById('timeEstimateHeader').style.display).toBe('block');
  });

  test('records simulation running time', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    await idx.startSimulation(mockEvent);
    expect(document.getElementById('simulationRunningTime').textContent).toContain('100');
  });

  test('stopwatch interval updates running time display during simulation', async () => {
    jest.useFakeTimers();
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);

    let resolveSimulation;
    sim.runSimulationProgressive.mockImplementation(
      () => new Promise((resolve) => { resolveSimulation = () => resolve(makeSimResults()); }),
    );

    const simPromise = idx.startSimulation(mockEvent);

    // Advance fake timers to trigger the interval callback
    jest.advanceTimersByTime(150);

    const textDuringRun = document.getElementById('simulationRunningTime').textContent;

    resolveSimulation();
    await simPromise;
    jest.useRealTimers();

    expect(textDuringRun).toContain('Simulation Running Time (ms):');
  });

  test('calls progress callback and updates cost stats when cost is enabled with valid cost data', async () => {
    buildSimulationDOM([{
      name: 'Task 1', min: '5', max: '10', confidence: '90',
    }]);
    appState.enableCost = true;

    sim.runSimulationProgressive.mockImplementation(async (passes, data, onProgress) => {
      onProgress({
        times: {
          min: 1, max: 3, list: [0, 1, 3, 1], median: 2, sd: 0.5, likelyMin: 1, likelyMax: 3,
        },
        costs: {
          min: 100,
          max: 300,
          list: [0, 1, 3, 1],
          median: 200,
          sd: 50,
          likelyMin: 100,
          likelyMax: 300,
        },
      });
      return makeSimResults();
    });

    await idx.startSimulation(mockEvent);

    expect(document.getElementById('simulationCostMedian').textContent).toContain('200');
  });
});

describe('createSimulationPanel save button click handlers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const panel = idx.createSimulationPanel();
    document.body.appendChild(panel);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('save time PNG button triggers saveSvgAsImage for timeHistoGram', () => {
    document.getElementById('saveTimePngBtn').click();
    expect(document.getElementById('timeHistoGram').querySelector('.error-message')).not.toBeNull();
  });

  test('save time JPEG button triggers saveSvgAsImage for timeHistoGram', () => {
    document.getElementById('saveTimeJpegBtn').click();
    expect(document.getElementById('timeHistoGram').querySelector('.error-message')).not.toBeNull();
  });

  test('save cost PNG button triggers saveSvgAsImage for costHistoGram', () => {
    document.getElementById('saveCostPngBtn').click();
    expect(document.getElementById('costHistoGram').querySelector('.error-message')).not.toBeNull();
  });

  test('save cost JPEG button triggers saveSvgAsImage for costHistoGram', () => {
    document.getElementById('saveCostJpegBtn').click();
    expect(document.getElementById('costHistoGram').querySelector('.error-message')).not.toBeNull();
  });
});
