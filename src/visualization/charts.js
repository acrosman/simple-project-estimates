/**
 * D3-powered chart and histogram visualization module.
 * Builds time and cost histograms, per-task mini graphs, and histogram previews.
 * Exposes GRAPH_CONFIG for runtime customization and GRAPH_CONFIG_DEFAULTS for resets.
 * @module visualization/charts
 */
import * as d3 from 'd3';
import { calculateKDE } from '../core/stats';

/**
 * Immutable snapshot of the original default graph configuration values.
 * Use this as the source of truth for initial values and reset operations.
 */
const GRAPH_CONFIG_DEFAULTS = Object.freeze({
  histogram: Object.freeze({
    barCutoff: 600, // Switch to scatter plot above this threshold
    maxBuckets: 120, // Maximum buckets for preview histograms
    width: 800, // Default histogram width
    height: 500, // Default histogram height
    margin: Object.freeze({ // SVG margins
      top: 10,
      right: 30,
      bottom: 50,
      left: 60,
    }),
  }),
  miniGraph: Object.freeze({
    width: 140,
    height: 26,
    maxBuckets: 24,
    gap: 1, // Gap between bars
  }),
});

/**
 * Configuration constants for all graphs.
 * Includes settings for main histograms, preview histograms, and task row mini graphs.
 * Initialized from GRAPH_CONFIG_DEFAULTS; mutated at runtime by Advanced Settings UI.
 */
const GRAPH_CONFIG = {
  histogram: {
    ...GRAPH_CONFIG_DEFAULTS.histogram,
    margin: { ...GRAPH_CONFIG_DEFAULTS.histogram.margin },
  },
  miniGraph: { ...GRAPH_CONFIG_DEFAULTS.miniGraph },
};

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

  // Pull graph dimensions and thresholds from the config
  const {
    barCutoff, width: imageWidth, height: imageHeight, margin,
  } = GRAPH_CONFIG.histogram;

  // When limitGraph is true, set the visible range to two standard deviations
  // around the median so extreme outliers don't distract from core display.
  let minBin = min;
  let maxBin = max;

  if (limitGraph) {
    maxBin = median + (stdDev * 2) < max ? median + (stdDev * 2) : max;
    minBin = median - (stdDev * 2) > min ? median - (stdDev * 2) : min;
  }

  // Slice the histogram array to only the visible range, and precompute indices for median and
  // stdDev styling.
  const data = list.filter((e, i) => (i >= minBin && i <= maxBin));

  const medianIndex = Math.round(median - minBin);
  const stdDevOffset = Math.round(stdDev);
  const stdDevLowIndex = medianIndex - stdDevOffset;
  const stdDevHighIndex = medianIndex + stdDevOffset;

  // Derive the inner drawing area by subtracting margins from the total SVG size
  const width = imageWidth - margin.left - margin.right;
  const height = imageHeight - margin.top - margin.bottom;

  // Add a one-unit buffer on each side so bars at the edges don't touch the axes
  const xMin = minBin - 1;
  const xMax = maxBin + 1;

  // Switch to a scatter-plot + KDE curve when the data range is too wide for readable bars
  const useBars = (xMax - xMin) < barCutoff;

  // binMargin is calculated dynamically based on number of bins and image size.
  // It is capped at 0.4 so bars remain at least ~20% of their slot width when data is dense.
  const BIN_GAP_PX = 1;
  const binMargin = Math.min(0.4, (BIN_GAP_PX * (xMax - xMin)) / width);

  // Set the y-axis ceiling to the maximum result count.
  const yMax = data.reduce((acc, val) => (val > acc ? val : acc), 0);

  // x maps bar index (0-based within the visible range) to pixel position; used for bar widths
  const x = d3.scaleLinear()
    .domain([0, (xMax - xMin)])
    .range([0, width]);

  // x2 maps the actual data value to pixel position; used for axis labels and positioning.
  const x2 = d3.scaleLinear()
    .domain([xMin, xMax])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, yMax])
    .range([height, 0]);

  const xAxis = d3.axisBottom().scale(x2);
  const yAxis = d3.axisLeft().scale(y).ticks(8);

  // Create the root SVG element
  const svg = d3.select(targetNode).append('svg')
    .attr('role', 'img')
    .attr('aria-label', `Histogram showing distribution of ${xLabel}. Median: ${median.toFixed(2)}, Standard Deviation: ${stdDev.toFixed(2)}, Range: ${min} to ${max}`)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Append x-axis at the bottom of the drawing area with its label.
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

  // Append y-axis on the left side, rotated 90° so "Frequency" reads vertically.
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
    // Bar graph: each bucket is a <g> that animates upward from the x-axis baseline.
    // CSS classes distinguish the median bar, one-stdDev band, and ordinary bars.
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

    bar.append('rect')
      .attr('x', x(binMargin))
      .attr('width', x(2 * binMargin))
      .attr('height', (d) => height - y(d));
  } else {
    // Scatter plot: used when the data range exceeds barCutoff and individual bars
    // would be too narrow to be meaningful.
    svg.selectAll('dot')
      .data(data)
      .join('circle')
      .attr('cx', (d, i) => x2(i + minBin))
      .attr('cy', (d) => y(d))
      .attr('opacity', 1)
      // The median point is drawn larger so it stays visible at small radii
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

    // Overlay a KDE smoothing curve to show the overall distribution shape
    const kdeData = calculateKDE(data, minBin, maxBin);
    // kdeStep maps each KDE sample back to the original value domain
    const kdeStep = (maxBin - minBin) / kdeData.length;

    const lineGenerator = d3.line()
      .x((d, i) => x2(minBin + (i * kdeStep)))
      .y((d) => y(d))
      .curve(d3.curveCardinal.tension(0.5));

    svg.append('path')
      .datum(kdeData)
      .attr('class', 'kde-curve')
      .attr('fill', 'none')
      .attr('stroke-width', 2.5)
      .attr('opacity', 0.8)
      .attr('d', lineGenerator);
  }
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

  root.select('.x.axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis);

  root.select('.xLabel')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom - 10)
    .text(xLabel);

  root.select('.y.axis')
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
      .attr('y', (d) => y(d))
      .attr('height', (d) => height - y(d)),
    (update) => update
      .attr('x', (d, i) => x(i) + 0.5)
      .attr('width', barWidth)
      .attr('y', (d) => y(d))
      .attr('height', (d) => height - y(d)),
    (exit) => exit.remove(),
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
