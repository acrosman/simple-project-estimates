// ============= Interface Element Helpers =================
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
 * @param {HTMLElement} containerElement The element to append the error message to.
 * @param {string} message The error message text.
 * @param {number} timeoutMs Milliseconds after which the element is auto-removed.
 *   Pass 0 to disable auto-removal. Defaults to 5000.
 * @returns {HTMLElement} The created error div.
 */
function showError(containerElement, message, timeoutMs = 5000) {
  const errorDiv = document.createElement('div');
  errorDiv.setAttribute('role', 'alert');
  errorDiv.setAttribute('aria-live', 'assertive');
  errorDiv.classList.add('error-message');
  errorDiv.textContent = message;

  const existingError = containerElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  containerElement.appendChild(errorDiv);

  if (timeoutMs > 0) {
    setTimeout(() => {
      errorDiv.remove();
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
