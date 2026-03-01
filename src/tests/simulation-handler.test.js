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
      // Already appended above: simulationPasses, LimitGraph, startSimulationButton, timeHistoGram, costHistoGram
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
});
