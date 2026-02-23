import { showError } from './dom-helpers';

/**
 * Saves an SVG element as a PNG or JPEG image
 * @param {string} svgContainerId ID of the element containing the SVG
 * @param {string} filename Name for the downloaded file
 * @param {string} format 'png' or 'jpeg'
 */
function saveSvgAsImage(svgContainerId, filename, format = 'png') {
  const container = document.getElementById(svgContainerId);

  if (!container) {
    // eslint-disable-next-line no-console
    console.error(`saveSvgAsImage: container element "${svgContainerId}" not found.`);
    return;
  }

  const svg = container.querySelector('svg');

  if (!svg) {
    showError(container, 'No graph to save. Please run a simulation first.');
    return;
  }

  // Clone the SVG to avoid modifying the original
  const svgClone = svg.cloneNode(true);

  // Inline styles to preserve colors
  const allElements = svgClone.querySelectorAll('*');
  const originalElements = svg.querySelectorAll('*');

  allElements.forEach((element, index) => {
    const originalElement = originalElements[index];
    if (originalElement) {
      const computedStyle = window.getComputedStyle(originalElement);
      const styleString = Array.from(computedStyle).reduce((acc, key) => {
        const value = computedStyle.getPropertyValue(key);
        if (value && key !== 'all') {
          return `${acc}${key}:${value};`;
        }
        return acc;
      }, '');
      if (styleString) {
        element.setAttribute('style', styleString);
      }
    }
  });

  // Get SVG data
  const svgData = new XMLSerializer().serializeToString(svgClone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Create an image to load the SVG
  const img = new Image();
  img.onload = () => {
    // Create a canvas with bottom margin
    const canvas = document.createElement('canvas');
    const svgSize = svg.getBoundingClientRect();
    const bottomMargin = 20;
    canvas.width = svgSize.width;
    canvas.height = svgSize.height + bottomMargin;

    // Draw the image onto the canvas
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, `image/${format}`, 0.95);

    URL.revokeObjectURL(url);
  };

  img.src = url;
}

export default saveSvgAsImage;
