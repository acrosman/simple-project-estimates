import * as d3 from 'd3';
import { calculateKDE } from '../core/stats';

/**
 * Configuration constants for all graph visualization.
 * Consolidates settings for main histograms, preview histograms, and task row mini graphs.
 */
const GRAPH_CONFIG = {
  // Main histogram settings
  histogram: {
    barCutoff: 600, // Switch to scatter plot above this threshold
    maxBuckets: 120, // Maximum buckets for preview histograms
    width: 800, // Default histogram width
    height: 500, // Default histogram height
    margin: { // SVG margins
      top: 10,
      right: 30,
      bottom: 50,
      left: 60,
    },
  },
  // Task row mini graph settings
  miniGraph: {
    width: 140,
    height: 26,
    maxBuckets: 24,
    gap: 1, // Gap between bars
  },
};

/**
 * Immutable snapshot of the original default graph configuration values.
 * Use this in reset operations rather than repeating the literal defaults.
 */
const GRAPH_CONFIG_DEFAULTS = Object.freeze({
  histogram: Object.freeze({
    barCutoff: 600,
    maxBuckets: 120,
    width: 800,
    height: 500,
    margin: Object.freeze({
      top: 10, right: 30, bottom: 50, left: 60,
    }),
  }),
  miniGraph: Object.freeze({
    width: 140,
    height: 26,
    maxBuckets: 24,
    gap: 1,
  }),
});

/**
 * Builds the histogram graph into the target DOM node using D3. When there is lots of
 * data it will automatically convert to use a xy scatter graph instead of a bar graph.
 * @param {HTMLElement} targetNode The DOM element to insert the graph into.
 * @param {Array} list List of values to display
 * @param {number} min Smallest value
 * @param {number} max Largest value
 * @param {number} median Median
 * @param {number} stdDev Standard Deviation of values.
 * @param {string} xLabel Label for the x-axis.
 * @param {boolean} limitGraph Limits the display to two standard deviations.
 */
function buildHistogram(targetNode, list, min, max, median, stdDev, xLabel, limitGraph) {
  // Remove any existing graphs
  targetNode.innerHTML = '';

  const {
    barCutoff, width: imageWidth, height: imageHeight, margin,
  } = GRAPH_CONFIG.histogram;

  const binMargin = 0.2;

  let minBin = min;
  let maxBin = max;

  if (limitGraph) {
    maxBin = median + (stdDev * 2) < max ? median + (stdDev * 2) : max;
    minBin = median - (stdDev * 2) > min ? median - (stdDev * 2) : min;
  }
  const data = list.filter((e, i) => (i >= minBin && i <= maxBin));

  const medianIndex = Math.round(median - minBin);
  const stdDevOffset = Math.round(stdDev);
  const stdDevLowIndex = medianIndex - stdDevOffset;
  const stdDevHighIndex = medianIndex + stdDevOffset;

  const width = imageWidth - margin.left - margin.right;
  const height = imageHeight - margin.top - margin.bottom;

  const xMin = minBin - 1;
  const xMax = maxBin + 1;

  const useBars = (xMax - xMin) < barCutoff;

  const sortedData = [...data].sort((a, b) => a - b);
  const yMax = sortedData[sortedData.length - 1];

  const x = d3.scaleLinear()
    .domain([0, (xMax - xMin)])
    .range([0, width]);

  const x2 = d3.scaleLinear()
    .domain([xMin, xMax])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, yMax])
    .range([height, 0]);

  const xAxis = d3.axisBottom().scale(x2);
  const yAxis = d3.axisLeft().scale(y).ticks(8);

  const svg = d3.select(targetNode).append('svg')
    .attr('role', 'img')
    .attr('aria-label', `Histogram showing distribution of ${xLabel}. Median: ${median.toFixed(2)}, Standard Deviation: ${stdDev.toFixed(2)}, Range: ${min} to ${max}`)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .style('opacity', 0)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const renderTransition = d3.transition().duration(250).ease(d3.easeCubicOut);

  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis);
  svg.append('text')
    .attr('class', 'xLabel')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 10)
    .text(xLabel);

  svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(0,0)')
    .call(yAxis);
  svg.append('text')
    .attr('class', 'yLabel')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .attr('transform', 'rotate(-90)')
    .style('text-anchor', 'middle')
    .text('Frequency');

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
      .attr('transform', (d, i) => `translate(${x2(i + minBin)},${height})`);

    bar.transition(renderTransition)
      .attr('transform', (d, i) => `translate(${x2(i + minBin)},${y(d)})`);

    bar.append('rect')
      .attr('x', x(binMargin))
      .attr('width', x(2 * binMargin))
      .attr('height', 0)
      .transition(renderTransition)
      .attr('height', (d) => height - y(d));
  } else {
    const points = svg.selectAll('dot')
      .data(data)
      .join('circle')
      .attr('cx', (d, i) => x2(i + minBin))
      .attr('cy', (d) => y(d))
      .attr('opacity', 0)
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

    points.transition(renderTransition)
      .attr('opacity', 1);

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
      .attr('opacity', 0)
      .attr('d', lineGenerator)
      .transition(renderTransition)
      .attr('opacity', 0.8);
  }

  d3.select(targetNode)
    .select('svg')
    .transition(renderTransition)
    .style('opacity', 1);
}

/**
 * Builds a lightweight histogram preview for progressive simulation updates.
 * Uses fixed bucket counts and no KDE for fast redraw performance.
 * @param {HTMLElement} targetNode The DOM element to insert the graph into.
 * @param {Array<number>} list List of values to display.
 * @param {number} min Smallest value.
 * @param {number} max Largest value.
 * @param {string} xLabel X axis label.
 */
function buildHistogramPreview(targetNode, list, min, max, xLabel) {
  if (min < 0 || max < min) {
    return;
  }

  const {
    width: imageWidth, height: imageHeight, margin,
  } = GRAPH_CONFIG.histogram;
  const width = imageWidth - margin.left - margin.right;
  const height = imageHeight - margin.top - margin.bottom;

  const valueRange = (max - min) + 1;
  const rawMaxBuckets = GRAPH_CONFIG.histogram.maxBuckets;
  const maxBuckets = (Number.isFinite(rawMaxBuckets) && rawMaxBuckets > 0)
    ? Math.floor(rawMaxBuckets)
    : 120;
  const bucketCount = Math.max(1, Math.min(maxBuckets, valueRange));
  const bucketSize = Math.max(1, Math.ceil(valueRange / bucketCount));
  const buckets = new Array(bucketCount).fill(0);

  for (let i = min; i <= max; i += 1) {
    const bucketIndex = Math.min(Math.floor((i - min) / bucketSize), bucketCount - 1);
    buckets[bucketIndex] += list[i] || 0;
  }

  let yMax = 0;
  for (const bucketValue of buckets) {
    if (bucketValue > yMax) {
      yMax = bucketValue;
    }
  }

  if (yMax < 1) {
    return;
  }

  const x = d3.scaleLinear()
    .domain([0, bucketCount])
    .range([0, width]);

  const x2 = d3.scaleLinear()
    .domain([min, max])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, yMax])
    .range([height, 0]);

  const xAxis = d3.axisBottom().scale(x2).ticks(8);
  const yAxis = d3.axisLeft().scale(y).ticks(8);

  const container = d3.select(targetNode);
  let svg = container.select('svg.preview-svg');

  if (svg.empty()) {
    targetNode.innerHTML = '';
    svg = container.append('svg')
      .attr('class', 'preview-svg')
      .attr('role', 'img');

    const root = svg.append('g')
      .attr('class', 'preview-root');

    root.append('g').attr('class', 'x axis');
    root.append('text')
      .attr('class', 'xLabel')
      .attr('text-anchor', 'middle');

    root.append('g').attr('class', 'y axis');
    root.append('text')
      .attr('class', 'yLabel')
      .attr('dy', '1em')
      .attr('transform', 'rotate(-90)')
      .style('text-anchor', 'middle')
      .text('Frequency');
  }

  svg
    .attr('aria-label', `Histogram preview showing distribution of ${xLabel}. Range: ${min} to ${max}`)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const root = svg.select('g.preview-root')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const barWidth = Math.max((width / bucketCount) - 1, 1);
  const renderTransition = d3.transition().duration(180).ease(d3.easeCubicOut);

  root.select('.x.axis')
    .attr('transform', `translate(0,${height})`)
    .transition(renderTransition)
    .call(xAxis);

  root.select('.xLabel')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 10)
    .text(xLabel);

  root.select('.y.axis')
    .transition(renderTransition)
    .call(yAxis);

  root.select('.yLabel')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2));

  const bars = root.selectAll('rect.preview-bar')
    .data(buckets, (d, i) => i);

  bars.join(
    (enter) => enter.append('rect')
      .attr('class', 'preview-bar')
      .attr('x', (d, i) => x(i) + 0.5)
      .attr('width', barWidth)
      .attr('y', height)
      .attr('height', 0)
      .call((selection) => selection.transition(renderTransition)
        .attr('y', (d) => y(d))
        .attr('height', (d) => height - y(d))),
    (update) => update
      .call((selection) => selection.transition(renderTransition)
        .attr('x', (d, i) => x(i) + 0.5)
        .attr('width', barWidth)
        .attr('y', (d) => y(d))
        .attr('height', (d) => height - y(d))),
    (exit) => exit
      .call((selection) => selection.transition(renderTransition)
        .attr('y', height)
        .attr('height', 0)
        .remove()),
  );
}

/**
 * Builds a compact histogram visualization for a single task row.
 * @param {HTMLElement} targetNode Graph container for one task row.
 * @param {Array<number>} list Task histogram data.
 * @param {number} min Minimum simulated value.
 * @param {number} max Maximum simulated value.
 * @param {string} taskName Task display name.
 */
function buildTaskRowHistogram(targetNode, list, min, max, taskName) {
  targetNode.innerHTML = '';

  if (min < 0 || max < min) {
    return;
  }

  const {
    width: graphWidth, height: graphHeight, maxBuckets, gap,
  } = GRAPH_CONFIG.miniGraph;
  const valueRange = max - min + 1;
  const bucketCount = Math.min(maxBuckets, valueRange);
  const bucketSize = Math.ceil(valueRange / bucketCount);
  const buckets = new Array(bucketCount).fill(0);

  for (let i = min; i <= max; i += 1) {
    const bucketIndex = Math.min(Math.floor((i - min) / bucketSize), bucketCount - 1);
    buckets[bucketIndex] += list[i];
  }

  let peak = 0;
  for (const value of buckets) {
    if (value > peak) {
      peak = value;
    }
  }

  if (peak === 0) {
    return;
  }

  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('width', String(graphWidth));
  svg.setAttribute('height', String(graphHeight));
  svg.setAttribute('viewBox', `0 0 ${graphWidth} ${graphHeight}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Task outcome histogram for ${taskName || 'task'}`);

  const barWidth = Math.max((graphWidth / bucketCount) - gap, 1);

  for (let i = 0; i < buckets.length; i += 1) {
    const bucketValue = buckets[i];
    const barHeight = Math.max((bucketValue / peak) * graphHeight, 1);
    const rect = document.createElementNS(svgNs, 'rect');
    rect.setAttribute('x', String(i * (barWidth + gap)));
    rect.setAttribute('y', String(graphHeight - barHeight));
    rect.setAttribute('width', String(barWidth));
    rect.setAttribute('height', String(barHeight));
    rect.setAttribute('class', 'task-row-mini-bar');
    svg.appendChild(rect);
  }

  targetNode.appendChild(svg);
}

export {
  GRAPH_CONFIG,
  GRAPH_CONFIG_DEFAULTS,
  buildHistogram,
  buildHistogramPreview,
  buildTaskRowHistogram,
};
