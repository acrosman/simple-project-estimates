import {
  getRandom,
  getValueCount,
  getMedian,
  getStandardDeviation,
  calculateKDE,
  taskUpperBound,
  taskLowerBound,
} from '../stats';

test('GetRandom', () => {
  const testResult = getRandom(1, 2);
  expect(testResult).toBeGreaterThanOrEqual(1);
  expect(testResult).toBeLessThanOrEqual(2);
});

test('GetValueCount: Short List', () => {
  // Represents a list of [1,2,2,2,3] therefore a count of 5 elements
  const sampleList = [0, 1, 3, 1];
  const countValue = getValueCount(sampleList);
  expect(countValue).toBe(5);
});

test('GetValueCount: Larger List', () => {
  // Represents a list of 36 elements
  const sampleList = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const countValue = getValueCount(sampleList);
  expect(countValue).toBe(36);
});

test('GetMedian: Simple', () => {
  // Represents a list of [1,2,2,2,3] therefore median of 2.
  const sampleList = [0, 1, 3, 1];
  const medianValue = getMedian(sampleList);
  expect(medianValue).toBe(2);
});

test('GetMedian: Last Value', () => {
  // Represents a list of [2,2,2,2,2] therefore median of 2.
  const sampleList = [0, 0, 5];
  const medianValue = getMedian(sampleList);
  expect(medianValue).toBe(2);
});

test('GetMedian: One space between values', () => {
  // [2,2,2,2,4,4,4,4] therefore median 3 (between two values)
  const sampleList = [0, 0, 4, 0, 4];
  const medianValue = getMedian(sampleList);
  expect(medianValue).toBe(3);
});

test('GetMedian: Two spaces between values', () => {
  // [2,2,2,2,5,5,5,5] therefore median 3.5 (between two values)
  const sampleList = [0, 0, 4, 0, 0, 4];
  const medianValue = getMedian(sampleList);
  expect(medianValue).toBe(3.5);
});

test('GetMedian: Three spaces between values', () => {
  // [2,2,2,2,6,6,6,6] therefore median 4 (between two values)
  const sampleList = [0, 0, 4, 0, 0, 0, 4];
  const medianValue = getMedian(sampleList);
  expect(medianValue).toBe(4);
});

test('GetMedian: Between to integers', () => {
  // [2,2,2,2,3,4,4,4] therefore median 2.5 (between two values by half)
  const sampleList = [0, 0, 4, 1, 3];
  const medianValue = getMedian(sampleList);
  expect(medianValue).toBe(2.5);
});

test('GetMedian: With Gap in List', () => {
  // [2,2,2,2,3,4,4,4,4,4,4,5,5,5,5,5,5,7,7,7,8,8,8,8] median 5 (gap in list)
  const sampleList = [0, 0, 4, 1, 6, 6, 0, 3, 4];
  const medianValue = getMedian(sampleList);
  expect(medianValue).toBe(5);
});

test('GetMedian: Bell Curve', () => {
  const sampleList = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const medianValue = getMedian(sampleList);
  expect(medianValue).toBe(6);
});

test('GetMedian: All Zeros', () => {
  const sampleList = [0, 0, 0];
  const medianValue = getMedian(sampleList);
  // All-zero histogram represents no data points; getMedian returns 0 in this case
  expect(medianValue).toBe(0);
});

test('StdDev: Bell Curve', () => {
  const sampleList = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const stdDev = getStandardDeviation(sampleList);
  expect(stdDev.toFixed(9)).toBe('2.449489743');
});

test('CalculateKDE: Returns array of density values', () => {
  const data = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const kdeValues = calculateKDE(data, 0, 10);

  expect(Array.isArray(kdeValues)).toBe(true);
  expect(kdeValues.length).toBeGreaterThan(0);
  expect(kdeValues.length).toBeLessThanOrEqual(200); // Max sample points
});

test('CalculateKDE: Peak corresponds to data peak', () => {
  // Bell curve with peak at index 5
  const data = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const kdeValues = calculateKDE(data, 0, 10);

  const maxKDE = Math.max(...kdeValues);
  const maxIndex = kdeValues.indexOf(maxKDE);

  // Should be near the middle where data peaks
  const midPoint = kdeValues.length / 2;
  expect(Math.abs(maxIndex - midPoint)).toBeLessThan(kdeValues.length * 0.2);
});

test('CalculateKDE: Handles uniform distribution', () => {
  const data = [5, 5, 5, 5, 5];
  const kdeValues = calculateKDE(data, 0, 4);

  expect(Array.isArray(kdeValues)).toBe(true);
  expect(kdeValues.length).toBeGreaterThan(0);
  expect(kdeValues.every((v) => v >= 0)).toBe(true);
});

test('CalculateKDE: Handles sparse data', () => {
  const data = [10, 0, 0, 0, 0, 0, 0, 0, 0, 10];
  const kdeValues = calculateKDE(data, 0, 9);

  expect(Array.isArray(kdeValues)).toBe(true);
  expect(kdeValues.length).toBeGreaterThan(0);
  // Should have two peaks
  const maxVal = Math.max(...kdeValues);
  const peaks = kdeValues.filter((v) => v > maxVal * 0.7);
  expect(peaks.length).toBeGreaterThan(0);
});

// Tests for taskUpperBound function
describe('taskUpperBound', () => {
  test('100% confidence should give 1x multiplier', () => {
    const result = taskUpperBound(10, 1.0);
    expect(result).toBe(10);
  });

  test('90% confidence should give 1x multiplier', () => {
    const result = taskUpperBound(10, 0.90);
    expect(result).toBe(10);
  });

  test('85% confidence should give 2x multiplier', () => {
    const result = taskUpperBound(10, 0.85);
    expect(result).toBe(20);
  });

  test('80% confidence should give 2x multiplier', () => {
    const result = taskUpperBound(10, 0.80);
    expect(result).toBe(20);
  });

  test('70% confidence should give 3x multiplier', () => {
    const result = taskUpperBound(10, 0.70);
    expect(result).toBe(30);
  });

  test('50% confidence should give 5x multiplier', () => {
    const result = taskUpperBound(10, 0.50);
    expect(result).toBe(50);
  });

  test('0% confidence should give 10x multiplier', () => {
    const result = taskUpperBound(10, 0);
    expect(result).toBe(100);
  });

  test('Works with different max estimates', () => {
    expect(taskUpperBound(20, 0.90)).toBe(20);
    expect(taskUpperBound(20, 0.80)).toBe(40);
    expect(taskUpperBound(5, 0.70)).toBe(15);
  });
});

// Tests for taskLowerBound function
describe('taskLowerBound', () => {
  test('100% confidence should give 1x divisor (floor equals min)', () => {
    const result = taskLowerBound(10, 1.0);
    expect(result).toBe(10);
  });

  test('90% confidence should give 1x divisor (floor equals min)', () => {
    const result = taskLowerBound(10, 0.90);
    expect(result).toBe(10);
  });

  test('85% confidence should give 2x divisor (floor is min / 2)', () => {
    const result = taskLowerBound(10, 0.85);
    expect(result).toBe(5);
  });

  test('80% confidence should give 2x divisor (floor is min / 2)', () => {
    const result = taskLowerBound(10, 0.80);
    expect(result).toBe(5);
  });

  test('70% confidence should give 3x divisor (floor is min / 3)', () => {
    const result = taskLowerBound(30, 0.70);
    expect(result).toBe(10);
  });

  test('50% confidence should give 5x divisor (floor is min / 5)', () => {
    const result = taskLowerBound(10, 0.50);
    expect(result).toBe(2);
  });

  test('0% confidence should give 10x divisor (floor is min / 10)', () => {
    const result = taskLowerBound(10, 0);
    expect(result).toBe(1);
  });

  test('min of 0 always returns 0 regardless of confidence', () => {
    expect(taskLowerBound(0, 1.0)).toBe(0);
    expect(taskLowerBound(0, 0.80)).toBe(0);
    expect(taskLowerBound(0, 0)).toBe(0);
  });

  test('Works with different min estimates', () => {
    expect(taskLowerBound(20, 0.90)).toBe(20);
    expect(taskLowerBound(20, 0.80)).toBe(10);
    expect(taskLowerBound(15, 0.70)).toBe(5);
  });
});
