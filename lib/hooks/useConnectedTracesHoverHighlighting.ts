import { useEffect, useRef } from "react";
import { findConnectedTraceIds } from "../utils/trace-connectivity";
import {
  addTraceHighlightingStyles,
  removeTraceHighlightingStyles,
} from "../utils/trace-highlighting-styles";

interface useConnectedTracesHoverHighlightingOptions {
  svgDivRef: React.RefObject<HTMLDivElement | null>;
  circuitJson: any[];
  circuitJsonKey?: string;
  enabled?: boolean;
}

/**
 * Optimized trace highlighting using CSS classes and circuit-to-svg metadata
 */
export const useConnectedTracesHoverHighlighting = ({
  svgDivRef,
  circuitJson,
  circuitJsonKey,
  enabled = true,
}: useConnectedTracesHoverHighlightingOptions) => {
  const activeNetRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !svgDivRef.current || !circuitJson || !circuitJsonKey) {
      return;
    }

    const svgContainer = svgDivRef.current;

    const handleTraceHover = (event: Event) => {
      const target = event.currentTarget as SVGElement;

      const traceId =
        target.getAttribute("data-schematic-trace-id") ||
        target.getAttribute("data-circuit-json-type") === "schematic_trace"
          ? target.getAttribute("data-schematic-trace-id")
          : null;

      if (!traceId) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const connectedTraces = findConnectedTraceIds(circuitJson, traceId);
      activeNetRef.current = traceId;

      const svgElement = svgContainer.querySelector("svg");
      if (svgElement) {
        svgElement.querySelectorAll(".trace-highlighted").forEach((el) => {
          el.classList.remove("trace-highlighted");
        });

        connectedTraces.forEach((connectedTraceId) => {
          const traceElement = svgElement.querySelector(
            `[data-schematic-trace-id="${connectedTraceId}"]`
          );
          if (traceElement) {
            traceElement.classList.add("trace-highlighted");
          }
        });
      }
    };

    const handleTraceLeave = () => {
      timeoutRef.current = setTimeout(() => {
        const svgElement = svgContainer.querySelector("svg");
        if (svgElement) {
          svgElement.querySelectorAll(".trace-highlighted").forEach((el) => {
            el.classList.remove("trace-highlighted");
          });
        }
        activeNetRef.current = null;
      }, 50);
    };

    const observer = new MutationObserver(() => {
      const svgElement = svgContainer.querySelector("svg");
      if (svgElement) {
        addTraceHighlightingStyles(svgContainer);

        const traceElements = svgElement.querySelectorAll(
          'g.trace[data-circuit-json-type="schematic_trace"], [data-schematic-trace-id]'
        );

        if (traceElements.length > 0) {
          traceElements.forEach((el) => {
            el.addEventListener("mouseenter", handleTraceHover);
            el.addEventListener("mouseleave", handleTraceLeave);
          });

          observer.disconnect();
        }
      }
    });

    observer.observe(svgContainer, { childList: true, subtree: true });

    return () => {
      observer.disconnect();

      const svgElement = svgContainer.querySelector("svg");
      if (svgElement) {
        const traceElements = svgElement.querySelectorAll(
          'g.trace[data-circuit-json-type="schematic_trace"], [data-schematic-trace-id]'
        );
        traceElements.forEach((el) => {
          el.removeEventListener("mouseenter", handleTraceHover);
          el.removeEventListener("mouseleave", handleTraceLeave);
        });
      }

      removeTraceHighlightingStyles(svgContainer);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [svgDivRef, circuitJsonKey, enabled]);

  return {
    currentHighlightedNet: activeNetRef.current,
  };
};
