// Pretext loader for Chrome extension
// This file loads pretext as ES modules

(async function() {
  try {
    // Import pretext modules
    const analysis = await import(chrome.runtime.getURL('pretext-lib/analysis.js'));
    const layout = await import(chrome.runtime.getURL('pretext-lib/layout.js'));
    
    // Expose to window
    window.pretext = {
      prepare: analysis.prepare,
      layout: analysis.layout,
      prepareWithSegments: layout.prepareWithSegments,
      layoutWithLines: layout.layoutWithLines,
      layoutNextLine: layout.layoutNextLine,
      materializeLineRange: layout.materializeLineRange,
      measureLineStats: layout.measureLineStats,
      walkLineRanges: layout.walkLineRanges,
      layoutNextLineRange: layout.layoutNextLineRange,
      measureNaturalWidth: layout.measureNaturalWidth
    };
    
    console.log('Pretext loaded successfully');
  } catch (error) {
    console.error('Failed to load pretext:', error);
  }
})();
