// Pretext wrapper for Chrome extension
// Import pretext modules

import { prepare, layout } from './node_modules/@chenglou/pretext/dist/analysis.js';
import { prepareWithSegments, layoutWithLines, layoutNextLine, materializeLineRange, measureLineStats, walkLineRanges, layoutNextLineRange, measureNaturalWidth } from './node_modules/@chenglou/pretext/dist/layout.js';

// Export to window for content script
window.pretext = {
  prepare,
  layout,
  prepareWithSegments,
  layoutWithLines,
  layoutNextLine,
  materializeLineRange,
  measureLineStats,
  walkLineRanges,
  layoutNextLineRange,
  measureNaturalWidth
};
