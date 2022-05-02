import * as sim from '../simulation';

test('Validate Elements', () => {
  expect(sim).toHaveProperty('runSimulation');
  expect(sim).toHaveProperty('buildHistogram');
  expect(sim).toHaveProperty('getRandom');
});

test('GetRandom', () => {
  const testResult = sim.getRandom(1, 2);
  expect(testResult).toBeGreaterThanOrEqual(1);
  expect(testResult).toBeLessThanOrEqual(2);
});

test('GetMedian: Simple', () => {
  // Represents a list of [1,2,2,2,3] therefore median of 2.
  const sampleList = [0, 1, 3, 1];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(2);
});

test('GetMedian: Last Value', () => {
  // Represents a list of [2,2,2,2,2] therefore median of 2.
  const sampleList = [0, 0, 5];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(2);
});

test('GetMedian: One space between values', () => {
  // [2,2,2,2,4,4,4,4] therefore median 3 (between two values)
  const sampleList = [0, 0, 4, 0, 4];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(3);
});

test('GetMedian: Two spaces between values', () => {
  // [2,2,2,2,5,5,5,5] therefore median 3.5 (between two values)
  const sampleList = [0, 0, 4, 0, 0, 4];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(3.5);
});

test('GetMedian: Three spaces between values', () => {
  // [2,2,2,2,6,6,6,6] therefore median 4 (between two values)
  const sampleList = [0, 0, 4, 0, 0, 0, 4];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(4);
});

test('GetMedian: Between to integers', () => {
  // [2,2,2,2,3,4,4,4] therefore median 2.5 (between two values by half)
  const sampleList = [0, 0, 4, 1, 3];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(2.5);
});

test('GetMedian: With Gap in List', () => {
  // [2,2,2,2,3,4,4,4,4,4,4,5,5,5,5,5,5,7,7,7,8,8,8,8] median 5 (gap in list)
  const sampleList = [0, 0, 4, 1, 6, 6, 0, 3, 4];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(5);
});

test('GetMedian: Bell Curve', () => {
  const sampleList = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const medianValue = sim.getMedian(sampleList);
  expect(medianValue).toBe(6);
});

test('StdDev: Bell Curve', () => {
  const sampleList = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const stdDev = sim.getStandardDeviation(sampleList);
  expect(stdDev.toFixed(9)).toBe(2.449489743);
});
