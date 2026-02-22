# GitHub Copilot Instructions

## Project Context

Monte Carlo simulation tool for project time and cost estimation. Runs 10,000+ simulations to generate statistical projections with D3-powered histograms.

## Tech Stack

- **JavaScript ES6+** with Webpack 5
- **D3.js v7** for data visualization
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

### Function Structure

```javascript
/**
 * Brief description of what the function does.
 * @param {type} paramName Description
 * @returns type Description
 */
function functionName(paramName) {
  // Implementation
}
```

## Architecture

### Core Modules

- **src/stats.js**: Pure math and statistics — no DOM, no D3
  - `getRandom`, `taskUpperBound`, `taskLowerBound`, `generateEstimate`
  - `getValueCount`, `getMedian`, `getStandardDeviation`, `calculateKDE`
  - `calculateUpperBound`
  - All functions are fully testable in isolation

- **src/charts.js**: D3 visualization and graph configuration
  - `GRAPH_CONFIG`, `GRAPH_CONFIG_DEFAULTS`
  - `buildHistogram`, `buildHistogramPreview`, `buildTaskRowHistogram`
  - Imports `calculateKDE` from `stats.js`; everything else is D3

- **src/simulation.js**: Simulation engine (~280 lines)
  - `runSimulation`, `runSimulationProgressive`, `runSimulationCore`
  - `fibonacciToCalendarDays`, `fibonacciToVelocityDays`
  - Re-exports everything from `stats.js` and `charts.js` for backward compatibility
  - Imports from `stats.js` and `charts.js`; no direct D3 usage

- **src/data-input.js**: Form generation, CSV parsing, and data validation
  - `generateDataRow`, `createEntryTable`, `validateCsvData`
  - Fibonacci and T-shirt mapping UI panels
  - Mode switching handlers

- **src/state.js**: Application state (`AppState` class)
  - Estimation mode, cost toggle, velocity config
  - Fibonacci calendar and T-shirt mappings

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
// Lower confidence = higher risk of overrun
// 90% conf: upper = max × 1
// 80% conf: upper = max × 2
// 70% conf: upper = max × 3
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

```javascript
// Text element with classes
const el = document.createElement("div");
el.appendChild(document.createTextNode("Content"));
el.classList.add("class1", "class2");

// Input with attributes
const input = document.createElement("input");
Object.assign(input, { type: "number", value: 10, name: "fieldName" });
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

## When Adding Features

### New Simulation Parameters

1. Add to task data model
2. Update `generateDataRow()` for UI input
3. Update CSV parsing logic
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

- All pure math functions in `stats.js` (`stats.test.js`)
- Graph config structure and histogram builder guards in `charts.test.js`
- Simulation engine behavior in `simulation.test.js`
- Edge cases: empty arrays, single values, gaps in data
- Random functions: verify output ranges
- Statistical accuracy with known datasets

### What Not to Test

- D3 rendering (mocked)
- DOM manipulation (integration test territory)
- File I/O (mocked)

### Test Structure

```javascript
test('Function: Scenario', () => {
  const input = /* test data */;
  const result = functionUnderTest(input);
  expect(result).toBe(expected);
});
```

## Performance Notes

- 10,000 simulations complete in <1 second
- Histogram arrays can be large (10,000+ cells)
- Use `Math.floor()` and `Math.ceil()` for integer operations
- Avoid `Math.max(...array)` for large arrays (can overflow stack)
- Instead: `[...array].sort((a,b) => a-b)[array.length-1]`

## D3 Patterns

### Standard Setup

```javascript
const svg = d3
  .select(targetNode)
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);
```

### Axes

```javascript
const xAxis = d3.axisBottom().scale(xScale);
const yAxis = d3.axisLeft().scale(yScale).ticks(8);
```

### Data Binding

```javascript
svg
  .selectAll(".bar")
  .data(dataArray)
  .enter()
  .append("rect")
  .attr("class", "bar")
  .attr("x", (d, i) => xScale(i))
  .attr("width", barWidth)
  .attr("y", (d) => yScale(d))
  .attr("height", (d) => height - yScale(d));
```

## File Modification Guide

| Task                        | Files to Modify                                      |
| --------------------------- | ---------------------------------------------------- |
| Math / statistics functions | `src/stats.js`, `src/tests/stats.test.js`            |
| Simulation engine           | `src/simulation.js`, `src/tests/simulation.test.js`  |
| D3 charts / graph config    | `src/charts.js`, `src/tests/charts.test.js`          |
| UI orchestration            | `src/index.js`, `src/style.css`, `src/index.html`    |
| Form / data entry           | `src/data-input.js`, `src/tests/data-input.test.js`  |
| Application state           | `src/state.js`, `src/tests/state.test.js`            |
| Data format / CSV           | `src/data-input.js` (parsing), `src/data/sample.csv` |
| Build config                | `webpack.config.js`                                  |
| Code style                  | `.eslintrc.js`                                       |

## Common Pitfalls

### Don't

- Use `innerHTML` for user-generated content (XSS risk)
- Add D3 or DOM code to `stats.js` (keep it pure math)
- Add math or statistics logic to `charts.js` or `index.js`
- Forget to validate min < max and 0 <= confidence <= 1
- Modify DOM directly in event handlers (use helper functions)
- Call `Math.max(...largeArray)` (stack overflow)

### Do

- Put new pure functions in `stats.js` and export them
- Re-export from `simulation.js` if existing callers depend on it
- Keep simulation engine logic in `simulation.js`, rendering in `charts.js`
- Use `Object.assign()` for multiple attributes
- Clear existing visualizations before creating new ones
- Round numbers for display but calculate with full precision

## Dependencies

### Core

- `d3` and `d3-fetch`: Data visualization and CSV loading
- `webpack` ecosystem: Build and dev server
- `jest`: Testing framework
- `eslint`: Code quality

### Mocked in Tests

- D3 modules → `__mocks__/d3Mock.js`
- CSS imports → `__mocks__/styleMock.js`
- Image/file imports → `__mocks__/fileMock.js`

## Build Process

- Entry: `src/index.js`
- Template: `src/index.html`
- Output: `dist/main.js`
- Dev mode: `inline-source-map`
- CSS: Injected via style-loader
- Assets: Copied to dist with unique hashes

## Quick Reference

### Run Commands

- `npm start` - Dev server with hot reload
- `npm test` - Jest with coverage
- `npm run lint` - Check code style
- `npm run build` - Create dist bundle

Run tests in VSCode whenever possible. Don't use npm by default for that purpose.

### Key Functions to Remember

**simulation.js**

- `runSimulation(passes, data, hoursPerTimeUnit)` - Synchronous simulation entry
- `runSimulationProgressive(passes, data, onProgress, progressInterval, hoursPerTimeUnit)` - Async simulation with progress callbacks
- `fibonacciToCalendarDays(fibonacci, mappings)` - Story points → calendar day range
- `fibonacciToVelocityDays(fibonacci, pointsPerSprint, sprintLengthDays)` - Story points → velocity-based day range

**stats.js**

- `generateEstimate(min, max, confidence)` - Single task estimate
- `getMedian(data)` - Calculate median from histogram array
- `getStandardDeviation(data)` - Calculate std dev from histogram array
- `taskUpperBound(maxEstimate, confidence)` - Worst-case upper bound for one task
- `taskLowerBound(minEstimate, confidence)` - Best-case lower bound for one task

**charts.js**

- `buildHistogram(targetNode, list, min, max, median, stdDev, xLabel, limitGraph)` - Final D3 histogram
- `buildHistogramPreview(targetNode, list, min, max, xLabel)` - Fast bucketed preview during progressive runs
- `buildTaskRowHistogram(targetNode, list, min, max, taskName)` - Compact per-task mini graph
- `GRAPH_CONFIG` - Mutable graph settings object (modified by Advanced Settings UI)
- `GRAPH_CONFIG_DEFAULTS` - Frozen copy of original defaults for reset operations
