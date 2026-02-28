/**
 * @jest-environment jsdom
 */

import SimulationResultsView from '../ui/simulation-results-view';
import { appState } from '../core/state';

describe('renderTaskRowHistograms', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('renders histogram only for matching task row ids', () => {
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"></div>
      <div class="task-row-graph" data-row-id="2"></div>
    `;

    SimulationResultsView.renderTaskRowHistograms([
      {
        rowId: '1',
        times: {
          list: [0, 2, 4, 2],
          min: 1,
          max: 3,
        },
      },
    ]);

    const row1Svg = document.querySelector('.task-row-graph[data-row-id="1"] svg');
    const row2Svg = document.querySelector('.task-row-graph[data-row-id="2"] svg');

    expect(row1Svg).not.toBeNull();
    expect(row2Svg).toBeNull();
  });

  test('clears existing graphs when no task results are provided', () => {
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"><svg></svg></div>
    `;

    SimulationResultsView.renderTaskRowHistograms([]);

    expect(document.querySelector('.task-row-graph[data-row-id="1"]').innerHTML).toBe('');
  });

  test('populates stats node when present', () => {
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"></div>
      <div class="task-row-stats" data-row-id="1"></div>
    `;

    SimulationResultsView.renderTaskRowHistograms([
      {
        rowId: '1',
        name: 'Task 1',
        times: {
          list: [0, 2, 4, 2],
          min: 1,
          max: 3,
          median: 2,
        },
      },
    ]);

    const statsNode = document.querySelector('.task-row-stats[data-row-id="1"]');
    expect(statsNode.innerHTML).toContain('Min: 1');
    expect(statsNode.innerHTML).toContain('Med: 2');
    expect(statsNode.innerHTML).toContain('Max: 3');
  });

  test('uses days as time unit in fibonacci estimation mode', () => {
    appState.estimationMode = 'fibonacci';
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"></div>
      <div class="task-row-stats" data-row-id="1"></div>
    `;

    SimulationResultsView.renderTaskRowHistograms([
      {
        rowId: '1',
        name: 'Task 1',
        times: {
          list: [0, 2, 4, 2],
          min: 1,
          max: 3,
          median: 2,
        },
      },
    ]);

    const statsNode = document.querySelector('.task-row-stats[data-row-id="1"]');
    expect(statsNode.innerHTML).toContain('days');
    appState.estimationMode = 'hours';
  });

  test('does not render when task results is null', () => {
    document.body.innerHTML = `
      <div class="task-row-graph" data-row-id="1"></div>
    `;

    SimulationResultsView.renderTaskRowHistograms(null);

    expect(document.querySelector('.task-row-graph[data-row-id="1"]').innerHTML).toBe('');
  });

  test('clears stats nodes when no task results are provided', () => {
    document.body.innerHTML = `
      <div class="task-row-stats" data-row-id="1">old stats</div>
    `;

    SimulationResultsView.renderTaskRowHistograms([]);

    expect(document.querySelector('.task-row-stats[data-row-id="1"]').innerHTML).toBe('');
  });
});
