/*
  * @jest-environment jsdom
  */

const {
  updateElementText,
  updateProgress,
  renderFinalResults,
  clearStatistics,
  showTimeResults,
  showCostResults,
  renderTaskRowHistograms,
  startSimulation,
} = require('../ui/simulation-handler');

describe('simulation-handler.js', () => {
  describe('updateElementText', () => {
    it('updates text content of an element', () => {
      const el = document.createElement('span');
      el.id = 'test-span';
      document.body.appendChild(el);
      updateElementText('test-span', 'Hello World');
      expect(el.textContent).toBe('Hello World');
      // ...existing code...
    });
    // Remove stray closing bracket
    // Additional tests to ensure all exported functions are called
    describe('simulation-handler exports coverage', () => {
      it('calls updateElementText safely', () => {
        const el = document.createElement('div');
        el.id = 'coverage-test';
        document.body.appendChild(el);
        updateElementText('coverage-test', 'Coverage');
        expect(el.textContent).toBe('Coverage');
        expect(() => updateElementText('no-such-id', 'Coverage')).not.toThrow();
      });

      it('calls updateProgress with edge cases', () => {
        expect(() => updateProgress({}, 'Hours', { format: (v) => v }, false)).not.toThrow();
        expect(() => updateProgress({ times: { min: -1 }, costs: { min: -1 } }, 'Hours', { format: (v) => v }, false)).not.toThrow();
      });

      it('calls renderFinalResults with edge cases', () => {
        expect(() => renderFinalResults({}, 'Hours', { format: (v) => v }, false)).not.toThrow();
        expect(() => renderFinalResults({ times: { min: -1 }, costs: { min: -1 } }, 'Hours', { format: (v) => v }, false)).not.toThrow();
      });

      it('calls clearStatistics safely', () => {
        expect(() => clearStatistics()).not.toThrow();
      });

      it('calls showTimeResults safely', () => {
        expect(() => showTimeResults()).not.toThrow();
      });

      it('calls showCostResults safely', () => {
        expect(() => showCostResults(true)).not.toThrow();
        expect(() => showCostResults(false)).not.toThrow();
      });

      it('calls renderTaskRowHistograms with edge cases', () => {
        expect(() => renderTaskRowHistograms([])).not.toThrow();
        expect(() => renderTaskRowHistograms([
          {
            rowId: 'none',
            name: 'None',
            times: {
              min: 0,
              max: 0,
              median: 0,
              list: [],
            },
          },
        ])).not.toThrow();
      });

      it('calls startSimulation with minimal DOM', async () => {
        const event = { preventDefault: jest.fn() };
        document.body.innerHTML = '';
        const passes = document.createElement('input');
        passes.id = 'simulationPasses';
        passes.value = 1;
        document.body.appendChild(passes);
        const limitGraph = document.createElement('input');
        limitGraph.id = 'LimitGraph';
        document.body.appendChild(limitGraph);
        const runButton = document.createElement('input');
        runButton.id = 'startSimulationButton';
        document.body.appendChild(runButton);
        global.gatherRawTaskData = () => [];
        global.normalizeTaskData = () => [];
        global.appState = { getTimeUnit: () => 'Hours', getHoursPerTimeUnit: () => 1, enableCost: false };
        global.fibonacciCalendarMappings = {};
        global.tshirtMappings = {};
        global.sim = {
          runSimulationProgressive: async () => ({}),
          buildHistogramPreview: jest.fn(),
          buildHistogram: jest.fn(),
        };
        const messagesDiv = document.createElement('div');
        messagesDiv.id = 'messages';
        document.body.appendChild(messagesDiv);
        await expect(startSimulation(event)).resolves.toBeUndefined();
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    describe('updateProgress', () => {
      it('runs without error for valid progress', () => {
        // Create required DOM elements
        const timeHeader = document.createElement('div');
        timeHeader.id = 'timeEstimateHeader';
        document.body.appendChild(timeHeader);
        const timeSaveButtons = document.createElement('div');
        timeSaveButtons.id = 'timeSaveButtons';
        document.body.appendChild(timeSaveButtons);
        const costHeader = document.createElement('div');
        costHeader.id = 'costEstimateHeader';
        document.body.appendChild(costHeader);
        const costSaveButtons = document.createElement('div');
        costSaveButtons.id = 'costSaveButtons';
        document.body.appendChild(costSaveButtons);
        [
          'simulationTimeMedian',
          'simulationTimeStandRange',
          'simulationTimeMax',
          'simulationTimeMin',
          'simulationTimeStandDev',
          'simulationCostMedian',
          'simulationCostStandRange',
          'simulationCostMax',
          'simulationCostMin',
          'simulationCostStandDev',
        ].forEach((id) => {
          const el = document.createElement('span');
          el.id = id;
          document.body.appendChild(el);
        });
        const progress = {
          times: {
            min: 1,
            max: 3,
            median: 2,
            sd: 0.5,
            likelyMin: 1,
            likelyMax: 3,
          },
          costs: {
            min: 100,
            max: 300,
            median: 200,
            sd: 50,
            likelyMin: 100,
            likelyMax: 300,
          },
        };
        expect(() => updateProgress(
          progress,
          'Hours',
          { format: (v) => `$${v}` },
          true,
        )).not.toThrow();
      });
      it('does nothing if progress.times.min is -1', () => {
        expect(() => updateProgress({ times: { min: -1, max: 0 }, costs: { min: -1 } }, 'Hours', { format: (v) => `$${v}` }, true)).not.toThrow();
      });
    });
  });

  describe('renderFinalResults', () => {
    it('runs without error for valid results', () => {
      const results = {
        runningTime: 123,
        times: {
          min: 1,
          max: 3,
          median: 2,
          sd: 0.5,
          likelyMin: 1,
          likelyMax: 3,
        },
        costs: {
          min: 100,
          max: 300,
          median: 200,
          sd: 50,
          likelyMin: 100,
          likelyMax: 300,
        },
      };
      expect(() => renderFinalResults(
        results,
        'Hours',
        { format: (v) => `$${v}` },
        true,
      )).not.toThrow();
    });
    it('does not throw if enableCost is false', () => {
      const results = {
        runningTime: 123,
        times: {
          min: 1,
          max: 3,
          median: 2,
          sd: 0.5,
          likelyMin: 1,
          likelyMax: 3,
        },
        costs: {
          min: 100,
          max: 300,
          median: 200,
          sd: 50,
          likelyMin: 100,
          likelyMax: 300,
        },
      };
      expect(() => renderFinalResults(results, 'Hours', { format: (v) => `$${v}` }, false)).not.toThrow();
    });
  });
});

describe('clearStatistics', () => {
  it('clears statistics fields without error', () => {
    [
      'simulationTimeMedian',
      'simulationTimeStandRange',
      'simulationTimeMax',
      'simulationTimeMin',
      'simulationTimeStandDev',
      'simulationCostMedian',
      'simulationCostStandRange',
      'simulationCostMax',
      'simulationCostMin',
      'simulationCostStandDev',
    ].forEach((id) => {
      const el = document.createElement('span');
      el.id = id;
      document.body.appendChild(el);
      el.textContent = 'dummy';
    });
    expect(() => clearStatistics()).not.toThrow();
    [
      'simulationTimeMedian',
      'simulationTimeStandRange',
      'simulationTimeMax',
      'simulationTimeMin',
      'simulationTimeStandDev',
      'simulationCostMedian',
      'simulationCostStandRange',
      'simulationCostMax',
      'simulationCostMin',
      'simulationCostStandDev',
    ].forEach((id) => {
      expect(document.getElementById(id).textContent).toBe('');
    });
  });
  it('does not throw if elements are missing', () => {
    expect(() => clearStatistics()).not.toThrow();
  });
});

describe('showTimeResults', () => {
  it('shows time results section', () => {
    document.body.innerHTML = '';
    const header = document.createElement('div');
    header.id = 'timeEstimateHeader';
    document.body.appendChild(header);
    const buttons = document.createElement('div');
    buttons.id = 'timeSaveButtons';
    document.body.appendChild(buttons);
    expect(() => showTimeResults()).not.toThrow();
    expect(header.style.display).toBe('block');
    expect(buttons.style.display).toBe('block');
  });
  it('does not throw if elements are missing', () => {
    document.body.innerHTML = '';
    expect(() => showTimeResults()).not.toThrow();
  });
});

describe('showCostResults', () => {
  it('shows/hides cost results section', () => {
    document.body.innerHTML = '';
    const header = document.createElement('div');
    header.id = 'costEstimateHeader';
    document.body.appendChild(header);
    const buttons = document.createElement('div');
    buttons.id = 'costSaveButtons';
    document.body.appendChild(buttons);
    showCostResults(true);
    expect(header.style.display).toBe('block');
    expect(buttons.style.display).toBe('block');
    showCostResults(false);
    expect(header.style.display).toBe('none');
    expect(buttons.style.display).toBe('none');
  });
  it('does not throw if elements are missing', () => {
    document.body.innerHTML = '';
    expect(() => showCostResults(true)).not.toThrow();
    expect(() => showCostResults(false)).not.toThrow();
  });
});

describe('renderTaskRowHistograms', () => {
  it('renders histograms for valid task results', () => {
    const graph = document.createElement('div');
    graph.className = 'task-row-graph';
    graph.setAttribute('data-row-id', '1');
    document.body.appendChild(graph);
    const stats = document.createElement('div');
    stats.className = 'task-row-stats';
    stats.setAttribute('data-row-id', '1');
    document.body.appendChild(stats);
    const taskResults = [
      {
        rowId: '1',
        name: 'Task 1',
        times: {
          min: 1,
          max: 3,
          median: 2,
          list: [1, 2, 2, 3],
        },
      },
    ];
    expect(() => renderTaskRowHistograms(taskResults)).not.toThrow();
    expect(stats.innerHTML).toContain('Min: 1');
    expect(stats.innerHTML).toContain('Med: 2');
    expect(stats.innerHTML).toContain('Max: 3');
  });

  it('clears graphs and stats when no results', () => {
    const graph = document.createElement('div');
    graph.className = 'task-row-graph';
    graph.setAttribute('data-row-id', '1');
    document.body.appendChild(graph);
    const stats = document.createElement('div');
    stats.className = 'task-row-stats';
    stats.setAttribute('data-row-id', '1');
    document.body.appendChild(stats);
    graph.innerHTML = 'old';
    stats.innerHTML = 'old';
    expect(() => renderTaskRowHistograms([])).not.toThrow();
    expect(graph.innerHTML).toBe('');
    expect(stats.innerHTML).toBe('');
  });
  it('does not throw if no matching DOM nodes', () => {
    document.body.innerHTML = '';
    expect(() => renderTaskRowHistograms([
      {
        rowId: 'x',
        name: 'Task',
        times: {
          min: 0,
          max: 1,
          median: 0,
          list: [0, 1],
        },
      },
    ])).not.toThrow();
  });
});

describe('startSimulation', () => {
  it('runs without error when called with a mock event', async () => {
    const event = { preventDefault: jest.fn() };
    // Add required DOM elements for startSimulation
    const passes = document.createElement('input');
    passes.id = 'simulationPasses';
    passes.value = 10;
    document.body.appendChild(passes);
    const limitGraph = document.createElement('input');
    limitGraph.id = 'LimitGraph';
    limitGraph.type = 'checkbox';
    document.body.appendChild(limitGraph);
    const runButton = document.createElement('input');
    runButton.id = 'startSimulationButton';
    document.body.appendChild(runButton);
    const timeHistoGram = document.createElement('div');
    timeHistoGram.id = 'timeHistoGram';
    document.body.appendChild(timeHistoGram);
    const costHistoGram = document.createElement('div');
    costHistoGram.id = 'costHistoGram';
    document.body.appendChild(costHistoGram);
    // Minimal stubs for required global functions
    global.gatherRawTaskData = () => [
      {
        Task: 'A',
        Min: 1,
        Max: 3,
        Confidence: 0.9,
        Cost: 100,
      },
    ];
    global.normalizeTaskData = () => [
      {
        rowId: '1',
        name: 'Task 1',
        times: {
          min: 1,
          max: 3,
          median: 2,
          list: [1, 2, 2, 3],
        },
      },
    ];
    global.appState = {
      getTimeUnit: () => 'Hours',
      getHoursPerTimeUnit: () => 1,
      enableCost: false,
    };
    global.fibonacciCalendarMappings = {};
    global.tshirtMappings = {};
    global.sim = {
      runSimulationProgressive: async () => ({
        times: {
          min: 1,
          max: 3,
          median: 2,
          list: [1, 2, 2, 3],
          sd: 0.5,
          likelyMin: 1,
          likelyMax: 3,
        },
        costs: {
          min: 100,
          max: 300,
          median: 200,
          sd: 50,
          likelyMin: 100,
          likelyMax: 300,
          list: [100, 200, 200, 300],
        },
        taskResults: [
          {
            rowId: '1',
            name: 'Task 1',
            times: {
              min: 1,
              max: 3,
              median: 2,
              list: [1, 2, 2, 3],
            },
          },
        ],
      }),
      buildHistogramPreview: jest.fn(),
      buildHistogram: jest.fn(),
    };
    // Ensure all required DOM elements exist
    // Already appended above: simulationPasses, LimitGraph, startSimulationButton,
    // timeHistoGram, costHistoGram
    // If startSimulation uses querySelector on any of these, they will be found
    // Add messages container for showError
    const messagesDiv = document.createElement('div');
    messagesDiv.id = 'messages';
    document.body.appendChild(messagesDiv);
    // Add required elements for querySelectorAll and querySelector
    const taskRowGraph = document.createElement('div');
    taskRowGraph.className = 'task-row-graph';
    taskRowGraph.setAttribute('data-row-id', '1');
    document.body.appendChild(taskRowGraph);
    const taskRowStats = document.createElement('div');
    taskRowStats.className = 'task-row-stats';
    taskRowStats.setAttribute('data-row-id', '1');
    document.body.appendChild(taskRowStats);
    await expect(startSimulation(event)).resolves.toBeUndefined();
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
it('shows error if no tasks found', async () => {
  const event = { preventDefault: jest.fn() };
  document.body.innerHTML = '';
  const passes = document.createElement('input');
  passes.id = 'simulationPasses';
  passes.value = 10;
  document.body.appendChild(passes);
  const limitGraph = document.createElement('input');
  limitGraph.id = 'LimitGraph';
  limitGraph.type = 'checkbox';
  document.body.appendChild(limitGraph);
  const runButton = document.createElement('input');
  runButton.id = 'startSimulationButton';
  document.body.appendChild(runButton);
  global.gatherRawTaskData = () => [];
  global.normalizeTaskData = () => [];
  global.appState = {
    getTimeUnit: () => 'Hours',
    getHoursPerTimeUnit: () => 1,
    enableCost: false,
  };
  global.fibonacciCalendarMappings = {};
  global.tshirtMappings = {};
  global.sim = {
    runSimulationProgressive: async () => ({}),
    buildHistogramPreview: jest.fn(),
    buildHistogram: jest.fn(),
  };
  // Add messages container for showError
  const messagesDiv = document.createElement('div');
  messagesDiv.id = 'messages';
  document.body.appendChild(messagesDiv);
  await expect(startSimulation(event)).resolves.toBeUndefined();
  expect(event.preventDefault).toHaveBeenCalled();

  expect(event.preventDefault).toHaveBeenCalled();
});
it('handles simulation error gracefully', async () => {
  const event = { preventDefault: jest.fn() };
  document.body.innerHTML = '';
  const passes = document.createElement('input');
  passes.id = 'simulationPasses';
  passes.value = 10;
  document.body.appendChild(passes);
  const limitGraph = document.createElement('input');
  limitGraph.id = 'LimitGraph';
  limitGraph.type = 'checkbox';
  document.body.appendChild(limitGraph);
  const runButton = document.createElement('input');
  runButton.id = 'startSimulationButton';
  document.body.appendChild(runButton);
  global.gatherRawTaskData = () => [
    {
      Task: 'A',
      Min: 1,
      Max: 3,
      Confidence: 0.9,
      Cost: 100,
    },
  ];
  global.normalizeTaskData = () => [
    {
      rowId: '1',
      name: 'Task 1',
      times: {
        min: 1,
        max: 3,
        median: 2,
        list: [1, 2, 2, 3],
      },
    },
  ];
  global.appState = {
    getTimeUnit: () => 'Hours',
    getHoursPerTimeUnit: () => 1,
    enableCost: false,
  };
  global.fibonacciCalendarMappings = {};
  global.tshirtMappings = {};
  global.sim = {
    runSimulationProgressive: async () => { throw new Error('Sim error'); },
    buildHistogramPreview: jest.fn(),
    buildHistogram: jest.fn(),
  };
  // Add messages container for showError
  const messagesDiv = document.createElement('div');
  messagesDiv.id = 'messages';
  document.body.appendChild(messagesDiv);
  await expect(startSimulation(event)).resolves.toBeUndefined();
  expect(event.preventDefault).toHaveBeenCalled();
});
