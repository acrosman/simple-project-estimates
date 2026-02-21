import './style.css';
import Icon from './logo.jpg';
import * as sim from './simulation';
import { appState, fibonacciCalendarMappings, tshirtMappings } from './state';
import {
  createTextElement,
  createLabeledInput,
  createDivWithIdAndClasses,
  normalizeTshirtSize,
  createModeSelector,
  createFileLoader,
  createDataEntrySection,
} from './data-input';

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
  const timeUnit = (appState.estimationMode === 'fibonacci' || appState.estimationMode === 'tshirt') ? 'days' : 'hours';

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
 * Saves an SVG element as a PNG or JPEG image
 * @param {string} svgContainerId ID of the element containing the SVG
 * @param {string} filename Name for the downloaded file
 * @param {string} format 'png' or 'jpeg'
 */
function saveSvgAsImage(svgContainerId, filename, format = 'png') {
  const container = document.getElementById(svgContainerId);
  const svg = container.querySelector('svg');

  if (!svg) {
    // Create accessible error message instead of alert
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = 'No graph to save. Please run a simulation first.';

    const existingError = container.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    container.appendChild(errorDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
    return;
  }

  // Clone the SVG to avoid modifying the original
  const svgClone = svg.cloneNode(true);

  // Inline styles to preserve colors
  const allElements = svgClone.querySelectorAll('*');
  const originalElements = svg.querySelectorAll('*');

  allElements.forEach((element, index) => {
    const originalElement = originalElements[index];
    if (originalElement) {
      const computedStyle = window.getComputedStyle(originalElement);
      const styleString = Array.from(computedStyle).reduce((acc, key) => {
        const value = computedStyle.getPropertyValue(key);
        if (value && key !== 'all') {
          return `${acc}${key}:${value};`;
        }
        return acc;
      }, '');
      if (styleString) {
        element.setAttribute('style', styleString);
      }
    }
  });

  // Get SVG data
  const svgData = new XMLSerializer().serializeToString(svgClone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Create an image to load the SVG
  const img = new Image();
  img.onload = () => {
    // Create a canvas with bottom margin
    const canvas = document.createElement('canvas');
    const svgSize = svg.getBoundingClientRect();
    const bottomMargin = 20;
    canvas.width = svgSize.width;
    canvas.height = svgSize.height + bottomMargin;

    // Draw the image onto the canvas
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, `image/${format}`, 0.95);

    URL.revokeObjectURL(url);
  };

  img.src = url;
}

/**
 * Triggers the start of the simulation run with the current values.
 * @param {Event} event
 */
async function startSimulation(event) {
  event.preventDefault();
  const passCount = document.getElementById('simulationPasses').value;
  const graphSetting = document.getElementById('LimitGraph').checked;
  const data = [];

  // Clear any previous task-level graphs immediately for this run.
  renderTaskRowHistograms([]);

  // Gather the task information.
  const tasks = document.querySelectorAll('#DataEntryTable .tr.data-row');
  let inputs;
  let taskDetail;
  for (const t of tasks) {
    taskDetail = {};
    taskDetail.RowId = t.dataset.rowId;
    inputs = t.getElementsByTagName('input');
    for (const i of inputs) {
      switch (i.name) {
        case 'Task':
          taskDetail.Name = i.value;
          break;
        case 'Min Time':
          taskDetail.Min = parseInt(i.value, 10);
          break;
        case 'Max Time':
          taskDetail.Max = parseInt(i.value, 10);
          break;
        case 'Fibonacci':
          taskDetail.Fibonacci = parseInt(i.value, 10);
          break;
        case 'T-Shirt':
          taskDetail.TShirt = normalizeTshirtSize(i.value);
          break;
        case 'Confidence':
          taskDetail.Confidence = parseFloat(i.value) / 100;
          break;
        case 'Cost':
          taskDetail.Cost = parseInt(i.value, 10);
          // Default to 0 if parseInt returns NaN (empty or invalid input)
          if (Number.isNaN(taskDetail.Cost)) {
            taskDetail.Cost = 0;
          }
          break;
        default:
          break;
      }
    }

    // Convert Fibonacci numbers to min/max if in Fibonacci mode
    if (appState.estimationMode === 'fibonacci' && taskDetail.Fibonacci) {
      const fibMode = appState.getFibonacciMode();
      let mapping;

      if (fibMode === 'calendar-days') {
        mapping = sim.fibonacciToCalendarDays(taskDetail.Fibonacci, fibonacciCalendarMappings);
      } else if (fibMode === 'velocity-based') {
        const { pointsPerSprint, sprintLengthDays } = appState.getVelocityConfig();
        mapping = sim.fibonacciToVelocityDays(
          taskDetail.Fibonacci,
          pointsPerSprint,
          sprintLengthDays,
        );
      }

      if (mapping) {
        taskDetail.Min = mapping.min;
        taskDetail.Max = mapping.max;
      }
    } else if (appState.estimationMode === 'tshirt' && taskDetail.TShirt) {
      const fibonacciValue = tshirtMappings[taskDetail.TShirt];
      if (fibonacciValue) {
        // Convert T-shirt size to Fibonacci, then Fibonacci to days
        const mapping = sim.fibonacciToCalendarDays(fibonacciValue, fibonacciCalendarMappings);
        if (mapping) {
          taskDetail.Min = mapping.min;
          taskDetail.Max = mapping.max;
        }
      }
    }

    // Set default cost to 0 if cost tracking is disabled
    if (!appState.enableCost && !taskDetail.Cost) {
      taskDetail.Cost = 0;
    }

    // Validate that task has required fields and they are valid numbers
    const hasName = taskDetail.Name && taskDetail.Name.trim() !== '';
    const hasValidMin = !Number.isNaN(taskDetail.Min) && taskDetail.Min !== undefined;
    const hasValidMax = !Number.isNaN(taskDetail.Max) && taskDetail.Max !== undefined;
    const hasValidConfidence = !Number.isNaN(taskDetail.Confidence)
      && taskDetail.Confidence !== undefined;

    // Additional validation for value ranges
    const minIsPositive = hasValidMin && taskDetail.Min >= 0;
    const maxIsValid = hasValidMax && taskDetail.Max >= taskDetail.Min;
    const confidenceInRange = hasValidConfidence
      && taskDetail.Confidence >= 0
      && taskDetail.Confidence <= 1;

    if (hasName && minIsPositive && maxIsValid && confidenceInRange) {
      data.push(taskDetail);
    }
  }

  // Validate we have at least one task
  if (data.length === 0) {
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = 'No valid tasks found. Please ensure all tasks have valid values: name, min >= 0, max >= min, and confidence between 0-100%.';

    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
      const existingError = resultsDiv.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      resultsDiv.insertBefore(errorDiv, resultsDiv.firstChild);
    }
    return;
  }

  // Determine the correct time unit based on estimation mode
  const timeUnit = (appState.estimationMode === 'fibonacci' || appState.estimationMode === 'tshirt') ? 'Days' : 'Hours';
  // When using days, need to multiply hourly cost by 8 hours/day
  const hoursPerTimeUnit = timeUnit === 'Days' ? 8 : 1;

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
    // Display user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.classList.add('error-message');
    errorDiv.textContent = 'Simulation failed. Please verify your input data is valid and try again. If the problem persists, check the browser console for details.';

    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
      const existingError = resultsDiv.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      resultsDiv.insertBefore(errorDiv, resultsDiv.firstChild);
    }
  } finally {
    clearInterval(stopwatchInterval);
    if (runButton) {
      runButton.disabled = false;
      runButton.value = 'Run Simulation';
    }
  }
}

/**
 * Creates the project logo image element.
 * @returns {HTMLImageElement} Logo image
 */
function createLogoElement() {
  const simIcon = document.createElement('img');
  simIcon.src = Icon;
  simIcon.alt = 'Project Estimate Simulator icon';
  simIcon.width = 100;
  simIcon.height = 100;
  simIcon.classList.add('project-icon');
  return simIcon;
}

/**
 * Creates the page header with GitHub ribbon.
 * @returns {HTMLElement} Header section
 */
function createHeader() {
  const headerDiv = document.createElement('div');
  headerDiv.classList.add('page-header', 'section');

  // Fork Me ribbon
  const githubRibbon = createDivWithIdAndClasses('forkOnGithub', ['github-ribbon']);
  const githubLink = document.createElement('a');
  githubLink.href = 'https://github.com/acrosman/simple-project-estimates';
  githubLink.textContent = 'Fork me on GitHub';
  githubRibbon.appendChild(githubLink);
  headerDiv.appendChild(githubRibbon);

  return headerDiv;
}

/**
 * Applies user-modified graph settings to GRAPH_CONFIG.
 */
function applyGraphSettings() {
  sim.GRAPH_CONFIG.histogram.width = parseInt(document.getElementById('histogramWidth').value, 10);
  sim.GRAPH_CONFIG.histogram.height = parseInt(document.getElementById('histogramHeight').value, 10);
  sim.GRAPH_CONFIG.histogram.barCutoff = parseInt(document.getElementById('histogramBarCutoff').value, 10);
  sim.GRAPH_CONFIG.histogram.maxBuckets = parseInt(document.getElementById('histogramMaxBuckets').value, 10);
  sim.GRAPH_CONFIG.miniGraph.width = parseInt(document.getElementById('miniGraphWidth').value, 10);
  sim.GRAPH_CONFIG.miniGraph.height = parseInt(document.getElementById('miniGraphHeight').value, 10);
  sim.GRAPH_CONFIG.miniGraph.maxBuckets = parseInt(document.getElementById('miniGraphMaxBuckets').value, 10);
  sim.GRAPH_CONFIG.miniGraph.gap = parseFloat(document.getElementById('miniGraphGap').value);

  // Show confirmation
  const details = document.getElementById('advancedSettings');
  const originalSummary = details.querySelector('summary').textContent;
  details.querySelector('summary').textContent = 'Advanced Graph Settings ✓ Applied';
  setTimeout(() => {
    details.querySelector('summary').textContent = originalSummary;
  }, 2000);
}

/**
 * Resets graph settings to default values.
 */
function resetGraphSettings() {
  const { histogram: h, miniGraph: m } = sim.GRAPH_CONFIG_DEFAULTS;

  // Reset GRAPH_CONFIG to original defaults.
  sim.GRAPH_CONFIG.histogram.width = h.width;
  sim.GRAPH_CONFIG.histogram.height = h.height;
  sim.GRAPH_CONFIG.histogram.barCutoff = h.barCutoff;
  sim.GRAPH_CONFIG.histogram.maxBuckets = h.maxBuckets;
  sim.GRAPH_CONFIG.miniGraph.width = m.width;
  sim.GRAPH_CONFIG.miniGraph.height = m.height;
  sim.GRAPH_CONFIG.miniGraph.maxBuckets = m.maxBuckets;
  sim.GRAPH_CONFIG.miniGraph.gap = m.gap;

  // Sync form fields to match the reset values.
  document.getElementById('histogramWidth').value = String(h.width);
  document.getElementById('histogramHeight').value = String(h.height);
  document.getElementById('histogramBarCutoff').value = String(h.barCutoff);
  document.getElementById('histogramMaxBuckets').value = String(h.maxBuckets);
  document.getElementById('miniGraphWidth').value = String(m.width);
  document.getElementById('miniGraphHeight').value = String(m.height);
  document.getElementById('miniGraphMaxBuckets').value = String(m.maxBuckets);
  document.getElementById('miniGraphGap').value = String(m.gap);

  // Show confirmation
  const details = document.getElementById('advancedSettings');
  const originalSummary = details.querySelector('summary').textContent;
  details.querySelector('summary').textContent = 'Advanced Graph Settings ✓ Reset';
  setTimeout(() => {
    details.querySelector('summary').textContent = originalSummary;
  }, 2000);
}

/**
 * Creates the advanced graph settings panel for power users.
 * @returns HTMLElement Details element with graph configuration controls.
 */
function createAdvancedSettings() {
  const details = document.createElement('details');
  details.classList.add('advanced-settings');
  details.id = 'advancedSettings';

  const summary = document.createElement('summary');
  summary.textContent = 'Advanced Graph Settings';
  details.appendChild(summary);

  const settingsWrapper = createDivWithIdAndClasses('advancedSettingsContent', ['settings-grid']);

  // Main histogram settings
  const histogramHeader = createTextElement('h3', 'Main Histogram Settings', ['settings-header']);
  settingsWrapper.appendChild(histogramHeader);

  const histogramWidthAttr = {
    type: 'number',
    min: '400',
    max: '2000',
    step: '50',
    id: 'histogramWidth',
    value: String(sim.GRAPH_CONFIG.histogram.width),
    name: 'Histogram Width',
  };
  settingsWrapper.appendChild(createLabeledInput('Width (px):', histogramWidthAttr, true));

  const histogramHeightAttr = {
    type: 'number',
    min: '300',
    max: '1000',
    step: '50',
    id: 'histogramHeight',
    value: String(sim.GRAPH_CONFIG.histogram.height),
    name: 'Histogram Height',
  };
  settingsWrapper.appendChild(createLabeledInput('Height (px):', histogramHeightAttr, true));

  const histogramBarCutoffAttr = {
    type: 'number',
    min: '100',
    max: '2000',
    step: '50',
    id: 'histogramBarCutoff',
    value: String(sim.GRAPH_CONFIG.histogram.barCutoff),
    name: 'Bar Cutoff',
  };
  settingsWrapper.appendChild(createLabeledInput('Bar/Scatter Cutoff:', histogramBarCutoffAttr, true));

  const histogramMaxBucketsAttr = {
    type: 'number',
    min: '20',
    max: '500',
    step: '10',
    id: 'histogramMaxBuckets',
    value: String(sim.GRAPH_CONFIG.histogram.maxBuckets),
    name: 'Max Preview Buckets',
  };
  settingsWrapper.appendChild(createLabeledInput('Max Preview Buckets:', histogramMaxBucketsAttr, true));

  // Mini graph settings
  const miniGraphHeader = createTextElement('h3', 'Task Row Mini Graph Settings', ['settings-header']);
  settingsWrapper.appendChild(miniGraphHeader);

  const miniWidthAttr = {
    type: 'number',
    min: '50',
    max: '300',
    step: '10',
    id: 'miniGraphWidth',
    value: String(sim.GRAPH_CONFIG.miniGraph.width),
    name: 'Mini Graph Width',
  };
  settingsWrapper.appendChild(createLabeledInput('Width (px):', miniWidthAttr, true));

  const miniHeightAttr = {
    type: 'number',
    min: '10',
    max: '100',
    step: '2',
    id: 'miniGraphHeight',
    value: String(sim.GRAPH_CONFIG.miniGraph.height),
    name: 'Mini Graph Height',
  };
  settingsWrapper.appendChild(createLabeledInput('Height (px):', miniHeightAttr, true));

  const miniMaxBucketsAttr = {
    type: 'number',
    min: '5',
    max: '50',
    step: '1',
    id: 'miniGraphMaxBuckets',
    value: String(sim.GRAPH_CONFIG.miniGraph.maxBuckets),
    name: 'Mini Max Buckets',
  };
  settingsWrapper.appendChild(createLabeledInput('Max Buckets:', miniMaxBucketsAttr, true));

  const miniGapAttr = {
    type: 'number',
    min: '0',
    max: '5',
    step: '0.5',
    id: 'miniGraphGap',
    value: String(sim.GRAPH_CONFIG.miniGraph.gap),
    name: 'Mini Graph Gap',
  };
  settingsWrapper.appendChild(createLabeledInput('Bar Gap (px):', miniGapAttr, true));

  // Reset and Apply buttons
  const buttonWrapper = document.createElement('div');
  buttonWrapper.classList.add('settings-buttons');

  const applyButton = document.createElement('input');
  Object.assign(applyButton, {
    type: 'button',
    value: 'Apply Settings',
    id: 'applyGraphSettings',
  });
  applyButton.addEventListener('click', applyGraphSettings);

  const resetButton = document.createElement('input');
  Object.assign(resetButton, {
    type: 'button',
    value: 'Reset to Defaults',
    id: 'resetGraphSettings',
  });
  resetButton.addEventListener('click', resetGraphSettings);

  buttonWrapper.appendChild(applyButton);
  buttonWrapper.appendChild(resetButton);
  settingsWrapper.appendChild(buttonWrapper);

  details.appendChild(settingsWrapper);
  return details;
}

/**
 * Creates the simulation control panel and results display.
 * @returns {HTMLElement} Simulation panel section
 */
function createSimulationPanel() {
  const simWrapper = createDivWithIdAndClasses('simulationAreaWrapper', ['section', 'container']);
  const simHeader = createTextElement('h2', 'Simulator', ['header', 'simulation']);

  const simControls = createDivWithIdAndClasses('simulatorControlsWrapper', ['section', 'controls-simulation']);

  const simCountFldAttr = {
    type: 'number',
    min: '1000',
    max: '9999999',
    step: '1000',
    id: 'simulationPasses',
    value: '100000',
    name: 'Simulation Passes',
  };
  const simCountCtl = createLabeledInput('Number of times to run the simulation:', simCountFldAttr, true);

  const simLimitFldAttr = {
    type: 'checkbox',
    value: '1',
    id: 'LimitGraph',
  };
  const simLimitCtl = createLabeledInput('Limit graph outliers', simLimitFldAttr, false);

  const simRun = document.createElement('input');
  simRun.type = 'button';
  simRun.id = 'startSimulationButton';
  simRun.value = 'Run Simulation';
  simRun.addEventListener('click', startSimulation);

  simControls.appendChild(simCountCtl);
  simControls.appendChild(simLimitCtl);
  simControls.appendChild(simRun);

  // Simulation Time Results elements
  const simResultWrapper = createDivWithIdAndClasses('simulationResultsWrapper', ['section', 'wrap-simulation-results']);
  simResultWrapper.appendChild(createDivWithIdAndClasses('simulationRunningTime', ['simulation-result', 'text']));
  const simTimeResultWrapper = createDivWithIdAndClasses('simulationTimeResultsWrapper', ['section', 'wrap-simulation-time-results']);
  const timeHeader = createTextElement('h3', 'Time Estimates', ['result-display', 'time-info']);
  timeHeader.id = 'timeEstimateHeader';
  timeHeader.style.display = 'none';
  simTimeResultWrapper.appendChild(timeHeader);
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeMedian', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeStandRange', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeMax', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeMin', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('simulationTimeStandDev', ['simulation-result', 'time-info', 'text']));
  simTimeResultWrapper.appendChild(createDivWithIdAndClasses('timeHistoGram', ['simulation-result', 'time-info', 'graph']));

  // Add save buttons for time histogram
  const timeSaveButtonsDiv = document.createElement('div');
  timeSaveButtonsDiv.id = 'timeSaveButtons';
  timeSaveButtonsDiv.classList.add('save-buttons', 'no-print');
  timeSaveButtonsDiv.style.display = 'none';

  const saveTimePng = document.createElement('input');
  Object.assign(saveTimePng, {
    type: 'button',
    value: 'Save Time Graph as PNG',
    id: 'saveTimePngBtn',
  });
  saveTimePng.addEventListener('click', () => saveSvgAsImage('timeHistoGram', 'time-estimates', 'png'));

  const saveTimeJpeg = document.createElement('input');
  Object.assign(saveTimeJpeg, {
    type: 'button',
    value: 'Save Time Graph as JPEG',
    id: 'saveTimeJpegBtn',
  });
  saveTimeJpeg.addEventListener('click', () => saveSvgAsImage('timeHistoGram', 'time-estimates', 'jpeg'));

  timeSaveButtonsDiv.appendChild(saveTimePng);
  timeSaveButtonsDiv.appendChild(saveTimeJpeg);
  simTimeResultWrapper.appendChild(timeSaveButtonsDiv);

  simResultWrapper.appendChild(simTimeResultWrapper);

  // Simulation Cost Results elements
  const simCostResultWrapper = createDivWithIdAndClasses('simulationCostResultsWrapper', ['section', 'wrap-simulation-cost-results']);
  const costHeader = createTextElement('h3', 'Cost Estimates', ['result-display', 'cost-info']);
  costHeader.id = 'costEstimateHeader';
  costHeader.style.display = 'none';
  simCostResultWrapper.appendChild(costHeader);
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostMedian', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostStandRange', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostMax', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostMin', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('simulationCostStandDev', ['simulation-result', 'cost-info', 'text']));
  simCostResultWrapper.appendChild(createDivWithIdAndClasses('costHistoGram', ['simulation-result', 'cost-info', 'graph']));

  // Add save buttons for cost histogram
  const costSaveButtonsDiv = document.createElement('div');
  costSaveButtonsDiv.id = 'costSaveButtons';
  costSaveButtonsDiv.classList.add('save-buttons', 'no-print');
  costSaveButtonsDiv.style.display = 'none';

  const saveCostPng = document.createElement('input');
  Object.assign(saveCostPng, {
    type: 'button',
    value: 'Save Cost Graph as PNG',
    id: 'saveCostPngBtn',
  });
  saveCostPng.addEventListener('click', () => saveSvgAsImage('costHistoGram', 'cost-estimates', 'png'));

  const saveCostJpeg = document.createElement('input');
  Object.assign(saveCostJpeg, {
    type: 'button',
    value: 'Save Cost Graph as JPEG',
    id: 'saveCostJpegBtn',
  });
  saveCostJpeg.addEventListener('click', () => saveSvgAsImage('costHistoGram', 'cost-estimates', 'jpeg'));

  costSaveButtonsDiv.appendChild(saveCostPng);
  costSaveButtonsDiv.appendChild(saveCostJpeg);
  simCostResultWrapper.appendChild(costSaveButtonsDiv);

  simResultWrapper.appendChild(simCostResultWrapper);

  // Add simulator elements to wrapper.
  simWrapper.appendChild(simHeader);
  simWrapper.appendChild(simControls);
  simWrapper.appendChild(createAdvancedSettings());
  simWrapper.appendChild(simResultWrapper);

  return simWrapper;
}

/**
 * Setup the Main application UI
 * @returns HTMLElement
 */
function setupUi() {
  // === Main page structures ===
  const mainElement = document.createElement('div');

  // Setup data entry section wrapper
  const dataWrapper = document.createElement('div');
  dataWrapper.classList.add('section');
  dataWrapper.id = 'dataAreaWrapper';

  // Build UI sections
  const header = createHeader();
  const modeSelector = createModeSelector();
  const fileLoader = createFileLoader();
  const dataEntry = createDataEntrySection();
  const simulationPanel = createSimulationPanel();

  // Create side-by-side wrapper: mode selector on the left, logo on the right
  const modeSelectorWithLogo = document.createElement('div');
  modeSelectorWithLogo.classList.add('mode-selector-logo-wrapper');
  modeSelectorWithLogo.appendChild(modeSelector);
  modeSelectorWithLogo.appendChild(createLogoElement());

  // Assemble data area
  dataWrapper.appendChild(modeSelectorWithLogo);
  dataWrapper.appendChild(fileLoader);
  dataWrapper.appendChild(dataEntry);

  // Add all elements to the main application wrapper.
  mainElement.appendChild(header);
  mainElement.appendChild(dataWrapper);
  mainElement.appendChild(simulationPanel);

  return mainElement;
}

// Initialize app if DOM element exists
const projectSimulator = document.getElementById('project-simulator');
if (projectSimulator) {
  projectSimulator.appendChild(setupUi());
}

// Export local functions for testing
export {
  updateElementText,
  renderTaskRowHistograms,
  saveSvgAsImage,
  applyGraphSettings,
  resetGraphSettings,
  createLogoElement,
};

// Re-export state
export { appState, fibonacciCalendarMappings, tshirtMappings } from './state';

// Re-export data-input functions
export {
  createTextElement,
  createLabeledInput,
  createDivWithIdAndClasses,
  generateDataField,
  isRowEmpty,
  normalizeTshirtSize,
  handleFibonacciModeChange,
  handleVelocityConfigChange,
  updateFibonacciCalendarMapping,
  updateTshirtMapping,
  validateCsvData,
} from './data-input';

// Export getter functions for mutable state
export const getEstimationMode = () => appState.estimationMode;
export const getEnableCost = () => appState.enableCost;
