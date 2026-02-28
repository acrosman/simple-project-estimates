/**
 * Handles all DOM updates for displaying simulation results.
 * Provides functions for updating progress, rendering final results,
 * and rendering per-task row histograms.
 * @module ui/simulation-results-view
 */

import { appState } from '../core/state';
import { buildTaskRowHistogram } from '../core/simulation';

function updateElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showError(targetNode, message, timeout = 0) {
  let errorDiv = targetNode.querySelector('.error-message');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.classList.add('error-message');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    targetNode.insertBefore(errorDiv, targetNode.firstChild);
  }
  errorDiv.textContent = message;
  if (timeout > 0) {
    setTimeout(() => errorDiv.remove(), timeout);
  }
  targetNode.style.display = 'block';
}

function updateProgress(progress, timeUnit, currencyFormatter, enableCost) {
  if (progress.times.min > -1 && progress.times.max >= progress.times.min) {
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

function renderFinalResults(results, timeUnit, currencyFormatter, enableCost) {
  updateElementText('simulationRunningTime', `Simulation Running Time (ms): ${results.runningTime}`);
  updateElementText('simulationTimeMedian', `Median Time: ${results.times.median} ${timeUnit.toLowerCase()}`);
  updateElementText('simulationTimeStandRange', `Likely Range: ${results.times.likelyMin} - ${results.times.likelyMax} ${timeUnit.toLowerCase()}`);
  updateElementText('simulationTimeMax', `Max Time: ${results.times.max} ${timeUnit.toLowerCase()}`);
  updateElementText('simulationTimeMin', `Min Time: ${results.times.min} ${timeUnit.toLowerCase()}`);
  updateElementText('simulationTimeStandDev', `Standard Deviation: ${results.times.sd}`);
  if (enableCost) {
    updateElementText('simulationCostMedian', `Median cost: ${currencyFormatter.format(results.costs.median)}`);
    updateElementText('simulationCostStandRange', `Likely Range: ${currencyFormatter.format(results.costs.likelyMin)} - ${currencyFormatter.format(results.costs.likelyMax)}`);
    updateElementText('simulationCostMax', `Max cost: ${currencyFormatter.format(results.costs.max)}`);
    updateElementText('simulationCostMin', `Min cost: ${currencyFormatter.format(results.costs.min)}`);
    updateElementText('simulationCostStandDev', `Standard Deviation: ${results.costs.sd}`);
  }
}

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

function showTimeResults() {
  document.getElementById('timeEstimateHeader').style.display = 'block';
  document.getElementById('timeSaveButtons').style.display = 'block';
}

function showCostResults(enable) {
  document.getElementById('costEstimateHeader').style.display = enable ? 'block' : 'none';
  document.getElementById('costSaveButtons').style.display = enable ? 'block' : 'none';
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

const SimulationResultsView = {
  updateElementText,
  showError,
  updateProgress,
  renderFinalResults,
  clearStatistics,
  showTimeResults,
  showCostResults,
  renderTaskRowHistograms,
};

export default SimulationResultsView;
