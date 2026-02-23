// ============= Application State Management =================
/**
 * Manages application state in a testable, encapsulated way.
 */
class AppState {
  constructor() {
    this.listeners = new Map();
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
    this.emit('modeChanged', mode);
  }

  getEstimationMode() {
    return this.estimationMode;
  }

  /**
   * Returns the display label for the current time unit.
   * @returns {'Days'|'Hours'} 'Days' for fibonacci/tshirt modes, 'Hours' for hours mode
   */
  getTimeUnit() {
    return (this.estimationMode === 'fibonacci' || this.estimationMode === 'tshirt') ? 'Days' : 'Hours';
  }

  /**
   * Returns the number of hours per time unit for cost calculations.
   * @returns {number} 8 for fibonacci/tshirt modes (days), 1 for hours mode
   */
  getHoursPerTimeUnit() {
    return (this.estimationMode === 'fibonacci' || this.estimationMode === 'tshirt') ? 8 : 1;
  }

  setEnableCost(enabled) {
    this.enableCost = enabled;
    this.emit('costToggled', enabled);
  }

  getEnableCost() {
    return this.enableCost;
  }

  setFibonacciMode(mode) {
    this.fibonacciMode = mode;
    this.emit('fibonacciModeChanged', mode);
  }

  getFibonacciMode() {
    return this.fibonacciMode;
  }

  setVelocityConfig(pointsPerSprint, sprintLengthDays) {
    this.velocityConfig = {
      pointsPerSprint: parseFloat(pointsPerSprint) || 25,
      sprintLengthDays: parseFloat(sprintLengthDays) || 10,
    };
    this.emit('velocityConfigChanged', this.velocityConfig);
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
   * Subscribes to an event.
   * @param {string} event The event name to subscribe to.
   * @param {Function} callback The callback to execute when the event is emitted.
   */
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emits an event to all subscribers.
   * @param {string} event The event name to emit.
   * @param {*} data The data to pass to the callbacks.
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }

  /**
   * Resets state to default values (useful for testing).
   */
  reset() {
    this.listeners.clear();
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
