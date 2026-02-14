import * as d3 from 'd3';

/**
 * Get a random number is a given range.
 * @param {int} minimum
 * @param {int} maximum
 * @returns int
 */
function getRandom(minimum, maximum) {
  const min = Math.ceil(minimum);
  const max = Math.floor(maximum);
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
}

/**
 * Calculates the upper bound for a specific task record. Because developers
 * are known to underestimate, the idea here is the less confidence they have
 * in their estimate the more risk that it could go much higher than expected.
 * So for every 10% drop in confidence we add the max estimate on again.
 * 90% leaves the upper bound at max estimate.
 * 80% gives us max * 2.
 * 70% max * 3.
 * And so on.
 * @param {*} maxEstimate
 * @param {*} confidence
 * @returns Integer
 */
function taskUpperBound(maxEstimate, confidence) {
  // Calculate multiplier based on confidence level
  // 100% conf = 1x, 90% = 1x, 80% = 2x, 70% = 3x, etc.
  const confidencePercent = Math.round(confidence * 100);
  const multiplier = Math.max(1, Math.ceil((100 - confidencePercent) / 10));
  const boundary = maxEstimate * multiplier;
  return boundary;
}

/**
 * Does the estimate for one task. It picks a random number between min and
 * max confidence % of the time. If the number is outside the range, it has
 * an even chance of being between 0-min, or above max. Since confidence in
 * an estimate implies both likelihood of being right and likelihood of being
 * close. The less confidence in the estimate the higher the risk of the
 * project going way over time. For every 10% drop in overrun grows by 100%
 * of max estimate.
 * @param {*} minimum
 * @param {*} maximum
 * @param {*} confidence
 * @returns
 */
function generateEstimate(minimum, maximum, confidence) {
  const max = parseInt(maximum, 10);
  const min = parseInt(minimum, 10);
  const base = getRandom(1, 1000);
  const boundary = confidence * 1000;
  const midBoundary = Math.floor((1000 - boundary) / 2);
  const range = (max - min) + 1;
  const maxOverrun = taskUpperBound(max, confidence);
  let total = 0;

  if (base < boundary) {
    total = (base % range) + min;
  } else if ((base - boundary) < midBoundary) {
    total = min === 0 ? 0 : base % min;
  } else {
    total = getRandom(max, maxOverrun);
  }

  return total;
}

/**
 * Counts the total number of values in this result set.
 * @param {Array} data Array of summarized results.
 * @returns the count of values in the result set.
 */
function getValueCount(data) {
  // Find total count of values.
  let valueCount = 0;
  data.forEach((value) => {
    valueCount += value;
  });
  return valueCount;
}

/**
 * Gaussian kernel function for KDE.
 * @param {number} distance Distance from the point
 * @param {number} bandwidth Bandwidth parameter
 * @returns {number} Kernel value
 */
function gaussianKernel(distance, bandwidth) {
  const u = distance / bandwidth;
  return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculates kernel density estimate for visualization.
 * @param {Array} data Array of frequency values
 * @param {number} minBin Starting index
 * @param {number} maxBin Ending index
 * @returns {Array} Array of KDE values
 */
function calculateKDE(data, minBin, maxBin) {
  // Calculate bandwidth using Silverman's rule of thumb
  const totalCount = getValueCount(data);
  const range = maxBin - minBin;
  const bandwidth = Math.max(range * 0.02, 1);

  const kdeValues = [];
  const samplePoints = Math.min(200, range); // Limit sample points for performance
  const step = range / samplePoints;

  for (let sample = 0; sample < samplePoints; sample += 1) {
    const x = minBin + (sample * step);
    let density = 0;

    // Sum kernel contributions from all data points
    data.forEach((frequency, i) => {
      if (frequency > 0) {
        const dataPoint = i + minBin;
        const distance = x - dataPoint;
        // Weight by frequency (how many times this value occurred)
        density += frequency * gaussianKernel(distance, bandwidth);
      }
    });

    // Normalize by total count and bandwidth
    kdeValues.push(density / (totalCount * bandwidth));
  }

  // Scale KDE values to match the frequency scale for visualization
  const maxKDE = Math.max(...kdeValues);
  const maxFreq = Math.max(...data);
  const scaleFactor = maxFreq / maxKDE;

  return kdeValues.map((v) => v * scaleFactor);
}

/**
 * Calculates the median value for all times run during a series of simulations. In the expected
 * array each cell is the number of times the result was equal to the index.
 * @param {Array} data Array of summarized results.
 * @returns the median from value of the run.
 */
function getMedian(data) {
  // Find total count of values.
  const valueCount = getValueCount(data);

  // Walk back to the middle of the result set to see which is median
  const midCount = valueCount / 2;
  let median = 0;
  let currentDistance = 0;
  for (let i = 0; i < data.length; i += 1) {
    currentDistance += data[i];
    // We passed the mid point in this segment, we are sitting on the value.
    if (currentDistance > midCount) {
      median = i;
      break;
    }
    // The median falls on the line between this segment and the next we have a bit of work to do.
    // If this is a odd-length set (rare in this design) average this and the next.
    // If there is gap between this value and the next, we need to measure it and pick the
    // midpoint of the gap.
    if (currentDistance === midCount) {
      const lookAhead = data[i + 1];
      if (lookAhead) {
        // No gap, to the median is between here and the next.
        median = (i + (i + 1)) / 2;
        return median;
      }
      // We have a gap, so find next value.
      let gap = 1;
      let offset = 0;
      for (let j = i + 2; j < data.length; j += 1) {
        if (data[j] === 0) {
          gap += 1;
        } else {
          // Found end of gap. The median is the middle of the gap.
          offset = gap / 2;
          break;
        }
      }
      median = i + offset + 0.5;
      return median;
    }
  }

  return median;
}

/**
 * Calculates the standard deviation of the result list in compressed form.
 * The assumption here is that this is histogram-style data so each cell
 * is a count of results at that value.
 * Hat Tip: http://statisticshelper.com/standard-deviation-calculator-with-step-by-step-solution
 * @param {*} numberArray
 * @returns
 */
function getStandardDeviation(numberArray) {
  // Calculate the average.
  const sum = numberArray.reduce(
    (total, currentValue, currentIndex) => total + (currentValue * currentIndex),
  );
  const valueCount = getValueCount(numberArray);
  const avg = sum / valueCount;

  // Calculate the standard deviation itself.
  let sdPrep = 0;
  for (let i = 0; i < numberArray.length; i += 1) {
    sdPrep += ((i - avg) ** 2) * numberArray[i];
  }

  // Divide by n - 1
  // This answer is the variance of the sample.
  const variance = sdPrep / (valueCount - 1);

  const standardDev = Math.sqrt(variance);
  return standardDev;
}

/**
 * Calculate the longest time the simulator may come up with.
 * @param {*} tasks: The list of tasks being tested.
 * @param {boolean} useCost: Calculates the cost instead of time boundary.
 * @returns
 */
function calculateUpperBound(tasks, useCost = false) {
  let total = 0;
  let multiplier = 1;
  tasks.forEach((row) => {
    if (useCost) {
      multiplier = row.Cost;
    }
    total += (taskUpperBound(row.Max, row.Confidence) * multiplier);
  });
  return total;
}

/**
 * Builds the histogram graph, and returns an svg from D3. When there is lots of
 * data it will automatically convert to use a xy scatter graph instead of a bar graph.
 * @param {HTMLElement} targetNode The DOM element to insert the graph into.
 * @param {Array} list List of values to display
 * @param {number} min Smallest value
 * @param {number} max Largest value
 * @param {number} median Median
 * @param {number} stdDev Standard Deviation of values.
 * @param {boolean} limitGraph Limits the display to two standard deviations.
 */
function buildHistogram(targetNode, list, min, max, median, stdDev, xLabel, limitGraph) {
  // Remove and existing graphs
  targetNode.innerHTML = '';

  // The number of points before it switches to using a line graph.
  const barCutoff = 600;

  // The width of the image
  const imageWidth = 800;
  const imageHeight = 500;

  // Image Margins
  const binMargin = 0.2;
  const margin = {
    top: 10, right: 30, bottom: 50, left: 60,
  };

  // Set outer bounds of graph.
  let minBin = min;
  let maxBin = max;

  // Trim the array to just hold cells in the range of results.
  // If limit graph is set, just show two standard deviations on the graph.
  if (limitGraph) {
    maxBin = median + (stdDev * 2) < max ? median + (stdDev * 2) : max;
    minBin = median - (stdDev * 2) > min ? median - (stdDev * 2) : min;
  }
  const data = list.filter((e, i) => (i >= minBin && i <= maxBin));

  // We need to round the median and standard deviation and find the
  // index we expect for the bars.
  const medianIndex = Math.round(median - minBin);
  const stdDevOffset = Math.round(stdDev);
  const stdDevLowIndex = medianIndex - stdDevOffset;
  const stdDevHighIndex = medianIndex + stdDevOffset;

  // whitespace on either side of the bars
  const width = imageWidth - margin.left - margin.right;
  const height = imageHeight - margin.top - margin.bottom;

  // Set the limits of the x axis
  const xMin = minBin - 1;
  const xMax = maxBin + 1;

  // Determine if we should use a bar graph or scatter plot.
  const useBars = (xMax - xMin) < barCutoff;

  // Set the max range of the y axis.
  // The data array can be quite large so standard Math.Max approaches can fail.
  const sortedData = [...data].sort((a, b) => a - b);
  const yMax = sortedData[sortedData.length - 1];

  // This scale is for determining the widths of the histogram bars
  const x = d3.scaleLinear()
    .domain([0, (xMax - xMin)])
    .range([0, width]);

  // Scale for the placement of the bars
  const x2 = d3.scaleLinear()
    .domain([xMin, xMax])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, yMax])
    .range([height, 0]);

  const xAxis = d3.axisBottom().scale(x2);
  const yAxis = d3.axisLeft().scale(y).ticks(8);

  // Put the graph in the histogram div.
  const svg = d3.select(targetNode).append('svg')
    .attr('role', 'img')
    .attr('aria-label', `Histogram showing distribution of ${xLabel}. Median: ${median.toFixed(2)}, Standard Deviation: ${stdDev.toFixed(2)}, Range: ${min} to ${max}`)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Add the x axis and x-label.
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis);
  svg.append('text')
    .attr('class', 'xLabel')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom)
    .text(xLabel);

  // Add the y axis and y-label.
  svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(0,0)')
    .call(yAxis);
  svg.append('text')
    .attr('class', 'yLabel')
    .attr('y', 0 - margin.left) // x and y switched due to rotation.
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .attr('transform', 'rotate(-90)')
    .style('text-anchor', 'middle')
    .text('Frequency');

  // Set up the bars.
  if (useBars) {
    const bar = svg.selectAll('.bar')
      .data(data)
      .enter().append('g')
      .attr('class', (d, i) => {
        if (i === medianIndex) {
          return 'bar median';
        } if (i > stdDevLowIndex && i < stdDevHighIndex) {
          return 'bar stdDev';
        }
        return 'bar';
      })
      .attr('transform', (d, i) => `translate(${x2(i + minBin)},${y(d)})`);

    // Add rectangles of correct size at correct location.
    bar.append('rect')
      .attr('x', x(binMargin))
      .attr('width', x(2 * binMargin))
      .attr('height', (d) => height - y(d));
  } else {
    // Use Scatter plot instead of bars
    svg.selectAll('dot')
      .data(data)
      .join('circle')
      .attr('cx', (d, i) => x2(i + minBin))
      .attr('cy', (d) => y(d))
      .attr('r', (d, i) => {
        if (i === medianIndex) {
          return 3;
        }
        return 1;
      })
      .attr('class', (d, i) => {
        if (i === medianIndex) {
          return 'graphXY median';
        } if (i > stdDevLowIndex && i < stdDevHighIndex) {
          return 'graphXY stdDev';
        }
        return 'graphXY';
      });

    // Draw kernel density estimate curve
    const kdeData = calculateKDE(data, minBin, maxBin);
    const kdeStep = (maxBin - minBin) / kdeData.length;

    const lineGenerator = d3.line()
      .x((d, i) => x2(minBin + (i * kdeStep)))
      .y((d) => y(d))
      .curve(d3.curveCardinal.tension(0.5));

    svg.append('path')
      .datum(kdeData)
      .attr('class', 'kde-curve')
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2.5)
      .attr('opacity', 0.8)
      .attr('d', lineGenerator);
  }
}

/**
 * Runs the main simulation.
 * @param {Integer} passes
 * @param {Object} data
 * @returns
 */
function runSimulation(passes, data) {
  const upperTimeBound = calculateUpperBound(data);
  const upperCostBound = calculateUpperBound(data, true);
  const times = new Array(upperTimeBound + 1).fill(0);
  const costs = new Array(upperCostBound + 1).fill(0);
  const taskOutcomes = {};
  const estimates = {
    times: [],
    costs: [],
  };
  const estimateDetails = [];
  const startTime = Date.now();
  let minTime = -1;
  let maxTime = 0;
  let minCost = -1;
  let maxCost = 0;
  let endTime = 0;
  let totalTime = 0;
  let totalCost = 0;
  let outcome = {};

  // Setup task-level outcome histograms for row-level visualization.
  for (const row of data) {
    const taskTimeUpperBound = taskUpperBound(row.Max, row.Confidence);
    const taskCostUpperBound = taskTimeUpperBound * row.Cost;
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

  // Run the simulation.
  for (let i = 0; i < passes; i += 1) {
    totalTime = 0;
    totalCost = 0;
    outcome = {};

    for (const row of data) {
      const rowId = row.RowId || row.Name;
      const taskOutcome = taskOutcomes[rowId];
      const taskTime = generateEstimate(row.Min, row.Max, row.Confidence);
      const taskCost = taskTime * row.Cost;
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
    costs[totalCost] += 1;
    estimates.times.push(totalTime);
    estimates.costs.push(totalCost);
    estimateDetails.push(outcome);
    if (totalTime < minTime || minTime === -1) { minTime = totalTime; }
    if (totalTime > maxTime) { maxTime = totalTime; }
    if (totalCost < minCost || minCost === -1) { minCost = totalCost; }
    if (totalCost > maxCost) { maxCost = totalCost; }
  }
  endTime = Date.now();

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

  // Calculate and display the results.
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
}

export {
  runSimulation,
  buildHistogram,
  getRandom,
  getValueCount,
  getMedian,
  getStandardDeviation,
  calculateKDE,
  taskUpperBound,
};
