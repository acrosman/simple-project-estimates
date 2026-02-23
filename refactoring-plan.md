# Refactoring Plan: Simple Project Estimates

This document outlines a step-by-step plan to refactor the `simple-project-estimates` codebase. The goal is to improve maintainability, testability, and separation of concerns without changing the core functionality.

Each step is designed to be completed in a single session. You can copy and paste the prompt for each step into a new chat session to execute that part of the refactoring.

---

## Step 1: Reorganize the Directory Structure

**Goal:** Move from a flat `src/` directory to a structured layout (`core/`, `ui/`, `utils/`, `visualization/`) to make the codebase easier to navigate.

**Prompt for Session 1:**
```text
I want to reorganize the directory structure of my project to improve maintainability. Currently, all files are in the `src/` directory. Please move the files into the following subdirectories within `src/` and update all import paths across the project (including tests) to reflect the new locations:

1. Create `src/core/` and move: `stats.js`, `simulation.js`, `state.js`
2. Create `src/ui/` and move: `task-table.js`, `fibonacci-config.js`, `tshirt-config.js`, `graph-settings.js`
3. Create `src/utils/` and move: `dom-helpers.js`, `export-utils.js`
4. Create `src/visualization/` and move: `charts.js`
5. Leave `index.js`, `data-input.js`, `style.css`, `logo.png`, `index.html`, and the `data/` and `tests/` folders in their current locations for now.

Make sure to run the tests (`npm run test`) after moving the files and updating the imports to ensure everything is still wired up correctly.
```

---

## Step 2: Extract UI Components from `index.js`

**Goal:** Reduce the size and responsibility of `index.js` by moving the UI layout creation functions into a dedicated module.

**Prompt for Session 2:**
```text
My `src/index.js` file is too large and handles both application orchestration and UI component creation. I want to extract the UI creation logic into a new file.

1. Create a new file `src/ui/layout.js`.
2. Move the following functions from `src/index.js` to `src/ui/layout.js`:
   - `createLogoElement`
   - `createHeader`
   - `createSimulationPanel`
   - `setupUi`
3. Update `src/index.js` to import `setupUi` from `src/ui/layout.js` and call it to initialize the app.
4. Ensure all necessary imports (like `createModeSelector`, `createFileLoader`, `createDataEntrySection`, `createAdvancedSettings`, `startSimulation`, `saveSvgAsImage`, `Icon`, etc.) are correctly moved or added to `src/ui/layout.js`.
5. Run the tests to ensure the application still builds and tests pass. You may need to update `src/tests/index.test.js` or create a new `src/tests/layout.test.js`.
```

---

## Step 3: Split `data-input.js` into Logic and UI

**Goal:** Separate the pure data processing (CSV parsing/validation) from the DOM creation and event binding in `data-input.js`.

**Prompt for Session 3:**
```text
The `src/data-input.js` file currently mixes pure data processing (CSV validation) with UI component creation and event handling. I want to separate these concerns.

1. Create a new file `src/utils/csv-parser.js`.
2. Move the `validateCsvData` function from `src/data-input.js` to `src/utils/csv-parser.js` and export it.
3. Move the `importCsvFile` function to `src/utils/csv-parser.js` (or keep it in `data-input.js` if it heavily relies on DOM manipulation, but ensure it imports `validateCsvData` from the new location).
4. Rename `src/data-input.js` to `src/ui/data-input-ui.js` (or keep the name but move it to `src/ui/`).
5. Update all imports across the project (including `src/ui/layout.js` and tests) to reflect these changes.
6. Run the tests to ensure everything works. You will likely need to update `src/tests/data-input.test.js` and potentially split it into two test files.
```

---

## Step 4: Implement Pub/Sub in `AppState`

**Goal:** Decouple state mutations from UI updates by implementing an Observer pattern in `state.js`.

**Prompt for Session 4:**
```text
I want to improve the state management in my application by implementing a simple Pub/Sub (Observer) pattern in the `AppState` class located in `src/core/state.js`. Currently, UI updates are triggered manually after state changes.

1. Add `listeners` (an object or Map) to the `AppState` constructor.
2. Add a `subscribe(event, callback)` method to register listeners.
3. Add an `emit(event, data)` method to trigger callbacks.
4. Update the setter methods in `AppState` (e.g., `setEstimationMode`, `setEnableCost`) to call `this.emit()` when the state changes.
5. Refactor `src/ui/data-input-ui.js` (or `data-input.js`) to remove direct calls to `createEntryTable()` inside `handleModeChange` and `handleCostToggle`. Instead, subscribe to the state changes (e.g., `appState.subscribe('modeChanged', () => createEntryTable())`) during initialization.
6. Run the tests and update `src/tests/state.test.js` to verify the Pub/Sub functionality.
```

---

## Step 5: Decouple Simulation Execution from DOM Updates

**Goal:** Refactor the massive `startSimulation` function in `index.js` to separate the simulation logic from the DOM manipulation.

**Prompt for Session 5:**
```text
The `startSimulation` function in `src/index.js` is too large and tightly coupled to the DOM. It manually updates dozens of elements by ID. I want to extract the DOM update logic into a dedicated view module.

1. Create a new file `src/ui/simulation-results-view.js`.
2. Move the DOM update logic from `startSimulation` (e.g., `updateElementText` calls, showing/hiding headers, updating progress) into methods within this new module (e.g., `updateProgress(progress)`, `renderFinalResults(results)`, `showError(message)`).
3. Refactor `startSimulation` in `src/index.js` (or move it to a new `src/core/simulation-controller.js`) to call the methods on `SimulationResultsView` instead of manipulating the DOM directly.
4. Ensure the progressive updates callback passed to `runSimulationProgressive` uses the new view module.
5. Run the tests to ensure the simulation still runs and updates the UI correctly.
```
