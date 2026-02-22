# Simple Project Simulator

![Run Tests](https://github.com/acrosman/simple-project-estimates/actions/workflows/test.yml/badge.svg)
![Lint Code](https://github.com/acrosman/simple-project-estimates/actions/workflows/lint.yml/badge.svg)
![CodeQL Security Scan](https://github.com/acrosman/simple-project-estimates/actions/workflows/codeql-analysis.yml/badge.svg)
![Build and Deploy](https://github.com/acrosman/simple-project-estimates/actions/workflows/deploy.yml/badge.svg)

This simple time estimator for projects takes a CSV file and runs a monte carlo simulation to help understand the project's future. It will give you projections of both time required and costs. It is inspired by ideas from [Joel Spolsky's piece of Evidence Based Estimates](https://www.joelonsoftware.com/2007/10/26/evidence-based-scheduling/) with my own tweaks and adjustments.

![Sample Time Projection Results](images/TimeEstimateSample.png?raw=true)

## Getting Started

**Use it online**: Visit [https://spinningcode.org/estimates](https://spinningcode.org/estimates) to use the tool without downloading anything.

**Run it locally**: Clone this repository and run:

```
npm install
npm start
```

## How to Use

### Estimation Modes

The simulator supports three types of project estimates:

1. **Hours-Based Estimates**: Provide a minimum and maximum hour estimate for each task
2. **Fibonacci-Based Estimates**: Use Fibonacci story points (1, 2, 3, 5, 8, 13, 21, 34) for each task
3. **T-Shirt Size Estimates**: Use t-shirt sizes (XS, S, M, L, XL, XXL) for each task

Choose the estimation mode that matches your team's planning methodology. The tool automatically maps Fibonacci numbers and t-shirt sizes to hour ranges for simulation purposes.

### Entering Your Tasks

You can enter your project tasks in two ways:

#### Manual Entry

1. Open the application in your browser
2. Select your estimation mode (Hours, Fibonacci, or T-Shirt)
3. Fill in the data fields for each task:
   - **Task**: Name or description of the task
   - **Min Time** (hours mode): Minimum hours estimate
   - **Max Time** (hours mode): Maximum hours estimate
   - **Fibonacci** (Fibonacci mode): Story point value (mutually exclusive with hours)
   - **T-Shirt** (T-Shirt mode): Size value (mutually exclusive with hours/fibonacci)
   - **Confidence**: Your confidence level as a percentage (0-100)
   - **Cost**: Hourly rate for this task
4. Click "Run Simulation" to generate results

#### CSV Upload

Upload a CSV file with your task data. The format depends on your estimation mode:

**Hours Mode CSV:**

```
Task,Max,Min,Confidence,Cost
Setup,5,2,90,120
Page,20,10,90,120
Blog Post,20,10,90,100
```

**Fibonacci Mode CSV:**

```
Task,Fibonacci,Confidence,Cost
Setup,2,90,120
Page,8,90,120
Blog Post,8,90,100
```

**T-Shirt Mode CSV:**

```
Task,TShirt,Confidence,Cost
Setup,S,90,120
Page,L,90,120
Blog Post,L,90,100
```

Sample files are available:

- [Hours-based sample](src/data/sample.csv)
- [Fibonacci-based sample](src/data/sample-fib.csv)
- [T-Shirt-based sample](src/data/sample-tshirt.csv)

### Understanding the Simulation

The tool runs a **Monte Carlo simulation** with 10,000+ iterations to generate statistical projections:

1. **For each task**, the simulation:
   - Within your confidence threshold: randomly selects a value between min and max
   - Outside your confidence threshold: has a 50% chance of underrunning (0 to min) or overrunning (max to upper bound)

2. **Upper Bound Calculation**: Lower confidence means higher risk of overrun
   - 90% confidence: upper bound = max × 1
   - 80% confidence: upper bound = max × 2
   - 70% confidence: upper bound = max × 3
   - And so on...

3. **Result Aggregation**: All task estimates are summed for each simulation run

4. **Statistical Analysis**: The tool calculates and displays:
   - Median estimate (the middle value across all simulations)
   - Standard deviation (how much variance to expect)
   - Visual histogram showing the distribution of outcomes

### How Settings Affect Results

#### Confidence Level

- **Higher confidence (90-100%)**: Tighter estimates, results cluster closer to your min-max range
- **Lower confidence (50-80%)**: Wider variance, higher risk of significant overruns
- The confidence percentage represents how often the actual time falls within your estimated range

#### Min/Max Range (Hours Mode)

- **Narrow range** (e.g., 5-6 hours): Indicates well-understood tasks with predictable outcomes
- **Wide range** (e.g., 10-40 hours): Reflects uncertainty or complexity; increases variance in results

#### Fibonacci Values

**Important**: Story points are estimated in **calendar days**, not hours. This reflects how Agile teams actually work, accounting for meetings, reviews, and all the overhead of real-world development.

The tool offers two mapping modes:

##### Calendar Days Mode (Fixed Mapping)

Each Fibonacci number maps to a calendar day range:

- 1 → 0.5-1 days
- 2 → 1-2 days
- 3 → 2-3 days
- 5 → 3-5 days
- 8 → 5-8 days (1-1.6 weeks)
- 13 → 8-13 days (1.6-2.6 weeks)
- 21 → 13-21 days (2.6-4.2 weeks)
- 34 → 21-34 days (4.2-6.8 weeks)

##### Velocity-Based Mode (Team-Specific)

Maps story points to days based on your team's historical velocity:

- **Points Per Sprint**: Average story points your team completes
- **Sprint Length**: Your sprint duration in working days
- **Calculation**: Points ÷ (Points Per Sprint ÷ Sprint Days) = Base Days ± 30% variance

Example: With 25 points/sprint over 10 days:

- Velocity ratio: 2.5 points/day
- 8-point story: 8 ÷ 2.5 = 3.2 days → **2.24 to 4.16 days**

**Tip**: Use velocity-based mode if your team tracks historical velocity. Use calendar days mode if you don't have velocity data or prefer standard agile time estimates.

#### T-Shirt Values

T-shirt sizes map to hour ranges:

- XS → 1-2 hours
- S → 2-3 hours
- M → 3-5 hours
- L → 5-8 hours
- XL → 8-13 hours
- XXL → 13-21 hours

#### Cost Tracking

- When enabled, calculates total project cost based on each task's hourly rate
- Provides both time and budget projections
- Can be toggled on/off as needed

### Interpreting Results

**Median Value**: Use this as your most likely outcome (50% of simulations came in at or below this)

**Standard Deviation**: Indicates the spread of results:

- Low standard deviation: Consistent, predictable project
- High standard deviation: High uncertainty, greater risk

**Histogram**: Shows the distribution of all simulation outcomes:

- Narrow peak: Predictable outcomes
- Wide spread: High variability; consider contingency planning
- Multiple peaks: May indicate tasks with very different confidence levels

The project leverages [D3](https://d3js.org/) for the histogram visualization.

## Advanced Graph Settings

For power users who want to customize the visualization appearance, the tool includes an **Advanced Graph Settings** panel located in the simulation section.

### Accessing Advanced Settings

1. Scroll to the simulation controls area
2. Click on "Advanced Graph Settings" to expand the panel
3. Modify any settings you wish to change
4. Click "Apply Settings" to use your custom values
5. Click "Reset to Defaults" to restore original values

### Available Settings

#### Main Histogram Settings

- **Width (px)**: Width of the main time/cost histogram graphs (default: 800px, range: 400-2000)
- **Height (px)**: Height of the main histogram graphs (default: 500px, range: 300-1000)
- **Bar/Scatter Cutoff**: Number of data points before switching from bar chart to scatter plot (default: 600, range: 100-2000)
  - Bar charts work well for smaller datasets
  - Scatter plots with KDE curves are used for large, complex distributions
- **Max Preview Buckets**: Maximum number of buckets for histogram preview during progressive simulation (default: 120, range: 20-500)
  - Reduces rendering complexity during live updates as simulation runs
  - Final histograms display full detail without bucketing (up to the bar/scatter cutoff)

#### Task Row Mini Graph Settings

Each task row displays a compact histogram showing that individual task's distribution:

- **Width (px)**: Width of mini task row graphs (default: 140px, range: 50-300)
- **Height (px)**: Height of mini task row graphs (default: 26px, range: 10-100)
- **Max Buckets**: Maximum number of bars in mini graphs (default: 24, range: 5-50)
- **Bar Gap (px)**: Spacing between bars in mini graphs (default: 1px, range: 0-5)

### When to Adjust Settings

- **Large displays**: Increase width/height for better visibility on high-resolution monitors
- **Presentations**: Adjust dimensions to match your presentation format
- **Print layouts**: Modify sizes to optimize for printed reports
- **Performance tuning**: Reduce max preview buckets if progressive simulation updates are slow
- **Dense data**: Increase bar/scatter cutoff if you prefer bar charts for larger datasets

### Notes

- Settings persist only for your current session
- Changes apply to new simulations; existing graphs are not retroactively updated
- All settings are validated to prevent invalid configurations
- The collapsible panel keeps the interface clean for casual users

## Development

### Prerequisites

- Node.js (v20 or higher recommended)
- npm

### Setup

1. Clone the repository:

```bash
git clone https://github.com/acrosman/simple-project-estimates.git
cd simple-project-estimates
```

2. Install dependencies:

```bash
npm install
```

### Available Scripts

- `npm start` - Start development server with hot reload
- `npm test` - Run test suite with coverage
- `npm run lint` - Check code style with ESLint
- `npm run lint-fix` - Automatically fix linting issues
- `npm run build` - Build for development
- `npx webpack --mode=production` - Build optimized production bundle

### Testing

The project uses Jest for testing. Tests are located in `src/tests/`:

- `stats.test.js` - Tests for pure math and statistics functions (`getMedian`, `getStandardDeviation`, `calculateKDE`, `taskUpperBound`, `taskLowerBound`, etc.)
- `charts.test.js` - Tests for graph configuration and D3 histogram builders (`GRAPH_CONFIG`, `buildHistogramPreview`, `buildTaskRowHistogram`)
- `simulation.test.js` - Tests for the simulation engine (`runSimulation`, `runSimulationProgressive`, Fibonacci utilities)
- `data-input.test.js` - Tests for CSV parsing, data validation, and form generation
- `index.test.js` - Tests for UI functions and DOM manipulation
- `state.test.js` - Tests for application state management
- `html-template.test.js` - Tests for HTML template structure and accessibility

Run tests with coverage report:

```bash
npm test
```

### Code Quality

- ESLint configured with Airbnb style guide
- All functions include JSDoc documentation
- Comprehensive test coverage for core simulation logic
- Accessible UI with ARIA labels and keyboard navigation

### Project Structure

```
src/
├── index.js          # UI orchestration and event handlers
├── simulation.js     # Simulation engine (runSimulation, runSimulationProgressive,
│                     #   Fibonacci utilities) + re-exports from stats and charts
├── stats.js          # Pure math and statistics (getMedian, getStandardDeviation,
│                     #   calculateKDE, taskUpperBound, taskLowerBound, generateEstimate)
├── charts.js         # D3 visualization (buildHistogram, buildHistogramPreview,
│                     #   buildTaskRowHistogram, GRAPH_CONFIG, GRAPH_CONFIG_DEFAULTS)
├── data-input.js     # Form generation, CSV parsing, and data validation
├── state.js          # Application state management (AppState class)
├── style.css         # Styling
├── index.html        # HTML template
├── data/             # Sample CSV files
└── tests/
    ├── stats.test.js           # Math and statistics function tests
    ├── charts.test.js          # Graph configuration and rendering tests
    ├── simulation.test.js      # Simulation engine and Fibonacci tests
    ├── data-input.test.js      # CSV parsing and form generation tests
    ├── index.test.js           # UI function tests
    ├── state.test.js           # Application state tests
    ├── html-template.test.js   # HTML template and accessibility tests
    └── accessibility.test.js   # Accessibility compliance tests
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request
