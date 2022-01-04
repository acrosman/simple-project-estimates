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
 * 90% leaves the uppoer bound at max estimate.
 * 80% gives us max * 2.
 * 70% max * 3.
 * And so on.
 * @param {*} maxEstimate
 * @param {*} confidence
 * @returns Integer
 */
function taskUpperBound(maxEstimate, confidence) {
  const boundry = maxEstimate * Math.abs(Math.floor(10 - (confidence * 10)));
  return boundry;
}

/**
 * Does the estimate for one task. It picks a random number between min and
 * max confidence % of the time. If the number is outside the range, it has
 * an even chance of being between 0-min, or above max. Since confidence in
 * an estimate implies both likelyhood of being right and likelyhood of being
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
  const boundry = confidence * 1000;
  const midBoundry = Math.floor((1000 - boundry) / 2);
  const range = (max - min) + 1;
  const maxOverrun = taskUpperBound(max, confidence);
  let total = 0;

  if (base < boundry) {
    total = (base % range) + min;
  } else if ((base - boundry) < midBoundry) {
    total = min === 0 ? 0 : base % min;
  } else {
    total = getRandom(max, maxOverrun);
  }

  return total;
}

/**
 * Calculates the median value for all times run during a series of simulations.
 * @param {Array} data Array of summarized results with each cell being the number of times the index was the result of a run.
 * @returns the median from value of the run.
 */
function getMedian(data) {

  // Find total number of values in the list.
  let total = 0;
  data.forEach((value, index) => {
    total += value * index;
  });

  // Walk back to the middle of the result set to see which is median
  const midPoint = total / 2;
  let median = 0;
  let currentDistance = 0;
  const isOdd = total % 2;
  for (let i = 0; i < data.length; i += 1) {
    currentDistance += data[i] * i;
    // We aren't there yet, so keep going.
    if (currentDistance < midPoint) {
      continue;
    }
    // We passed the midPoint in this segment, so the median was here.
    if (currentDistance > midPoint) {
      median = i;
      break;
    }
    // The median falls on the line between this segment and the next.
    // if this is a odd-lengthed set (rare in this design) average this and the next.
    // otherwise use this value.
    if (currentDistance === midPoint) {
      if (isOdd) {
        median = (i + (i + 1)) / 2;
      } else {
        median = i;
      }
      break;
    }
  }

  return median;
}

/**
 * Calculates the standard deviation of the result list.
 * Hat tip: https://stackoverflow.com/a/41781242/24215
 * @param {*} numberArray
 * @returns
 */
function getStandardDeviation(numberArray) {
  // Calculate the average.
  const sum = numberArray.reduce((a, b) => a + b);
  const avg = sum / numberArray.length;

  // Calculate the standard deviation itself.
  let sdPrep = 0;
  for (let i = 0; i < numberArray.length; i += 1) {
    sdPrep += (parseFloat(numberArray[i]) - avg) ** 2;
  }

  const standardDev = Math.sqrt(sdPrep / numberArray.length);
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
 * Builds the histogram graph, and returns an svg from D3.
 * @param {*} list
 * @param {*} min
 * @param {*} max
 * @param {*} median
 * @param {*} stdDev
 * @returns HTMLElement
 */
function buildHistogram(list, min, max, median, stdDev, limitGraph) {
  const minBin = min;
  const maxBin = max;
  const stdDevOffset = Math.floor(stdDev);
  const maxVal = Math.max(...list);
  const medianIndex = Math.floor(median - min);

  // // Trim the array to just hold cells in the range of results.
  // // If limit graph is set, just show two standard deviations on the graph.
  // let upper = max;
  // let lower = min;
  // if (limitGraph) {
  //   upper = results.median + (results.sd * 2) < max ? results.median + (results.sd * 2) : max;
  //   lower = results.median - (results.sd * 2) > min ? results.median - (results.sd * 2) : min;
  // }
  // results.trimmed = times.filter((e, i) => (i > lower && i < upper));


  // whitespace on either side of the bars
  const binmargin = 0.2;
  const margin = {
    top: 10, right: 30, bottom: 50, left: 60,
  };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Set the limits of the x axis
  const xmin = minBin - 1;
  const xmax = maxBin + 1;

  // This scale is for determining the widths of the histogram bars
  const x = d3.scaleLinear()
    .domain([0, (xmax - xmin)])
    .range([0, width]);

  // Scale for the placement of the bars
  const x2 = d3.scaleLinear()
    .domain([xmin, xmax])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, maxVal])
    .range([height, 0]);

  const xAxis = d3.axisBottom().scale(x2);
  const yAxis = d3.axisLeft().scale(y).ticks(8);

  // Put the graph in the histogram div.
  const svgDom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const svg = d3.select(svgDom.window.document).select('body').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Set up the bars.
  const bar = svg.selectAll('.bar')
    .data(list)
    .enter().append('g')
    .attr('class', (d, i) => {
      if (i === medianIndex) {
        return 'bar median';
      } if (i > medianIndex - stdDevOffset && i < medianIndex + stdDevOffset) {
        return 'bar stdDev';
      }
      return 'bar';
    })
    .attr('transform', (d, i) => `translate(${x2(i + minBin)},${y(d)})`);

  // Add rectangles of correct size at correct location.
  bar.append('rect')
    .attr('x', x(binmargin))
    .attr('width', x(2 * binmargin))
    .attr('height', (d) => height - y(d));

  // Add the x axis and x-label.
  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis);
  svg.append('text')
    .attr('class', 'xlabel')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom)
    .text('Hours');

  // Add the y axis and y-label.
  svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(0,0)')
    .call(yAxis);
  svg.append('text')
    .attr('class', 'ylabel')
    .attr('y', 0 - margin.left) // x and y switched due to rotation.
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .attr('transform', 'rotate(-90)')
    .style('text-anchor', 'middle')
    .text('Frequency');

  return svg;
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
  const times = new Array(upperTimeBound).fill(0);
  const costs = new Array(upperCostBound).fill(0);
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

  // Run the simulation.
  for (let i = 0; i < passes; i += 1) {
    totalTime = 0;
    totalCost = 0;
    outcome = {};

    data.forEach((row) => {
      const taskTime = generateEstimate(row.Min, row.Max, row.Confidence);
      const taskCost = taskTime * row.Cost;
      totalTime += taskTime;
      totalCost += taskCost;
      outcome[row.Task] = {
        time: taskTime,
        cost: taskCost,
      };
    });
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

  // Calculate and display the results.
  const runningTime = endTime - startTime;
  const results = {
    runningTime,
    estimateDetails,
    times: {
      median: getMedian(times),
      sd: getStandardDeviation(estimates.times),
      min: minTime,
      max: maxTime,
    },
    costs: {
      median: getMedian(costs),
      sd: getStandardDeviation(estimates.costs),
      min: minCost,
      max: maxCost,
    },
  };

  results.times.likelyMin = Math.round(results.times.median - results.times.sd);
  results.times.likelyMax = Math.round(results.times.median + results.times.sd);
  results.costs.likelyMin = Math.round(results.costs.median - results.costs.sd);
  results.costs.likelyMax = Math.round(results.costs.median + results.costs.sd);

  return results;
}

export { runSimulation, buildHistogram };
