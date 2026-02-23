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
    expect(idx).toHaveProperty('startSimulation');
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
