import * as sim from '../simulation';

test('Validate Elements', () => {
  expect(sim).toHaveProperty('runSimulation');
  expect(sim).toHaveProperty('buildHistogram');
});
