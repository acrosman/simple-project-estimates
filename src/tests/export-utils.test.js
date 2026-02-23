/**
 * @jest-environment jsdom
 */

import saveSvgAsImage from '../utils/export-utils';
import { showError } from '../utils/dom-helpers';

jest.mock('../utils/dom-helpers', () => ({
  showError: jest.fn(),
}));

describe('saveSvgAsImage', () => {
  let mockContainer;
  let mockSvg;
  let mockCanvas;
  let mockContext;
  let mockImage;
  let originalCreateElement;
  let originalGetComputedStyle;
  let originalURL;
  let originalGetElementById;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {
      fillStyle: '',
      fillRect: jest.fn(),
      drawImage: jest.fn(),
    };

    mockCanvas = {
      getContext: jest.fn(() => mockContext),
      toBlob: jest.fn((callback) => callback(new Blob(['test'], { type: 'image/png' }))),
      width: 0,
      height: 0,
    };

    mockSvg = {
      cloneNode: jest.fn(() => ({
        querySelectorAll: jest.fn(() => []),
      })),
      querySelectorAll: jest.fn(() => []),
      getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 })),
    };

    mockContainer = {
      querySelector: jest.fn(() => mockSvg),
    };

    mockImage = { onload: null, src: '' };
    global.Image = jest.fn(() => mockImage);

    global.XMLSerializer = jest.fn(() => ({
      serializeToString: jest.fn(() => '<svg></svg>'),
    }));

    global.Blob = jest.fn((content, options) => ({ content, type: options.type }));

    originalGetElementById = document.getElementById;
    document.getElementById = jest.fn(() => mockContainer);

    originalCreateElement = document.createElement;
    document.createElement = jest.fn((tag) => {
      if (tag === 'canvas') return mockCanvas;
      if (tag === 'a') return { click: jest.fn(), download: '', href: '' };
      return originalCreateElement.call(document, tag);
    });

    originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = jest.fn(() => ({
      getPropertyValue: jest.fn(() => 'blue'),
      [Symbol.iterator]: function* iterator() {
        yield 'fill';
        yield 'stroke';
      },
    }));

    originalURL = global.URL;
    global.URL = {
      createObjectURL: jest.fn(() => 'blob:mock-url'),
      revokeObjectURL: jest.fn(),
    };
  });

  afterEach(() => {
    document.getElementById = originalGetElementById;
    document.createElement = originalCreateElement;
    window.getComputedStyle = originalGetComputedStyle;
    global.URL = originalURL;
    jest.restoreAllMocks();
  });

  describe('when the container element is not found', () => {
    beforeEach(() => {
      document.getElementById = jest.fn(() => null);
    });

    test('returns without throwing', () => {
      expect(() => saveSvgAsImage('missingId', 'test-file', 'png')).not.toThrow();
    });

    test('does not attempt to serialize an SVG', () => {
      saveSvgAsImage('missingId', 'test-file', 'png');
      expect(global.XMLSerializer).not.toHaveBeenCalled();
    });

    test('does not call showError', () => {
      saveSvgAsImage('missingId', 'test-file', 'png');
      expect(showError).not.toHaveBeenCalled();
    });
  });

  describe('when no SVG is present in the container', () => {
    beforeEach(() => {
      mockContainer.querySelector = jest.fn(() => null);
    });

    test('calls showError with the container and an error message', () => {
      saveSvgAsImage('testId', 'test-file', 'png');
      expect(showError).toHaveBeenCalledWith(
        mockContainer,
        'No graph to save. Please run a simulation first.',
      );
    });

    test('does not attempt to serialize an SVG', () => {
      saveSvgAsImage('testId', 'test-file', 'png');
      expect(global.XMLSerializer).not.toHaveBeenCalled();
    });
  });

  describe('when an SVG is present in the container', () => {
    test('calls XMLSerializer.serializeToString', () => {
      const serializeSpy = jest.fn(() => '<svg></svg>');
      global.XMLSerializer = jest.fn(() => ({ serializeToString: serializeSpy }));

      saveSvgAsImage('testId', 'test-file', 'png');

      expect(global.XMLSerializer).toHaveBeenCalled();
      expect(serializeSpy).toHaveBeenCalled();
    });

    test('creates a Blob from the serialized SVG', () => {
      saveSvgAsImage('testId', 'test-file', 'png');
      expect(global.Blob).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(String)]),
        expect.objectContaining({ type: 'image/svg+xml;charset=utf-8' }),
      );
    });

    test('creates an object URL from the Blob', () => {
      saveSvgAsImage('testId', 'test-file', 'png');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('triggers a click on an <a> element to download the image', () => {
      saveSvgAsImage('testId', 'test-file', 'png');
      mockImage.onload();

      const anchorCalls = document.createElement.mock.calls.filter(([tag]) => tag === 'a');
      expect(anchorCalls.length).toBeGreaterThan(0);

      const link = document.createElement.mock.results.find(
        (r) => r.value && typeof r.value.click === 'function',
      ).value;
      expect(link.click).toHaveBeenCalled();
    });

    test('does not call showError', () => {
      saveSvgAsImage('testId', 'test-file', 'png');
      expect(showError).not.toHaveBeenCalled();
    });
  });

  describe('MIME type based on format argument', () => {
    test("'png' format produces image/png MIME type", () => {
      saveSvgAsImage('testId', 'test-file', 'png');
      mockImage.onload();
      const toBlobCall = mockCanvas.toBlob.mock.calls[0];
      expect(toBlobCall[1]).toBe('image/png');
    });

    test("'jpeg' format produces image/jpeg MIME type", () => {
      saveSvgAsImage('testId', 'test-file', 'jpeg');
      mockImage.onload();
      const toBlobCall = mockCanvas.toBlob.mock.calls[0];
      expect(toBlobCall[1]).toBe('image/jpeg');
    });

    test("default format is 'png'", () => {
      saveSvgAsImage('testId', 'test-file');
      mockImage.onload();
      const toBlobCall = mockCanvas.toBlob.mock.calls[0];
      expect(toBlobCall[1]).toBe('image/png');
    });
  });
});
