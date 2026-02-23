/**
 * @jest-environment jsdom
 */

import {
  createLogoElement,
  createHeader,
  createSimulationPanel,
  setupUi,
} from '../ui/layout';
// import * as idx from '../index';
import * as exportUtils from '../utils/export-utils';

jest.mock('../index', () => ({
  startSimulation: jest.fn(),
}));

jest.mock('../utils/export-utils', () => jest.fn());

describe('Layout Module Exports', () => {
  test('Validate exported functions exist', () => {
    expect(createLogoElement).toBeDefined();
    expect(createHeader).toBeDefined();
    expect(createSimulationPanel).toBeDefined();
    expect(setupUi).toBeDefined();
  });
});

describe('createLogoElement', () => {
  test('returns an img element', () => {
    const el = createLogoElement();
    expect(el.tagName).toBe('IMG');
  });

  test('has the project-icon class', () => {
    const el = createLogoElement();
    expect(el.classList.contains('project-icon')).toBe(true);
  });

  test('has a non-empty alt attribute', () => {
    const el = createLogoElement();
    expect(el.alt).toBeTruthy();
    expect(el.alt.length).toBeGreaterThan(0);
  });

  test('has explicit width and height set to 100', () => {
    const el = createLogoElement();
    expect(el.width).toBe(100);
    expect(el.height).toBe(100);
  });

  test('returns a new instance each call', () => {
    const el1 = createLogoElement();
    const el2 = createLogoElement();
    expect(el1).not.toBe(el2);
  });
});

describe('createHeader', () => {
  test('returns a div element', () => {
    const el = createHeader();
    expect(el.tagName).toBe('DIV');
  });

  test('has page-header and section classes', () => {
    const el = createHeader();
    expect(el.classList.contains('page-header')).toBe(true);
    expect(el.classList.contains('section')).toBe(true);
  });

  test('contains github ribbon element', () => {
    const el = createHeader();
    const ribbon = el.querySelector('#forkOnGithub.github-ribbon');
    expect(ribbon).not.toBeNull();
  });

  test('contains link to github', () => {
    const el = createHeader();
    const link = el.querySelector('a');
    expect(link).not.toBeNull();
    expect(link.href).toContain('github.com');
  });
});

describe('createSimulationPanel', () => {
  test('returns element with id simulationAreaWrapper', () => {
    const el = createSimulationPanel();
    expect(el.id).toBe('simulationAreaWrapper');
  });

  test('contains simulation pass count input', () => {
    const el = createSimulationPanel();
    const input = el.querySelector('#simulationPasses');
    expect(input).not.toBeNull();
    expect(input.type).toBe('number');
  });

  test('contains LimitGraph checkbox', () => {
    const el = createSimulationPanel();
    const input = el.querySelector('#LimitGraph');
    expect(input).not.toBeNull();
    expect(input.type).toBe('checkbox');
  });

  test('contains start simulation button', () => {
    const el = createSimulationPanel();
    const btn = el.querySelector('#startSimulationButton');
    expect(btn).not.toBeNull();
    expect(btn.type).toBe('button');
  });

  test('contains time histogram container', () => {
    const el = createSimulationPanel();
    const container = el.querySelector('#timeHistoGram');
    expect(container).not.toBeNull();
  });

  test('contains cost histogram container', () => {
    const el = createSimulationPanel();
    const container = el.querySelector('#costHistoGram');
    expect(container).not.toBeNull();
  });

  test('contains all time stats display elements', () => {
    const el = createSimulationPanel();
    expect(el.querySelector('#simulationTimeMedian')).not.toBeNull();
    expect(el.querySelector('#simulationTimeStandRange')).not.toBeNull();
    expect(el.querySelector('#simulationTimeMax')).not.toBeNull();
    expect(el.querySelector('#simulationTimeMin')).not.toBeNull();
    expect(el.querySelector('#simulationTimeStandDev')).not.toBeNull();
  });

  test('contains all cost stats display elements', () => {
    const el = createSimulationPanel();
    expect(el.querySelector('#simulationCostMedian')).not.toBeNull();
    expect(el.querySelector('#simulationCostStandRange')).not.toBeNull();
    expect(el.querySelector('#simulationCostMax')).not.toBeNull();
    expect(el.querySelector('#simulationCostMin')).not.toBeNull();
    expect(el.querySelector('#simulationCostStandDev')).not.toBeNull();
  });

  test('time and cost headers are initially hidden', () => {
    const el = createSimulationPanel();
    expect(el.querySelector('#timeEstimateHeader').style.display).toBe('none');
    expect(el.querySelector('#costEstimateHeader').style.display).toBe('none');
  });

  test('time and cost save buttons are initially hidden', () => {
    const el = createSimulationPanel();
    expect(el.querySelector('#timeSaveButtons').style.display).toBe('none');
    expect(el.querySelector('#costSaveButtons').style.display).toBe('none');
  });

  test('contains PNG and JPEG save buttons for time graph', () => {
    const el = createSimulationPanel();
    expect(el.querySelector('#saveTimePngBtn')).not.toBeNull();
    expect(el.querySelector('#saveTimeJpegBtn')).not.toBeNull();
  });

  test('contains PNG and JPEG save buttons for cost graph', () => {
    const el = createSimulationPanel();
    expect(el.querySelector('#saveCostPngBtn')).not.toBeNull();
    expect(el.querySelector('#saveCostJpegBtn')).not.toBeNull();
  });

  test('contains advanced settings panel', () => {
    const el = createSimulationPanel();
    expect(el.querySelector('#advancedSettings')).not.toBeNull();
  });
});

describe('createSimulationPanel save button click handlers', () => {
  let panel;

  beforeEach(() => {
    jest.clearAllMocks();
    panel = createSimulationPanel();
    document.body.appendChild(panel);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('save time PNG button triggers saveSvgAsImage for timeHistoGram', () => {
    const btn = document.getElementById('saveTimePngBtn');
    btn.click();
    expect(exportUtils.default).toHaveBeenCalledWith('timeHistoGram', 'time-estimates', 'png');
  });

  test('save time JPEG button triggers saveSvgAsImage for timeHistoGram', () => {
    const btn = document.getElementById('saveTimeJpegBtn');
    btn.click();
    expect(exportUtils.default).toHaveBeenCalledWith('timeHistoGram', 'time-estimates', 'jpeg');
  });

  test('save cost PNG button triggers saveSvgAsImage for costHistoGram', () => {
    const btn = document.getElementById('saveCostPngBtn');
    btn.click();
    expect(exportUtils.default).toHaveBeenCalledWith('costHistoGram', 'cost-estimates', 'png');
  });

  test('save cost JPEG button triggers saveSvgAsImage for costHistoGram', () => {
    const btn = document.getElementById('saveCostJpegBtn');
    btn.click();
    expect(exportUtils.default).toHaveBeenCalledWith('costHistoGram', 'cost-estimates', 'jpeg');
  });
});

describe('setupUi', () => {
  test('returns a main container div', () => {
    const el = setupUi();
    expect(el.tagName).toBe('DIV');
  });

  test('contains header section', () => {
    const el = setupUi();
    expect(el.querySelector('.page-header')).not.toBeNull();
  });

  test('contains data area wrapper', () => {
    const el = setupUi();
    expect(el.querySelector('#dataAreaWrapper')).not.toBeNull();
  });

  test('contains simulation panel', () => {
    const el = setupUi();
    expect(el.querySelector('#simulationAreaWrapper')).not.toBeNull();
  });

  test('contains mode selector and logo wrapper', () => {
    const el = setupUi();
    expect(el.querySelector('.mode-selector-logo-wrapper')).not.toBeNull();
  });
});
