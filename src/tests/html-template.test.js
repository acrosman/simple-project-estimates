/**
 * @jest-environment jsdom
 */

import fs from 'fs';
import path from 'path';

describe('HTML Template Accessibility', () => {
  let htmlContent;

  beforeAll(() => {
    // Read the actual HTML template
    const htmlPath = path.join(__dirname, '../index.html');
    htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  });

  test('HTML has lang attribute', () => {
    expect(htmlContent).toMatch(/<html[^>]*\slang=/i);
  });

  test('HTML has proper document type declaration', () => {
    expect(htmlContent).toMatch(/<!DOCTYPE html>/i);
  });

  test('HTML has viewport meta tag', () => {
    expect(htmlContent).toMatch(/<meta[^>]*name="viewport"/i);
    expect(htmlContent).toMatch(/width=device-width/i);
  });

  test('HTML has charset declaration', () => {
    expect(htmlContent).toMatch(/<meta[^>]*charset=/i);
  });

  test('HTML has title element', () => {
    expect(htmlContent).toMatch(/<title>/i);
  });

  test('HTML structure is valid', () => {
    // Basic validation
    expect(htmlContent).toMatch(/<html[^>]*>/i);
    expect(htmlContent).toMatch(/<head>/i);
    expect(htmlContent).toMatch(/<\/head>/i);
    expect(htmlContent).toMatch(/<body>/i);
    expect(htmlContent).toMatch(/<\/body>/i);
    expect(htmlContent).toMatch(/<\/html>/i);
  });
});
