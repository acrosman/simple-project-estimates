/**
 * T-shirt size mapping configuration UI panel.
 * Renders the table that lets users define hour-range mappings for each size (XS–XXL).
 * @module ui/tshirt-config
 */
import { tshirtMappings } from '../core/state';
import { createTextElement, createDivWithIdAndClasses } from '../utils/dom-helpers';

/**
 * Normalizes t-shirt size values for mapping lookup.
 * @param {string} size Raw t-shirt size input.
 * @returns {string} Normalized uppercase size.
 */
function normalizeTshirtSize(size) {
  if (typeof size !== 'string') {
    return '';
  }
  return size.trim().toUpperCase();
}

/**
 * Handles tab navigation inside mapping tables so focus moves min->max per column.
 * @param {KeyboardEvent} event Keyboard event from mapping input.
 * @param {string} keyField Data attribute key name (fib|tshirt).
 * @param {Array<string|number>} orderedKeys Ordered mapping keys.
 */
function handleMappingTabNavigation(event, keyField, orderedKeys) {
  // Only intercept plain Tab/Shift+Tab; let browser handle all other key combos.
  if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  // Guard against synthetic or malformed events missing target/dataset.
  const target = event && event.target ? event.target : null;
  const dataset = target && target.dataset ? target.dataset : null;
  const currentKey = dataset ? dataset[keyField] : null;
  const currentType = dataset ? dataset.type : null;
  if (!currentKey || !currentType) {
    return;
  }

  // Build a flat ordered sequence of every focusable input in the table:
  // [key0-min, key0-max, key1-min, key1-max, …]. Normalizing keys ensures
  // t-shirt sizes like "xs" and "XS" resolve to the same position.
  const normalizedCurrentKey = keyField === 'tshirt' ? normalizeTshirtSize(currentKey) : currentKey;
  const sequence = [];
  for (const key of orderedKeys) {
    const normalizedKey = keyField === 'tshirt' ? normalizeTshirtSize(String(key)) : String(key);
    sequence.push({ key: normalizedKey, type: 'min' });
    sequence.push({ key: normalizedKey, type: 'max' });
  }

  const currentIndex = sequence.findIndex((item) => (
    item.key === normalizedCurrentKey && item.type === currentType
  ));

  if (currentIndex < 0) {
    return;
  }

  // Shift+Tab moves backward through the sequence; plain Tab moves forward.
  const direction = event.shiftKey ? -1 : 1;
  const nextIndex = currentIndex + direction;

  // Allow the browser's default Tab behavior when focus would leave the table.
  if (nextIndex < 0 || nextIndex >= sequence.length) {
    return;
  }

  const next = sequence[nextIndex];
  const selector = `input[data-${keyField}="${next.key}"][data-type="${next.type}"]`;
  const nextInput = document.querySelector(selector);

  if (nextInput) {
    event.preventDefault();
    nextInput.focus();
  }
}

/**
 * Updates the t-shirt mapping when user changes values.
 * @param {Event} event
 */
function updateTshirtMapping(event) {
  if (!event || !event.target || !event.target.dataset) {
    return;
  }

  const { tshirt } = event.target.dataset;
  const rawValue = event.target.value;

  if (!tshirt) {
    return;
  }

  const size = normalizeTshirtSize(tshirt);
  const value = Number.parseInt(rawValue, 10);

  if (!size || !Number.isFinite(value) || value < 0) {
    return;
  }

  if (!Object.hasOwn(tshirtMappings, size)) {
    return;
  }

  tshirtMappings[size] = value;
}

/**
 * Creates the t-shirt mapping configuration interface.
 * @returns HTMLElement
 */
function createTshirtMappingTable() {
  const wrapper = createDivWithIdAndClasses('tshirtMappingWrapper', ['section', 'fibonacci-mapping']);
  const header = createTextElement('h3', 'T-Shirt Size to Fibonacci Mapping', ['header', 'fib-mapping']);
  const helpText = createTextElement('p', 'Map t-shirt sizes to Fibonacci story points. These will be converted to days using the Fibonacci calendar day mappings.', ['help-text']);

  const table = createDivWithIdAndClasses(null, ['table', 'fib-mapping-table']);

  const sizes = Object.keys(tshirtMappings);

  const sizeRow = createDivWithIdAndClasses(null, ['tr', 'fib-mapping-row']);
  sizeRow.appendChild(createTextElement('div', 'T-Shirt Size', ['th']));

  for (const size of sizes) {
    const sizeCell = createDivWithIdAndClasses(null, ['td']);
    sizeCell.appendChild(createTextElement('span', size, []));
    sizeRow.appendChild(sizeCell);
  }
  table.appendChild(sizeRow);

  const fibRow = createDivWithIdAndClasses(null, ['tr', 'fib-mapping-row']);
  fibRow.appendChild(createTextElement('div', 'Fibonacci Points', ['th']));

  for (const size of sizes) {
    const fibCell = createDivWithIdAndClasses(null, ['td']);
    const fibInput = document.createElement('input');
    Object.assign(fibInput, {
      type: 'number',
      value: tshirtMappings[size],
      name: `tshirt-fib-${size}`,
      min: 0,
      step: 1,
    });
    fibInput.setAttribute('aria-label', `Fibonacci points for t-shirt size ${size}`);
    fibInput.dataset.tshirt = size;
    fibInput.addEventListener('change', updateTshirtMapping);
    fibCell.appendChild(fibInput);
    fibRow.appendChild(fibCell);
  }
  table.appendChild(fibRow);

  wrapper.appendChild(header);
  wrapper.appendChild(helpText);
  wrapper.appendChild(table);
  wrapper.classList.add('hidden');

  return wrapper;
}

export {
  normalizeTshirtSize,
  handleMappingTabNavigation,
  updateTshirtMapping,
  createTshirtMappingTable,
};
