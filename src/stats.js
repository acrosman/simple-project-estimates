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
 * Calculates the lower bound for a specific task record. Mirrors taskUpperBound:
 * the less confidence in the estimate, the further an underrun can drop below min.
 * 90% leaves the lower bound at min estimate (no further underrun possible).
 * 80% gives us min / 2.
 * 70% min / 3.
 * And so on.
 * @param {number} minEstimate
 * @param {number} confidence
 * @returns {number}
 */
function taskLowerBound(minEstimate, confidence) {
  const confidencePercent = Math.round(confidence * 100);
  const multiplier = Math.max(1, Math.ceil((100 - confidencePercent) / 10));
  return minEstimate / multiplier;
}

/**
 * Does the estimate for one task. It picks a random number between min and
 * max confidence % of the time. If the number is outside the range, overruns
 * receive 75% of the outside-confidence budget and underruns receive 25%,
 * reflecting that tasks more often run over than under. Underruns are bounded
 * by a confidence-scaled floor: the lower the confidence, the further below
 * min the result can reach (mirroring the overrun upper-bound logic). For
 * every 10% drop in confidence the overrun ceiling grows by 100% of max,
 * and the underrun floor drops by 1/multiplier of min.
 * @param {number} minimum
 * @param {number} maximum
 * @param {number} confidence
 * @returns {number}
 */
function generateEstimate(minimum, maximum, confidence) {
  const max = parseFloat(maximum);
  const min = parseFloat(minimum);
  const base = getRandom(1, 1000);
  const boundary = confidence * 1000;
  // Underruns get 25% of the outside-confidence budget; overruns get 75%.
  const underrunBudget = Math.floor((1000 - boundary) * 0.25);
  const range = max - min;
  const maxOverrun = taskUpperBound(max, confidence);
  const minUnderrun = taskLowerBound(min, confidence);
  let total = 0;

  if (base < boundary) {
    // Generate random value within the min-max range
    total = (Math.random() * range) + min;
  } else if ((base - boundary) < underrunBudget) {
    // Underrun: confidence-scaled floor up to min
    total = min === 0 ? 0 : minUnderrun + (Math.random() * (min - minUnderrun));
  } else {
    // Overrun: random value between max and maxOverrun
    total = max + (Math.random() * (maxOverrun - max));
  }

  // Round to whole numbers (integers) for cleaner histogram storage
  return Math.round(total);
}

/**
 * Counts the total number of values in this result set.
 * @param {Array} data Array of summarized results.
 * @returns the count of values in the result set.
 */
function getValueCount(data) {
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
  const totalCount = getValueCount(data);
  const range = maxBin - minBin;
  const bandwidth = Math.max(range * 0.02, 1);

  const kdeValues = [];
  const samplePoints = Math.min(200, range); // Limit sample points for performance
  const step = range / samplePoints;

  for (let sample = 0; sample < samplePoints; sample += 1) {
    const x = minBin + (sample * step);
    let density = 0;

    data.forEach((frequency, i) => {
      if (frequency > 0) {
        const dataPoint = i + minBin;
        const distance = x - dataPoint;
        density += frequency * gaussianKernel(distance, bandwidth);
      }
    });

    kdeValues.push(density / (totalCount * bandwidth));
  }

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
  const valueCount = getValueCount(data);

  if (valueCount === 0) {
    return 0;
  }

  const midCount = valueCount / 2;
  let median = 0;
  let currentDistance = 0;
  for (let i = 0; i < data.length; i += 1) {
    currentDistance += data[i];
    if (currentDistance > midCount) {
      median = i;
      break;
    }
    if (currentDistance === midCount) {
      const lookAhead = data[i + 1];
      if (lookAhead) {
        median = (i + (i + 1)) / 2;
        return median;
      }
      let gap = 1;
      let offset = 0;
      for (let j = i + 2; j < data.length; j += 1) {
        if (data[j] === 0) {
          gap += 1;
        } else {
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
 * @param {Array<number>} numberArray Histogram-style frequency array.
 * @returns {number} Sample standard deviation.
 */
function getStandardDeviation(numberArray) {
  const sum = numberArray.reduce(
    (total, currentValue, currentIndex) => total + (currentValue * currentIndex),
  );
  const valueCount = getValueCount(numberArray);
  const avg = sum / valueCount;

  let sdPrep = 0;
  for (let i = 0; i < numberArray.length; i += 1) {
    sdPrep += ((i - avg) ** 2) * numberArray[i];
  }

  const variance = valueCount > 1 ? sdPrep / (valueCount - 1) : 0;
  const standardDev = Math.sqrt(variance);
  return standardDev;
}

/**
 * Calculate the longest time the simulator may come up with.
 * @param {Array<Object>} tasks The list of tasks being tested.
 * @param {boolean} useCost Calculates the cost instead of time boundary.
 * @returns {number} Combined worst-case upper bound across all tasks.
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

export {
  getRandom,
  taskUpperBound,
  taskLowerBound,
  generateEstimate,
  getValueCount,
  calculateKDE,
  getMedian,
  getStandardDeviation,
  calculateUpperBound,
};
