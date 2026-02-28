import './style.css';
import * as sim from './core/simulation';
import { appState, fibonacciCalendarMappings, tshirtMappings } from './core/state';
import { gatherRawTaskData, normalizeTaskData } from './ui/task-table';
import { setupUi } from './ui/layout';
import SimulationResultsView from './ui/simulation-results-view';

/**
 * Triggers the start of the simulation run with the current values.
 * @param {Event} event
 */
async function startSimulation(event) {
  event.preventDefault();
  const passCount = document.getElementById('simulationPasses').value;
  const graphSetting = document.getElementById('LimitGraph').checked;

  // Clear any previous task-level graphs immediately for this run.
  SimulationResultsView.renderTaskRowHistograms([]);

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
    SimulationResultsView.showError('No valid tasks found. Please ensure all tasks have valid values: name, min >= 0, max >= min, and confidence between 0-100%.');
    return;
  }

  // Determine the correct time unit based on estimation mode
  const timeUnit = appState.getTimeUnit();
  // When using days, need to multiply hourly cost by 8 hours/day
  const hoursPerTimeUnit = appState.getHoursPerTimeUnit();

  const runButton = document.getElementById('startSimulationButton');
  const runStartTime = Date.now();
  const updateRunningTimeDisplay = (runningTime) => {
    SimulationResultsView.updateElementText('simulationRunningTime', `Simulation Running Time (ms): ${runningTime}`);
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
  SimulationResultsView.clearStatistics();

  try {
    // Run main simulator with progressive graph updates.
    document.getElementById('costHistoGram').innerHTML = '';
    SimulationResultsView.showCostResults(false);

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
        SimulationResultsView.updateProgress(
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
    SimulationResultsView.renderFinalResults(
      results,
      timeUnit,
      currencyFormatter,
      appState.enableCost,
    );

    // Render row-level task distributions as soon as simulation data is available.
    SimulationResultsView.renderTaskRowHistograms(results.taskResults);

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
    SimulationResultsView.showTimeResults();

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
      SimulationResultsView.showCostResults(true);
    } else {
      SimulationResultsView.showCostResults(false);
    }
  } catch (error) {
    SimulationResultsView.showError('Simulation failed. Please verify your input data is valid and try again. If the problem persists, check the browser console for details.');
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

// Export for testing
export default startSimulation;
