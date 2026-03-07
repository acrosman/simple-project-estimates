// simulation-handler.js
// Handles simulation orchestration and results view
import * as sim from '../core/simulation';
import { appState, fibonacciCalendarMappings, tshirtMappings } from '../core/state';
import { gatherRawTaskData, normalizeTaskData } from './task-table';
import { buildTaskRowHistogram } from '../core/simulation';
import { showError } from '../utils/dom-helpers';

/**
 * Sets the text content of a DOM element by its ID.
 * @param {string} id - The ID of the target element.
 * @param {string} text - The text content to assign.
 */
function updateElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * Updates the statistics display elements with intermediate simulation progress data.
 * @param {object} progress - The current progress snapshot from the simulation.
 * @param {object} progress.times - Time statistics (min, max, median, likelyMin, likelyMax, sd).
 * @param {object} progress.costs - Cost statistics (min, median, likelyMin, likelyMax, sd).
 * @param {string} timeUnit - Label for the time unit (e.g. 'Days', 'Hours').
 * @param {Intl.NumberFormat} currencyFormatter - Formatter used to display cost values.
 * @param {boolean} enableCost - Whether cost tracking is active.
 */
function updateProgress(progress, timeUnit, currencyFormatter, enableCost) {
  if (progress.times && progress.times.min > -1 && progress.times.max >= progress.times.min) {
    // Update time histogram preview
    // (Histogram preview handled by simulation module)
    document.getElementById('timeEstimateHeader').style.display = 'block';
    document.getElementById('timeSaveButtons').style.display = 'block';
    updateElementText('simulationTimeMedian', `Median Time: ${progress.times.median} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeStandRange', `Likely Range: ${progress.times.likelyMin} - ${progress.times.likelyMax} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeMax', `Max Time: ${progress.times.max} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeMin', `Min Time: ${progress.times.min} ${timeUnit.toLowerCase()}`);
    updateElementText('simulationTimeStandDev', `Standard Deviation: ${progress.times.sd}`);
    if (enableCost && progress.costs.min > -1) {
      updateElementText('simulationCostMedian', `Median cost: ${currencyFormatter.format(progress.costs.median)}`);
      updateElementText('simulationCostStandRange', `Likely Range: ${currencyFormatter.format(progress.costs.likelyMin)} - ${currencyFormatter.format(progress.costs.likelyMax)}`);
      updateElementText('simulationCostMax', `Max cost: ${currencyFormatter.format(progress.costs.max)}`);
      updateElementText('simulationCostMin', `Min cost: ${currencyFormatter.format(progress.costs.min)}`);
      updateElementText('simulationCostStandDev', `Standard Deviation: ${progress.costs.sd}`);
    }
  }
}

/**
 * Populates the statistics display elements with the final simulation results.
 * @param {object} results - The completed simulation results object.
 * @param {object} results.times - Final time statistics
 *   (min, max, median, likelyMin, likelyMax, sd).
 * @param {object} results.costs - Final cost statistics
 *   (min, max, median, likelyMin, likelyMax, sd).
 * @param {number} results.runningTime - Total simulation wall-clock time in milliseconds.
 * @param {string} timeUnit - Label for the time unit (e.g. 'Days', 'Hours').
 * @param {Intl.NumberFormat} currencyFormatter - Formatter used to display cost values.
 * @param {boolean} enableCost - Whether cost tracking is active.
 */
function renderFinalResults(results, timeUnit, currencyFormatter, enableCost) {
  updateElementText('simulationRunningTime', `Simulation Running Time (ms): ${results.runningTime}`);
  updateElementText('simulationTimeMedian', `Median Time: ${(results.times && results.times.median !== undefined) ? results.times.median : ''} ${timeUnit.toLowerCase()}`);
  updateElementText('simulationTimeStandRange', `Likely Range: ${(results.times && results.times.likelyMin !== undefined) ? results.times.likelyMin : ''} - ${(results.times && results.times.likelyMax !== undefined) ? results.times.likelyMax : ''} ${timeUnit.toLowerCase()}`);
  updateElementText('simulationTimeMax', `Max Time: ${(results.times && results.times.max !== undefined) ? results.times.max : ''} ${timeUnit.toLowerCase()}`);
  updateElementText('simulationTimeMin', `Min Time: ${(results.times && results.times.min !== undefined) ? results.times.min : ''} ${timeUnit.toLowerCase()}`);
  updateElementText('simulationTimeStandDev', `Standard Deviation: ${(results.times && results.times.sd !== undefined) ? results.times.sd : ''}`);
  if (enableCost) {
    updateElementText('simulationCostMedian', `Median cost: ${currencyFormatter.format(results.costs.median)}`);
    updateElementText('simulationCostStandRange', `Likely Range: ${currencyFormatter.format(results.costs.likelyMin)} - ${currencyFormatter.format(results.costs.likelyMax)}`);
    updateElementText('simulationCostMax', `Max cost: ${currencyFormatter.format(results.costs.max)}`);
    updateElementText('simulationCostMin', `Min cost: ${currencyFormatter.format(results.costs.min)}`);
    updateElementText('simulationCostStandDev', `Standard Deviation: ${results.costs.sd}`);
  }
}

/**
 * Clears all simulation statistics display elements, resetting them to empty strings.
 */
function clearStatistics() {
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
}

/**
 * Makes the time estimate header and save buttons visible in the results area.
 */
function showTimeResults() {
  const timeHeader = document.getElementById('timeEstimateHeader');
  if (timeHeader) timeHeader.style.display = 'block';
  const timeButtons = document.getElementById('timeSaveButtons');
  if (timeButtons) timeButtons.style.display = 'block';
}

/**
 * Shows or hides the cost estimate header and save buttons in the results area.
 * @param {boolean} enable - When true, the cost results section is shown; otherwise hidden.
 */
function showCostResults(enable) {
  const costHeader = document.getElementById('costEstimateHeader');
  if (costHeader) costHeader.style.display = enable ? 'block' : 'none';
  const costButtons = document.getElementById('costSaveButtons');
  if (costButtons) costButtons.style.display = enable ? 'block' : 'none';
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
      buildTaskRowHistogram(
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
    showError('No tasks found. Please add at least one task before running the simulation.');
    return;
  }

  // Determine the correct time unit based on estimation mode
  const timeUnit = appState.getTimeUnit();
  // When using days, need to multiply hourly cost by 8 hours/day
  const hoursPerTimeUnit = appState.getHoursPerTimeUnit();

  const runButton = document.getElementById('startSimulationButton');
  const runStartTime = Date.now();
  const updateRunningTimeDisplay = (elapsedMs) => {
    updateElementText('simulationRunningTime', `Simulation Running Time (ms): ${elapsedMs}`);
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
  clearStatistics();

  try {
    // Run main simulator with progressive graph updates.
    document.getElementById('costHistoGram').innerHTML = '';
    showCostResults(false);

    const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    const graphProgressInterval = 1000;
    const results = await sim.runSimulationProgressive(
      passCount,
      data,
      (progress) => {
        // Histogram preview (D3) still handled here:
        if (progress.times.min > -1 && progress.times.max >= progress.times.min) {
          sim.buildHistogramPreview(
            document.getElementById('timeHistoGram'),
            progress.times.list,
            progress.times.min,
            progress.times.max,
            timeUnit,
          );
        }
        updateProgress(
          progress,
          timeUnit,
          currencyFormatter,
          appState.enableCost,
        );
      },
      graphProgressInterval,
      hoursPerTimeUnit,
    );

    // Display final summary data (one last update with complete results)
    // Display final summary data (one last update with complete results)
    renderFinalResults(
      results,
      timeUnit,
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      appState.enableCost,
    );

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
    showTimeResults();

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
      showCostResults(true);
    } else {
      showCostResults(false);
    }
  } catch (error) {
    showError(`Simulation failed: ${error.message}`);
  } finally {
    clearInterval(stopwatchInterval);
    if (runButton) {
      runButton.disabled = false;
      runButton.value = 'Run Simulation';
    }
  }
}

export {
  updateElementText,
  updateProgress,
  renderFinalResults,
  clearStatistics,
  showTimeResults,
  showCostResults,
  renderTaskRowHistograms,
  startSimulation,
};
