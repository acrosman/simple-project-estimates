/**
 * @jest-environment jsdom
 */

import * as idx from '../index';
import * as sim from '../simulation';

describe('Index Module Exports', () => {
  test('Validate exported functions exist', () => {
    expect(idx).toHaveProperty('createTextElement');
    expect(idx).toHaveProperty('createLabeledInput');
    expect(idx).toHaveProperty('createDivWithIdAndClasses');
    expect(idx).toHaveProperty('generateDataField');
    expect(idx).toHaveProperty('updateElementText');
    expect(idx).toHaveProperty('renderTaskRowHistograms');
    expect(idx).toHaveProperty('isRowEmpty');
    expect(idx).toHaveProperty('normalizeTshirtSize');
    expect(idx).toHaveProperty('updateFibonacciCalendarMapping');
    expect(idx).toHaveProperty('updateTshirtMapping');
    expect(idx).toHaveProperty('handleFibonacciModeChange');
    expect(idx).toHaveProperty('handleVelocityConfigChange');
    expect(idx).toHaveProperty('applyGraphSettings');
    expect(idx).toHaveProperty('resetGraphSettings');
    expect(idx).toHaveProperty('createLogoElement');
  });

  test('Validate exported state exists', () => {
    expect(idx).toHaveProperty('getEstimationMode');
    expect(idx).toHaveProperty('fibonacciCalendarMappings');
    expect(idx).toHaveProperty('tshirtMappings');
    expect(idx).toHaveProperty('getEnableCost');
    expect(idx).toHaveProperty('appState');
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

    test('shows confirmation message', (done) => {
      // Set up DOM
      setupGraphSettingsDOM();

      const details = document.getElementById('advancedSettings');
      const summary = details.querySelector('summary');
      const originalText = summary.textContent;

      // Apply settings
      idx.applyGraphSettings();

      // Check confirmation message appears
      expect(summary.textContent).toBe('Advanced Graph Settings ✓ Applied');

      // Wait for timeout to restore original text
      setTimeout(() => {
        expect(summary.textContent).toBe(originalText);
        done();
      }, 2100);
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

    test('shows confirmation message', (done) => {
      // Set up DOM
      setupGraphSettingsDOM();

      const details = document.getElementById('advancedSettings');
      const summary = details.querySelector('summary');
      const originalText = summary.textContent;

      // Reset settings
      idx.resetGraphSettings();

      // Check confirmation message appears
      expect(summary.textContent).toBe('Advanced Graph Settings ✓ Reset');

      // Wait for timeout to restore original text
      setTimeout(() => {
        expect(summary.textContent).toBe(originalText);
        done();
      }, 2100);
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
