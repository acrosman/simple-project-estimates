import './style.css';
import * as sim from './core/simulation';
import { appState, fibonacciCalendarMappings, tshirtMappings } from './core/state';
import { applyGraphSettings, resetGraphSettings } from './ui/graph-settings';
import { gatherRawTaskData, normalizeTaskData } from './ui/task-table';
import { setupUi } from './ui/layout';
import {
  showError,
} from './utils/dom-helpers';

/**
 * Helper function to replace all of a node's content with new text.
 * @param {*} id Element ID for search.
 * @param {*} content A string to place into the element.
 */
function updateElementText(id, content) {
  const el = document.getElementById(id);
  el.textContent = content;
}

/**
 * Renders mini histograms for all task rows from simulation output.
 * @param {Array} taskResults Per-task simulation results.
 */
function renderTaskRowHistograms(taskResults) {
  const rowGraphs = document.querySelectorAll('.task-row-graph');
  for (const graphNode of rowGraphs) {
    graphNode.innerHTML = '';
  }

  const rowStats = document.querySelectorAll('.task-row-stats');
  for (const statsNode of rowStats) {
    statsNode.innerHTML = '';
  }

  if (!taskResults || taskResults.length < 1) {
    return;
  }

  // Determine time unit based on estimation mode
  const timeUnit = appState.getTimeUnit().toLowerCase();

  for (const taskResult of taskResults) {
    const graphNode = document.querySelector(`.task-row-graph[data-row-id="${taskResult.rowId}"]`);
    if (graphNode) {
      sim.buildTaskRowHistogram(
        graphNode,
        taskResult.times.list,
        taskResult.times.min,
        taskResult.times.max,
        taskResult.name,
      );
    }

    // Add statistics display
    const statsNode = document.querySelector(`.task-row-stats[data-row-id="${taskResult.rowId}"]`);
    if (statsNode) {
      statsNode.innerHTML = `Min: ${taskResult.times.min} | Med: ${taskResult.times.median} | Max: ${taskResult.times.max} ${timeUnit}`;
    }
  }
}

/**
 * Triggers the start of the simulation run with the current values.
 * @param {Event} event
 */
async function startSimulation(event) {
  event.preventDefault();
  const passCount = document.getElementById('simulationPasses').value;
  const graphSetting = document.getElementById('LimitGraph').checked;

  // Clear any previous task-level graphs immediately for this run.
  renderTaskRowHistograms([]);

  // Gather and normalize task data.
  const rawTasks = gatherRawTaskData();
  const data = normalizeTaskData(
    rawTasks,
    appState,
    fibonacciCalendarMappings,
    tshirtMappings,
    sim.fibonacciToCalendarDays,
    sim.fibonacciToVelocityDays,
  );

  // Validate we have at least one task
  if (data.length === 0) {
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
      showError(resultsDiv, 'No valid tasks found. Please ensure all tasks have valid values: name, min >= 0, max >= min, and confidence between 0-100%.', 0);
    }
    return;
  }

  // Determine the correct time unit based on estimation mode
  const timeUnit = appState.getTimeUnit();
  // When using days, need to multiply hourly cost by 8 hours/day
  const hoursPerTimeUnit = appState.getHoursPerTimeUnit();

  const runButton = document.getElementById('startSimulationButton');
  const runStartTime = Date.now();
  const updateRunningTimeDisplay = (runningTime) => {
    updateElementText('simulationRunningTime', `Simulation Running Time (ms): ${runningTime}`);
  };
  const stopwatchInterval = setInterval(() => {
    updateRunningTimeDisplay(Date.now() - runStartTime);
  }, 100);

  if (runButton) {
    runButton.disabled = true;
    runButton.value = 'Running...';
  }

  updateRunningTimeDisplay(0);

  // Clear previous statistics at the start of a new simulation
  updateElementText('simulationTimeMedian', '');
  updateElementText('simulationTimeStandRange', '');
  updateElementText('simulationTimeMax', '');
  updateElementText('simulationTimeMin', '');
  updateElementText('simulationTimeStandDev', '');
  updateElementText('simulationCostMedian', '');
  updateElementText('simulationCostStandRange', '');
  updateElementText('simulationCostMax', '');
  updateElementText('simulationCostMin', '');
  updateElementText('simulationCostStandDev', '');

  try {
    // Run main simulator with progressive graph updates.
    document.getElementById('costHistoGram').innerHTML = '';
    document.getElementById('costEstimateHeader').style.display = 'none';
    document.getElementById('costSaveButtons').style.display = 'none';

    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    const graphProgressInterval = 1000;
    const results = await sim.runSimulationProgressive(
      passCount,
      data,
      (progress) => {
        if (progress.times.min > -1 && progress.times.max >= progress.times.min) {
          // Update time histogram preview
          sim.buildHistogramPreview(
            document.getElementById('timeHistoGram'),
            progress.times.list,
            progress.times.min,
            progress.times.max,
            timeUnit,
          );
          document.getElementById('timeEstimateHeader').style.display = 'block';
          document.getElementById('timeSaveButtons').style.display = 'block';

          // Update time statistics during progressive updates
          updateElementText('simulationTimeMedian', `Median Time: ${progress.times.median} ${timeUnit.toLowerCase()}`);
          updateElementText('simulationTimeStandRange', `Likely Range: ${progress.times.likelyMin} - ${progress.times.likelyMax} ${timeUnit.toLowerCase()}`);
          updateElementText('simulationTimeMax', `Max Time: ${progress.times.max} ${timeUnit.toLowerCase()}`);
          updateElementText('simulationTimeMin', `Min Time: ${progress.times.min} ${timeUnit.toLowerCase()}`);
          updateElementText('simulationTimeStandDev', `Standard Deviation: ${progress.times.sd}`);

          // Update cost statistics during progressive updates if enabled
          if (appState.enableCost && progress.costs.min > -1) {
            updateElementText('simulationCostMedian', `Median cost: ${currencyFormatter.format(progress.costs.median)}`);
            updateElementText('simulationCostStandRange', `Likely Range: ${currencyFormatter.format(progress.costs.likelyMin)} - ${currencyFormatter.format(progress.costs.likelyMax)}`);
            updateElementText('simulationCostMax', `Max cost: ${currencyFormatter.format(progress.costs.max)}`);
            updateElementText('simulationCostMin', `Min cost: ${currencyFormatter.format(progress.costs.min)}`);
            updateElementText('simulationCostStandDev', `Standard Deviation: ${progress.costs.sd}`);
          }
        }
      },
      graphProgressInterval,
      hoursPerTimeUnit,
    );

    // Display final summary data (one last update with complete results)
    updateElementText('simulationRunningTime', `Simulation Running Time (ms): ${results.runningTime}`);
    updateElementText('simulationTimeMedian', `Median Time: ${results.times.median} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeStandRange', `Likely Range: ${results.times.likelyMin} - ${results.times.likelyMax} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeMax', `Max Time: ${results.times.max} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeMin', `Min Time: ${results.times.min} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeStandDev', `Standard Deviation: ${results.times.sd}`);

    // Only display cost results if cost tracking is enabled
    if (appState.enableCost) {
      updateElementText('simulationCostMedian', `Median cost: ${currencyFormatter.format(results.costs.median)}`);
      updateElementText('simulationCostStandRange', `Likely Range: ${currencyFormatter.format(results.costs.likelyMin)} - ${currencyFormatter.format(results.costs.likelyMax)}`);
      updateElementText('simulationCostMax', `Max cost: ${currencyFormatter.format(results.costs.max)}`);
      updateElementText('simulationCostMin', `Min cost: ${currencyFormatter.format(results.costs.min)}`);
      updateElementText('simulationCostStandDev', `Standard Deviation: ${results.costs.sd}`);
    }

    // Render row-level task distributions as soon as simulation data is available.
    renderTaskRowHistograms(results.taskResults);

    // Build and display histograms.
    sim.buildHistogram(
      document.getElementById('timeHistoGram'),
      results.times.list,
      results.times.min,
      results.times.max,
      results.times.median,
      results.times.sd,
      timeUnit,
      graphSetting,
    );
    // Show time estimate header and save buttons now that graph is generated
    document.getElementById('timeEstimateHeader').style.display = 'block';
    document.getElementById('timeSaveButtons').style.display = 'block';

    // Only build cost histogram if cost tracking is enabled
    if (appState.enableCost) {
      sim.buildHistogram(
        document.getElementById('costHistoGram'),
        results.costs.list,
        results.costs.min,
        results.costs.max,
        results.costs.median,
        results.costs.sd,
        'Cost',
        graphSetting,
      );
      // Show cost estimate header and save buttons now that graph is generated
      document.getElementById('costEstimateHeader').style.display = 'block';
      document.getElementById('costSaveButtons').style.display = 'block';
    } else {
      // Hide cost estimate header and save buttons if cost tracking is disabled
      document.getElementById('costEstimateHeader').style.display = 'none';
      document.getElementById('costSaveButtons').style.display = 'none';
    }
  } catch (error) {
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
      showError(resultsDiv, 'Simulation failed. Please verify your input data is valid and try again. If the problem persists, check the browser console for details.', 0);
    }
  } finally {
    clearInterval(stopwatchInterval);
    if (runButton) {
      runButton.disabled = false;
      runButton.value = 'Run Simulation';
    }
  }
}

// Initialize app if DOM element exists
const projectSimulator = document.getElementById('project-simulator');
if (projectSimulator) {
  projectSimulator.appendChild(setupUi());

  const startSimulationButton = document.getElementById('startSimulationButton');
  if (startSimulationButton) {
    startSimulationButton.addEventListener('click', startSimulation);
  }
}

// Export local functions for testing
export {
  updateElementText,
  renderTaskRowHistograms,
  applyGraphSettings,
  resetGraphSettings,
  startSimulation,
  setupUi,
};
