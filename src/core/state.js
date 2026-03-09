/**
 * Application state management module.
 * Provides the AppState class and a shared appState instance.
 * Stores estimation mode, cost toggle, velocity configuration, and size mappings.
 * @module core/state
 */

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

  /**
   * Sets the current estimation mode and emits a modeChanged event.
   * @param {'hours'|'fibonacci'|'tshirt'} mode The estimation mode to activate.
   */
  setEstimationMode(mode) {
    this.estimationMode = mode;
    this.emit('modeChanged', mode);
  }

  /**
   * Returns the current estimation mode.
   * @returns {'hours'|'fibonacci'|'tshirt'} The active estimation mode.
   */
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

  /**
   * Enables or disables cost tracking and emits a costToggled event.
   * @param {boolean} enabled Whether cost tracking should be enabled.
   */
  setEnableCost(enabled) {
    this.enableCost = enabled;
    this.emit('costToggled', enabled);
  }

  /**
   * Returns whether cost tracking is currently enabled.
   * @returns {boolean} True if cost tracking is enabled.
   */
  getEnableCost() {
    return this.enableCost;
  }

  /**
   * Sets the Fibonacci estimation sub-mode and emits a fibonacciModeChanged event.
   * @param {'calendar-days'|'velocity-based'} mode The Fibonacci mode to activate.
   */
  setFibonacciMode(mode) {
    this.fibonacciMode = mode;
    this.emit('fibonacciModeChanged', mode);
  }

  /**
   * Returns the current Fibonacci estimation sub-mode.
   * @returns {'calendar-days'|'velocity-based'} The active Fibonacci mode.
   */
  getFibonacciMode() {
    return this.fibonacciMode;
  }

  /**
   * Updates the velocity configuration and emits a velocityConfigChanged event.
   * @param {number} pointsPerSprint The number of story points completed per sprint.
   * @param {number} sprintLengthDays The length of a sprint in calendar days.
   */
  setVelocityConfig(pointsPerSprint, sprintLengthDays) {
    this.velocityConfig = {
      pointsPerSprint: parseFloat(pointsPerSprint) || 25,
      sprintLengthDays: parseFloat(sprintLengthDays) || 10,
    };
    this.emit('velocityConfigChanged', this.velocityConfig);
  }

  /**
   * Returns the current velocity configuration.
   * @returns {{pointsPerSprint: number, sprintLengthDays: number}} The velocity config object.
   */
  getVelocityConfig() {
    return this.velocityConfig;
  }

  /**
   * Returns the Fibonacci-to-calendar-day range mappings.
   * @returns {Object.<number, {min: number, max: number}>} The Fibonacci calendar mappings.
   */
  getFibonacciCalendarMappings() {
    return this.fibonacciCalendarMappings;
  }

  /**
   * Returns the T-shirt size to story point mappings.
   * @returns {Object.<string, number>} The T-shirt size mappings.
   */
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

export {
  AppState,
  appState,
};
