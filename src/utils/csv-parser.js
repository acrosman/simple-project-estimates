/**
 * Validates CSV data structure and content. Pure function for testing.
 * @param {Array} data Parsed CSV data as array of objects
 * @param {string} estimationMode Current estimation mode ('hours', 'fibonacci', 'tshirt')
 * @param {boolean} enableCost Whether cost tracking is enabled
 * @returns {Array} Validated data array
 * @throws {Error} If validation fails
 */
function validateCsvData(data, estimationMode, enableCost) {
  // Validate CSV data has required structure
  if (!data || data.length === 0) {
    throw new Error('CSV file is empty or contains no data rows.');
  }

  // Check for required columns based on current estimation mode
  const requiredColumns = ['Task', 'Confidence'];
  if (estimationMode === 'hours') {
    requiredColumns.push('Min', 'Max');
  } else if (estimationMode === 'fibonacci') {
    requiredColumns.push('Fibonacci');
  } else if (estimationMode === 'tshirt') {
    requiredColumns.push('TShirt');
  }

  const firstRow = data[0];
  const missingColumns = requiredColumns.filter((col) => !(col in firstRow));

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Expected columns: ${requiredColumns.join(', ')}${enableCost ? ', Cost (optional)' : ''}.`);
  }

  // Validate data types for first few rows
  for (let i = 0; i < Math.min(3, data.length); i += 1) {
    const row = data[i];
    if (estimationMode === 'hours') {
      if (row.Min && Number.isNaN(Number(row.Min))) {
        throw new Error(`Invalid Min value "${row.Min}" in row ${i + 1}. Must be a number.`);
      }
      if (row.Max && Number.isNaN(Number(row.Max))) {
        throw new Error(`Invalid Max value "${row.Max}" in row ${i + 1}. Must be a number.`);
      }
    }
    const confidence = Number(row.Confidence);
    if (row.Confidence && (Number.isNaN(confidence)
      || confidence < 0 || confidence > 100)) {
      throw new Error(`Invalid Confidence value "${row.Confidence}" in row ${i + 1}. Must be a number between 0 and 100.`);
    }
  }

  return data;
}

export default validateCsvData;
