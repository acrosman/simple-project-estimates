/**
 * Reusable DOM element factory helpers.
 * Provides convenience wrappers over document.createElement for common patterns.
 * Contains no application state, simulation logic, or D3 references.
 * @module utils/dom-helpers
 */
/**
 * Create a text element with it's internal text node.
 * @param {string} wrapperTag Tag name
 * @param {string} text Tag content
 * @param {array} classList List of classes.
 * @param {string} role Optional ARIA role
 * @returns HTMLElement
 */
function createTextElement(wrapperTag, text, classList = [], role = null) {
  const el = document.createElement(wrapperTag);
  el.appendChild(document.createTextNode(text));
  el.classList.add(...classList);
  if (role) {
    el.setAttribute('role', role);
  }
  return el;
}

/**
 * Create a labeled input.
 * @param {string} labelText Text for input label.
 * @param {*} inputAttributes A collection of attributes to set on the input.
 * @param {boolean} labelFirst when true, puts the label before the input and vice versa.
 * @returns HTMLElement
 */
function createLabeledInput(labelText, inputAttributes, labelFirst = true) {
  const wrapper = document.createElement('div');
  const fldLabel = createTextElement('label', labelText);
  fldLabel.htmlFor = inputAttributes.id || inputAttributes.name;
  const field = document.createElement('input');
  Object.assign(field, inputAttributes);

  if (labelFirst) {
    wrapper.appendChild(fldLabel);
    wrapper.appendChild(field);
  } else {
    wrapper.appendChild(field);
    wrapper.appendChild(fldLabel);
  }
  return wrapper;
}

/**
 * Creates an HTML div with the ID and classes set.
 * @param {*} id The id for the div
 * @param {*} classList list of classes to add.
 * @returns HTMLElement
 */
function createDivWithIdAndClasses(id, classList = []) {
  const el = document.createElement('div');
  el.id = id;
  el.classList.add(...classList);

  return el;
}

/**
 * Shows an accessible error message inside a container element.
 * Removes any pre-existing .error-message child before appending the new one.
 * @param {string} message The error message text.
 * @param {HTMLElement} [container] Optional container to append error to. Defaults to #messages.
 * @param {number} timeoutMs Milliseconds after which the element is auto-removed.
 *   Pass 0 to disable auto-removal. Defaults to 5000.
 * @returns {HTMLElement} The created error div.
 */
function showError(message, container = null, timeoutMs = 5000) {
  const containerElement = container || document.getElementById('messages');
  // Remove any existing error message in the container
  const existingError = containerElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  const errorDiv = document.createElement('div');
  errorDiv.setAttribute('role', 'alert');
  errorDiv.setAttribute('aria-live', 'assertive');
  errorDiv.classList.add('error-message');
  errorDiv.textContent = message;

  containerElement.appendChild(errorDiv);
  // Only toggle visibility class if using the default container
  if (!container || container === document.getElementById('messages')) {
    containerElement.classList.remove('hidden');
  }

  // Auto hide errors after a timeout.
  if (timeoutMs > 0) {
    setTimeout(() => {
      errorDiv.remove();
      // Only toggle visibility class if using the default container
      if (!container || container === document.getElementById('messages')) {
        containerElement.classList.add('hidden');
      }
    }, timeoutMs);
  }

  return errorDiv;
}

export {
  createTextElement,
  createLabeledInput,
  createDivWithIdAndClasses,
  showError,
};
