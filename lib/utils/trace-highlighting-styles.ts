/**
 * Optimized CSS-only approach for trace highlighting
 * Instead of manipulating SVG, we inject CSS that works with existing circuit-to-svg structure
 */
export const addTraceHighlightingStyles = (svgContainer: HTMLElement): void => {
  // Check if styles already added
  const existingStyle = svgContainer.querySelector(
    "style[data-trace-highlighting]"
  );
  if (existingStyle) {
    return;
  }

  // Create style element
  const styleElement = document.createElement("style");
  styleElement.setAttribute("data-trace-highlighting", "true");

  styleElement.textContent = `
    /* Match the original .trace:hover behavior exactly */
    
    /* Use the same filter effect as the original hover */
    svg .trace-highlighted {
      filter: invert(1) !important;
    }
    
    /* Hide crossing outlines on highlighted traces - matches original */
    svg .trace-highlighted .trace-crossing-outline {
     // opacity: 0 !important;
    }

    /* Ensure pointer cursor for all trace groups */
    svg g.trace[data-circuit-json-type="schematic_trace"]:hover {
      cursor: pointer !important;
    }

    /* Alternative selector for data-schematic-trace-id elements */
    svg [data-schematic-trace-id]:hover {
      cursor: pointer !important;
    }
  `;

  // Add to container (not inside SVG)
  svgContainer.appendChild(styleElement);
};

/**
 * Remove trace highlighting styles
 */
export const removeTraceHighlightingStyles = (
  svgContainer: HTMLElement
): void => {
  const styleElement = svgContainer.querySelector(
    "style[data-trace-highlighting]"
  );
  if (styleElement) {
    styleElement.remove();
  }
};
