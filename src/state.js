// ============= Application State Management =================
/**
 * Manages application state in a testable, encapsulated way.
 */
class AppState {
  constructor() {
    this.estimationMode = 'hours'; // 'hours', 'fibonacci', or 'tshirt'
    this.enableCost = true; // Track cost by default
    this.fibonacciMode = 'calendar-days'; // 'calendar-days' or 'velocity-based'
    this.fibonacciCalendarMappings = {
      1: { min: 1, max: 1 },
      2: { min: 1, max: 2 },
      3: { min: 2, max: 3 },
      5: { min: 3, max: 5 },
      8: { min: 5, max: 8 },
      13: { min: 8, max: 13 },
      21: { min: 13, max: 21 },
      34: { min: 21, max: 34 },
    };
    this.velocityConfig = {
      pointsPerSprint: 25,
      sprintLengthDays: 10,
    };
    this.tshirtMappings = {
      XS: 1,
      S: 2,
      M: 3,
      L: 5,
      XL: 8,
      XXL: 13,
    };
  }

  setEstimationMode(mode) {
    this.estimationMode = mode;
  }

  getEstimationMode() {
    return this.estimationMode;
  }

  setEnableCost(enabled) {
    this.enableCost = enabled;
  }

  getEnableCost() {
    return this.enableCost;
  }

  setFibonacciMode(mode) {
    this.fibonacciMode = mode;
  }

  getFibonacciMode() {
    return this.fibonacciMode;
  }

  setVelocityConfig(pointsPerSprint, sprintLengthDays) {
    this.velocityConfig = {
      pointsPerSprint: parseFloat(pointsPerSprint) || 25,
      sprintLengthDays: parseFloat(sprintLengthDays) || 10,
    };
  }

  getVelocityConfig() {
    return this.velocityConfig;
  }

  getFibonacciCalendarMappings() {
    return this.fibonacciCalendarMappings;
  }

  getTshirtMappings() {
    return this.tshirtMappings;
  }

  /**
   * Resets state to default values (useful for testing).
   */
  reset() {
    this.estimationMode = 'hours';
    this.enableCost = true;
    this.fibonacciMode = 'calendar-days';
    this.velocityConfig = {
      pointsPerSprint: 25,
      sprintLengthDays: 10,
    };

    // Clear existing fibonacci calendar mappings
    Object.keys(this.fibonacciCalendarMappings).forEach((key) => {
      delete this.fibonacciCalendarMappings[key];
    });

    // Clear existing tshirt mappings
    Object.keys(this.tshirtMappings).forEach((key) => {
      delete this.tshirtMappings[key];
    });

    // Reassign default values to the same objects
    Object.assign(this.fibonacciCalendarMappings, {
      1: { min: 1, max: 1 },
      2: { min: 1, max: 2 },
      3: { min: 2, max: 3 },
      5: { min: 3, max: 5 },
      8: { min: 5, max: 8 },
      13: { min: 8, max: 13 },
      21: { min: 13, max: 21 },
      34: { min: 21, max: 34 },
    });
    Object.assign(this.tshirtMappings, {
      XS: 1,
      S: 2,
      M: 3,
      L: 5,
      XL: 8,
      XXL: 13,
    });
  }
}

const appState = new AppState();

// Maintain backward compatibility with existing code
const { fibonacciCalendarMappings, tshirtMappings } = appState;

export {
  AppState,
  appState,
  fibonacciCalendarMappings,
  tshirtMappings,
};
