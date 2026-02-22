# GitHub Copilot Instructions

## Project Context

Monte Carlo simulation tool for project time and cost estimation. Runs 10,000+ simulations to generate statistical projections with D3-powered histograms.

## Tech Stack

- **JavaScript ES6+** with Webpack 5
- **D3.js v7** and **d3-fetch** for data visualization and CSV loading
- **Jest** for testing
- **ESLint** with Airbnb style guide

## Code Style & Conventions

### ESLint Rules

- Use `for...of` loops (allowed), avoid `for...in`
- Always use JSDoc comments for functions and classes
- Use const for constants, let for variables, no var
- Use template literals for string concatenation
- Use Object destructuring for function parameters and object access

### Naming Conventions

- Functions: camelCase with descriptive verb names (`generateEstimate`, `buildHistogram`)
- Constants: UPPER_SNAKE_CASE for true constants
- DOM elements: descriptive names (`taskField`, `resultContainer`)
- CSS classes: kebab-case (`data-row`, `histogram-container`)

## Architecture

### Core Modules

- **src/stats.js**: Pure math and statistics — no DOM, no D3; all functions are fully testable in isolation
  - `generateEstimate(min, max, confidence)` - Single task estimate
  - `getMedian(data)` - Calculate median from histogram array
  - `getStandardDeviation(data)` - Calculate std dev from histogram array
  - `taskUpperBound(maxEstimate, confidence)` - Worst-case upper bound for one task
  - `taskLowerBound(minEstimate, confidence)` - Best-case lower bound for one task
  - `getRandom`, `getValueCount`, `calculateKDE`, `calculateUpperBound`

- **src/charts.js**: D3 visualization and graph configuration; imports `calculateKDE` from `stats.js`; everything else is D3
  - `buildHistogram(targetNode, list, min, max, median, stdDev, xLabel, limitGraph)` - Final D3 histogram
  - `buildHistogramPreview(targetNode, list, min, max, xLabel)` - Fast bucketed preview during progressive runs
  - `buildTaskRowHistogram(targetNode, list, min, max, taskName)` - Compact per-task mini graph
  - `GRAPH_CONFIG` - Mutable graph settings object (modified by Advanced Settings UI)
  - `GRAPH_CONFIG_DEFAULTS` - Frozen copy of original defaults for reset operations

- **src/simulation.js**: Simulation engine; re-exports selected symbols from `stats.js` and `charts.js` for backward compatibility; no direct D3 usage
  - `runSimulation(passes, data, hoursPerTimeUnit)` - Synchronous simulation entry
  - `runSimulationProgressive(passes, data, hoursPerTimeUnit)` - Async simulation with progress callbacks; returns a Promise
  - `fibonacciToCalendarDays(fibonacci, mappings)` - Story points → calendar day range
  - `fibonacciToVelocityDays(fibonacci, pointsPerSprint, sprintLengthDays)` - Story points → velocity-based day range

- **src/data-input.js**: CSV parsing, data validation, and top-level data entry UI assembly
  - `handleCostToggle`, `handleModeChange`, `validateCsvData`, `importCsvFile`
  - `createModeSelector`, `createFileLoader`, `createDataEntrySection`

- **src/state.js**: Application state (`AppState` class)
  - Estimation mode, cost toggle, velocity config
  - Fibonacci calendar and T-shirt mappings

- **src/dom-helpers.js**: Reusable DOM element factories — no state, no D3
  - `createTextElement`, `createLabeledInput`, `createDivWithIdAndClasses`
  - Preferred over raw `document.createElement` patterns elsewhere in the codebase

- **src/task-table.js**: Task data-entry table creation and row lifecycle
  - Renders the manual task input table; handles row add/remove

- **src/fibonacci-config.js**: Fibonacci/velocity configuration UI panel
  - `handleFibonacciModeChange`, `handleVelocityConfigChange`
  - `createFibonacciConfigPanel`, `createFibonacciCalendarMappingTable`

- **src/tshirt-config.js**: T-shirt size mapping configuration UI panel
  - `createTshirtMappingTable`, `updateTshirtMapping`

- **src/index.js**: UI orchestration and event handlers
  - Wires together data-input, simulation, and charts
  - `startSimulation`, `renderTaskRowHistograms`, `saveSvgAsImage`
  - `applyGraphSettings`, `resetGraphSettings`
  - No direct math or D3 calls — delegates to the appropriate module

### Data Flow

1. User inputs tasks (manual or CSV) → parsed into task objects
2. Task objects → `runSimulation()` → histogram data
3. Histogram data → `buildHistogram()` → D3 visualization
4. Results displayed with median and standard deviation

### Task Data Model

```javascript
{
  Task: string,        // Task name
  Max: number,         // Maximum hours
  Min: number,         // Minimum hours
  Confidence: number,  // 0-1 decimal (0.90 = 90%)
  Cost: number        // Hourly rate
}
```

### Simulation Parameters

All parameters and settings in the project should be configurable via the UI and passed as arguments to the relevant functions. Avoid hardcoding values in the logic.

## Key Algorithms

### Risk Calculation

```javascript
const confidencePercent = Math.round(confidence * 100);
const multiplier = Math.max(1, Math.ceil((100 - confidencePercent) / 10));
upperBound = maxEstimate * multiplier;
```

### Simulation Logic

- Generate random 1-1000
- If within confidence threshold: pick value between min-max
- If outside confidence threshold: 75% chance of overrun (max-upperBound), 25% chance of underrun (lowerBound-min)
  - Lower confidence also lowers the underrun floor: `lowerBound = min / multiplier`
- Repeat for all tasks, sum totals, store in histogram array

### Histogram Data Structure

Array where index = value, cell = frequency count

```javascript
// [0, 1, 3, 1] represents: one 1, three 2s, one 3
```

## Common Patterns

### Creating DOM Elements

Prefer helpers from `dom-helpers.js` over raw `document.createElement`:

```javascript
// Text element (any tag)
const el = createTextElement('h2', 'Title Text', ['my-class']);

// Labeled input wrapped in a div
const field = createLabeledInput('Field Label', { type: 'number', value: 10, name: 'fieldName' });

// Div with id and classes
const container = createDivWithIdAndClasses('my-id', ['class1', 'class2']);
```

For inputs not covered by helpers, use `Object.assign()` for multiple attributes:

```javascript
const input = document.createElement('input');
Object.assign(input, { type: 'number', value: 10, name: 'fieldName' });
```

### D3 Visualization

- Always remove existing SVG before creating new: `targetNode.innerHTML = ''`
- Use margins for axes: `{ top: 10, right: 30, bottom: 50, left: 60 }`
- Switch to scatter plot when data points > 600
- Standard scales: `d3.scaleLinear()` for both axes

### Testing Pure Functions

```javascript
// Test with histogram-style arrays
test("GetMedian: Simple", () => {
  const sampleList = [0, 1, 3, 1]; // represents [1,2,2,2,3]
  const result = sim.getMedian(sampleList);
  expect(result).toBe(2);
});
```

Do not test functions using superfluous trailing arguments.

Use
  `handleVelocityConfigChange();`
Not
  `handleVelocityConfigChange({});`

## When Adding Features

### New Simulation Parameters

1. Add to task data model
2. Update task row UI in `task-table.js` (`generateDataField`)
3. Update CSV parsing logic in `data-input.js`
4. Modify `generateEstimate()` or `runSimulation()`
5. Add to sample.csv
6. Write unit tests

### New Statistical Measures

1. Create pure function in `stats.js`
2. Export for testing: `export { functionName }`
3. Re-export from `simulation.js` if callers need it via that module
4. Call from `runSimulation()` return object if needed
5. Display in UI (`index.js`)
6. Add Jest tests in `src/tests/stats.test.js` with edge cases

### UI Components

1. Create element factory function
2. Add CSS classes in style.css
3. Attach event listeners in setup code
4. Validate inputs before processing

## Testing Guidelines

### What to Test

- Every function you create, you must create a test for it.
- All pure math functions in `stats.js` (`stats.test.js`)
- Graph config structure and histogram builder guards in `charts.test.js`
- Simulation engine behavior in `simulation.test.js`
- DOM helper utilities in `dom-helpers.test.js`
- Task table creation and row logic in `task-table.test.js`
- Fibonacci config panel and velocity handlers in `fibonacci-config.test.js`
- T-shirt mapping logic in `tshirt-config.test.js`
- Edge cases: empty arrays, single values, gaps in data
- Random functions: verify output ranges
- Statistical accuracy with known datasets

### What Not to Test

- D3 rendering (mocked via `__mocks__/d3Mock.js`)
- CSS imports (mocked via `__mocks__/styleMock.js`)
- Image/file imports (mocked via `__mocks__/fileMock.js`)
- DOM manipulation (integration test territory)
- File I/O (mocked)

## Performance Notes

- 10,000 simulations complete in <1 second
- Histogram arrays can be large (10,000+ cells)
- Use `Math.floor()` and `Math.ceil()` for integer operations
- Avoid `Math.max(...array)` for large arrays (can overflow stack)
- Instead: `[...array].sort((a,b) => a-b)[array.length-1]`

## File Modification Guide

| Task                        | Files to Modify                                                          |
| --------------------------- | ------------------------------------------------------------------------ |
| Math / statistics functions | `src/stats.js`, `src/tests/stats.test.js`                                |
| Simulation engine           | `src/simulation.js`, `src/tests/simulation.test.js`                      |
| D3 charts / graph config    | `src/charts.js`, `src/tests/charts.test.js`                              |
| UI orchestration            | `src/index.js`, `src/style.css`, `src/index.html`                        |
| Form / data entry           | `src/data-input.js`, `src/tests/data-input.test.js`                      |
| Task input table            | `src/task-table.js`, `src/tests/task-table.test.js`                      |
| DOM element helpers         | `src/dom-helpers.js`, `src/tests/dom-helpers.test.js`                    |
| Fibonacci config UI         | `src/fibonacci-config.js`, `src/tests/fibonacci-config.test.js`          |
| T-shirt config UI           | `src/tshirt-config.js`, `src/tests/tshirt-config.test.js`                |
| Application state           | `src/state.js`, `src/tests/state.test.js`                                |
| Data format / CSV           | `src/data-input.js` (parsing), `src/data/sample.csv`                     |
| Build config                | `webpack.config.js`                                                      |
| Code style                  | `.eslintrc.js`                                                           |

## Common Pitfalls

### Don't

- Use `innerHTML` for user-generated content (XSS risk)
- Add D3 or DOM code to `stats.js` (keep it pure math)
- Add math or statistics logic to `charts.js` or `index.js`
- Forget to validate min < max and 0 <= confidence <= 1
- Modify DOM directly in event handlers (use helper functions)
- Call `Math.max(...largeArray)` (stack overflow)

## Build Process

- Entry: `src/index.js`
- Template: `src/index.html`
- Output: `dist/main.js`
- Dev mode: `inline-source-map`

## Quick Reference

### Run Commands

- `npm start` - Dev server with hot reload
- `npm test` - Jest with coverage
- `npm run lint` - Check code style
- `npm run build` - Create dist bundle

Run tests in VSCode whenever possible. Don't use npm by default for that purpose.
