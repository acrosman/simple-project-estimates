import {
  taskUpperBound,
  generateEstimate,
  getMedian,
  getStandardDeviation,
  calculateUpperBound,
} from './stats';

/**
 * Yields execution to allow UI updates between simulation batches.
 * @returns {Promise<void>} Promise that resolves on next event loop turn.
 */
function pauseForUiUpdate() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Core simulation logic shared between synchronous and asynchronous implementations.
 * @param {number} passes - Number of times to run the simulation
 * @param {Array} data - Array of task objects with Min, Max, Confidence, Cost
 * @param {Object} callbacks - Optional callbacks for progress updates
 * @param {Function} callbacks.onBatchComplete - Called after each batch of iterations.
 * @param {number} callbacks.batchSize - Size of each batch for progressive execution.
 * @param {number} hoursPerTimeUnit - Hours per time unit (1 for hours mode, 8 for days mode)
 * @returns {Object|Promise<Object>} Simulation results (promise if using callbacks).
 */
function runSimulationCore(passes, data, callbacks = {}, hoursPerTimeUnit = 1) {
  const { onBatchComplete, batchSize = 1000 } = callbacks;
  const totalPasses = parseInt(passes, 10);
  const costMultiplier = parseFloat(hoursPerTimeUnit) || 1;
  const upperTimeBound = Math.ceil(calculateUpperBound(data));
  const upperCostBound = Math.ceil(calculateUpperBound(data, true) * costMultiplier);
  const times = new Array(upperTimeBound + 1).fill(0);
  const costs = new Array(upperCostBound + 1).fill(0);
  const taskOutcomes = {};
  const estimateDetails = [];
  const startTime = Date.now();
  let minTime = -1;
  let maxTime = 0;
  let minCost = -1;
  let maxCost = 0;
  let totalTime = 0;
  let totalCost = 0;
  let outcome = {};

  // Setup task-level outcome histograms for row-level visualization.
  for (const row of data) {
    const taskTimeUpperBound = Math.ceil(taskUpperBound(row.Max, row.Confidence));
    const taskCostUpperBound = Math.ceil(taskTimeUpperBound * row.Cost * costMultiplier);
    const rowId = row.RowId || row.Name;
    taskOutcomes[rowId] = {
      rowId,
      name: row.Name,
      times: {
        min: -1,
        max: 0,
        list: new Array(taskTimeUpperBound + 1).fill(0),
      },
      costs: {
        min: -1,
        max: 0,
        list: new Array(taskCostUpperBound + 1).fill(0),
      },
    };
  }

  /**
   * Executes a single simulation iteration.
   */
  const runIteration = () => {
    totalTime = 0;
    totalCost = 0;
    outcome = {};

    for (const row of data) {
      const rowId = row.RowId || row.Name;
      const taskOutcome = taskOutcomes[rowId];
      const taskTime = generateEstimate(row.Min, row.Max, row.Confidence);
      const taskCost = taskTime * row.Cost * costMultiplier;
      totalTime += taskTime;
      totalCost += taskCost;
      outcome[row.Name] = {
        time: taskTime,
        cost: taskCost,
      };

      taskOutcome.times.list[taskTime] += 1;
      taskOutcome.costs.list[taskCost] += 1;
      if (taskOutcome.times.min === -1 || taskTime < taskOutcome.times.min) {
        taskOutcome.times.min = taskTime;
      }
      if (taskTime > taskOutcome.times.max) {
        taskOutcome.times.max = taskTime;
      }
      if (taskOutcome.costs.min === -1 || taskCost < taskOutcome.costs.min) {
        taskOutcome.costs.min = taskCost;
      }
      if (taskCost > taskOutcome.costs.max) {
        taskOutcome.costs.max = taskCost;
      }
    }

    times[totalTime] += 1;
    const totalCostBucket = Math.round(totalCost);
    costs[totalCostBucket] += 1;
    estimateDetails.push(outcome);
    if (totalTime < minTime || minTime === -1) { minTime = totalTime; }
    if (totalTime > maxTime) { maxTime = totalTime; }
    if (totalCostBucket < minCost || minCost === -1) { minCost = totalCostBucket; }
    if (totalCostBucket > maxCost) { maxCost = totalCostBucket; }
  };

  /**
   * Compiles final results from simulation data.
   * @returns {Object} Complete simulation results with statistics.
   */
  const compileResults = () => {
    const endTime = Date.now();
    const taskResults = Object.values(taskOutcomes).map((task) => {
      const result = {
        rowId: task.rowId,
        name: task.name,
        times: {
          ...task.times,
          median: getMedian(task.times.list),
          sd: getStandardDeviation(task.times.list),
        },
        costs: {
          ...task.costs,
          median: getMedian(task.costs.list),
          sd: getStandardDeviation(task.costs.list),
        },
      };

      result.times.likelyMin = Math.round(result.times.median - result.times.sd);
      result.times.likelyMax = Math.round(result.times.median + result.times.sd);
      result.costs.likelyMin = Math.round(result.costs.median - result.costs.sd);
      result.costs.likelyMax = Math.round(result.costs.median + result.costs.sd);

      return result;
    });

    const runningTime = endTime - startTime;
    const results = {
      runningTime,
      estimateDetails,
      taskResults,
      times: {
        median: getMedian(times),
        sd: getStandardDeviation(times),
        min: minTime,
        max: maxTime,
        list: times,
      },
      costs: {
        median: getMedian(costs),
        sd: getStandardDeviation(costs),
        min: minCost,
        max: maxCost,
        list: costs,
      },
    };

    results.times.likelyMin = Math.round(results.times.median - results.times.sd);
    results.times.likelyMax = Math.round(results.times.median + results.times.sd);
    results.costs.likelyMin = Math.round(results.costs.median - results.costs.sd);
    results.costs.likelyMax = Math.round(results.costs.median + results.costs.sd);

    return results;
  };

  // If using progress callbacks, execute asynchronously with batches
  if (onBatchComplete) {
    const runBatch = async (startIndex, currentBatchSize) => {
      const endIndex = Math.min(startIndex + currentBatchSize, totalPasses);

      for (let i = startIndex; i < endIndex; i += 1) {
        runIteration();
      }

      const processedPasses = endIndex;
      const hasMoreBatches = endIndex < totalPasses;

      const currentTimeMedian = getMedian(times);
      const currentTimeSd = getStandardDeviation(times);
      const currentCostMedian = getMedian(costs);
      const currentCostSd = getStandardDeviation(costs);

      await onBatchComplete({
        processedPasses,
        totalPasses,
        hasMoreBatches,
        times: {
          list: times,
          min: minTime,
          max: maxTime,
          median: currentTimeMedian,
          sd: currentTimeSd,
          likelyMin: Math.round(currentTimeMedian - currentTimeSd),
          likelyMax: Math.round(currentTimeMedian + currentTimeSd),
        },
        costs: {
          list: costs,
          min: minCost,
          max: maxCost,
          median: currentCostMedian,
          sd: currentCostSd,
          likelyMin: Math.round(currentCostMedian - currentCostSd),
          likelyMax: Math.round(currentCostMedian + currentCostSd),
        },
      });

      if (hasMoreBatches) {
        await pauseForUiUpdate();
        return runBatch(endIndex, currentBatchSize);
      }

      return Promise.resolve();
    };

    return runBatch(0, batchSize).then(() => compileResults());
  }

  // Otherwise, execute synchronously
  for (let i = 0; i < totalPasses; i += 1) {
    runIteration();
  }

  return compileResults();
}

/**
 * Runs the simulation for a given number of passes.
 * @param {number} passes - Number of simulation iterations
 * @param {Array} data - Task data
 * @param {number} hoursPerTimeUnit - Hours per time unit (1 for hours, 8 for days)
 * @returns {Object} Simulation results
 */
function runSimulation(passes, data, hoursPerTimeUnit = 1) {
  return runSimulationCore(passes, data, {}, hoursPerTimeUnit);
}

/**
 * Runs simulation asynchronously and reports intermediate histogram progress.
 * @param {Integer} passes Number of simulation passes.
 * @param {Object} data Task input data.
 * @param {Function} onProgress Callback invoked with intermediate histogram state.
 * @param {number} progressInterval Number of passes between progress callbacks.
 * @param {number} hoursPerTimeUnit Hours per time unit (1 for hours mode, 8 for days mode).
 * @returns {Promise<Object>} Full simulation results.
 */
async function runSimulationProgressive(
  passes,
  data,
  onProgress = null,
  progressInterval = 1000,
  hoursPerTimeUnit = 1,
) {
  const updateInterval = Math.max(1, parseInt(progressInterval, 10) || 1000);

  return runSimulationCore(passes, data, {
    batchSize: updateInterval,
    onBatchComplete: async (progress) => {
      const shouldUpdate = typeof onProgress === 'function'
        && (progress.processedPasses % updateInterval === 0 || !progress.hasMoreBatches);

      if (shouldUpdate) {
        onProgress(progress);
      }
    },
  }, hoursPerTimeUnit);
}

/**
 * Maps Fibonacci story point values to calendar day ranges using provided mappings.
 * @param {number} fibonacci - Story point value (1, 2, 3, 5, 8, 13, 21, 34)
 * @param {Object} mappings - Object mapping Fibonacci values to {min, max} day ranges
 * @returns {Object} {min: number, max: number} Range in calendar days
 */
function fibonacciToCalendarDays(fibonacci, mappings) {
  const fib = parseInt(fibonacci, 10);

  if (mappings && mappings[fib]) {
    return mappings[fib];
  }

  // Fallback for any non-standard Fibonacci numbers
  return { min: Math.round(fib * 0.8), max: fib };
}

/**
 * Maps Fibonacci story point values to calendar day ranges based on team velocity.
 * Uses historical velocity data to convert story points to realistic day estimates.
 * @param {number} fibonacci - Story point value
 * @param {number} pointsPerSprint - Team's velocity (points completed per sprint)
 * @param {number} sprintLengthDays - Sprint duration in working days
 * @returns {Object} {min: number, max: number} Range in calendar days
 */
function fibonacciToVelocityDays(fibonacci, pointsPerSprint, sprintLengthDays) {
  const fib = parseInt(fibonacci, 10);
  const points = parseFloat(pointsPerSprint);
  const days = parseFloat(sprintLengthDays);

  if (fib <= 0 || points <= 0 || days <= 0) {
    return { min: 0, max: 0 };
  }

  const pointsPerDay = points / days;
  const baseDays = fib / pointsPerDay;

  // Apply variance: ±30% to account for uncertainty, rounded to whole days
  const min = Math.round(baseDays * 0.7);
  const max = Math.round(baseDays * 1.3);

  return { min, max };
}

// Re-export everything from sub-modules so existing callers (index.js, tests) need no changes.
export {
  GRAPH_CONFIG,
  GRAPH_CONFIG_DEFAULTS,
  buildHistogram,
  buildHistogramPreview,
  buildTaskRowHistogram,
} from '../visualization/charts';

export {
  getRandom,
  getValueCount,
  getMedian,
  getStandardDeviation,
  calculateKDE,
  taskUpperBound,
  taskLowerBound,
} from './stats';

export {
  runSimulation,
  runSimulationProgressive,
  fibonacciToCalendarDays,
  fibonacciToVelocityDays,
};
