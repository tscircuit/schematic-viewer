// lib/components/SchematicViewer.tsx
import {
  convertCircuitJsonToSchematicSvg
} from "circuit-to-svg";
import { su as su6 } from "@tscircuit/soup-util";

// lib/hooks/useChangeSchematicComponentLocationsInSvg.ts
import "@tscircuit/soup-util";
import "transformation-matrix";
import { useEffect, useRef } from "react";

// lib/utils/get-component-offset-due-to-events.ts
var getComponentOffsetDueToEvents = ({
  editEvents,
  schematic_component_id
}) => {
  const editEventsForComponent = editEvents.filter(
    (event) => "schematic_component_id" in event && event.schematic_component_id === schematic_component_id
  ).filter(
    (event) => "edit_event_type" in event && event.edit_event_type === "edit_schematic_component_location"
  );
  const totalOffsetX = editEventsForComponent.reduce((acc, event) => {
    return acc + event.new_center.x - event.original_center.x;
  }, 0);
  const totalOffsetY = editEventsForComponent.reduce((acc, event) => {
    return acc + event.new_center.y - event.original_center.y;
  }, 0);
  return {
    x: totalOffsetX,
    y: totalOffsetY
  };
};

// lib/hooks/useChangeSchematicComponentLocationsInSvg.ts
var useChangeSchematicComponentLocationsInSvg = ({
  svgDivRef,
  realToSvgProjection,
  svgToScreenProjection,
  activeEditEvent,
  editEvents
}) => {
  const lastSvgContentRef = useRef(null);
  useEffect(() => {
    const svg = svgDivRef.current;
    if (!svg) return;
    const observer = new MutationObserver((mutations) => {
      const currentSvgContent = svg.innerHTML;
      if (currentSvgContent !== lastSvgContentRef.current) {
        lastSvgContentRef.current = currentSvgContent;
        applyTransforms();
      }
    });
    const applyTransforms = () => {
      const componentsThatHaveBeenMoved = /* @__PURE__ */ new Set();
      for (const event of editEvents) {
        if ("edit_event_type" in event && event.edit_event_type === "edit_schematic_component_location") {
          componentsThatHaveBeenMoved.add(event.schematic_component_id);
        }
      }
      if (activeEditEvent) {
        componentsThatHaveBeenMoved.add(activeEditEvent.schematic_component_id);
      }
      const allComponents = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_component"]'
      );
      for (const component of Array.from(allComponents)) {
        const schematic_component_id = component.getAttribute(
          "data-schematic-component-id"
        );
        const offsetMm = getComponentOffsetDueToEvents({
          editEvents: [
            ...editEvents,
            ...activeEditEvent ? [activeEditEvent] : []
          ],
          schematic_component_id
        });
        const offsetPx = {
          x: offsetMm.x * realToSvgProjection.a,
          y: offsetMm.y * realToSvgProjection.d
        };
        const style = component.style;
        style.transform = `translate(${offsetPx.x}px, ${offsetPx.y}px)`;
        if (activeEditEvent?.schematic_component_id === schematic_component_id) {
          style.outline = "solid 2px rgba(255,0,0,0.5)";
          style.outlineOffset = "5px";
        } else if (style.outline) {
          style.outline = "";
        }
      }
    };
    observer.observe(svg, {
      childList: true,
      // Watch for changes to the child elements
      subtree: false,
      // Watch for changes in the entire subtree
      characterData: false
      // Watch for changes to text content
    });
    applyTransforms();
    return () => {
      observer.disconnect();
    };
  }, [svgDivRef, editEvents, activeEditEvent]);
};

// lib/hooks/useChangeSchematicTracesForMovedComponents.ts
import { useEffect as useEffect2, useRef as useRef2 } from "react";
import { su as su2 } from "@tscircuit/soup-util";
var useChangeSchematicTracesForMovedComponents = ({
  svgDivRef,
  circuitJson,
  activeEditEvent,
  editEvents
}) => {
  const lastSvgContentRef = useRef2(null);
  useEffect2(() => {
    const svg = svgDivRef.current;
    if (!svg) return;
    const updateTraceStyles = () => {
      const allTraces = svg.querySelectorAll(
        '[data-circuit-json-type="schematic_trace"] path'
      );
      for (const trace of Array.from(allTraces)) {
        trace.setAttribute("stroke-dasharray", "0");
        trace.style.animation = "";
      }
      for (const editEvent of [
        ...editEvents,
        ...activeEditEvent ? [activeEditEvent] : []
      ]) {
        if ("schematic_component_id" in editEvent && editEvent.edit_event_type === "edit_schematic_component_location") {
          const sch_component = su2(circuitJson).schematic_component.get(
            editEvent.schematic_component_id
          );
          if (!sch_component) return;
          const src_ports = su2(circuitJson).source_port.list({
            source_component_id: sch_component.source_component_id
          });
          const src_port_ids = new Set(src_ports.map((sp) => sp.source_port_id));
          const src_traces = su2(circuitJson).source_trace.list().filter(
            (st) => st.connected_source_port_ids?.some(
              (spi) => src_port_ids.has(spi)
            )
          );
          const src_trace_ids = new Set(
            src_traces.map((st) => st.source_trace_id)
          );
          const schematic_traces = su2(circuitJson).schematic_trace.list().filter((st) => src_trace_ids.has(st.source_trace_id));
          schematic_traces.forEach((trace) => {
            const traceElements = svg.querySelectorAll(
              `[data-schematic-trace-id="${trace.schematic_trace_id}"] path`
            );
            for (const traceElement of Array.from(traceElements)) {
              if (traceElement.getAttribute("class")?.includes("invisible"))
                continue;
              traceElement.setAttribute("stroke-dasharray", "20,20");
              traceElement.style.animation = "dash-animation 350ms linear infinite, pulse-animation 900ms linear infinite";
              if (!svg.querySelector("style#dash-animation")) {
                const style = document.createElement("style");
                style.id = "dash-animation";
                style.textContent = `
                  @keyframes dash-animation {
                    to {
                      stroke-dashoffset: -40;
                    }
                  }
                  @keyframes pulse-animation {
                    0% { opacity: 0.6; }
                    50% { opacity: 0.2; }
                    100% { opacity: 0.6; }
                  }
                `;
                svg.appendChild(style);
              }
            }
          });
        }
      }
    };
    updateTraceStyles();
    const observer = new MutationObserver(updateTraceStyles);
    observer.observe(svg, {
      childList: true,
      // Watch for changes to the child elements
      subtree: false,
      // Watch for changes in the entire subtree
      characterData: false
      // Watch for changes to text content
    });
    return () => {
      observer.disconnect();
    };
  }, [svgDivRef, activeEditEvent, circuitJson, editEvents]);
};

// lib/hooks/useSchematicGroupsOverlay.ts
import { useEffect as useEffect3 } from "react";
import { su as su3 } from "@tscircuit/soup-util";
var GROUP_COLORS = [
  "#8B0000",
  // Dark Red
  "#2F4F4F",
  // Dark Slate Gray
  "#191970",
  // Midnight Blue
  "#006400",
  // Dark Green
  "#FF4500",
  // Dark Orange
  "#800080",
  // Purple
  "#2E8B57",
  // Sea Green
  "#B8860B",
  // Dark Goldenrod
  "#C71585",
  // Medium Violet Red
  "#008B8B"
  // Dark Cyan
];
var useSchematicGroupsOverlay = (options) => {
  const { svgDivRef, circuitJson, circuitJsonKey, showGroups } = options;
  useEffect3(() => {
    if (svgDivRef.current) {
      const existingOverlays = svgDivRef.current.querySelectorAll(
        ".schematic-group-overlay"
      );
      existingOverlays.forEach((overlay) => overlay.remove());
    }
    if (!svgDivRef.current || !showGroups || !circuitJson || circuitJson.length === 0) {
      return;
    }
    const timeoutId = setTimeout(() => {
      if (!svgDivRef.current) return;
      const svg = svgDivRef.current.querySelector("svg");
      if (!svg) {
        return;
      }
      const existingOverlays = svg.querySelectorAll(".schematic-group-overlay");
      existingOverlays.forEach((overlay) => overlay.remove());
      try {
        const sourceGroups = su3(circuitJson).source_group?.list().filter((x) => !!!x.is_subcircuit) || [];
        const schematicComponents = su3(circuitJson).schematic_component?.list() || [];
        const sourceGroupHierarchy = /* @__PURE__ */ new Map();
        sourceGroups.forEach((group) => {
          const groupWithParent = group;
          if (groupWithParent.parent_source_group_id) {
            const children = sourceGroupHierarchy.get(
              groupWithParent.parent_source_group_id
            ) || [];
            children.push(group.source_group_id);
            sourceGroupHierarchy.set(
              groupWithParent.parent_source_group_id,
              children
            );
          }
        });
        const getAllDescendantSourceGroups = (sourceGroupId) => {
          const descendants = [];
          const children = sourceGroupHierarchy.get(sourceGroupId) || [];
          for (const child of children) {
            descendants.push(child);
            descendants.push(...getAllDescendantSourceGroups(child));
          }
          return descendants;
        };
        const getGroupDepthLevel = (sourceGroupId) => {
          const groupWithParent = sourceGroups.find(
            (g) => g.source_group_id === sourceGroupId
          );
          if (!groupWithParent?.parent_source_group_id) {
            return 0;
          }
          return 1 + getGroupDepthLevel(groupWithParent.parent_source_group_id);
        };
        const hasMeaningfulGroups = sourceGroups.length > 0 && sourceGroups.some((group) => group.name && group.name.trim() !== "");
        let groupsToRender = [];
        if (hasMeaningfulGroups) {
          const groupMap = /* @__PURE__ */ new Map();
          for (const comp of schematicComponents) {
            const sourceComp = su3(circuitJson).source_component.get(
              comp.source_component_id
            );
            if (sourceComp?.source_group_id) {
              if (!groupMap.has(sourceComp.source_group_id)) {
                groupMap.set(sourceComp.source_group_id, []);
              }
              groupMap.get(sourceComp.source_group_id).push(comp);
            }
          }
          sourceGroups.forEach((group, index) => {
            let groupComponents = groupMap.get(group.source_group_id) || [];
            const descendantGroups = getAllDescendantSourceGroups(
              group.source_group_id
            );
            for (const descendantGroupId of descendantGroups) {
              const descendantComponents = groupMap.get(descendantGroupId) || [];
              groupComponents = [...groupComponents, ...descendantComponents];
            }
            if (groupComponents.length > 0) {
              const depthLevel = getGroupDepthLevel(group.source_group_id);
              const hasChildren = getAllDescendantSourceGroups(group.source_group_id).length > 0;
              if (group.name?.startsWith("unnamed_board")) return;
              groupsToRender.push({
                id: group.source_group_id,
                name: group.name || `Group ${index + 1}`,
                components: groupComponents,
                color: GROUP_COLORS[index % GROUP_COLORS.length],
                depthLevel,
                hasChildren,
                sourceGroupId: group.source_group_id
              });
            }
          });
        }
        const viewBox = svg.viewBox.baseVal;
        const svgRect = svg.getBoundingClientRect();
        const scale = Math.min(
          svgRect.width / viewBox.width,
          svgRect.height / viewBox.height
        ) || 1;
        groupsToRender.sort((a, b) => a.depthLevel - b.depthLevel);
        groupsToRender.forEach((group) => {
          if (group.components.length === 0) return;
          const groupBounds = calculateGroupBounds(group.components, svg);
          if (!groupBounds) return;
          const basePadding = Math.max(
            8,
            Math.min(25, 15 / Math.max(scale, 0.3))
          );
          const hierarchyPadding = group.hasChildren ? basePadding * 0.6 : 0;
          const totalPadding = basePadding + hierarchyPadding;
          const baseStrokeWidth = Math.max(1, 2 / Math.max(scale, 0.5));
          const strokeWidth = group.depthLevel === 0 ? baseStrokeWidth : baseStrokeWidth * 0.7;
          const baseDashSize = Math.max(4, 8 / Math.max(scale, 0.5));
          const dashMultiplier = group.hasChildren ? 1.3 : 1;
          const dashSize = baseDashSize * dashMultiplier;
          const gapSize = dashSize * 0.5;
          const groupOverlay = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          groupOverlay.setAttribute("class", "schematic-group-overlay");
          groupOverlay.setAttribute(
            "x",
            (groupBounds.minX - totalPadding).toString()
          );
          groupOverlay.setAttribute(
            "y",
            (groupBounds.minY - totalPadding).toString()
          );
          groupOverlay.setAttribute(
            "width",
            (groupBounds.maxX - groupBounds.minX + totalPadding * 2).toString()
          );
          groupOverlay.setAttribute(
            "height",
            (groupBounds.maxY - groupBounds.minY + totalPadding * 2).toString()
          );
          groupOverlay.setAttribute("fill", "none");
          groupOverlay.setAttribute("stroke", group.color);
          groupOverlay.setAttribute("stroke-width", strokeWidth.toString());
          groupOverlay.setAttribute(
            "stroke-dasharray",
            `${dashSize},${gapSize}`
          );
          groupOverlay.setAttribute("opacity", "0.8");
          groupOverlay.setAttribute("rx", "0");
          groupOverlay.setAttribute("ry", "0");
          const baseFontSize = Math.max(
            6,
            Math.min(20, 14 / Math.max(scale, 0.2))
          );
          const fontSizeReduction = group.depthLevel === 0 || group.depthLevel === 1 ? 0 : group.depthLevel * 0.2;
          const fontSize = baseFontSize * (1 - fontSizeReduction);
          const labelPadding = Math.max(1, fontSize * 0.2);
          const labelText = group.name;
          const tempText = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          tempText.setAttribute("font-size", fontSize.toString());
          tempText.setAttribute("font-family", "Arial, sans-serif");
          tempText.textContent = labelText;
          svg.appendChild(tempText);
          const textBBox = tempText.getBBox();
          svg.removeChild(tempText);
          const labelWidth = textBBox.width + labelPadding * 2;
          const labelHeight = fontSize + labelPadding * 2;
          const labelX = groupBounds.minX - totalPadding;
          const labelY = groupBounds.minY - totalPadding - labelHeight;
          const labelBg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          labelBg.setAttribute("class", "schematic-group-overlay");
          labelBg.setAttribute("x", labelX.toString());
          labelBg.setAttribute("y", (labelY - labelHeight).toString());
          labelBg.setAttribute("width", labelWidth.toString());
          labelBg.setAttribute("height", labelHeight.toString());
          labelBg.setAttribute("fill", "transparent");
          labelBg.setAttribute("rx", "0");
          labelBg.setAttribute("ry", "0");
          const groupLabel = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          groupLabel.setAttribute("class", "schematic-group-overlay");
          groupLabel.setAttribute("x", (labelX + labelPadding).toString());
          groupLabel.setAttribute(
            "y",
            (labelY + labelHeight - labelPadding).toString()
          );
          groupLabel.setAttribute("fill", group.color);
          groupLabel.setAttribute("font-size", fontSize.toString());
          groupLabel.setAttribute("font-family", "Arial, sans-serif");
          groupLabel.setAttribute(
            "font-weight",
            group.depthLevel === 0 ? "600" : "500"
          );
          groupLabel.setAttribute("stroke", group.color);
          groupLabel.setAttribute(
            "stroke-width",
            Math.max(0.2, fontSize * 0.02).toString()
          );
          groupLabel.textContent = labelText;
          svg.appendChild(groupOverlay);
          svg.appendChild(labelBg);
          svg.appendChild(groupLabel);
        });
      } catch (error) {
        console.error("Error creating group overlays:", error);
      }
    }, 10);
    return () => clearTimeout(timeoutId);
  }, [svgDivRef, circuitJsonKey, showGroups]);
};
function calculateGroupBounds(components, svg) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const component of components) {
    let componentElement = svg.querySelector(
      `g[data-schematic-component-id="${component.schematic_component_id}"]`
    );
    if (!componentElement) {
      componentElement = svg.querySelector(
        `[data-schematic-component-id="${component.schematic_component_id}"]`
      );
    }
    if (componentElement) {
      const bbox = componentElement.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    }
  }
  if (minX === Infinity) {
    return null;
  }
  const bounds = { minX, minY, maxX, maxY };
  return bounds;
}

// lib/utils/debug.ts
import Debug from "debug";
var debug = Debug("schematic-viewer");
var enableDebug = () => {
  Debug.enable("schematic-viewer*");
};
var debug_default = debug;

// lib/components/SchematicViewer.tsx
import { useCallback as useCallback18, useEffect as useEffect30, useMemo as useMemo6, useRef as useRef24, useState as useState20 } from "react";
import {
  fromString,
  identity,
  toString as transformToString
} from "transformation-matrix";
import { useMouseMatrixTransform } from "use-mouse-matrix-transform";

// lib/hooks/use-resize-handling.ts
import { useEffect as useEffect4, useState } from "react";
var useResizeHandling = (containerRef) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  useEffect4(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      setContainerWidth(rect?.width || 0);
      setContainerHeight(rect?.height || 0);
    };
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);
  return { containerWidth, containerHeight };
};

// lib/hooks/useComponentDragging.ts
import { su as su4 } from "@tscircuit/soup-util";
import { useCallback, useEffect as useEffect5, useRef as useRef3, useState as useState2 } from "react";
import { compose as compose2 } from "transformation-matrix";
var debug2 = debug_default.extend("useComponentDragging");
var useComponentDragging = ({
  onEditEvent,
  editEvents = [],
  circuitJson,
  cancelDrag,
  svgToScreenProjection,
  realToSvgProjection,
  enabled = false,
  snapToGrid = false
}) => {
  const [activeEditEvent, setActiveEditEvent] = useState2(null);
  const realToScreenProjection = compose2(
    realToSvgProjection,
    svgToScreenProjection
  );
  const dragStartPosRef = useRef3(null);
  const activeEditEventRef = useRef3(null);
  const componentPositionsRef = useRef3(
    /* @__PURE__ */ new Map()
  );
  useEffect5(() => {
    editEvents.forEach((event) => {
      if ("edit_event_type" in event && event.edit_event_type === "edit_schematic_component_location" && !event.in_progress) {
        componentPositionsRef.current.set(event.schematic_component_id, {
          ...event.new_center
        });
      }
    });
  }, [editEvents]);
  const startDrag = useCallback(
    (clientX, clientY, target) => {
      if (!enabled) return false;
      const componentGroup = target.closest(
        '[data-circuit-json-type="schematic_component"]'
      );
      if (!componentGroup) return false;
      const schematic_component_id = componentGroup.getAttribute(
        "data-schematic-component-id"
      );
      if (!schematic_component_id) return false;
      if (cancelDrag) cancelDrag();
      const schematic_component = su4(circuitJson).schematic_component.get(
        schematic_component_id
      );
      if (!schematic_component) return false;
      dragStartPosRef.current = { x: clientX, y: clientY };
      let current_position;
      const trackedPosition = componentPositionsRef.current.get(
        schematic_component_id
      );
      if (trackedPosition) {
        current_position = { ...trackedPosition };
      } else {
        const editEventOffset = getComponentOffsetDueToEvents({
          editEvents,
          schematic_component_id
        });
        current_position = {
          x: schematic_component.center.x + editEventOffset.x,
          y: schematic_component.center.y + editEventOffset.y
        };
        componentPositionsRef.current.set(schematic_component_id, {
          ...current_position
        });
      }
      const newEditEvent = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_component_location",
        schematic_component_id,
        original_center: current_position,
        new_center: { ...current_position },
        in_progress: true,
        created_at: Date.now(),
        _element: componentGroup
      };
      activeEditEventRef.current = newEditEvent;
      setActiveEditEvent(newEditEvent);
      return true;
    },
    [cancelDrag, enabled, circuitJson, editEvents]
  );
  const handleMouseDown = useCallback(
    (e) => {
      startDrag(e.clientX, e.clientY, e.target);
    },
    [startDrag]
  );
  const handleTouchStart = useCallback(
    (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      if (startDrag(touch.clientX, touch.clientY, e.target)) {
        e.preventDefault();
      }
    },
    [startDrag]
  );
  const updateDragPosition = useCallback(
    (clientX, clientY) => {
      if (!activeEditEventRef.current || !dragStartPosRef.current) return;
      const screenDelta = {
        x: clientX - dragStartPosRef.current.x,
        y: clientY - dragStartPosRef.current.y
      };
      const mmDelta = {
        x: screenDelta.x / realToScreenProjection.a,
        y: screenDelta.y / realToScreenProjection.d
      };
      let newCenter = {
        x: activeEditEventRef.current.original_center.x + mmDelta.x,
        y: activeEditEventRef.current.original_center.y + mmDelta.y
      };
      if (snapToGrid) {
        const snap = (v) => Math.round(v * 10) / 10;
        newCenter = { x: snap(newCenter.x), y: snap(newCenter.y) };
      }
      const newEditEvent = {
        ...activeEditEventRef.current,
        new_center: newCenter
      };
      activeEditEventRef.current = newEditEvent;
      setActiveEditEvent(newEditEvent);
    },
    [realToScreenProjection, snapToGrid]
  );
  const handleMouseMove = useCallback(
    (e) => updateDragPosition(e.clientX, e.clientY),
    [updateDragPosition]
  );
  const handleTouchMove = useCallback(
    (e) => {
      if (e.touches.length !== 1 || !activeEditEventRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      updateDragPosition(touch.clientX, touch.clientY);
    },
    [updateDragPosition]
  );
  const endDrag = useCallback(() => {
    if (!activeEditEventRef.current) return;
    const finalEvent = {
      ...activeEditEventRef.current,
      in_progress: false
    };
    componentPositionsRef.current.set(finalEvent.schematic_component_id, {
      ...finalEvent.new_center
    });
    debug2("endDrag calling onEditEvent with new edit event", {
      newEditEvent: finalEvent
    });
    if (onEditEvent) onEditEvent(finalEvent);
    activeEditEventRef.current = null;
    dragStartPosRef.current = null;
    setActiveEditEvent(null);
  }, [onEditEvent]);
  const handleMouseUp = useCallback(() => endDrag(), [endDrag]);
  const handleTouchEnd = useCallback(() => endDrag(), [endDrag]);
  useEffect5(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);
  return {
    handleMouseDown,
    handleTouchStart,
    isDragging: !!activeEditEventRef.current,
    activeEditEvent
  };
};

// lib/utils/z-index-map.ts
var zIndexMap = {
  schematicEditIcon: 50,
  schematicGridIcon: 49,
  spiceSimulationIcon: 50,
  viewMenuIcon: 48,
  viewMenu: 55,
  viewMenuBackdrop: 54,
  clickToInteractOverlay: 100,
  schematicComponentHoverOutline: 47,
  schematicPortHoverOutline: 48
};

// lib/components/EditIcon.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var EditIcon = ({
  onClick,
  active
}) => {
  const handleInteraction = (e) => {
    e.preventDefault();
    onClick();
  };
  return /* @__PURE__ */ jsx(
    "div",
    {
      onClick: handleInteraction,
      onTouchEnd: handleInteraction,
      title: active ? "Disable edit mode" : "Enable edit mode",
      style: {
        position: "absolute",
        top: "16px",
        right: "64px",
        backgroundColor: active ? "#4CAF50" : "#fff",
        color: active ? "#fff" : "#000",
        padding: "8px",
        borderRadius: "4px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: zIndexMap.schematicEditIcon
      },
      children: /* @__PURE__ */ jsxs(
        "svg",
        {
          width: "16",
          height: "16",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          children: [
            /* @__PURE__ */ jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
            /* @__PURE__ */ jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })
          ]
        }
      )
    }
  );
};

// lib/components/GridIcon.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var GridIcon = ({
  onClick,
  active
}) => {
  const handleInteraction = (e) => {
    e.preventDefault();
    onClick();
  };
  return /* @__PURE__ */ jsx2(
    "div",
    {
      onClick: handleInteraction,
      onTouchEnd: handleInteraction,
      title: active ? "Hide grid" : "Show grid",
      style: {
        position: "absolute",
        top: "56px",
        right: "64px",
        backgroundColor: active ? "#4CAF50" : "#fff",
        color: active ? "#fff" : "#000",
        padding: "8px",
        borderRadius: "4px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: zIndexMap.schematicGridIcon
      },
      children: /* @__PURE__ */ jsx2(
        "svg",
        {
          width: "16",
          height: "16",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          children: /* @__PURE__ */ jsx2("path", { d: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" })
        }
      )
    }
  );
};

// lib/components/ViewMenuIcon.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var ViewMenuIcon = ({
  onClick,
  active
}) => {
  const handleInteraction = (e) => {
    e.preventDefault();
    onClick();
  };
  return /* @__PURE__ */ jsx3(
    "div",
    {
      onClick: handleInteraction,
      onTouchEnd: handleInteraction,
      title: active ? "Hide view menu" : "Show view menu",
      style: {
        position: "absolute",
        top: "16px",
        right: "16px",
        backgroundColor: active ? "#4CAF50" : "#fff",
        color: active ? "#fff" : "#000",
        padding: "8px",
        borderRadius: "4px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: zIndexMap.viewMenuIcon
      },
      children: /* @__PURE__ */ jsxs2(
        "svg",
        {
          width: "16",
          height: "16",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          children: [
            /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "12", r: "1" }),
            /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "5", r: "1" }),
            /* @__PURE__ */ jsx3("circle", { cx: "12", cy: "19", r: "1" })
          ]
        }
      )
    }
  );
};

// lib/components/ViewMenu.tsx
import { useMemo } from "react";
import { su as su5 } from "@tscircuit/soup-util";

// package.json
var package_default = {
  name: "@tscircuit/schematic-viewer",
  version: "2.0.58",
  main: "dist/index.js",
  type: "module",
  scripts: {
    start: "cosmos",
    "build:webworker": "tsup --config tsup-webworker.config.ts",
    "build:blob-url": "bun scripts/build-worker-blob-url.ts",
    build: "bun run build:webworker && bun run build:blob-url && tsup-node ./lib/index.ts --dts --format esm --sourcemap",
    "build:site": "cosmos-export",
    "vercel-build": "bun run build:webworker && bun run build:blob-url && bun run build:site",
    format: "biome format --write .",
    "format:check": "biome format ."
  },
  files: [
    "dist"
  ],
  devDependencies: {
    "@biomejs/biome": "^1.9.4",
    "@types/bun": "latest",
    "@types/debug": "^4.1.12",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "@types/recharts": "^2.0.1",
    "@vitejs/plugin-react": "^4.3.4",
    react: "^19.1.0",
    "react-cosmos": "^6.2.1",
    "react-cosmos-plugin-vite": "^6.2.0",
    "react-dom": "^19.1.0",
    "react-reconciler": "^0.31.0",
    semver: "^7.7.2",
    tscircuit: "^0.0.1528",
    tsup: "^8.3.5",
    vite: "^6.0.3"
  },
  peerDependencies: {
    typescript: "^5.0.0",
    tscircuit: "*"
  },
  dependencies: {
    "chart.js": "^4.5.0",
    "circuit-json-to-spice": "^0.0.30",
    debug: "^4.4.0",
    "performance-now": "^2.1.0",
    "react-chartjs-2": "^5.3.0",
    "use-mouse-matrix-transform": "^1.2.2"
  }
};

// lib/components/ViewMenu.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var ViewMenu = ({
  circuitJson,
  circuitJsonKey,
  isVisible,
  onClose,
  showGroups,
  onToggleGroups,
  showGrid,
  onToggleGrid
}) => {
  const hasGroups = useMemo(() => {
    if (!circuitJson || circuitJson.length === 0) return false;
    try {
      const sourceGroups = su5(circuitJson).source_group?.list() || [];
      if (sourceGroups.length > 0) return true;
      const schematicComponents = su5(circuitJson).schematic_component?.list() || [];
      if (schematicComponents.length > 1) {
        const componentTypes = /* @__PURE__ */ new Set();
        for (const comp of schematicComponents) {
          const sourceComp = su5(circuitJson).source_component.get(
            comp.source_component_id
          );
          if (sourceComp?.ftype) {
            componentTypes.add(sourceComp.ftype);
          }
        }
        return componentTypes.size > 1;
      }
      return false;
    } catch (error) {
      console.error("Error checking for groups:", error);
      return false;
    }
  }, [circuitJsonKey]);
  if (!isVisible) return null;
  return /* @__PURE__ */ jsxs3(Fragment, { children: [
    /* @__PURE__ */ jsx4(
      "div",
      {
        onClick: onClose,
        onTouchEnd: (e) => {
          e.preventDefault();
          onClose();
        },
        style: {
          position: "absolute",
          inset: 0,
          backgroundColor: "transparent",
          zIndex: zIndexMap.viewMenuBackdrop
        }
      }
    ),
    /* @__PURE__ */ jsxs3(
      "div",
      {
        style: {
          position: "absolute",
          top: "56px",
          right: "16px",
          backgroundColor: "#ffffff",
          color: "#000000",
          border: "1px solid #ccc",
          borderRadius: "4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          minWidth: "200px",
          zIndex: zIndexMap.viewMenu
        },
        children: [
          /* @__PURE__ */ jsxs3(
            "div",
            {
              onClick: () => {
                if (hasGroups) {
                  onToggleGroups(!showGroups);
                }
              },
              onTouchEnd: (e) => {
                e.preventDefault();
                if (hasGroups) {
                  onToggleGroups(!showGroups);
                }
              },
              style: {
                padding: "8px 12px",
                cursor: hasGroups ? "pointer" : "not-allowed",
                opacity: hasGroups ? 1 : 0.5,
                fontSize: "13px",
                color: "#000000",
                fontFamily: "sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              },
              onMouseEnter: (e) => {
                if (hasGroups) {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }
              },
              onMouseLeave: (e) => {
                if (hasGroups) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              },
              children: [
                /* @__PURE__ */ jsx4(
                  "div",
                  {
                    style: {
                      width: "16px",
                      height: "16px",
                      border: "2px solid #000",
                      borderRadius: "2px",
                      backgroundColor: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold"
                    },
                    children: showGroups && "\u2713"
                  }
                ),
                "View Schematic Groups"
              ]
            }
          ),
          !hasGroups && /* @__PURE__ */ jsx4(
            "div",
            {
              style: {
                padding: "8px 12px",
                fontSize: "11px",
                color: "#666",
                fontStyle: "italic"
              },
              children: "No groups found in this schematic"
            }
          ),
          /* @__PURE__ */ jsxs3(
            "div",
            {
              onClick: () => onToggleGrid(!showGrid),
              onTouchEnd: (e) => {
                e.preventDefault();
                onToggleGrid(!showGrid);
              },
              style: {
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "13px",
                color: "#000000",
                fontFamily: "sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.backgroundColor = "#f0f0f0";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              },
              children: [
                /* @__PURE__ */ jsx4(
                  "div",
                  {
                    style: {
                      width: "16px",
                      height: "16px",
                      border: "2px solid #000",
                      borderRadius: "2px",
                      backgroundColor: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold"
                    },
                    children: showGrid && "\u2713"
                  }
                ),
                "Show Grid"
              ]
            }
          ),
          /* @__PURE__ */ jsxs3(
            "div",
            {
              style: {
                padding: "4px 8px",
                fontSize: "12px",
                color: "#999",
                borderTop: "1px solid #eee",
                textAlign: "center"
              },
              children: [
                "v",
                String(package_default?.version)
              ]
            }
          )
        ]
      }
    )
  ] });
};

// lib/components/SpiceIcon.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
var SpiceIcon = () => /* @__PURE__ */ jsx5(
  "svg",
  {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    children: /* @__PURE__ */ jsx5("path", { d: "M3 12h2.5l2.5-9 4 18 4-9h5.5" })
  }
);

// lib/components/SpiceSimulationIcon.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
var SpiceSimulationIcon = ({
  onClick
}) => {
  return /* @__PURE__ */ jsx6(
    "div",
    {
      onClick,
      title: "Run SPICE simulation",
      style: {
        position: "absolute",
        top: "16px",
        right: "112px",
        backgroundColor: "#fff",
        color: "#000",
        padding: "8px",
        borderRadius: "4px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: zIndexMap.spiceSimulationIcon
      },
      children: /* @__PURE__ */ jsx6(SpiceIcon, {})
    }
  );
};

// lib/components/SpicePlot.tsx
import { useMemo as useMemo2 } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import { jsx as jsx7, jsxs as jsxs4 } from "react/jsx-runtime";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
var colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#387908"];
var formatTimeWithUnits = (seconds) => {
  if (seconds === 0) return "0s";
  const absSeconds = Math.abs(seconds);
  let unit = "s";
  let scale = 1;
  if (absSeconds < 1e-12) {
    unit = "fs";
    scale = 1e15;
  } else if (absSeconds < 1e-9) {
    unit = "ps";
    scale = 1e12;
  } else if (absSeconds < 1e-6) {
    unit = "ns";
    scale = 1e9;
  } else if (absSeconds < 1e-3) {
    unit = "us";
    scale = 1e6;
  } else if (absSeconds < 1) {
    unit = "ms";
    scale = 1e3;
  }
  return `${parseFloat((seconds * scale).toPrecision(3))}${unit}`;
};
var SpicePlot = ({
  plotData,
  nodes,
  isLoading,
  error,
  hasRun
}) => {
  const yAxisLabel = useMemo2(() => {
    const hasVoltage = nodes.some((n) => n.toLowerCase().startsWith("v("));
    const hasCurrent = nodes.some((n) => n.toLowerCase().startsWith("i("));
    if (hasVoltage && hasCurrent) return "Value";
    if (hasVoltage) return "Voltage (V)";
    if (hasCurrent) return "Current (A)";
    return "Value";
  }, [nodes]);
  if (isLoading) {
    return /* @__PURE__ */ jsx7(
      "div",
      {
        style: {
          height: "300px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: "Running simulation..."
      }
    );
  }
  if (!hasRun) {
    return /* @__PURE__ */ jsx7(
      "div",
      {
        style: {
          height: "300px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: 'Click "Run" to start the simulation.'
      }
    );
  }
  if (error) {
    return /* @__PURE__ */ jsxs4(
      "div",
      {
        style: {
          height: "300px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "red"
        },
        children: [
          "Error: ",
          error
        ]
      }
    );
  }
  if (plotData.length === 0) {
    return /* @__PURE__ */ jsx7(
      "div",
      {
        style: {
          height: "300px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        },
        children: "No data to plot. Check simulation output or SPICE netlist."
      }
    );
  }
  const chartData = {
    datasets: nodes.map((node, i) => ({
      label: node,
      data: plotData.map((p) => ({
        x: Number(p.name),
        y: p[node]
      })),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length],
      fill: false,
      tension: 0.1
    }))
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            family: "sans-serif"
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => {
            if (tooltipItems.length > 0) {
              const item = tooltipItems[0];
              return formatTimeWithUnits(item.parsed.x);
            }
            return "";
          }
        }
      }
    },
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: "Time",
          font: {
            family: "sans-serif"
          }
        },
        ticks: {
          callback: (value) => formatTimeWithUnits(value),
          font: {
            family: "sans-serif"
          }
        }
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
          font: {
            family: "sans-serif"
          }
        },
        ticks: {
          font: {
            family: "sans-serif"
          }
        }
      }
    }
  };
  return /* @__PURE__ */ jsx7("div", { style: { position: "relative", height: "300px", width: "100%" }, children: /* @__PURE__ */ jsx7(Line, { options, data: chartData }) });
};

// lib/components/SpiceSimulationOverlay.tsx
import { useEffect as useEffect6, useState as useState3 } from "react";
import { jsx as jsx8, jsxs as jsxs5 } from "react/jsx-runtime";
var SpiceSimulationOverlay = ({
  spiceString,
  onClose,
  plotData,
  nodes,
  isLoading,
  error,
  simOptions,
  onSimOptionsChange,
  hasRun
}) => {
  const [startTimeDraft, setStartTimeDraft] = useState3(
    String(simOptions.startTime)
  );
  const [durationDraft, setDurationDraft] = useState3(
    String(simOptions.duration)
  );
  useEffect6(() => {
    setStartTimeDraft(String(simOptions.startTime));
    setDurationDraft(String(simOptions.duration));
  }, [simOptions.startTime, simOptions.duration]);
  const handleRerun = () => {
    onSimOptionsChange({
      ...simOptions,
      startTime: Number(startTimeDraft),
      duration: Number(durationDraft)
    });
  };
  const filteredNodes = nodes.filter((node) => {
    const isVoltage = node.toLowerCase().startsWith("v(");
    const isCurrent = node.toLowerCase().startsWith("i(");
    if (simOptions.showVoltage && isVoltage) return true;
    if (simOptions.showCurrent && isCurrent) return true;
    return false;
  });
  return /* @__PURE__ */ jsx8(
    "div",
    {
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1002,
        fontFamily: "sans-serif"
      },
      children: /* @__PURE__ */ jsxs5(
        "div",
        {
          style: {
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "900px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
          },
          children: [
            /* @__PURE__ */ jsxs5(
              "div",
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "16px"
                },
                children: [
                  /* @__PURE__ */ jsx8(
                    "h2",
                    {
                      style: {
                        margin: 0,
                        fontSize: "22px",
                        fontWeight: 600,
                        color: "#333"
                      },
                      children: "SPICE Simulation"
                    }
                  ),
                  /* @__PURE__ */ jsx8(
                    "button",
                    {
                      onClick: onClose,
                      style: {
                        background: "none",
                        border: "none",
                        fontSize: "28px",
                        cursor: "pointer",
                        color: "#888",
                        padding: 0,
                        lineHeight: 1
                      },
                      children: "\xD7"
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsx8("div", { children: /* @__PURE__ */ jsx8(
              SpicePlot,
              {
                plotData,
                nodes: filteredNodes,
                isLoading,
                error,
                hasRun
              }
            ) }),
            /* @__PURE__ */ jsxs5(
              "div",
              {
                style: {
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#f7f7f7",
                  borderRadius: "6px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "24px",
                  alignItems: "center",
                  fontSize: "14px"
                },
                children: [
                  /* @__PURE__ */ jsxs5("div", { style: { display: "flex", gap: "16px" }, children: [
                    /* @__PURE__ */ jsxs5(
                      "label",
                      {
                        style: { display: "flex", alignItems: "center", gap: "6px" },
                        children: [
                          /* @__PURE__ */ jsx8(
                            "input",
                            {
                              type: "checkbox",
                              checked: simOptions.showVoltage,
                              onChange: (e) => onSimOptionsChange({
                                ...simOptions,
                                showVoltage: e.target.checked
                              })
                            }
                          ),
                          "Voltage"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs5(
                      "label",
                      {
                        style: { display: "flex", alignItems: "center", gap: "6px" },
                        children: [
                          /* @__PURE__ */ jsx8(
                            "input",
                            {
                              type: "checkbox",
                              checked: simOptions.showCurrent,
                              onChange: (e) => onSimOptionsChange({
                                ...simOptions,
                                showCurrent: e.target.checked
                              })
                            }
                          ),
                          "Current"
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs5("div", { style: { display: "flex", gap: "16px", alignItems: "center" }, children: [
                    /* @__PURE__ */ jsx8("label", { htmlFor: "startTime", children: "Start Time (ms):" }),
                    /* @__PURE__ */ jsx8(
                      "input",
                      {
                        id: "startTime",
                        type: "number",
                        value: startTimeDraft,
                        onChange: (e) => setStartTimeDraft(e.target.value),
                        style: {
                          width: "80px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc"
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx8("label", { htmlFor: "duration", children: "Duration (ms):" }),
                    /* @__PURE__ */ jsx8(
                      "input",
                      {
                        id: "duration",
                        type: "number",
                        value: durationDraft,
                        onChange: (e) => setDurationDraft(e.target.value),
                        style: {
                          width: "80px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc"
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx8(
                      "button",
                      {
                        onClick: handleRerun,
                        style: {
                          padding: "4px 12px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          backgroundColor: "#f0f0f0",
                          cursor: "pointer"
                        },
                        children: hasRun ? "Rerun" : "Run"
                      }
                    )
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxs5("div", { style: { marginTop: "24px" }, children: [
              /* @__PURE__ */ jsx8(
                "h3",
                {
                  style: {
                    marginTop: 0,
                    marginBottom: "12px",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#333"
                  },
                  children: "SPICE Netlist"
                }
              ),
              /* @__PURE__ */ jsx8(
                "pre",
                {
                  style: {
                    backgroundColor: "#fafafa",
                    padding: "16px",
                    borderRadius: "6px",
                    maxHeight: "150px",
                    overflowY: "auto",
                    border: "1px solid #eee",
                    color: "#333",
                    fontSize: "13px",
                    fontFamily: "monospace"
                  },
                  children: spiceString
                }
              )
            ] })
          ]
        }
      )
    }
  );
};

// lib/hooks/useSpiceSimulation.ts
import { useState as useState4, useEffect as useEffect7 } from "react";

// lib/workers/spice-simulation.worker.blob.js
var b64 = "dmFyIGU9bnVsbCxzPWFzeW5jKCk9Pihhd2FpdCBpbXBvcnQoImh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vZWVjaXJjdWl0LWVuZ2luZUAxLjUuMi8rZXNtIikpLlNpbXVsYXRpb24sYz1hc3luYygpPT57aWYoZSYmZS5pc0luaXRpYWxpemVkKCkpcmV0dXJuO2xldCBpPWF3YWl0IHMoKTtlPW5ldyBpLGF3YWl0IGUuc3RhcnQoKX07c2VsZi5vbm1lc3NhZ2U9YXN5bmMgaT0+e3RyeXtpZihhd2FpdCBjKCksIWUpdGhyb3cgbmV3IEVycm9yKCJTaW11bGF0aW9uIG5vdCBpbml0aWFsaXplZCIpO2xldCB0PWkuZGF0YS5zcGljZVN0cmluZyxhPXQubWF0Y2goL3dyZGF0YVxzKyhcUyspXHMrKC4qKS9pKTtpZihhKXtsZXQgbz1gLnByb2JlICR7YVsyXS50cmltKCkuc3BsaXQoL1xzKy8pLmpvaW4oIiAiKX1gO3Q9dC5yZXBsYWNlKC93cmRhdGEuKi9pLG8pfWVsc2UgaWYoIXQubWF0Y2goL1wucHJvYmUvaSkpdGhyb3cgdC5tYXRjaCgvcGxvdFxzKyguKikvaSk/bmV3IEVycm9yKCJUaGUgJ3Bsb3QnIGNvbW1hbmQgaXMgbm90IHN1cHBvcnRlZCBmb3IgZGF0YSBleHRyYWN0aW9uLiBQbGVhc2UgdXNlICd3cmRhdGEgPGZpbGVuYW1lPiA8dmFyMT4gLi4uJyBvciAnLnByb2JlIDx2YXIxPiAuLi4nIGluc3RlYWQuIik6bmV3IEVycm9yKCJObyAnLnByb2JlJyBvciAnd3JkYXRhJyBjb21tYW5kIGZvdW5kIGluIFNQSUNFIGZpbGUuIFVzZSAnd3JkYXRhIDxmaWxlbmFtZT4gPHZhcjE+IC4uLicgdG8gc3BlY2lmeSBvdXRwdXQuIik7ZS5zZXROZXRMaXN0KHQpO2xldCBuPWF3YWl0IGUucnVuU2ltKCk7c2VsZi5wb3N0TWVzc2FnZSh7dHlwZToicmVzdWx0IixyZXN1bHQ6bn0pfWNhdGNoKHQpe3NlbGYucG9zdE1lc3NhZ2Uoe3R5cGU6ImVycm9yIixlcnJvcjp0Lm1lc3NhZ2V9KX19Owo=";
var blobUrl = null;
var getSpiceSimulationWorkerBlobUrl = () => {
  if (typeof window === "undefined") return null;
  if (blobUrl) return blobUrl;
  try {
    const blob = new Blob([atob(b64)], { type: "application/javascript" });
    blobUrl = URL.createObjectURL(blob);
    return blobUrl;
  } catch (e) {
    console.error("Failed to create blob URL for worker", e);
    return null;
  }
};

// lib/hooks/useSpiceSimulation.ts
var parseEecEngineOutput = (result) => {
  const columnData = {};
  if (result.dataType === "real") {
    result.data.forEach((col) => {
      columnData[col.name] = col.values;
    });
  } else if (result.dataType === "complex") {
    result.data.forEach((col) => {
      columnData[col.name] = col.values.map((v) => v.real);
    });
  } else {
    throw new Error("Unsupported data type in simulation result");
  }
  const timeKey = Object.keys(columnData).find(
    (k) => k.toLowerCase() === "time" || k.toLowerCase() === "frequency"
  );
  if (!timeKey) {
    throw new Error("No time or frequency data in simulation result");
  }
  const timeValues = columnData[timeKey];
  const probedVariables = Object.keys(columnData).filter((k) => k !== timeKey);
  const plotableNodes = probedVariables;
  const plotData = timeValues.map((t, i) => {
    const point = { name: t.toExponential(2) };
    probedVariables.forEach((variable) => {
      point[variable] = columnData[variable][i];
    });
    return point;
  });
  return { plotData, nodes: plotableNodes };
};
var useSpiceSimulation = (spiceString) => {
  const [plotData, setPlotData] = useState4([]);
  const [nodes, setNodes] = useState4([]);
  const [isLoading, setIsLoading] = useState4(true);
  const [error, setError] = useState4(null);
  useEffect7(() => {
    if (!spiceString) {
      setIsLoading(false);
      setPlotData([]);
      setNodes([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setPlotData([]);
    setNodes([]);
    const workerUrl = getSpiceSimulationWorkerBlobUrl();
    if (!workerUrl) {
      setError("Could not create SPICE simulation worker.");
      setIsLoading(false);
      return;
    }
    const worker = new Worker(workerUrl, { type: "module" });
    worker.onmessage = (event) => {
      if (event.data.type === "result") {
        try {
          const { plotData: parsedData, nodes: parsedNodes } = parseEecEngineOutput(event.data.result);
          setPlotData(parsedData);
          setNodes(parsedNodes);
        } catch (e) {
          setError(e.message || "Failed to parse simulation result");
          console.error(e);
        }
      } else if (event.data.type === "error") {
        setError(event.data.error);
      }
      setIsLoading(false);
    };
    worker.onerror = (err) => {
      setError(err.message);
      setIsLoading(false);
    };
    worker.postMessage({ spiceString });
    return () => {
      worker.terminate();
    };
  }, [spiceString]);
  return { plotData, nodes, isLoading, error };
};

// lib/utils/spice-utils.ts
import { circuitJsonToSpice } from "circuit-json-to-spice";
var formatSimTime = (seconds) => {
  if (seconds === 0) return "0";
  const absSeconds = Math.abs(seconds);
  const precision = (v) => v.toPrecision(4);
  if (absSeconds >= 1) return precision(seconds);
  if (absSeconds >= 1e-3) return `${precision(seconds * 1e3)}m`;
  if (absSeconds >= 1e-6) return `${precision(seconds * 1e6)}u`;
  if (absSeconds >= 1e-9) return `${precision(seconds * 1e9)}n`;
  if (absSeconds >= 1e-12) return `${precision(seconds * 1e12)}p`;
  if (absSeconds >= 1e-15) return `${precision(seconds * 1e15)}f`;
  return seconds.toExponential(3);
};
var getSpiceFromCircuitJson = (circuitJson, options) => {
  const spiceNetlist = circuitJsonToSpice(circuitJson);
  const baseSpiceString = spiceNetlist.toSpiceString();
  const lines = baseSpiceString.split("\n").filter((l) => l.trim() !== "");
  const componentLines = lines.filter(
    (l) => !l.startsWith("*") && !l.startsWith(".") && l.trim() !== ""
  );
  const allNodes = /* @__PURE__ */ new Set();
  const capacitorNodes = /* @__PURE__ */ new Set();
  const componentNamesToProbeCurrent = /* @__PURE__ */ new Set();
  for (const line of componentLines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;
    const componentName = parts[0];
    const componentType = componentName[0].toUpperCase();
    let nodesOnLine = [];
    if (["R", "C", "L", "V", "I", "D"].includes(componentType)) {
      nodesOnLine = parts.slice(1, 3);
      if (componentType === "V") {
        componentNamesToProbeCurrent.add(componentName);
      }
    } else if (componentType === "Q" && parts.length >= 4) {
      nodesOnLine = parts.slice(1, 4);
    } else if (componentType === "M" && parts.length >= 5) {
      nodesOnLine = parts.slice(1, 5);
    } else if (componentType === "X") {
      nodesOnLine = parts.slice(1, -1);
    } else {
      continue;
    }
    nodesOnLine.forEach((node) => allNodes.add(node));
    if (componentType === "C") {
      nodesOnLine.forEach((node) => capacitorNodes.add(node));
    }
  }
  allNodes.delete("0");
  capacitorNodes.delete("0");
  const icLines = Array.from(capacitorNodes).map((node) => `.ic V(${node})=0`);
  const probes = [];
  const probeVoltages = Array.from(allNodes).map((node) => `V(${node})`);
  probes.push(...probeVoltages);
  const probeCurrents = Array.from(componentNamesToProbeCurrent).map(
    (name) => `I(${name})`
  );
  probes.push(...probeCurrents);
  const probeLine = probes.length > 0 ? `.probe ${probes.join(" ")}` : "";
  const tstart_ms = options?.startTime ?? 0;
  const duration_ms = options?.duration ?? 20;
  const tstart = tstart_ms * 1e-3;
  const duration = duration_ms * 1e-3;
  const tstop = tstart + duration;
  const tstep = duration / 50;
  const tranLine = `.tran ${formatSimTime(tstep)} ${formatSimTime(
    tstop
  )} ${formatSimTime(tstart)} UIC`;
  const endStatement = ".end";
  const originalLines = baseSpiceString.split("\n");
  let endIndex = -1;
  for (let i = originalLines.length - 1; i >= 0; i--) {
    if (originalLines[i].trim().toLowerCase().startsWith(endStatement)) {
      endIndex = i;
      break;
    }
  }
  const injectionLines = [...icLines, probeLine, tranLine].filter(Boolean);
  let finalLines;
  if (endIndex !== -1) {
    const beforeEnd = originalLines.slice(0, endIndex);
    const endLineAndAfter = originalLines.slice(endIndex);
    finalLines = [...beforeEnd, ...injectionLines, ...endLineAndAfter];
  } else {
    finalLines = [...originalLines, ...injectionLines, endStatement];
  }
  return finalLines.join("\n");
};

// lib/hooks/useLocalStorage.ts
import { useCallback as useCallback2 } from "react";
var getStoredBoolean = (key, defaultValue) => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};
var setStoredBoolean = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
};
var spacePanHeld = false;
var isSpacePanHeld = () => spacePanHeld;
var setSpacePanHeld = (held) => {
  spacePanHeld = held;
};

// lib/components/MouseTracker.tsx
import {
  createContext,
  useCallback as useCallback3,
  useContext,
  useEffect as useEffect8,
  useMemo as useMemo3,
  useRef as useRef4
} from "react";
import { Fragment as Fragment2, jsx as jsx9 } from "react/jsx-runtime";
var MouseTrackerContext = createContext(null);
var DRAG_THRESHOLD_PX = 5;
var boundsAreEqual = (a, b) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.minX === b.minX && a.maxX === b.maxX && a.minY === b.minY && a.maxY === b.maxY;
};
var MouseTracker = ({ children }) => {
  const existingContext = useContext(MouseTrackerContext);
  if (existingContext) {
    return /* @__PURE__ */ jsx9(Fragment2, { children });
  }
  const storeRef = useRef4({
    pointer: null,
    boundingBoxes: /* @__PURE__ */ new Map(),
    hoveringIds: /* @__PURE__ */ new Set(),
    subscribers: /* @__PURE__ */ new Set(),
    mouseDownPosition: null
  });
  const notifySubscribers = useCallback3(() => {
    for (const callback of storeRef.current.subscribers) {
      callback();
    }
  }, []);
  const updateHovering = useCallback3(() => {
    const pointer = storeRef.current.pointer;
    const newHovering = /* @__PURE__ */ new Set();
    if (pointer) {
      for (const [id, registration] of storeRef.current.boundingBoxes) {
        const bounds = registration.bounds;
        if (!bounds) continue;
        if (pointer.x >= bounds.minX && pointer.x <= bounds.maxX && pointer.y >= bounds.minY && pointer.y <= bounds.maxY) {
          newHovering.add(id);
        }
      }
    }
    const prevHovering = storeRef.current.hoveringIds;
    if (newHovering.size === prevHovering.size && [...newHovering].every((id) => prevHovering.has(id))) {
      return;
    }
    storeRef.current.hoveringIds = newHovering;
    notifySubscribers();
  }, [notifySubscribers]);
  const registerBoundingBox = useCallback3(
    (id, registration) => {
      storeRef.current.boundingBoxes.set(id, registration);
      updateHovering();
    },
    [updateHovering]
  );
  const updateBoundingBox = useCallback3(
    (id, registration) => {
      const existing = storeRef.current.boundingBoxes.get(id);
      if (existing && boundsAreEqual(existing.bounds, registration.bounds) && existing.onClick === registration.onClick) {
        return;
      }
      storeRef.current.boundingBoxes.set(id, registration);
      updateHovering();
    },
    [updateHovering]
  );
  const unregisterBoundingBox = useCallback3(
    (id) => {
      const removed = storeRef.current.boundingBoxes.delete(id);
      if (removed) {
        updateHovering();
      }
    },
    [updateHovering]
  );
  const subscribe = useCallback3((listener) => {
    storeRef.current.subscribers.add(listener);
    return () => {
      storeRef.current.subscribers.delete(listener);
    };
  }, []);
  const isHovering = useCallback3((id) => {
    return storeRef.current.hoveringIds.has(id);
  }, []);
  useEffect8(() => {
    const handlePointerPosition = (event) => {
      const { clientX, clientY } = event;
      const pointer = storeRef.current.pointer;
      if (pointer && pointer.x === clientX && pointer.y === clientY) {
        return;
      }
      storeRef.current.pointer = { x: clientX, y: clientY };
      updateHovering();
    };
    const handlePointerLeave = () => {
      if (storeRef.current.pointer === null) return;
      storeRef.current.pointer = null;
      storeRef.current.mouseDownPosition = null;
      updateHovering();
    };
    const handleMouseDown = (event) => {
      storeRef.current.mouseDownPosition = {
        x: event.clientX,
        y: event.clientY
      };
    };
    const handleClick = (event) => {
      const { clientX, clientY } = event;
      const mouseDownPos = storeRef.current.mouseDownPosition;
      if (mouseDownPos) {
        const distance = Math.sqrt(
          Math.pow(clientX - mouseDownPos.x, 2) + Math.pow(clientY - mouseDownPos.y, 2)
        );
        if (distance > DRAG_THRESHOLD_PX) {
          storeRef.current.mouseDownPosition = null;
          return;
        }
      }
      storeRef.current.mouseDownPosition = null;
      for (const registration of storeRef.current.boundingBoxes.values()) {
        const bounds = registration.bounds;
        if (!bounds) continue;
        if (clientX >= bounds.minX && clientX <= bounds.maxX && clientY >= bounds.minY && clientY <= bounds.maxY) {
          registration.onClick?.(event);
        }
      }
    };
    window.addEventListener("pointermove", handlePointerPosition, {
      passive: true
    });
    window.addEventListener("pointerdown", handlePointerPosition, {
      passive: true
    });
    window.addEventListener("pointerup", handlePointerPosition, {
      passive: true
    });
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("pointercancel", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerPosition);
      window.removeEventListener("pointerdown", handlePointerPosition);
      window.removeEventListener("pointerup", handlePointerPosition);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointercancel", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("click", handleClick);
    };
  }, [updateHovering]);
  const value = useMemo3(
    () => ({
      registerBoundingBox,
      updateBoundingBox,
      unregisterBoundingBox,
      subscribe,
      isHovering
    }),
    [
      registerBoundingBox,
      updateBoundingBox,
      unregisterBoundingBox,
      subscribe,
      isHovering
    ]
  );
  return /* @__PURE__ */ jsx9(MouseTrackerContext.Provider, { value, children });
};

// lib/components/SchematicComponentMouseTarget.tsx
import { useCallback as useCallback4, useEffect as useEffect10, useRef as useRef6, useState as useState5 } from "react";

// lib/hooks/useMouseEventsOverBoundingBox.ts
import {
  useContext as useContext2,
  useEffect as useEffect9,
  useId,
  useMemo as useMemo4,
  useRef as useRef5,
  useSyncExternalStore
} from "react";
var useMouseEventsOverBoundingBox = (options) => {
  const context = useContext2(MouseTrackerContext);
  if (!context) {
    throw new Error(
      "useMouseEventsOverBoundingBox must be used within a MouseTracker"
    );
  }
  const id = useId();
  const latestOptionsRef = useRef5(options);
  latestOptionsRef.current = options;
  const handleClick = useMemo4(
    () => (event) => {
      latestOptionsRef.current.onClick?.(event);
    },
    []
  );
  useEffect9(() => {
    context.registerBoundingBox(id, {
      bounds: latestOptionsRef.current.bounds,
      onClick: latestOptionsRef.current.onClick ? handleClick : void 0
    });
    return () => {
      context.unregisterBoundingBox(id);
    };
  }, [context, handleClick, id]);
  useEffect9(() => {
    context.updateBoundingBox(id, {
      bounds: latestOptionsRef.current.bounds,
      onClick: latestOptionsRef.current.onClick ? handleClick : void 0
    });
  }, [
    context,
    handleClick,
    id,
    options.bounds?.minX,
    options.bounds?.maxX,
    options.bounds?.minY,
    options.bounds?.maxY,
    options.onClick
  ]);
  const hovering = useSyncExternalStore(
    context.subscribe,
    () => context.isHovering(id),
    () => false
  );
  return { hovering };
};

// lib/components/SchematicComponentMouseTarget.tsx
import { jsx as jsx10 } from "react/jsx-runtime";
var areMeasurementsEqual = (a, b) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return Math.abs(a.bounds.minX - b.bounds.minX) < 0.5 && Math.abs(a.bounds.maxX - b.bounds.maxX) < 0.5 && Math.abs(a.bounds.minY - b.bounds.minY) < 0.5 && Math.abs(a.bounds.maxY - b.bounds.maxY) < 0.5 && Math.abs(a.rect.left - b.rect.left) < 0.5 && Math.abs(a.rect.top - b.rect.top) < 0.5 && Math.abs(a.rect.width - b.rect.width) < 0.5 && Math.abs(a.rect.height - b.rect.height) < 0.5;
};
var SchematicComponentMouseTarget = ({
  componentId,
  svgDivRef,
  containerRef,
  onComponentClick,
  onHoverChange,
  showOutline,
  circuitJsonKey
}) => {
  const [measurement, setMeasurement] = useState5(null);
  const frameRef = useRef6(null);
  const measure = useCallback4(() => {
    frameRef.current = null;
    const svgDiv = svgDivRef.current;
    const container = containerRef.current;
    if (!svgDiv || !container) {
      setMeasurement((prev) => prev ? null : prev);
      return;
    }
    const element = svgDiv.querySelector(
      `[data-schematic-component-id="${componentId}"]`
    );
    if (!element) {
      setMeasurement((prev) => prev ? null : prev);
      return;
    }
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const nextMeasurement = {
      bounds: {
        minX: elementRect.left,
        maxX: elementRect.right,
        minY: elementRect.top,
        maxY: elementRect.bottom
      },
      rect: {
        left: elementRect.left - containerRect.left,
        top: elementRect.top - containerRect.top,
        width: elementRect.width,
        height: elementRect.height
      }
    };
    setMeasurement(
      (prev) => areMeasurementsEqual(prev, nextMeasurement) ? prev : nextMeasurement
    );
  }, [componentId, containerRef, svgDivRef]);
  const scheduleMeasure = useCallback4(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(measure);
  }, [measure]);
  useEffect10(() => {
    scheduleMeasure();
  }, [scheduleMeasure, circuitJsonKey]);
  useEffect10(() => {
    scheduleMeasure();
    const svgDiv = svgDivRef.current;
    const container = containerRef.current;
    if (!svgDiv || !container) return;
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      scheduleMeasure();
    }) : null;
    resizeObserver?.observe(container);
    resizeObserver?.observe(svgDiv);
    const mutationObserver = typeof MutationObserver !== "undefined" ? new MutationObserver(() => {
      scheduleMeasure();
    }) : null;
    mutationObserver?.observe(svgDiv, {
      attributes: true,
      attributeFilter: ["style", "transform"],
      subtree: true,
      childList: true
    });
    window.addEventListener("scroll", scheduleMeasure, true);
    window.addEventListener("resize", scheduleMeasure);
    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.removeEventListener("resize", scheduleMeasure);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [scheduleMeasure, svgDivRef, containerRef]);
  const handleClick = useCallback4(
    (event) => {
      if (onComponentClick) {
        onComponentClick(componentId, event);
      }
    },
    [componentId, onComponentClick]
  );
  const bounds = measurement?.bounds ?? null;
  const { hovering } = useMouseEventsOverBoundingBox({
    bounds,
    onClick: onComponentClick ? handleClick : void 0
  });
  useEffect10(() => {
    if (onHoverChange) {
      onHoverChange(componentId, hovering);
    }
  }, [hovering, componentId, onHoverChange]);
  if (!measurement || !hovering || !showOutline) {
    return null;
  }
  const rect = measurement.rect;
  return /* @__PURE__ */ jsx10(
    "div",
    {
      style: {
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        border: "1.5px solid rgba(51, 153, 255, 0.9)",
        pointerEvents: "none",
        zIndex: zIndexMap.schematicComponentHoverOutline
      }
    }
  );
};

// lib/components/SchematicPortMouseTarget.tsx
import { useCallback as useCallback5, useEffect as useEffect11, useRef as useRef7, useState as useState6 } from "react";
import { Fragment as Fragment3, jsx as jsx11, jsxs as jsxs6 } from "react/jsx-runtime";
var areMeasurementsEqual2 = (a, b) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return Math.abs(a.bounds.minX - b.bounds.minX) < 0.5 && Math.abs(a.bounds.maxX - b.bounds.maxX) < 0.5 && Math.abs(a.bounds.minY - b.bounds.minY) < 0.5 && Math.abs(a.bounds.maxY - b.bounds.maxY) < 0.5 && Math.abs(a.rect.left - b.rect.left) < 0.5 && Math.abs(a.rect.top - b.rect.top) < 0.5 && Math.abs(a.rect.width - b.rect.width) < 0.5 && Math.abs(a.rect.height - b.rect.height) < 0.5;
};
var SchematicPortMouseTarget = ({
  portId,
  portLabel,
  svgDivRef,
  containerRef,
  onPortClick,
  onPortMouseDown,
  onHoverChange,
  showOutline,
  interactive = false,
  hitPaddingPx = 4,
  circuitJsonKey
}) => {
  const [measurement, setMeasurement] = useState6(null);
  const frameRef = useRef7(null);
  const measure = useCallback5(() => {
    frameRef.current = null;
    const svgDiv = svgDivRef.current;
    const container = containerRef.current;
    if (!svgDiv || !container) {
      setMeasurement((prev) => prev ? null : prev);
      return;
    }
    const element = svgDiv.querySelector(
      `[data-schematic-port-id="${portId}"]`
    );
    if (!element) {
      setMeasurement((prev) => prev ? null : prev);
      return;
    }
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const padding = hitPaddingPx;
    const nextMeasurement = {
      bounds: {
        minX: elementRect.left - padding,
        maxX: elementRect.right + padding,
        minY: elementRect.top - padding,
        maxY: elementRect.bottom + padding
      },
      rect: {
        left: elementRect.left - containerRect.left - padding,
        top: elementRect.top - containerRect.top - padding,
        width: elementRect.width + padding * 2,
        height: elementRect.height + padding * 2
      }
    };
    setMeasurement(
      (prev) => areMeasurementsEqual2(prev, nextMeasurement) ? prev : nextMeasurement
    );
  }, [portId, containerRef, svgDivRef, hitPaddingPx]);
  const scheduleMeasure = useCallback5(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(measure);
  }, [measure]);
  useEffect11(() => {
    scheduleMeasure();
  }, [scheduleMeasure, circuitJsonKey]);
  useEffect11(() => {
    scheduleMeasure();
    const svgDiv = svgDivRef.current;
    const container = containerRef.current;
    if (!svgDiv || !container) return;
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      scheduleMeasure();
    }) : null;
    resizeObserver?.observe(container);
    resizeObserver?.observe(svgDiv);
    const mutationObserver = typeof MutationObserver !== "undefined" ? new MutationObserver(() => {
      scheduleMeasure();
    }) : null;
    mutationObserver?.observe(svgDiv, {
      attributes: true,
      attributeFilter: ["style", "transform"],
      subtree: true,
      childList: true
    });
    window.addEventListener("scroll", scheduleMeasure, true);
    window.addEventListener("resize", scheduleMeasure);
    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.removeEventListener("resize", scheduleMeasure);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [scheduleMeasure, svgDivRef, containerRef]);
  const handleClick = useCallback5(
    (event) => {
      if (onPortClick) {
        onPortClick(portId, event);
      }
    },
    [portId, onPortClick]
  );
  const bounds = measurement?.bounds ?? null;
  const { hovering } = useMouseEventsOverBoundingBox({
    bounds,
    onClick: onPortClick ? handleClick : void 0
  });
  useEffect11(() => {
    if (onHoverChange) {
      onHoverChange(portId, hovering);
    }
  }, [hovering, portId, onHoverChange]);
  if (!measurement || !showOutline) {
    return null;
  }
  const rect = measurement.rect;
  return /* @__PURE__ */ jsxs6(Fragment3, { children: [
    /* @__PURE__ */ jsx11(
      "div",
      {
        onMouseDown: interactive && onPortMouseDown ? (e) => {
          e.preventDefault();
          e.stopPropagation();
          onPortMouseDown(portId, e.nativeEvent);
        } : void 0,
        style: {
          position: "absolute",
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          border: hovering ? "1.5px solid rgba(255, 153, 51, 0.9)" : "1.5px solid rgba(255, 153, 51, 0.3)",
          backgroundColor: hovering ? "rgba(255, 153, 51, 0.15)" : "rgba(255, 153, 51, 0.05)",
          borderRadius: "50%",
          pointerEvents: interactive ? "auto" : "none",
          cursor: interactive ? "crosshair" : void 0,
          zIndex: zIndexMap.schematicPortHoverOutline,
          transition: "border-color 0.15s, background-color 0.15s"
        }
      }
    ),
    hovering && portLabel && /* @__PURE__ */ jsx11(
      "div",
      {
        style: {
          position: "absolute",
          left: rect.left + rect.width / 2,
          top: rect.top - 24,
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          fontFamily: "monospace",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: zIndexMap.schematicPortHoverOutline + 1
        },
        children: portLabel
      }
    )
  ] });
};

// lib/hooks/useWireDrawing.ts
import { useCallback as useCallback6, useEffect as useEffect12, useRef as useRef8, useState as useState7 } from "react";
import "transformation-matrix";

// lib/utils/isMouseCaptureIgnoredTarget.ts
function isMouseCaptureIgnoredTarget(target) {
  const el = target;
  if (!el) return false;
  return Boolean(
    el.closest(
      "[data-schematic-ignore-mouse-capture], input, textarea, select, option"
    )
  );
}

// lib/utils/schematicPortHitTest.ts
import { compose as compose3 } from "transformation-matrix";
var SCHEMATIC_PORT_HIT_RADIUS_PX = 36;
function resolveSchematicPortId(circuitJson, portId) {
  const bySchematic = circuitJson.find(
    (el) => el.type === "schematic_port" && el.schematic_port_id === portId
  );
  if (bySchematic) return portId;
  const bySource = circuitJson.find(
    (el) => el.type === "schematic_port" && el.source_port_id === portId
  );
  return bySource?.schematic_port_id ?? null;
}
function createScreenToReal(svgToScreenProjection, realToSvgProjection, containerRef) {
  return (screenX, screenY) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const localX = screenX - rect.left;
    const localY = screenY - rect.top;
    const realToScreen = compose3(svgToScreenProjection, realToSvgProjection);
    return {
      x: (localX - realToScreen.e) / realToScreen.a,
      y: (localY - realToScreen.f) / realToScreen.d
    };
  };
}
function getSchematicPortCenter(circuitJson, container, schematicPortId, screenToReal) {
  const port = circuitJson.find(
    (el2) => el2.type === "schematic_port" && el2.schematic_port_id === schematicPortId
  );
  if (port?.center) {
    return { x: port.center.x, y: port.center.y };
  }
  if (!container) return null;
  const el = container.querySelector(
    `[data-schematic-port-id="${schematicPortId}"]`
  );
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return screenToReal(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );
}
function getSchematicPortAtScreen(container, circuitJson, screenX, screenY, hitRadiusPx = SCHEMATIC_PORT_HIT_RADIUS_PX) {
  if (!container) return null;
  let closest = null;
  for (const node of container.querySelectorAll("[data-schematic-port-id]")) {
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(cx - screenX, cy - screenY);
    if (dist < hitRadiusPx && (!closest || dist < closest.dist)) {
      const id = node.getAttribute("data-schematic-port-id");
      const resolved = id ? resolveSchematicPortId(circuitJson, id) : null;
      if (resolved) closest = { id: resolved, dist };
    }
  }
  return closest?.id ?? null;
}

// lib/hooks/useWireDrawing.ts
var useWireDrawing = ({
  enabled,
  circuitJson,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [state, setState] = useState7({
    isDrawing: false,
    fromPortId: null,
    previewEnd: null,
    waypoints: []
  });
  const stateRef = useRef8(state);
  stateRef.current = state;
  const screenToReal = useCallback6(
    createScreenToReal(svgToScreenProjection, realToSvgProjection, containerRef),
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const getPortCenter = useCallback6(
    (portId) => {
      const schematicPortId = resolveSchematicPortId(circuitJson, portId);
      if (!schematicPortId) return null;
      return getSchematicPortCenter(
        circuitJson,
        containerRef.current,
        schematicPortId,
        screenToReal
      );
    },
    [circuitJson, containerRef, screenToReal]
  );
  const getPortAtScreen = useCallback6(
    (screenX, screenY) => getSchematicPortAtScreen(
      containerRef.current,
      circuitJson,
      screenX,
      screenY
    ),
    [circuitJson, containerRef]
  );
  const beginWireAtPort = useCallback6(
    (portId) => {
      const schematicPortId = resolveSchematicPortId(circuitJson, portId);
      if (!schematicPortId) return false;
      const center = getPortCenter(schematicPortId);
      if (!center) return false;
      setState({
        isDrawing: true,
        fromPortId: schematicPortId,
        previewEnd: center,
        waypoints: [center]
      });
      return true;
    },
    [circuitJson, getPortCenter]
  );
  const finishWireAtPort = useCallback6(
    (portId) => {
      const current = stateRef.current;
      if (!current.isDrawing || !current.fromPortId) return false;
      const schematicPortId = resolveSchematicPortId(circuitJson, portId);
      if (!schematicPortId || schematicPortId === current.fromPortId) {
        return false;
      }
      const toCenter = getPortCenter(schematicPortId);
      if (!toCenter) return false;
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_wire_add",
        from_schematic_port_id: current.fromPortId,
        to_schematic_port_id: schematicPortId,
        route: [...current.waypoints, toCenter],
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        waypoints: []
      });
      return true;
    },
    [circuitJson, getPortCenter, onEditEvent]
  );
  const handlePortMouseDown = useCallback6(
    (portId, e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const current = stateRef.current;
      if (!current.isDrawing) {
        beginWireAtPort(portId);
        return;
      }
      if (!finishWireAtPort(portId)) {
        const realPos = screenToReal(e.clientX, e.clientY);
        setState((prev) => ({
          ...prev,
          waypoints: [...prev.waypoints, realPos]
        }));
      }
    },
    [enabled, beginWireAtPort, finishWireAtPort, screenToReal]
  );
  const handleMouseDown = useCallback6(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) {
        return;
      }
      const current = stateRef.current;
      const portId = getPortAtScreen(e.clientX, e.clientY);
      if (!current.isDrawing) {
        if (!portId) return;
        e.preventDefault();
        e.stopPropagation();
        beginWireAtPort(portId);
        return;
      }
      if (portId && finishWireAtPort(portId)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const realPos = screenToReal(e.clientX, e.clientY);
      setState((prev) => ({
        ...prev,
        waypoints: [...prev.waypoints, realPos]
      }));
    },
    [enabled, getPortAtScreen, beginWireAtPort, finishWireAtPort, screenToReal]
  );
  const handleMouseMove = useCallback6(
    (e) => {
      if (!enabled || !stateRef.current.isDrawing) return;
      const realPos = screenToReal(e.clientX, e.clientY);
      setState((prev) => ({ ...prev, previewEnd: realPos }));
    },
    [enabled, screenToReal]
  );
  const handleKeyDown = useCallback6((e) => {
    if (e.key === "Escape" && stateRef.current.isDrawing) {
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        waypoints: []
      });
    }
  }, []);
  useEffect12(() => {
    if (!enabled) {
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        waypoints: []
      });
      return;
    }
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true
      });
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleMouseDown, handleMouseMove, handleKeyDown]);
  return { wireDrawingState: state, handlePortMouseDown };
};

// lib/hooks/useBusDrawing.ts
import { useCallback as useCallback7, useEffect as useEffect13, useRef as useRef9, useState as useState8 } from "react";
import { compose as compose4 } from "transformation-matrix";
var useBusDrawing = ({
  enabled,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [state, setState] = useState8({
    isDrawing: false,
    previewEnd: null,
    waypoints: []
  });
  const stateRef = useRef9(state);
  stateRef.current = state;
  const screenToReal = useCallback7(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      const realToScreen = compose4(svgToScreenProjection, realToSvgProjection);
      return {
        x: (localX - realToScreen.e) / realToScreen.a,
        y: (localY - realToScreen.f) / realToScreen.d
      };
    },
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const dedupeRoute = (route) => {
    const out = [];
    for (const p of route) {
      const last = out[out.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.05) out.push(p);
    }
    return out;
  };
  const finishBus = useCallback7(
    (route) => {
      const cleaned = dedupeRoute(route);
      if (cleaned.length < 2) return false;
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_bus_add",
        route: cleaned,
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
      setState({ isDrawing: false, previewEnd: null, waypoints: [] });
      return true;
    },
    [onEditEvent]
  );
  const handleMouseDown = useCallback7(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return;
      const current = stateRef.current;
      const realPos = screenToReal(e.clientX, e.clientY);
      if (!current.isDrawing) {
        e.stopPropagation();
        setState({
          isDrawing: true,
          previewEnd: realPos,
          waypoints: [realPos]
        });
        return;
      }
      e.stopPropagation();
      setState((prev) => ({
        ...prev,
        waypoints: [...prev.waypoints, realPos],
        previewEnd: realPos
      }));
    },
    [enabled, screenToReal]
  );
  const handleDoubleClick = useCallback7(
    (e) => {
      if (!enabled || !stateRef.current.isDrawing) return;
      const current = stateRef.current;
      const end = screenToReal(e.clientX, e.clientY);
      const route = [...current.waypoints, end];
      if (finishBus(route.length >= 2 ? route : current.waypoints)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [enabled, screenToReal, finishBus]
  );
  const handleMouseMove = useCallback7(
    (e) => {
      if (!enabled || !stateRef.current.isDrawing) return;
      const realPos = screenToReal(e.clientX, e.clientY);
      setState((prev) => ({ ...prev, previewEnd: realPos }));
    },
    [enabled, screenToReal]
  );
  const handleKeyDown = useCallback7(
    (e) => {
      const target = e.target;
      if (target?.closest("input, textarea, select")) return;
      if (e.key === "Enter" && stateRef.current.isDrawing) {
        const route = stateRef.current.waypoints;
        if (finishBus(route)) {
          e.preventDefault();
        }
        return;
      }
      if (e.key === "Escape" && stateRef.current.isDrawing) {
        setState({ isDrawing: false, previewEnd: null, waypoints: [] });
      }
    },
    [finishBus]
  );
  useEffect13(() => {
    if (!enabled) {
      setState({ isDrawing: false, previewEnd: null, waypoints: [] });
      return;
    }
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("dblclick", handleDoubleClick, { capture: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true
      });
      window.removeEventListener("dblclick", handleDoubleClick, {
        capture: true
      });
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enabled,
    handleMouseDown,
    handleDoubleClick,
    handleMouseMove,
    handleKeyDown
  ]);
  return { busDrawingState: state };
};

// lib/hooks/useBusEntryPlacement.ts
import { useCallback as useCallback8, useEffect as useEffect14, useState as useState9 } from "react";
import { compose as compose5 } from "transformation-matrix";
var BUS_ENTRY_STUB_LEN = 2.5;
var useBusEntryPlacement = ({
  enabled,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [previewState, setPreviewState] = useState9({
    anchor: null
  });
  const screenToReal = useCallback8(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      const realToScreen = compose5(svgToScreenProjection, realToSvgProjection);
      return {
        x: (localX - realToScreen.e) / realToScreen.a,
        y: (localY - realToScreen.f) / realToScreen.d
      };
    },
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const placeEntry = useCallback8(
    (anchor) => {
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_bus_entry_add",
        anchor,
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
    },
    [onEditEvent]
  );
  const handleMouseDown = useCallback8(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return;
      const anchor = screenToReal(e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();
      placeEntry(anchor);
    },
    [enabled, screenToReal, placeEntry]
  );
  const handleMouseMove = useCallback8(
    (e) => {
      if (!enabled) return;
      setPreviewState({ anchor: screenToReal(e.clientX, e.clientY) });
    },
    [enabled, screenToReal]
  );
  useEffect14(() => {
    if (!enabled) {
      setPreviewState({ anchor: null });
      return;
    }
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true
      });
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [enabled, handleMouseDown, handleMouseMove]);
  return { busEntryPreviewState: previewState };
};

// lib/hooks/useNoConnectPlacement.ts
import { useCallback as useCallback9, useEffect as useEffect15, useState as useState10 } from "react";
import { compose as compose6 } from "transformation-matrix";
var NO_CONNECT_HALF = 0.4;
var PORT_HIT_RADIUS_PX = 36;
var useNoConnectPlacement = ({
  enabled,
  circuitJson,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [previewState, setPreviewState] = useState10({
    center: null
  });
  const screenToReal = useCallback9(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      const realToScreen = compose6(svgToScreenProjection, realToSvgProjection);
      return {
        x: (localX - realToScreen.e) / realToScreen.a,
        y: (localY - realToScreen.f) / realToScreen.d
      };
    },
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const resolveSchematicPortId2 = useCallback9(
    (portId) => {
      const bySchematic = circuitJson.find(
        (el) => el.type === "schematic_port" && el.schematic_port_id === portId
      );
      if (bySchematic) return portId;
      const bySource = circuitJson.find(
        (el) => el.type === "schematic_port" && el.source_port_id === portId
      );
      return bySource?.schematic_port_id ?? null;
    },
    [circuitJson]
  );
  const getPortCenter = useCallback9(
    (portId) => {
      const schematicPortId = resolveSchematicPortId2(portId);
      if (!schematicPortId) return null;
      const port = circuitJson.find(
        (el) => el.type === "schematic_port" && el.schematic_port_id === schematicPortId
      );
      if (!port?.center) return null;
      return { x: port.center.x, y: port.center.y };
    },
    [circuitJson, resolveSchematicPortId2]
  );
  const getPortAtScreen = useCallback9(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container) return null;
      let closest = null;
      const portEls = container.querySelectorAll("[data-schematic-port-id]");
      for (const node of portEls) {
        const rect = node.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt((cx - screenX) ** 2 + (cy - screenY) ** 2);
        if (dist < PORT_HIT_RADIUS_PX && (!closest || dist < closest.dist)) {
          const id = node.getAttribute("data-schematic-port-id");
          const resolved = id ? resolveSchematicPortId2(id) : null;
          if (resolved) closest = { id: resolved, dist };
        }
      }
      return closest?.id ?? null;
    },
    [containerRef, resolveSchematicPortId2]
  );
  const placeNoConnect = useCallback9(
    (center, schematicPortId) => {
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_no_connect_add",
        center,
        schematic_port_id: schematicPortId,
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
    },
    [onEditEvent]
  );
  const handleMouseDown = useCallback9(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      const portId = getPortAtScreen(e.clientX, e.clientY);
      if (portId) {
        const center = getPortCenter(portId);
        if (center) {
          placeNoConnect(center, portId);
          return;
        }
      }
      placeNoConnect(screenToReal(e.clientX, e.clientY));
    },
    [enabled, getPortAtScreen, getPortCenter, placeNoConnect, screenToReal]
  );
  const handleMouseMove = useCallback9(
    (e) => {
      if (!enabled) return;
      const portId = getPortAtScreen(e.clientX, e.clientY);
      if (portId) {
        const center = getPortCenter(portId);
        if (center) {
          setPreviewState({ center });
          return;
        }
      }
      setPreviewState({ center: screenToReal(e.clientX, e.clientY) });
    },
    [enabled, getPortAtScreen, getPortCenter, screenToReal]
  );
  useEffect15(() => {
    if (!enabled) {
      setPreviewState({ center: null });
      return;
    }
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true
      });
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [enabled, handleMouseDown, handleMouseMove]);
  return { noConnectPreviewState: previewState };
};

// lib/hooks/useNetLabelPlacement.ts
import { useCallback as useCallback10, useEffect as useEffect16, useRef as useRef10, useState as useState11 } from "react";
import { compose as compose7 } from "transformation-matrix";
var PORT_SNAP_RADIUS_PX = 32;
var useNetLabelPlacement = ({
  enabled,
  circuitJson,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [state, setState] = useState11({
    previewPos: null,
    pendingPos: null,
    pendingPortId: null
  });
  const stateRef = useRef10(state);
  stateRef.current = state;
  const screenToReal = useCallback10(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      const realToScreen = compose7(svgToScreenProjection, realToSvgProjection);
      return {
        x: (localX - realToScreen.e) / realToScreen.a,
        y: (localY - realToScreen.f) / realToScreen.d
      };
    },
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const snapToPort = useCallback10(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container)
        return { pos: screenToReal(screenX, screenY), portId: null };
      let closest = null;
      const portEls = container.querySelectorAll("[data-schematic-port-id]");
      for (const node of portEls) {
        const rect = node.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt((cx - screenX) ** 2 + (cy - screenY) ** 2);
        if (dist < PORT_SNAP_RADIUS_PX && (!closest || dist < closest.dist)) {
          const id = node.getAttribute("data-schematic-port-id");
          const portEl = circuitJson.find(
            (el) => el.type === "schematic_port" && el.schematic_port_id === id
          );
          if (id && portEl?.center) {
            closest = { id, dist, center: portEl.center };
          }
        }
      }
      if (closest) return { pos: closest.center, portId: closest.id };
      return { pos: screenToReal(screenX, screenY), portId: null };
    },
    [containerRef, circuitJson, screenToReal]
  );
  const handleMouseMove = useCallback10(
    (e) => {
      if (!enabled || stateRef.current.pendingPos) return;
      const { pos } = snapToPort(e.clientX, e.clientY);
      setState((prev) => ({ ...prev, previewPos: pos }));
    },
    [enabled, snapToPort]
  );
  const handleMouseDown = useCallback10(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return;
      if (stateRef.current.pendingPos) return;
      e.preventDefault();
      e.stopPropagation();
      const { pos, portId } = snapToPort(e.clientX, e.clientY);
      setState((prev) => ({
        ...prev,
        pendingPos: pos,
        pendingPortId: portId,
        previewPos: null
      }));
    },
    [enabled, snapToPort]
  );
  const handleKeyDown = useCallback10((e) => {
    if (e.key === "Escape") {
      setState({
        previewPos: null,
        pendingPos: null,
        pendingPortId: null
      });
    }
  }, []);
  const confirmPlacement = useCallback10(
    (netName) => {
      const current = stateRef.current;
      if (!current.pendingPos || !netName.trim()) return;
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_net_label_add",
        position: current.pendingPos,
        net_name: netName.trim(),
        schematic_port_id: current.pendingPortId ?? void 0,
        anchor_side: "right",
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
      setState({ previewPos: null, pendingPos: null, pendingPortId: null });
    },
    [onEditEvent]
  );
  const cancelPlacement = useCallback10(() => {
    setState({ previewPos: null, pendingPos: null, pendingPortId: null });
  }, []);
  useEffect16(() => {
    if (!enabled) {
      setState({ previewPos: null, pendingPos: null, pendingPortId: null });
      return;
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleMouseMove, handleMouseDown, handleKeyDown]);
  return { netLabelState: state, confirmPlacement, cancelPlacement };
};

// lib/hooks/useGlobalLabelPlacement.ts
import { useCallback as useCallback11, useEffect as useEffect17, useRef as useRef11, useState as useState12 } from "react";
import { compose as compose8 } from "transformation-matrix";
var PORT_SNAP_RADIUS_PX2 = 32;
var useGlobalLabelPlacement = ({
  enabled,
  circuitJson,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [state, setState] = useState12({
    previewPos: null,
    pendingPos: null,
    pendingPortId: null
  });
  const stateRef = useRef11(state);
  stateRef.current = state;
  const screenToReal = useCallback11(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      const realToScreen = compose8(svgToScreenProjection, realToSvgProjection);
      return {
        x: (localX - realToScreen.e) / realToScreen.a,
        y: (localY - realToScreen.f) / realToScreen.d
      };
    },
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const snapToPort = useCallback11(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container)
        return { pos: screenToReal(screenX, screenY), portId: null };
      let closest = null;
      const portEls = container.querySelectorAll("[data-schematic-port-id]");
      for (const node of portEls) {
        const rect = node.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt((cx - screenX) ** 2 + (cy - screenY) ** 2);
        if (dist < PORT_SNAP_RADIUS_PX2 && (!closest || dist < closest.dist)) {
          const id = node.getAttribute("data-schematic-port-id");
          const portEl = circuitJson.find(
            (el) => el.type === "schematic_port" && el.schematic_port_id === id
          );
          if (id && portEl?.center) {
            closest = { id, dist, center: portEl.center };
          }
        }
      }
      if (closest) return { pos: closest.center, portId: closest.id };
      return { pos: screenToReal(screenX, screenY), portId: null };
    },
    [containerRef, circuitJson, screenToReal]
  );
  const handleMouseMove = useCallback11(
    (e) => {
      if (!enabled || stateRef.current.pendingPos) return;
      const { pos } = snapToPort(e.clientX, e.clientY);
      setState((prev) => ({ ...prev, previewPos: pos }));
    },
    [enabled, snapToPort]
  );
  const handleMouseDown = useCallback11(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return;
      if (stateRef.current.pendingPos) return;
      e.preventDefault();
      e.stopPropagation();
      const { pos, portId } = snapToPort(e.clientX, e.clientY);
      setState((prev) => ({
        ...prev,
        pendingPos: pos,
        pendingPortId: portId,
        previewPos: null
      }));
    },
    [enabled, snapToPort]
  );
  const handleKeyDown = useCallback11((e) => {
    if (e.key === "Escape") {
      setState({
        previewPos: null,
        pendingPos: null,
        pendingPortId: null
      });
    }
  }, []);
  const confirmPlacement = useCallback11(
    (netName) => {
      const current = stateRef.current;
      if (!current.pendingPos || !netName.trim()) return;
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_global_label_add",
        position: current.pendingPos,
        net_name: netName.trim(),
        schematic_port_id: current.pendingPortId ?? void 0,
        anchor_side: "right",
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
      setState({ previewPos: null, pendingPos: null, pendingPortId: null });
    },
    [onEditEvent]
  );
  const cancelPlacement = useCallback11(() => {
    setState({ previewPos: null, pendingPos: null, pendingPortId: null });
  }, []);
  useEffect17(() => {
    if (!enabled) {
      setState({ previewPos: null, pendingPos: null, pendingPortId: null });
      return;
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleMouseMove, handleMouseDown, handleKeyDown]);
  return { globalLabelState: state, confirmPlacement, cancelPlacement };
};

// lib/hooks/useHierSheetPlacement.ts
import { useCallback as useCallback12, useEffect as useEffect18, useRef as useRef12, useState as useState13 } from "react";
import {
  applyToPoint as applyToPoint2,
  compose as compose9,
  inverse
} from "transformation-matrix";
var MIN_BOX_PX = 48;
function normalizeScreenBox(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  let width = Math.abs(b.x - a.x);
  let height = Math.abs(b.y - a.y);
  if (width < MIN_BOX_PX) width = MIN_BOX_PX;
  if (height < MIN_BOX_PX) height = MIN_BOX_PX;
  return { x, y, width, height };
}
function realBoxFromScreenBox(screenBox, localToReal) {
  const { x, y, width, height } = screenBox;
  const corners = [
    localToReal(x, y),
    localToReal(x + width, y),
    localToReal(x, y + height),
    localToReal(x + width, y + height)
  ];
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}
var useHierSheetPlacement = ({
  enabled,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [state, setState] = useState13({
    isDrawing: false,
    anchorLocal: null,
    previewLocal: null,
    pendingBox: null,
    pendingScreenBox: null
  });
  const stateRef = useRef12(state);
  stateRef.current = state;
  const localFromMouse = useCallback12(
    (clientX, clientY) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [containerRef]
  );
  const localToReal = useCallback12(
    (localX, localY) => {
      const realToScreen = compose9(svgToScreenProjection, realToSvgProjection);
      return applyToPoint2(inverse(realToScreen), { x: localX, y: localY });
    },
    [svgToScreenProjection, realToSvgProjection]
  );
  const reset = useCallback12(() => {
    setState({
      isDrawing: false,
      anchorLocal: null,
      previewLocal: null,
      pendingBox: null,
      pendingScreenBox: null
    });
  }, []);
  const handleMouseMove = useCallback12(
    (e) => {
      if (!enabled || stateRef.current.pendingBox) return;
      const pos = localFromMouse(e.clientX, e.clientY);
      if (stateRef.current.isDrawing && stateRef.current.anchorLocal) {
        setState((prev) => ({ ...prev, previewLocal: pos }));
      }
    },
    [enabled, localFromMouse]
  );
  const handleMouseDown = useCallback12(
    (e) => {
      if (!enabled || e.button !== 0 || stateRef.current.pendingBox || isMouseCaptureIgnoredTarget(e.target))
        return;
      e.preventDefault();
      e.stopPropagation();
      const pos = localFromMouse(e.clientX, e.clientY);
      const current = stateRef.current;
      if (!current.isDrawing) {
        setState({
          isDrawing: true,
          anchorLocal: pos,
          previewLocal: pos,
          pendingBox: null,
          pendingScreenBox: null
        });
        return;
      }
      if (!current.anchorLocal) return;
      const screenBox = normalizeScreenBox(current.anchorLocal, pos);
      const box = realBoxFromScreenBox(screenBox, localToReal);
      setState({
        isDrawing: false,
        anchorLocal: null,
        previewLocal: null,
        pendingBox: box,
        pendingScreenBox: screenBox
      });
    },
    [enabled, localFromMouse, localToReal]
  );
  const handleKeyDown = useCallback12(
    (e) => {
      if (e.key === "Escape") reset();
    },
    [reset]
  );
  const confirmPlacement = useCallback12(
    (sheetName, targetSheetId) => {
      const box = stateRef.current.pendingBox;
      const screenBox = stateRef.current.pendingScreenBox;
      if (!box || !screenBox || !sheetName.trim() || !targetSheetId.trim()) return;
      const sheetNamePos = localToReal(screenBox.x + 6, screenBox.y + 14);
      const fileNamePos = localToReal(
        screenBox.x + 6,
        screenBox.y + screenBox.height - 8
      );
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_hier_sheet_add",
        box,
        sheet_name: sheetName.trim(),
        target_sheet_id: targetSheetId.trim(),
        sheet_name_pos: sheetNamePos,
        file_name_pos: fileNamePos,
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
      reset();
    },
    [onEditEvent, reset, localToReal]
  );
  const cancelPlacement = useCallback12(() => reset(), [reset]);
  useEffect18(() => {
    if (!enabled) {
      reset();
      return;
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleMouseMove, handleMouseDown, handleKeyDown, reset]);
  return { hierSheetState: state, confirmPlacement, cancelPlacement };
};

// lib/components/WirePreview.tsx
import { applyToPoint as applyToPoint3, compose as compose10 } from "transformation-matrix";
import { jsx as jsx12, jsxs as jsxs7 } from "react/jsx-runtime";
var WirePreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef
}) => {
  if (!state.isDrawing || !state.previewEnd || state.waypoints.length === 0)
    return null;
  const container = containerRef.current;
  if (!container) return null;
  if (!realToSvgProjection?.a || isNaN(realToSvgProjection.a) || !svgToScreenProjection?.a || isNaN(svgToScreenProjection.a))
    return null;
  const realToScreen = compose10(svgToScreenProjection, realToSvgProjection);
  const toScreen = (pt) => applyToPoint3(realToScreen, pt);
  const points = [...state.waypoints.map(toScreen), toScreen(state.previewEnd)];
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return /* @__PURE__ */ jsxs7(
    "svg",
    {
      style: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 200
      },
      children: [
        /* @__PURE__ */ jsx12(
          "path",
          {
            d,
            stroke: "#00b4d8",
            strokeWidth: 2,
            strokeDasharray: "6 3",
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx12(
          "circle",
          {
            cx: points[0].x,
            cy: points[0].y,
            r: 5,
            fill: "#00b4d8",
            opacity: 0.8
          }
        ),
        /* @__PURE__ */ jsx12(
          "circle",
          {
            cx: points[points.length - 1].x,
            cy: points[points.length - 1].y,
            r: 4,
            fill: "none",
            stroke: "#00b4d8",
            strokeWidth: 1.5,
            opacity: 0.8
          }
        )
      ]
    }
  );
};

// lib/components/BusPreview.tsx
import { applyToPoint as applyToPoint4, compose as compose11 } from "transformation-matrix";
import { jsx as jsx13 } from "react/jsx-runtime";
var BusPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef
}) => {
  if (!state.isDrawing || !state.previewEnd || state.waypoints.length === 0)
    return null;
  const container = containerRef.current;
  if (!container) return null;
  if (!realToSvgProjection?.a || isNaN(realToSvgProjection.a) || !svgToScreenProjection?.a || isNaN(svgToScreenProjection.a))
    return null;
  const realToScreen = compose11(svgToScreenProjection, realToSvgProjection);
  const toScreen = (pt) => applyToPoint4(realToScreen, pt);
  const points = [...state.waypoints.map(toScreen), toScreen(state.previewEnd)];
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return /* @__PURE__ */ jsx13(
    "svg",
    {
      style: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 200
      },
      children: /* @__PURE__ */ jsx13(
        "path",
        {
          d,
          stroke: "#7e3ec0",
          strokeWidth: 4,
          strokeDasharray: "8 4",
          fill: "none",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }
      )
    }
  );
};

// lib/components/BusEntryPreview.tsx
import { applyToPoint as applyToPoint5, compose as compose12 } from "transformation-matrix";
import { jsx as jsx14 } from "react/jsx-runtime";
var BusEntryPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef
}) => {
  if (!state.anchor || !containerRef.current) return null;
  if (!realToSvgProjection?.a || !svgToScreenProjection?.a) return null;
  const realToScreen = compose12(svgToScreenProjection, realToSvgProjection);
  const toScreen = (pt) => applyToPoint5(realToScreen, pt);
  const p1 = toScreen(state.anchor);
  const p2 = toScreen({
    x: state.anchor.x + BUS_ENTRY_STUB_LEN,
    y: state.anchor.y + BUS_ENTRY_STUB_LEN
  });
  return /* @__PURE__ */ jsx14(
    "svg",
    {
      style: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 200
      },
      children: /* @__PURE__ */ jsx14(
        "line",
        {
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          stroke: "#7e3ec0",
          strokeWidth: 3,
          strokeDasharray: "6 3",
          strokeLinecap: "round"
        }
      )
    }
  );
};

// lib/components/NoConnectPreview.tsx
import { applyToPoint as applyToPoint6, compose as compose13 } from "transformation-matrix";
import { jsx as jsx15, jsxs as jsxs8 } from "react/jsx-runtime";
var NoConnectPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef
}) => {
  if (!state.center || !containerRef.current) return null;
  if (!realToSvgProjection?.a || !svgToScreenProjection?.a) return null;
  const realToScreen = compose13(svgToScreenProjection, realToSvgProjection);
  const toScreen = (pt) => applyToPoint6(realToScreen, pt);
  const { x, y } = state.center;
  const d = NO_CONNECT_HALF;
  const a1 = toScreen({ x: x - d, y: y - d });
  const a2 = toScreen({ x: x + d, y: y + d });
  const b1 = toScreen({ x: x + d, y: y - d });
  const b2 = toScreen({ x: x - d, y: y + d });
  return /* @__PURE__ */ jsxs8(
    "svg",
    {
      style: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 200
      },
      children: [
        /* @__PURE__ */ jsx15(
          "line",
          {
            x1: a1.x,
            y1: a1.y,
            x2: a2.x,
            y2: a2.y,
            stroke: "#c1271c",
            strokeWidth: 2.5,
            strokeDasharray: "4 3",
            strokeLinecap: "round"
          }
        ),
        /* @__PURE__ */ jsx15(
          "line",
          {
            x1: b1.x,
            y1: b1.y,
            x2: b2.x,
            y2: b2.y,
            stroke: "#c1271c",
            strokeWidth: 2.5,
            strokeDasharray: "4 3",
            strokeLinecap: "round"
          }
        )
      ]
    }
  );
};

// lib/components/NetLabelPreview.tsx
import { applyToPoint as applyToPoint7, compose as compose14 } from "transformation-matrix";
import { useRef as useRef13, useEffect as useEffect19 } from "react";
import { Fragment as Fragment4, jsx as jsx16, jsxs as jsxs9 } from "react/jsx-runtime";
var NetLabelPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
  onConfirm,
  onCancel
}) => {
  const inputRef = useRef13(null);
  useEffect19(() => {
    if (state.pendingPos && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = "";
    }
  }, [state.pendingPos]);
  const container = containerRef.current;
  if (!container) return null;
  if (!realToSvgProjection?.a || isNaN(realToSvgProjection.a) || !svgToScreenProjection?.a || isNaN(svgToScreenProjection.a))
    return null;
  const realToScreen = compose14(svgToScreenProjection, realToSvgProjection);
  const toScreen = (pt) => applyToPoint7(realToScreen, pt);
  const LabelShape = ({ pos }) => {
    const sp = toScreen(pos);
    return /* @__PURE__ */ jsxs9("g", { transform: `translate(${sp.x}, ${sp.y})`, opacity: 0.8, children: [
      /* @__PURE__ */ jsx16(
        "polygon",
        {
          points: "0,-10 60,-10 70,0 60,10 0,10",
          fill: "none",
          stroke: "#00b4d8",
          strokeWidth: 1.5,
          strokeDasharray: "4 2"
        }
      ),
      /* @__PURE__ */ jsx16("text", { x: 5, y: 4, fontSize: 10, fill: "#00b4d8", fontFamily: "monospace", children: "NET" }),
      /* @__PURE__ */ jsx16("circle", { cx: 0, cy: 0, r: 3, fill: "#00b4d8", opacity: 0.6 })
    ] });
  };
  return /* @__PURE__ */ jsxs9(Fragment4, { children: [
    state.previewPos && !state.pendingPos && /* @__PURE__ */ jsx16(
      "svg",
      {
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 50
        },
        children: /* @__PURE__ */ jsx16(LabelShape, { pos: state.previewPos })
      }
    ),
    state.pendingPos && (() => {
      const sp = toScreen(state.pendingPos);
      return /* @__PURE__ */ jsxs9(
        "div",
        {
          style: {
            position: "absolute",
            left: sp.x + 4,
            top: sp.y - 10,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: 4
          },
          children: [
            /* @__PURE__ */ jsx16(
              "input",
              {
                ref: inputRef,
                type: "text",
                placeholder: "Net name\u2026",
                style: {
                  background: "#1a1a2e",
                  border: "1.5px solid #00b4d8",
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none",
                  width: 120
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    onConfirm(e.target.value);
                  } else if (e.key === "Escape") {
                    onCancel();
                  }
                  e.stopPropagation();
                }
              }
            ),
            /* @__PURE__ */ jsx16(
              "button",
              {
                type: "button",
                style: {
                  background: "#00b4d8",
                  border: "none",
                  color: "#000",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 11,
                  cursor: "pointer"
                },
                onClick: () => {
                  if (inputRef.current) onConfirm(inputRef.current.value);
                },
                children: "\u2713"
              }
            )
          ]
        }
      );
    })()
  ] });
};

// lib/components/GlobalLabelPreview.tsx
import { applyToPoint as applyToPoint8, compose as compose15 } from "transformation-matrix";
import { useRef as useRef14, useEffect as useEffect20 } from "react";
import { Fragment as Fragment5, jsx as jsx17, jsxs as jsxs10 } from "react/jsx-runtime";
var GLOBAL_COLOR = "#c1271c";
var GlobalLabelPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
  onConfirm,
  onCancel
}) => {
  const inputRef = useRef14(null);
  useEffect20(() => {
    if (state.pendingPos && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = "";
    }
  }, [state.pendingPos]);
  const container = containerRef.current;
  if (!container) return null;
  if (!realToSvgProjection?.a || isNaN(realToSvgProjection.a) || !svgToScreenProjection?.a || isNaN(svgToScreenProjection.a))
    return null;
  const realToScreen = compose15(svgToScreenProjection, realToSvgProjection);
  const toScreen = (pt) => applyToPoint8(realToScreen, pt);
  const LabelShape = ({ pos }) => {
    const sp = toScreen(pos);
    return /* @__PURE__ */ jsxs10("g", { transform: `translate(${sp.x}, ${sp.y})`, opacity: 0.85, children: [
      /* @__PURE__ */ jsx17(
        "polygon",
        {
          points: "0,-10 60,-10 70,0 60,10 0,10",
          fill: "none",
          stroke: GLOBAL_COLOR,
          strokeWidth: 1.5,
          strokeDasharray: "4 2"
        }
      ),
      /* @__PURE__ */ jsx17(
        "text",
        {
          x: 5,
          y: 4,
          fontSize: 10,
          fill: GLOBAL_COLOR,
          fontFamily: "monospace",
          children: "GLOBAL"
        }
      ),
      /* @__PURE__ */ jsx17("circle", { cx: 0, cy: 0, r: 3, fill: GLOBAL_COLOR, opacity: 0.6 })
    ] });
  };
  return /* @__PURE__ */ jsxs10(Fragment5, { children: [
    state.previewPos && !state.pendingPos && /* @__PURE__ */ jsx17(
      "svg",
      {
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 50
        },
        children: /* @__PURE__ */ jsx17(LabelShape, { pos: state.previewPos })
      }
    ),
    state.pendingPos && (() => {
      const sp = toScreen(state.pendingPos);
      return /* @__PURE__ */ jsxs10(
        "div",
        {
          style: {
            position: "absolute",
            left: sp.x + 4,
            top: sp.y - 10,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: 4
          },
          children: [
            /* @__PURE__ */ jsx17(
              "input",
              {
                ref: inputRef,
                type: "text",
                placeholder: "Global net name\u2026",
                style: {
                  background: "#1a1a2e",
                  border: `1.5px solid ${GLOBAL_COLOR}`,
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none",
                  width: 140
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    onConfirm(e.target.value);
                  } else if (e.key === "Escape") {
                    onCancel();
                  }
                  e.stopPropagation();
                }
              }
            ),
            /* @__PURE__ */ jsx17(
              "button",
              {
                type: "button",
                style: {
                  background: GLOBAL_COLOR,
                  border: "none",
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 11,
                  cursor: "pointer"
                },
                onClick: () => {
                  if (inputRef.current) onConfirm(inputRef.current.value);
                },
                children: "\u2713"
              }
            )
          ]
        }
      );
    })()
  ] });
};

// lib/components/HierSheetPreview.tsx
import { applyToPoint as applyToPoint9, compose as compose16 } from "transformation-matrix";
import { useEffect as useEffect21, useMemo as useMemo5, useRef as useRef15, useState as useState14 } from "react";
import { Fragment as Fragment6, jsx as jsx18, jsxs as jsxs11 } from "react/jsx-runtime";
var SHEET_STROKE = "#0050d8";
var SHEET_FILL = "rgba(234, 242, 255, 0.35)";
var NAME_COLOR = "#006464";
var FILE_COLOR = "#725600";
var SheetSymbolShape = ({
  screenBox,
  dashed = true
}) => {
  const { x, y, width, height } = screenBox;
  const pinLen = Math.min(10, width * 0.08);
  const midY = y + height / 2;
  return /* @__PURE__ */ jsxs11("g", { opacity: dashed ? 0.85 : 1, children: [
    /* @__PURE__ */ jsx18(
      "rect",
      {
        x,
        y,
        width,
        height,
        fill: SHEET_FILL,
        stroke: SHEET_STROKE,
        strokeWidth: 1.8,
        strokeDasharray: dashed ? "6 3" : void 0
      }
    ),
    /* @__PURE__ */ jsx18(
      "line",
      {
        x1: x - pinLen,
        y1: midY - height * 0.2,
        x2: x,
        y2: midY - height * 0.2,
        stroke: SHEET_STROKE,
        strokeWidth: 1.4
      }
    ),
    /* @__PURE__ */ jsx18(
      "line",
      {
        x1: x - pinLen,
        y1: midY + height * 0.2,
        x2: x,
        y2: midY + height * 0.2,
        stroke: SHEET_STROKE,
        strokeWidth: 1.4
      }
    ),
    /* @__PURE__ */ jsx18(
      "line",
      {
        x1: x + width,
        y1: midY,
        x2: x + width + pinLen,
        y2: midY,
        stroke: SHEET_STROKE,
        strokeWidth: 1.4
      }
    ),
    /* @__PURE__ */ jsx18(
      "text",
      {
        x: x + 6,
        y: y + 14,
        fontSize: 11,
        fill: NAME_COLOR,
        fontFamily: "monospace",
        fontWeight: 600,
        children: "Sheet name"
      }
    ),
    /* @__PURE__ */ jsx18(
      "text",
      {
        x: x + 6,
        y: y + height - 8,
        fontSize: 10,
        fill: FILE_COLOR,
        fontFamily: "monospace",
        children: "Target sheet"
      }
    )
  ] });
};
function pendingBoxKey(box) {
  return `${box.x},${box.y},${box.width},${box.height}`;
}
var HierSheetPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
  sheetTargets,
  activeSheetId,
  onConfirm,
  onCancel
}) => {
  const [sheetName, setSheetName] = useState14("");
  const [targetSheetId, setTargetSheetId] = useState14("");
  const initializedKeyRef = useRef15(null);
  const nameInputRef = useRef15(null);
  const targets = useMemo5(
    () => sheetTargets.filter((t) => t.id !== activeSheetId),
    [sheetTargets, activeSheetId]
  );
  useEffect21(() => {
    if (!state.pendingBox) {
      initializedKeyRef.current = null;
      setSheetName("");
      setTargetSheetId("");
      return;
    }
    const key = pendingBoxKey(state.pendingBox);
    if (initializedKeyRef.current === key) return;
    initializedKeyRef.current = key;
    setSheetName("");
    setTargetSheetId(targets[0]?.id ?? "");
    requestAnimationFrame(() => nameInputRef.current?.focus());
  }, [state.pendingBox, targets]);
  const container = containerRef.current;
  if (!container) return null;
  if (!realToSvgProjection?.a || isNaN(realToSvgProjection.a) || !svgToScreenProjection?.a || isNaN(svgToScreenProjection.a)) {
    return null;
  }
  const realToScreen = compose16(svgToScreenProjection, realToSvgProjection);
  const boxToScreen = (box) => {
    const p1 = applyToPoint9(realToScreen, { x: box.x, y: box.y });
    const p2 = applyToPoint9(realToScreen, {
      x: box.x + box.width,
      y: box.y + box.height
    });
    return {
      x: Math.min(p1.x, p2.x),
      y: Math.min(p1.y, p2.y),
      width: Math.abs(p2.x - p1.x),
      height: Math.abs(p2.y - p1.y)
    };
  };
  const previewScreenBox = state.isDrawing && state.anchorLocal && state.previewLocal ? normalizeScreenBox(state.anchorLocal, state.previewLocal) : null;
  const committedScreenBox = state.pendingScreenBox ?? (state.pendingBox ? boxToScreen(state.pendingBox) : null);
  const dialogAnchor = committedScreenBox;
  const submit = () => {
    if (!sheetName.trim() || !targetSheetId.trim()) return;
    onConfirm(sheetName, targetSheetId);
  };
  return /* @__PURE__ */ jsxs11(Fragment6, { children: [
    previewScreenBox && /* @__PURE__ */ jsx18(
      "svg",
      {
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 50
        },
        children: /* @__PURE__ */ jsx18(SheetSymbolShape, { screenBox: previewScreenBox })
      }
    ),
    state.pendingBox && committedScreenBox && /* @__PURE__ */ jsx18(
      "svg",
      {
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 51
        },
        children: /* @__PURE__ */ jsx18(SheetSymbolShape, { screenBox: committedScreenBox, dashed: false })
      }
    ),
    state.pendingBox && dialogAnchor && /* @__PURE__ */ jsxs11(
      "div",
      {
        style: {
          position: "absolute",
          left: dialogAnchor.x + 8,
          top: dialogAnchor.y + dialogAnchor.height + 8,
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "8px 10px",
          background: "#1a1a2e",
          border: `1.5px solid ${SHEET_STROKE}`,
          borderRadius: 6,
          minWidth: 220
        },
        onMouseDown: (e) => e.stopPropagation(),
        "data-schematic-ignore-mouse-capture": true,
        children: [
          /* @__PURE__ */ jsxs11("label", { style: { fontSize: 10, color: NAME_COLOR, fontFamily: "monospace" }, children: [
            "Sheet name",
            /* @__PURE__ */ jsx18(
              "input",
              {
                ref: nameInputRef,
                type: "text",
                value: sheetName,
                placeholder: "e.g. MCU_Sub",
                onChange: (e) => setSheetName(e.target.value),
                style: {
                  display: "block",
                  marginTop: 3,
                  width: "100%",
                  background: "#0f0f1a",
                  border: `1px solid ${NAME_COLOR}`,
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none"
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    submit();
                  } else if (e.key === "Escape") {
                    onCancel();
                  }
                  e.stopPropagation();
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs11("label", { style: { fontSize: 10, color: FILE_COLOR, fontFamily: "monospace" }, children: [
            "Target sheet (file name)",
            /* @__PURE__ */ jsx18(
              "select",
              {
                value: targetSheetId,
                disabled: targets.length === 0,
                onChange: (e) => setTargetSheetId(e.target.value),
                style: {
                  display: "block",
                  marginTop: 3,
                  width: "100%",
                  background: "#0f0f1a",
                  border: `1px solid ${FILE_COLOR}`,
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none"
                },
                children: targets.length === 0 ? /* @__PURE__ */ jsx18("option", { value: "", children: "No other sheets" }) : targets.map((t) => /* @__PURE__ */ jsxs11("option", { value: t.id, children: [
                  t.title,
                  " (",
                  t.id,
                  ")"
                ] }, t.id))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs11("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end" }, children: [
            /* @__PURE__ */ jsx18(
              "button",
              {
                type: "button",
                style: {
                  background: "transparent",
                  border: "1px solid #666",
                  color: "#ccc",
                  padding: "3px 10px",
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: "pointer"
                },
                onClick: onCancel,
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx18(
              "button",
              {
                type: "button",
                disabled: targets.length === 0 || !sheetName.trim(),
                style: {
                  background: SHEET_STROKE,
                  border: "none",
                  color: "#fff",
                  padding: "3px 10px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 11,
                  cursor: targets.length === 0 || !sheetName.trim() ? "not-allowed" : "pointer",
                  opacity: targets.length === 0 || !sheetName.trim() ? 0.5 : 1
                },
                onClick: submit,
                children: "Place sheet"
              }
            )
          ] })
        ]
      }
    )
  ] });
};

// lib/hooks/usePowerPortPlacement.ts
import { useCallback as useCallback13, useEffect as useEffect22, useRef as useRef16, useState as useState15 } from "react";
import { compose as compose17 } from "transformation-matrix";
var PORT_SNAP_RADIUS_PX3 = 32;
var usePowerPortPlacement = ({
  enabled,
  circuitJson,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [state, setState] = useState15({
    previewPos: null,
    pendingPos: null,
    pendingPortId: null
  });
  const stateRef = useRef16(state);
  stateRef.current = state;
  const screenToReal = useCallback13(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      const realToScreen = compose17(svgToScreenProjection, realToSvgProjection);
      return {
        x: (localX - realToScreen.e) / realToScreen.a,
        y: (localY - realToScreen.f) / realToScreen.d
      };
    },
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const snapToPort = useCallback13(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container)
        return { pos: screenToReal(screenX, screenY), portId: null };
      let closest = null;
      const portEls = container.querySelectorAll("[data-schematic-port-id]");
      for (const node of portEls) {
        const rect = node.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt((cx - screenX) ** 2 + (cy - screenY) ** 2);
        if (dist < PORT_SNAP_RADIUS_PX3 && (!closest || dist < closest.dist)) {
          const id = node.getAttribute("data-schematic-port-id");
          const portEl = circuitJson.find(
            (el) => el.type === "schematic_port" && el.schematic_port_id === id
          );
          if (id && portEl?.center) {
            closest = { id, dist, center: portEl.center };
          }
        }
      }
      if (closest) return { pos: closest.center, portId: closest.id };
      return { pos: screenToReal(screenX, screenY), portId: null };
    },
    [containerRef, circuitJson, screenToReal]
  );
  const handleMouseMove = useCallback13(
    (e) => {
      if (!enabled || stateRef.current.pendingPos) return;
      const { pos } = snapToPort(e.clientX, e.clientY);
      setState((prev) => ({ ...prev, previewPos: pos }));
    },
    [enabled, snapToPort]
  );
  const handleMouseDown = useCallback13(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return;
      if (stateRef.current.pendingPos) return;
      e.preventDefault();
      e.stopPropagation();
      const { pos, portId } = snapToPort(e.clientX, e.clientY);
      setState((prev) => ({
        ...prev,
        pendingPos: pos,
        pendingPortId: portId,
        previewPos: null
      }));
    },
    [enabled, snapToPort]
  );
  const handleKeyDown = useCallback13((e) => {
    if (e.key === "Escape") {
      setState({
        previewPos: null,
        pendingPos: null,
        pendingPortId: null
      });
    }
  }, []);
  const confirmPlacement = useCallback13(
    (netName) => {
      const current = stateRef.current;
      if (!current.pendingPos || !netName.trim()) return;
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_power_port_add",
        position: current.pendingPos,
        net_name: netName.trim(),
        schematic_port_id: current.pendingPortId ?? void 0,
        anchor_side: "bottom",
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
      setState({ previewPos: null, pendingPos: null, pendingPortId: null });
    },
    [onEditEvent]
  );
  const cancelPlacement = useCallback13(() => {
    setState({ previewPos: null, pendingPos: null, pendingPortId: null });
  }, []);
  useEffect22(() => {
    if (!enabled) {
      setState({ previewPos: null, pendingPos: null, pendingPortId: null });
      return;
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleMouseMove, handleMouseDown, handleKeyDown]);
  return { powerPortState: state, confirmPlacement, cancelPlacement };
};

// lib/components/PowerPortPreview.tsx
import { applyToPoint as applyToPoint10, compose as compose18 } from "transformation-matrix";
import { useRef as useRef17, useEffect as useEffect23 } from "react";
import { Fragment as Fragment7, jsx as jsx19, jsxs as jsxs12 } from "react/jsx-runtime";
var POWER_COLOR = "#c1271c";
var PowerPortPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
  onConfirm,
  onCancel
}) => {
  const inputRef = useRef17(null);
  useEffect23(() => {
    if (state.pendingPos && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = "VCC";
    }
  }, [state.pendingPos]);
  const container = containerRef.current;
  if (!container) return null;
  if (!realToSvgProjection?.a || isNaN(realToSvgProjection.a) || !svgToScreenProjection?.a || isNaN(svgToScreenProjection.a)) {
    return null;
  }
  const realToScreen = compose18(svgToScreenProjection, realToSvgProjection);
  const toScreen = (pt) => applyToPoint10(realToScreen, pt);
  const PowerShape = ({ pos }) => {
    const sp = toScreen(pos);
    return /* @__PURE__ */ jsxs12("g", { transform: `translate(${sp.x}, ${sp.y})`, opacity: 0.85, children: [
      /* @__PURE__ */ jsx19("line", { x1: 0, y1: 0, x2: 0, y2: 18, stroke: POWER_COLOR, strokeWidth: 1.5 }),
      /* @__PURE__ */ jsx19("polygon", { points: "0,-14 -8,2 8,2", fill: "none", stroke: POWER_COLOR, strokeWidth: 1.5 }),
      /* @__PURE__ */ jsx19("text", { x: -10, y: -18, fontSize: 9, fill: POWER_COLOR, fontFamily: "monospace", children: "PWR" }),
      /* @__PURE__ */ jsx19("circle", { cx: 0, cy: 0, r: 3, fill: POWER_COLOR, opacity: 0.6 })
    ] });
  };
  return /* @__PURE__ */ jsxs12(Fragment7, { children: [
    state.previewPos && !state.pendingPos && /* @__PURE__ */ jsx19(
      "svg",
      {
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 50
        },
        children: /* @__PURE__ */ jsx19(PowerShape, { pos: state.previewPos })
      }
    ),
    state.pendingPos && (() => {
      const sp = toScreen(state.pendingPos);
      return /* @__PURE__ */ jsxs12(
        "div",
        {
          style: {
            position: "absolute",
            left: sp.x + 4,
            top: sp.y - 36,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: 4
          },
          children: [
            /* @__PURE__ */ jsx19(
              "input",
              {
                ref: inputRef,
                type: "text",
                placeholder: "Net name (VCC, +3V3)\u2026",
                style: {
                  background: "#1a1a2e",
                  border: `1.5px solid ${POWER_COLOR}`,
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none",
                  width: 140
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    onConfirm(e.target.value);
                  } else if (e.key === "Escape") {
                    onCancel();
                  }
                  e.stopPropagation();
                }
              }
            ),
            /* @__PURE__ */ jsx19(
              "button",
              {
                type: "button",
                style: {
                  background: POWER_COLOR,
                  border: "none",
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 11,
                  cursor: "pointer"
                },
                onClick: () => {
                  if (inputRef.current) onConfirm(inputRef.current.value);
                },
                children: "\u2713"
              }
            )
          ]
        }
      );
    })()
  ] });
};

// lib/hooks/useGroundPortPlacement.ts
import { useCallback as useCallback14, useEffect as useEffect24, useRef as useRef18, useState as useState16 } from "react";
import { compose as compose19 } from "transformation-matrix";
var PORT_SNAP_RADIUS_PX4 = 32;
var useGroundPortPlacement = ({
  enabled,
  circuitJson,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [state, setState] = useState16({
    previewPos: null,
    pendingPos: null,
    pendingPortId: null
  });
  const stateRef = useRef18(state);
  stateRef.current = state;
  const screenToReal = useCallback14(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      const realToScreen = compose19(svgToScreenProjection, realToSvgProjection);
      return {
        x: (localX - realToScreen.e) / realToScreen.a,
        y: (localY - realToScreen.f) / realToScreen.d
      };
    },
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const snapToPort = useCallback14(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container)
        return { pos: screenToReal(screenX, screenY), portId: null };
      let closest = null;
      const portEls = container.querySelectorAll("[data-schematic-port-id]");
      for (const node of portEls) {
        const rect = node.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt((cx - screenX) ** 2 + (cy - screenY) ** 2);
        if (dist < PORT_SNAP_RADIUS_PX4 && (!closest || dist < closest.dist)) {
          const id = node.getAttribute("data-schematic-port-id");
          const portEl = circuitJson.find(
            (el) => el.type === "schematic_port" && el.schematic_port_id === id
          );
          if (id && portEl?.center) {
            closest = { id, dist, center: portEl.center };
          }
        }
      }
      if (closest) return { pos: closest.center, portId: closest.id };
      return { pos: screenToReal(screenX, screenY), portId: null };
    },
    [containerRef, circuitJson, screenToReal]
  );
  const handleMouseMove = useCallback14(
    (e) => {
      if (!enabled || stateRef.current.pendingPos) return;
      const { pos } = snapToPort(e.clientX, e.clientY);
      setState((prev) => ({ ...prev, previewPos: pos }));
    },
    [enabled, snapToPort]
  );
  const handleMouseDown = useCallback14(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return;
      if (stateRef.current.pendingPos) return;
      e.preventDefault();
      e.stopPropagation();
      const { pos, portId } = snapToPort(e.clientX, e.clientY);
      setState((prev) => ({
        ...prev,
        pendingPos: pos,
        pendingPortId: portId,
        previewPos: null
      }));
    },
    [enabled, snapToPort]
  );
  const handleKeyDown = useCallback14((e) => {
    if (e.key === "Escape") {
      setState({
        previewPos: null,
        pendingPos: null,
        pendingPortId: null
      });
    }
  }, []);
  const confirmPlacement = useCallback14(
    (netName) => {
      const current = stateRef.current;
      if (!current.pendingPos || !netName.trim()) return;
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_ground_port_add",
        position: current.pendingPos,
        net_name: netName.trim(),
        schematic_port_id: current.pendingPortId ?? void 0,
        anchor_side: "top",
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
      setState({ previewPos: null, pendingPos: null, pendingPortId: null });
    },
    [onEditEvent]
  );
  const cancelPlacement = useCallback14(() => {
    setState({ previewPos: null, pendingPos: null, pendingPortId: null });
  }, []);
  useEffect24(() => {
    if (!enabled) {
      setState({ previewPos: null, pendingPos: null, pendingPortId: null });
      return;
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleMouseMove, handleMouseDown, handleKeyDown]);
  return { groundPortState: state, confirmPlacement, cancelPlacement };
};

// lib/components/GroundPortPreview.tsx
import { applyToPoint as applyToPoint11, compose as compose20 } from "transformation-matrix";
import { useRef as useRef19, useEffect as useEffect25 } from "react";
import { Fragment as Fragment8, jsx as jsx20, jsxs as jsxs13 } from "react/jsx-runtime";
var GND_COLOR = "#5c5c5c";
var GroundPortPreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
  onConfirm,
  onCancel
}) => {
  const inputRef = useRef19(null);
  useEffect25(() => {
    if (state.pendingPos && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = "GND";
    }
  }, [state.pendingPos]);
  const container = containerRef.current;
  if (!container) return null;
  if (!realToSvgProjection?.a || isNaN(realToSvgProjection.a) || !svgToScreenProjection?.a || isNaN(svgToScreenProjection.a)) {
    return null;
  }
  const realToScreen = compose20(svgToScreenProjection, realToSvgProjection);
  const toScreen = (pt) => applyToPoint11(realToScreen, pt);
  const GroundShape = ({ pos }) => {
    const sp = toScreen(pos);
    return /* @__PURE__ */ jsxs13("g", { transform: `translate(${sp.x}, ${sp.y})`, opacity: 0.85, children: [
      /* @__PURE__ */ jsx20("line", { x1: 0, y1: 0, x2: 0, y2: 18, stroke: GND_COLOR, strokeWidth: 1.5 }),
      /* @__PURE__ */ jsx20("polygon", { points: "0,32 -8,16 8,16", fill: "none", stroke: GND_COLOR, strokeWidth: 1.5 }),
      /* @__PURE__ */ jsx20("text", { x: -10, y: 42, fontSize: 9, fill: GND_COLOR, fontFamily: "monospace", children: "GND" }),
      /* @__PURE__ */ jsx20("circle", { cx: 0, cy: 0, r: 3, fill: GND_COLOR, opacity: 0.6 })
    ] });
  };
  return /* @__PURE__ */ jsxs13(Fragment8, { children: [
    state.previewPos && !state.pendingPos && /* @__PURE__ */ jsx20(
      "svg",
      {
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 50
        },
        children: /* @__PURE__ */ jsx20(GroundShape, { pos: state.previewPos })
      }
    ),
    state.pendingPos && (() => {
      const sp = toScreen(state.pendingPos);
      return /* @__PURE__ */ jsxs13(
        "div",
        {
          style: {
            position: "absolute",
            left: sp.x + 4,
            top: sp.y - 36,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: 4
          },
          children: [
            /* @__PURE__ */ jsx20(
              "input",
              {
                ref: inputRef,
                type: "text",
                placeholder: "Net name (GND, AGND)\u2026",
                style: {
                  background: "#1a1a2e",
                  border: `1.5px solid ${GND_COLOR}`,
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none",
                  width: 140
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    onConfirm(e.target.value);
                  } else if (e.key === "Escape") {
                    onCancel();
                  }
                  e.stopPropagation();
                }
              }
            ),
            /* @__PURE__ */ jsx20(
              "button",
              {
                type: "button",
                style: {
                  background: GND_COLOR,
                  border: "none",
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 11,
                  cursor: "pointer"
                },
                onClick: () => {
                  if (inputRef.current) onConfirm(inputRef.current.value);
                },
                children: "\u2713"
              }
            )
          ]
        }
      );
    })()
  ] });
};

// lib/hooks/useTextNotePlacement.ts
import { useCallback as useCallback15, useEffect as useEffect26, useRef as useRef20, useState as useState17 } from "react";
import { compose as compose21 } from "transformation-matrix";
var useTextNotePlacement = ({
  enabled,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [state, setState] = useState17({
    previewPos: null,
    pendingPos: null
  });
  const stateRef = useRef20(state);
  stateRef.current = state;
  const screenToReal = useCallback15(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      const realToScreen = compose21(svgToScreenProjection, realToSvgProjection);
      return {
        x: (localX - realToScreen.e) / realToScreen.a,
        y: (localY - realToScreen.f) / realToScreen.d
      };
    },
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const handleMouseMove = useCallback15(
    (e) => {
      if (!enabled || stateRef.current.pendingPos) return;
      setState((prev) => ({
        ...prev,
        previewPos: screenToReal(e.clientX, e.clientY)
      }));
    },
    [enabled, screenToReal]
  );
  const handleMouseDown = useCallback15(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return;
      if (stateRef.current.pendingPos) return;
      e.preventDefault();
      e.stopPropagation();
      setState((prev) => ({
        ...prev,
        pendingPos: screenToReal(e.clientX, e.clientY),
        previewPos: null
      }));
    },
    [enabled, screenToReal]
  );
  const handleKeyDown = useCallback15((e) => {
    if (e.key === "Escape") {
      setState({ previewPos: null, pendingPos: null });
    }
  }, []);
  const confirmPlacement = useCallback15(
    (text) => {
      const current = stateRef.current;
      if (!current.pendingPos || !text.trim()) return;
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_text_note_add",
        position: current.pendingPos,
        text: text.trim(),
        anchor: "left",
        font_size: 0.2,
        color: "#1a1612",
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
      setState({ previewPos: null, pendingPos: null });
    },
    [onEditEvent]
  );
  const cancelPlacement = useCallback15(() => {
    setState({ previewPos: null, pendingPos: null });
  }, []);
  useEffect26(() => {
    if (!enabled) {
      setState({ previewPos: null, pendingPos: null });
      return;
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleMouseMove, handleMouseDown, handleKeyDown]);
  return { textNoteState: state, confirmPlacement, cancelPlacement };
};

// lib/components/TextNotePreview.tsx
import { applyToPoint as applyToPoint12, compose as compose22 } from "transformation-matrix";
import { useRef as useRef21, useEffect as useEffect27 } from "react";
import { Fragment as Fragment9, jsx as jsx21, jsxs as jsxs14 } from "react/jsx-runtime";
var NOTE_COLOR = "#1a1612";
var TextNotePreview = ({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
  onConfirm,
  onCancel
}) => {
  const inputRef = useRef21(null);
  useEffect27(() => {
    if (state.pendingPos && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.value = "";
    }
  }, [state.pendingPos]);
  const container = containerRef.current;
  if (!container) return null;
  if (!realToSvgProjection?.a || isNaN(realToSvgProjection.a) || !svgToScreenProjection?.a || isNaN(svgToScreenProjection.a)) {
    return null;
  }
  const realToScreen = compose22(svgToScreenProjection, realToSvgProjection);
  const toScreen = (pt) => applyToPoint12(realToScreen, pt);
  const NoteShape = ({ pos }) => {
    const sp = toScreen(pos);
    return /* @__PURE__ */ jsxs14("g", { transform: `translate(${sp.x}, ${sp.y})`, opacity: 0.75, children: [
      /* @__PURE__ */ jsx21(
        "text",
        {
          x: 0,
          y: 0,
          fontSize: 11,
          fill: NOTE_COLOR,
          fontFamily: "monospace",
          fontStyle: "italic",
          children: "Text"
        }
      ),
      /* @__PURE__ */ jsx21("circle", { cx: 0, cy: 0, r: 3, fill: NOTE_COLOR, opacity: 0.4 })
    ] });
  };
  return /* @__PURE__ */ jsxs14(Fragment9, { children: [
    state.previewPos && !state.pendingPos && /* @__PURE__ */ jsx21(
      "svg",
      {
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 50
        },
        children: /* @__PURE__ */ jsx21(NoteShape, { pos: state.previewPos })
      }
    ),
    state.pendingPos && (() => {
      const sp = toScreen(state.pendingPos);
      return /* @__PURE__ */ jsxs14(
        "div",
        {
          style: {
            position: "absolute",
            left: sp.x + 4,
            top: sp.y - 10,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: 4
          },
          children: [
            /* @__PURE__ */ jsx21(
              "input",
              {
                ref: inputRef,
                type: "text",
                placeholder: "Note text\u2026",
                style: {
                  background: "#1a1a2e",
                  border: `1.5px solid ${NOTE_COLOR}`,
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 12,
                  outline: "none",
                  width: 180
                },
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    onConfirm(e.target.value);
                  } else if (e.key === "Escape") {
                    onCancel();
                  }
                  e.stopPropagation();
                }
              }
            ),
            /* @__PURE__ */ jsx21(
              "button",
              {
                type: "button",
                style: {
                  background: NOTE_COLOR,
                  border: "none",
                  color: "#fff",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "monospace",
                  fontSize: 11,
                  cursor: "pointer"
                },
                onClick: () => {
                  if (inputRef.current) onConfirm(inputRef.current.value);
                },
                children: "\u2713"
              }
            )
          ]
        }
      );
    })()
  ] });
};

// lib/hooks/useTraceDrawing.ts
import { useCallback as useCallback16, useEffect as useEffect28, useRef as useRef22, useState as useState18 } from "react";
import "transformation-matrix";

// lib/utils/computeTraceRoute.ts
function computeTraceRoute(from, to) {
  if (Math.abs(from.x - to.x) < 1e-6 || Math.abs(from.y - to.y) < 1e-6) {
    return [from, to];
  }
  const viaHFirst = { x: to.x, y: from.y };
  const viaVFirst = { x: from.x, y: to.y };
  const lenH = Math.abs(from.x - viaHFirst.x) + Math.abs(from.y - viaHFirst.y) + Math.abs(viaHFirst.x - to.x) + Math.abs(viaHFirst.y - to.y);
  const lenV = Math.abs(from.x - viaVFirst.x) + Math.abs(from.y - viaVFirst.y) + Math.abs(viaVFirst.x - to.x) + Math.abs(viaVFirst.y - to.y);
  const corner = lenH <= lenV ? viaHFirst : viaVFirst;
  return [from, corner, to];
}

// lib/hooks/useTraceDrawing.ts
var useTraceDrawing = ({
  enabled,
  circuitJson,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [state, setState] = useState18({
    isDrawing: false,
    fromPortId: null,
    previewEnd: null,
    previewRoute: []
  });
  const stateRef = useRef22(state);
  stateRef.current = state;
  const screenToReal = useCallback16(
    createScreenToReal(svgToScreenProjection, realToSvgProjection, containerRef),
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const getPortCenter = useCallback16(
    (portId) => {
      const schematicPortId = resolveSchematicPortId(circuitJson, portId);
      if (!schematicPortId) return null;
      return getSchematicPortCenter(
        circuitJson,
        containerRef.current,
        schematicPortId,
        screenToReal
      );
    },
    [circuitJson, containerRef, screenToReal]
  );
  const getPortAtScreen = useCallback16(
    (screenX, screenY) => getSchematicPortAtScreen(
      containerRef.current,
      circuitJson,
      screenX,
      screenY
    ),
    [circuitJson, containerRef]
  );
  const beginTraceAtPort = useCallback16(
    (portId) => {
      const schematicPortId = resolveSchematicPortId(circuitJson, portId);
      if (!schematicPortId) return false;
      const center = getPortCenter(schematicPortId);
      if (!center) return false;
      setState({
        isDrawing: true,
        fromPortId: schematicPortId,
        previewEnd: center,
        previewRoute: [center]
      });
      return true;
    },
    [circuitJson, getPortCenter]
  );
  const finishTraceAtPort = useCallback16(
    (portId) => {
      const current = stateRef.current;
      if (!current.isDrawing || !current.fromPortId) return false;
      const schematicPortId = resolveSchematicPortId(circuitJson, portId);
      if (!schematicPortId || schematicPortId === current.fromPortId) {
        return false;
      }
      const fromCenter = getPortCenter(current.fromPortId);
      const toCenter = getPortCenter(schematicPortId);
      if (!fromCenter || !toCenter) return false;
      const route = computeTraceRoute(fromCenter, toCenter);
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_wire_add",
        from_schematic_port_id: current.fromPortId,
        to_schematic_port_id: schematicPortId,
        route,
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        previewRoute: []
      });
      return true;
    },
    [circuitJson, getPortCenter, onEditEvent]
  );
  const handlePortMouseDown = useCallback16(
    (portId, e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const current = stateRef.current;
      if (!current.isDrawing) {
        beginTraceAtPort(portId);
        return;
      }
      finishTraceAtPort(portId);
    },
    [enabled, beginTraceAtPort, finishTraceAtPort]
  );
  const handleMouseDown = useCallback16(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) {
        return;
      }
      const current = stateRef.current;
      const portId = getPortAtScreen(e.clientX, e.clientY);
      if (!current.isDrawing) {
        if (!portId) return;
        e.preventDefault();
        e.stopPropagation();
        beginTraceAtPort(portId);
        return;
      }
      if (portId && finishTraceAtPort(portId)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [enabled, getPortAtScreen, beginTraceAtPort, finishTraceAtPort]
  );
  const handleMouseMove = useCallback16(
    (e) => {
      if (!enabled || !stateRef.current.isDrawing || !stateRef.current.fromPortId) {
        return;
      }
      const fromCenter = getPortCenter(stateRef.current.fromPortId);
      if (!fromCenter) return;
      const hover = screenToReal(e.clientX, e.clientY);
      setState((prev) => ({
        ...prev,
        previewEnd: hover,
        previewRoute: computeTraceRoute(fromCenter, hover)
      }));
    },
    [enabled, getPortCenter, screenToReal]
  );
  const handleKeyDown = useCallback16((e) => {
    if (e.key === "Escape" && stateRef.current.isDrawing) {
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        previewRoute: []
      });
    }
  }, []);
  useEffect28(() => {
    if (!enabled) {
      setState({
        isDrawing: false,
        fromPortId: null,
        previewEnd: null,
        previewRoute: []
      });
      return;
    }
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleMouseDown, handleMouseMove, handleKeyDown]);
  const wireDrawingState = {
    isDrawing: state.isDrawing,
    fromPortId: state.fromPortId,
    previewEnd: state.previewEnd,
    waypoints: state.previewRoute
  };
  return { traceDrawingState: state, wireDrawingState, handlePortMouseDown };
};

// lib/hooks/useComponentPlacement.ts
import { useCallback as useCallback17, useEffect as useEffect29, useRef as useRef23, useState as useState19 } from "react";
import { compose as compose23 } from "transformation-matrix";
var useComponentPlacement = ({
  enabled,
  componentKind,
  svgToScreenProjection,
  realToSvgProjection,
  containerRef,
  onEditEvent
}) => {
  const [state, setState] = useState19({
    previewPos: null,
    rotation: 0
  });
  const stateRef = useRef23(state);
  stateRef.current = state;
  const kindRef = useRef23(componentKind);
  kindRef.current = componentKind;
  const screenToReal = useCallback17(
    (screenX, screenY) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left;
      const localY = screenY - rect.top;
      const realToScreen = compose23(svgToScreenProjection, realToSvgProjection);
      return {
        x: (localX - realToScreen.e) / realToScreen.a,
        y: (localY - realToScreen.f) / realToScreen.d
      };
    },
    [svgToScreenProjection, realToSvgProjection, containerRef]
  );
  const placeAt = useCallback17(
    (position) => {
      const event = {
        edit_event_id: Math.random().toString(36).substr(2, 9),
        edit_event_type: "edit_schematic_component_add",
        position,
        component_kind: kindRef.current,
        rotation: stateRef.current.rotation,
        created_at: Date.now(),
        in_progress: false
      };
      onEditEvent?.(event);
    },
    [onEditEvent]
  );
  const handleMouseMove = useCallback17(
    (e) => {
      if (!enabled) return;
      setState((prev) => ({
        ...prev,
        previewPos: screenToReal(e.clientX, e.clientY)
      }));
    },
    [enabled, screenToReal]
  );
  const handleMouseDown = useCallback17(
    (e) => {
      if (!enabled || e.button !== 0 || isMouseCaptureIgnoredTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      placeAt(screenToReal(e.clientX, e.clientY));
    },
    [enabled, screenToReal, placeAt]
  );
  const handleKeyDown = useCallback17((e) => {
    if (!enabled) return;
    if (e.key === "r" || e.key === "R") {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      setState((prev) => ({
        ...prev,
        rotation: (prev.rotation + 90) % 360
      }));
    }
  }, [enabled]);
  useEffect29(() => {
    if (!enabled) {
      setState({ previewPos: null, rotation: 0 });
      return;
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleMouseMove, handleMouseDown, handleKeyDown]);
  return { componentPlacementState: state };
};

// lib/components/ComponentPlacementPreview.tsx
import { jsx as jsx22 } from "react/jsx-runtime";
var KIND_LABEL = {
  resistor: "R",
  capacitor: "C",
  inductor: "L"
};
function ComponentPlacementPreview({
  state,
  realToSvgProjection,
  svgToScreenProjection,
  containerRef,
  componentKind
}) {
  if (!state.previewPos) return null;
  const container = containerRef.current;
  if (!container) return null;
  const realToScreen = {
    a: realToSvgProjection.a * svgToScreenProjection.a,
    d: realToSvgProjection.d * svgToScreenProjection.d,
    e: realToSvgProjection.e * svgToScreenProjection.a + svgToScreenProjection.e,
    f: realToSvgProjection.f * svgToScreenProjection.d + svgToScreenProjection.f
  };
  const sx = state.previewPos.x * realToScreen.a + realToScreen.e;
  const sy = state.previewPos.y * realToScreen.d + realToScreen.f;
  const label = KIND_LABEL[componentKind] ?? "?";
  return /* @__PURE__ */ jsx22(
    "div",
    {
      className: "pointer-events-none absolute z-20",
      style: {
        left: sx,
        top: sy,
        transform: `translate(-50%, -50%) rotate(${state.rotation}deg)`
      },
      children: /* @__PURE__ */ jsx22(
        "div",
        {
          className: "rounded border border-dashed px-2 py-1 font-mono text-[11px]",
          style: {
            borderColor: "#1f6feb",
            color: "#1f6feb",
            background: "rgba(31, 111, 235, 0.08)"
          },
          children: label
        }
      )
    }
  );
}

// lib/components/SchematicViewer.tsx
import { jsx as jsx23, jsxs as jsxs15 } from "react/jsx-runtime";
var SchematicViewer = ({
  circuitJson,
  containerStyle,
  editEvents: unappliedEditEvents = [],
  onEditEvent,
  defaultEditMode = false,
  debugGrid = false,
  editingEnabled = false,
  debug: debug3 = false,
  clickToInteractEnabled = false,
  colorOverrides,
  spiceSimulationEnabled = false,
  disableGroups = false,
  onSchematicComponentClicked,
  showSchematicPorts = false,
  onSchematicPortClicked,
  toolMode = "select",
  onWireAdded,
  onBusAdded,
  onBusEntryAdded,
  onNoConnectAdded,
  onNetLabelAdded,
  onGlobalLabelAdded,
  onHierSheetAdded,
  onPowerPortAdded,
  onGroundPortAdded,
  onTextNoteAdded,
  onComponentAdded,
  placementComponentKind = "resistor",
  hierSheetTargets = [],
  activeSheetId,
  allowComponentEdit = false,
  allowCanvasPan = true
}) => {
  if (debug3) {
    enableDebug();
  }
  const [showSpiceOverlay, setShowSpiceOverlay] = useState20(false);
  const [spiceSimOptions, setSpiceSimOptions] = useState20({
    showVoltage: true,
    showCurrent: false,
    startTime: 0,
    // in ms
    duration: 20
    // in ms
  });
  const getCircuitHash = (circuitJson2) => {
    return `${circuitJson2?.length || 0}_${circuitJson2?.editCount || 0}`;
  };
  const circuitJsonKey = useMemo6(
    () => getCircuitHash(circuitJson),
    [circuitJson]
  );
  const spiceString = useMemo6(() => {
    if (!spiceSimulationEnabled) return null;
    try {
      return getSpiceFromCircuitJson(circuitJson, spiceSimOptions);
    } catch (e) {
      console.error("Failed to generate SPICE string", e);
      return null;
    }
  }, [
    circuitJsonKey,
    spiceSimulationEnabled,
    spiceSimOptions.startTime,
    spiceSimOptions.duration
  ]);
  const [hasSpiceSimRun, setHasSpiceSimRun] = useState20(false);
  useEffect30(() => {
    setHasSpiceSimRun(false);
  }, [circuitJsonKey]);
  useEffect30(() => {
    const onKeyDown = (e) => {
      if (e.code !== "Space") return;
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
      setSpacePanHeld(true);
    };
    const onKeyUp = (e) => {
      if (e.code === "Space") setSpacePanHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      setSpacePanHeld(false);
    };
  }, []);
  const {
    plotData,
    nodes,
    isLoading: isSpiceSimLoading,
    error: spiceSimError
  } = useSpiceSimulation(hasSpiceSimRun ? spiceString : null);
  const [editModeEnabled, setEditModeEnabled] = useState20(defaultEditMode);
  const effectiveEditMode = toolMode === "select" && editModeEnabled;
  useEffect30(() => {
    if (toolMode === "draw_wire" || toolMode === "draw_bus" || toolMode === "draw_bus_entry" || toolMode === "draw_no_connect" || toolMode === "draw_net_label" || toolMode === "draw_global_label" || toolMode === "draw_hier_sheet" || toolMode === "draw_power_port" || toolMode === "draw_ground_port" || toolMode === "draw_text_note") {
      setEditModeEnabled(false);
    } else if (toolMode === "select" && defaultEditMode) {
      setEditModeEnabled(true);
    } else {
      setEditModeEnabled(false);
    }
  }, [toolMode, defaultEditMode]);
  const [snapToGrid, setSnapToGrid] = useState20(true);
  const [showGridInternal, setShowGridInternal] = useState20(false);
  const showGrid = debugGrid || showGridInternal;
  const [isInteractionEnabled, setIsInteractionEnabled] = useState20(
    !clickToInteractEnabled
  );
  const [showViewMenu, setShowViewMenu] = useState20(false);
  const [showSchematicGroups, setShowSchematicGroups] = useState20(() => {
    if (disableGroups) return false;
    return getStoredBoolean("schematic_viewer_show_groups", false);
  });
  const [isHoveringClickableComponent, setIsHoveringClickableComponent] = useState20(false);
  const hoveringComponentsRef = useRef24(/* @__PURE__ */ new Set());
  const handleComponentHoverChange = useCallback18(
    (componentId, isHovering) => {
      if (isHovering) {
        hoveringComponentsRef.current.add(componentId);
      } else {
        hoveringComponentsRef.current.delete(componentId);
      }
      setIsHoveringClickableComponent(hoveringComponentsRef.current.size > 0);
    },
    []
  );
  const [isHoveringClickablePort, setIsHoveringClickablePort] = useState20(false);
  const hoveringPortsRef = useRef24(/* @__PURE__ */ new Set());
  const handlePortHoverChange = useCallback18(
    (portId, isHovering) => {
      if (isHovering) {
        hoveringPortsRef.current.add(portId);
      } else {
        hoveringPortsRef.current.delete(portId);
      }
      setIsHoveringClickablePort(hoveringPortsRef.current.size > 0);
    },
    []
  );
  const svgDivRef = useRef24(null);
  const touchStartRef = useRef24(null);
  const schematicComponentIds = useMemo6(() => {
    try {
      return su6(circuitJson).schematic_component?.list()?.map((component) => component.schematic_component_id) ?? [];
    } catch (err) {
      console.error("Failed to derive schematic component ids", err);
      return [];
    }
  }, [circuitJsonKey, circuitJson]);
  const schematicPortsInfo = useMemo6(() => {
    if (!showSchematicPorts) return [];
    try {
      const ports = su6(circuitJson).schematic_port?.list() ?? [];
      return ports.map((port) => {
        const sourcePort = su6(circuitJson).source_port.get(port.source_port_id);
        const sourceComponent = sourcePort?.source_component_id ? su6(circuitJson).source_component.get(sourcePort.source_component_id) : null;
        const componentName = sourceComponent?.name ?? "?";
        const pinLabel = port.display_pin_label ?? sourcePort?.pin_number ?? sourcePort?.name ?? "?";
        return {
          portId: port.schematic_port_id,
          label: `${componentName}.${pinLabel}`
        };
      });
    } catch (err) {
      console.error("Failed to derive schematic port info", err);
      return [];
    }
  }, [circuitJsonKey, circuitJson, showSchematicPorts]);
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  };
  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const start = touchStartRef.current;
    if (!start) return;
    const deltaX = Math.abs(touch.clientX - start.x);
    const deltaY = Math.abs(touch.clientY - start.y);
    if (deltaX < 10 && deltaY < 10) {
      e.preventDefault();
      setIsInteractionEnabled(true);
    }
    touchStartRef.current = null;
  };
  const [internalEditEvents, setInternalEditEvents] = useState20([]);
  const circuitJsonRef = useRef24(circuitJson);
  useEffect30(() => {
    const circuitHash = getCircuitHash(circuitJson);
    const circuitHashRef = getCircuitHash(circuitJsonRef.current);
    if (circuitHash !== circuitHashRef) {
      setInternalEditEvents([]);
      circuitJsonRef.current = circuitJson;
    }
  }, [circuitJson]);
  const panPolicyRef = useRef24({ toolMode, allowComponentEdit, allowCanvasPan });
  panPolicyRef.current = { toolMode, allowComponentEdit, allowCanvasPan };
  const onSetSvgTransform = useCallback18((transform) => {
    if (!svgDivRef.current) return;
    svgDivRef.current.style.transform = transformToString(transform);
  }, []);
  const shouldDrag = useCallback18((e) => {
    if (e.type === "wheel") return true;
    if (e.type === "mousemove" || e.type === "mouseup" || e.type === "mouseout") {
      return true;
    }
    if (e instanceof MouseEvent && e.button !== 0) return true;
    if (isSpacePanHeld() && e instanceof MouseEvent) return true;
    const { toolMode: mode, allowComponentEdit: allowEdit, allowCanvasPan: pan } = panPolicyRef.current;
    if (!pan && e.type !== "wheel") {
      return false;
    }
    if (mode === "draw_wire" || mode === "draw_trace" || mode === "draw_component" || mode === "draw_bus" || mode === "draw_bus_entry" || mode === "draw_no_connect" || mode === "draw_net_label" || mode === "draw_global_label" || mode === "draw_hier_sheet" || mode === "draw_power_port" || mode === "draw_ground_port" || mode === "draw_text_note") {
      return false;
    }
    if (allowEdit) {
      const target = e.target;
      if (target.closest('[data-circuit-json-type="schematic_component"]')) {
        return false;
      }
    }
    return true;
  }, []);
  const {
    ref: containerRef,
    cancelDrag,
    transform: svgToScreenProjection
  } = useMouseMatrixTransform({
    onSetTransform: onSetSvgTransform,
    // @ts-ignore disabled is a valid prop but not typed
    enabled: isInteractionEnabled && !showSpiceOverlay,
    shouldDrag
  });
  const { containerWidth, containerHeight } = useResizeHandling(containerRef);
  const svgString = useMemo6(() => {
    if (!containerWidth || !containerHeight) return "";
    return convertCircuitJsonToSchematicSvg(circuitJson, {
      width: containerWidth,
      height: containerHeight || 720,
      grid: !showGrid ? void 0 : {
        cellSize: 1,
        labelCells: true
      },
      colorOverrides
    });
  }, [circuitJsonKey, circuitJson, containerWidth, containerHeight, showGrid, colorOverrides]);
  const containerBackgroundColor = useMemo6(() => {
    const match = svgString.match(
      /<svg[^>]*style="[^"]*background-color:\s*([^;\"]+)/i
    );
    return match?.[1] ?? "transparent";
  }, [svgString]);
  const realToSvgProjection = useMemo6(() => {
    if (!svgString) return identity();
    const transformString = svgString.match(
      /data-real-to-screen-transform="([^"]+)"/
    )?.[1];
    try {
      return fromString(transformString);
    } catch (e) {
      console.error(e);
      return identity();
    }
  }, [svgString]);
  const handleEditEvent = (event) => {
    setInternalEditEvents((prev) => [...prev, event]);
    if (onEditEvent) {
      onEditEvent(event);
    }
  };
  const editEventsWithUnappliedEditEvents = useMemo6(() => {
    return [...unappliedEditEvents, ...internalEditEvents];
  }, [unappliedEditEvents, internalEditEvents]);
  const {
    handleMouseDown,
    handleTouchStart: handleComponentTouchStart,
    isDragging,
    activeEditEvent
  } = useComponentDragging({
    onEditEvent: handleEditEvent,
    cancelDrag,
    realToSvgProjection,
    svgToScreenProjection,
    circuitJson,
    editEvents: editEventsWithUnappliedEditEvents,
    enabled: allowComponentEdit && isInteractionEnabled && !showSpiceOverlay,
    snapToGrid
  });
  const isProjectionReady = svgToScreenProjection?.a != null && !isNaN(svgToScreenProjection.a) && realToSvgProjection?.a != null && !isNaN(realToSvgProjection.a);
  const { wireDrawingState, handlePortMouseDown } = useWireDrawing({
    enabled: toolMode === "draw_wire" && isInteractionEnabled && isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onWireAdded
  });
  const { wireDrawingState: tracePreviewState, handlePortMouseDown: handleTracePortMouseDown } = useTraceDrawing({
    enabled: toolMode === "draw_trace" && isInteractionEnabled && isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onWireAdded
  });
  const { componentPlacementState } = useComponentPlacement({
    enabled: toolMode === "draw_component" && isInteractionEnabled && isProjectionReady,
    componentKind: placementComponentKind,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onComponentAdded
  });
  const portMouseDownHandler = toolMode === "draw_trace" ? handleTracePortMouseDown : handlePortMouseDown;
  const activeWirePreviewState = toolMode === "draw_trace" ? tracePreviewState : wireDrawingState;
  const { busDrawingState } = useBusDrawing({
    enabled: toolMode === "draw_bus" && isInteractionEnabled && isProjectionReady,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onBusAdded
  });
  const { busEntryPreviewState } = useBusEntryPlacement({
    enabled: toolMode === "draw_bus_entry" && isInteractionEnabled && isProjectionReady,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onBusEntryAdded
  });
  const { noConnectPreviewState } = useNoConnectPlacement({
    enabled: toolMode === "draw_no_connect" && isInteractionEnabled && isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onNoConnectAdded
  });
  const { netLabelState, confirmPlacement, cancelPlacement } = useNetLabelPlacement({
    enabled: toolMode === "draw_net_label" && isInteractionEnabled && isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onNetLabelAdded
  });
  const {
    globalLabelState,
    confirmPlacement: confirmGlobalPlacement,
    cancelPlacement: cancelGlobalPlacement
  } = useGlobalLabelPlacement({
    enabled: toolMode === "draw_global_label" && isInteractionEnabled && isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onGlobalLabelAdded
  });
  const {
    powerPortState,
    confirmPlacement: confirmPowerPlacement,
    cancelPlacement: cancelPowerPlacement
  } = usePowerPortPlacement({
    enabled: toolMode === "draw_power_port" && isInteractionEnabled && isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onPowerPortAdded
  });
  const {
    groundPortState,
    confirmPlacement: confirmGroundPlacement,
    cancelPlacement: cancelGroundPlacement
  } = useGroundPortPlacement({
    enabled: toolMode === "draw_ground_port" && isInteractionEnabled && isProjectionReady,
    circuitJson,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onGroundPortAdded
  });
  const {
    textNoteState,
    confirmPlacement: confirmTextNotePlacement,
    cancelPlacement: cancelTextNotePlacement
  } = useTextNotePlacement({
    enabled: toolMode === "draw_text_note" && isInteractionEnabled && isProjectionReady,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onTextNoteAdded
  });
  const {
    hierSheetState,
    confirmPlacement: confirmHierSheetPlacement,
    cancelPlacement: cancelHierSheetPlacement
  } = useHierSheetPlacement({
    enabled: toolMode === "draw_hier_sheet" && isInteractionEnabled && isProjectionReady,
    svgToScreenProjection,
    realToSvgProjection,
    containerRef,
    onEditEvent: onHierSheetAdded
  });
  useChangeSchematicComponentLocationsInSvg({
    svgDivRef,
    editEvents: editEventsWithUnappliedEditEvents,
    realToSvgProjection,
    svgToScreenProjection,
    activeEditEvent
  });
  useChangeSchematicTracesForMovedComponents({
    svgDivRef,
    circuitJson,
    activeEditEvent,
    editEvents: editEventsWithUnappliedEditEvents
  });
  useSchematicGroupsOverlay({
    svgDivRef,
    circuitJson,
    circuitJsonKey,
    showGroups: showSchematicGroups && !disableGroups
  });
  const handleComponentTouchStartRef = useRef24(handleComponentTouchStart);
  useEffect30(() => {
    handleComponentTouchStartRef.current = handleComponentTouchStart;
  }, [handleComponentTouchStart]);
  const svgDiv = useMemo6(
    () => /* @__PURE__ */ jsx23(
      "div",
      {
        ref: svgDivRef,
        style: {
          pointerEvents: clickToInteractEnabled ? isInteractionEnabled ? "auto" : "none" : "auto",
          transformOrigin: "0 0"
        },
        className: onSchematicComponentClicked ? "schematic-component-clickable" : void 0,
        onTouchStart: (e) => {
          if (effectiveEditMode && isInteractionEnabled && !showSpiceOverlay) {
            handleComponentTouchStartRef.current(e);
          }
        },
        dangerouslySetInnerHTML: { __html: svgString }
      }
    ),
    [
      svgString,
      isInteractionEnabled,
      clickToInteractEnabled,
      editModeEnabled,
      showSpiceOverlay
    ]
  );
  return /* @__PURE__ */ jsxs15(MouseTracker, { children: [
    onSchematicComponentClicked && /* @__PURE__ */ jsx23("style", { children: `.schematic-component-clickable [data-schematic-component-id]:hover { cursor: pointer !important; }` }),
    onSchematicPortClicked && /* @__PURE__ */ jsx23("style", { children: `[data-schematic-port-id]:hover { cursor: pointer !important; }` }),
    /* @__PURE__ */ jsxs15(
      "div",
      {
        ref: containerRef,
        style: {
          position: "relative",
          backgroundColor: containerBackgroundColor,
          overflow: hierSheetState.pendingBox ? "visible" : "hidden",
          cursor: showSpiceOverlay ? "auto" : toolMode === "draw_wire" || toolMode === "draw_trace" || toolMode === "draw_bus" || toolMode === "draw_bus_entry" || toolMode === "draw_no_connect" || toolMode === "draw_net_label" || toolMode === "draw_global_label" || toolMode === "draw_hier_sheet" || toolMode === "draw_power_port" || toolMode === "draw_ground_port" || toolMode === "draw_text_note" || toolMode === "draw_component" ? "crosshair" : isDragging ? "grabbing" : clickToInteractEnabled && !isInteractionEnabled ? "pointer" : isHoveringClickableComponent && onSchematicComponentClicked ? "pointer" : isHoveringClickablePort && onSchematicPortClicked ? "pointer" : "grab",
          minHeight: "300px",
          ...containerStyle
        },
        onWheelCapture: (e) => {
          if (showSpiceOverlay) {
            e.stopPropagation();
          }
        },
        onMouseDown: (e) => {
          if (clickToInteractEnabled && !isInteractionEnabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (allowComponentEdit) {
            handleMouseDown(e);
          }
        },
        onMouseDownCapture: (e) => {
          if (clickToInteractEnabled && !isInteractionEnabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        },
        onTouchStart: (e) => {
          if (showSpiceOverlay) return;
          handleTouchStart(e);
        },
        onTouchEnd: (e) => {
          if (showSpiceOverlay) return;
          handleTouchEnd(e);
        },
        children: [
          !isInteractionEnabled && clickToInteractEnabled && /* @__PURE__ */ jsx23(
            "div",
            {
              onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsInteractionEnabled(true);
              },
              style: {
                position: "absolute",
                inset: 0,
                cursor: "pointer",
                zIndex: zIndexMap.clickToInteractOverlay,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "all",
                touchAction: "pan-x pan-y pinch-zoom"
              },
              children: /* @__PURE__ */ jsx23(
                "div",
                {
                  style: {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontFamily: "sans-serif",
                    pointerEvents: "none"
                  },
                  children: typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0) ? "Touch to Interact" : "Click to Interact"
                }
              )
            }
          ),
          /* @__PURE__ */ jsx23(
            ViewMenuIcon,
            {
              active: showViewMenu,
              onClick: () => setShowViewMenu(!showViewMenu)
            }
          ),
          editingEnabled && /* @__PURE__ */ jsx23(
            EditIcon,
            {
              active: editModeEnabled,
              onClick: () => setEditModeEnabled(!editModeEnabled)
            }
          ),
          editingEnabled && editModeEnabled && /* @__PURE__ */ jsx23(
            GridIcon,
            {
              active: snapToGrid,
              onClick: () => setSnapToGrid(!snapToGrid)
            }
          ),
          /* @__PURE__ */ jsx23(
            ViewMenu,
            {
              circuitJson,
              circuitJsonKey,
              isVisible: showViewMenu,
              onClose: () => setShowViewMenu(false),
              showGroups: showSchematicGroups,
              onToggleGroups: (value) => {
                if (!disableGroups) {
                  setShowSchematicGroups(value);
                  setStoredBoolean("schematic_viewer_show_groups", value);
                }
              },
              showGrid,
              onToggleGrid: setShowGridInternal
            }
          ),
          spiceSimulationEnabled && /* @__PURE__ */ jsx23(SpiceSimulationIcon, { onClick: () => setShowSpiceOverlay(true) }),
          showSpiceOverlay && /* @__PURE__ */ jsx23(
            SpiceSimulationOverlay,
            {
              spiceString,
              onClose: () => setShowSpiceOverlay(false),
              plotData,
              nodes,
              isLoading: isSpiceSimLoading,
              error: spiceSimError,
              simOptions: spiceSimOptions,
              onSimOptionsChange: (options) => {
                setHasSpiceSimRun(true);
                setSpiceSimOptions(options);
              },
              hasRun: hasSpiceSimRun
            }
          ),
          onSchematicComponentClicked && schematicComponentIds.map((componentId) => /* @__PURE__ */ jsx23(
            SchematicComponentMouseTarget,
            {
              componentId,
              svgDivRef,
              containerRef,
              showOutline: true,
              circuitJsonKey,
              onHoverChange: handleComponentHoverChange,
              onComponentClick: (id, event) => {
                onSchematicComponentClicked?.({
                  schematicComponentId: id,
                  event
                });
              }
            },
            componentId
          )),
          svgDiv,
          /* @__PURE__ */ jsx23(
            WirePreview,
            {
              state: activeWirePreviewState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef
            }
          ),
          /* @__PURE__ */ jsx23(
            ComponentPlacementPreview,
            {
              state: componentPlacementState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef,
              componentKind: placementComponentKind
            }
          ),
          /* @__PURE__ */ jsx23(
            BusPreview,
            {
              state: busDrawingState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef
            }
          ),
          /* @__PURE__ */ jsx23(
            BusEntryPreview,
            {
              state: busEntryPreviewState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef
            }
          ),
          /* @__PURE__ */ jsx23(
            NoConnectPreview,
            {
              state: noConnectPreviewState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef
            }
          ),
          /* @__PURE__ */ jsx23(
            NetLabelPreview,
            {
              state: netLabelState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef,
              onConfirm: confirmPlacement,
              onCancel: cancelPlacement
            }
          ),
          /* @__PURE__ */ jsx23(
            GlobalLabelPreview,
            {
              state: globalLabelState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef,
              onConfirm: confirmGlobalPlacement,
              onCancel: cancelGlobalPlacement
            }
          ),
          /* @__PURE__ */ jsx23(
            PowerPortPreview,
            {
              state: powerPortState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef,
              onConfirm: confirmPowerPlacement,
              onCancel: cancelPowerPlacement
            }
          ),
          /* @__PURE__ */ jsx23(
            GroundPortPreview,
            {
              state: groundPortState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef,
              onConfirm: confirmGroundPlacement,
              onCancel: cancelGroundPlacement
            }
          ),
          /* @__PURE__ */ jsx23(
            TextNotePreview,
            {
              state: textNoteState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef,
              onConfirm: confirmTextNotePlacement,
              onCancel: cancelTextNotePlacement
            }
          ),
          /* @__PURE__ */ jsx23(
            HierSheetPreview,
            {
              state: hierSheetState,
              realToSvgProjection,
              svgToScreenProjection,
              containerRef,
              sheetTargets: hierSheetTargets,
              activeSheetId,
              onConfirm: confirmHierSheetPlacement,
              onCancel: cancelHierSheetPlacement
            }
          ),
          showSchematicPorts && schematicPortsInfo.map(({ portId, label }) => /* @__PURE__ */ jsx23(
            SchematicPortMouseTarget,
            {
              portId,
              portLabel: label,
              svgDivRef,
              containerRef,
              showOutline: true,
              interactive: toolMode === "draw_wire" || toolMode === "draw_trace",
              hitPaddingPx: toolMode === "draw_trace" ? 12 : 4,
              onPortMouseDown: portMouseDownHandler,
              circuitJsonKey,
              onHoverChange: handlePortHoverChange,
              onPortClick: onSchematicPortClicked ? (id, event) => {
                onSchematicPortClicked?.({
                  schematicPortId: id,
                  event
                });
              } : void 0
            },
            portId
          ))
        ]
      }
    )
  ] });
};

// lib/components/AnalogSimulationViewer.tsx
import {
  convertCircuitJsonToSchematicSimulationSvg
} from "circuit-to-svg";
import { useEffect as useEffect31, useState as useState21, useMemo as useMemo7, useRef as useRef25 } from "react";
import { useMouseMatrixTransform as useMouseMatrixTransform2 } from "use-mouse-matrix-transform";
import { toString as transformToString2 } from "transformation-matrix";
import { jsx as jsx24, jsxs as jsxs16 } from "react/jsx-runtime";
var AnalogSimulationViewer = ({
  circuitJson: inputCircuitJson,
  containerStyle,
  colorOverrides,
  width,
  height,
  className
}) => {
  const [circuitJson, setCircuitJson] = useState21(null);
  const [isLoading, setIsLoading] = useState21(true);
  const [error, setError] = useState21(null);
  const [svgObjectUrl, setSvgObjectUrl] = useState21(null);
  const containerRef = useRef25(null);
  const imgRef = useRef25(null);
  const { containerWidth, containerHeight } = useResizeHandling(
    containerRef
  );
  const [isDragging, setIsDragging] = useState21(false);
  const {
    ref: transformRef,
    cancelDrag: _cancelDrag,
    transform: _svgToScreenProjection
  } = useMouseMatrixTransform2({
    onSetTransform(transform) {
      if (imgRef.current) {
        imgRef.current.style.transform = transformToString2(transform);
      }
    }
  });
  const effectiveWidth = width || containerWidth || 1e3;
  const effectiveHeight = height || containerHeight || 600;
  useEffect31(() => {
    setIsLoading(true);
    setError(null);
    setCircuitJson(inputCircuitJson);
    setIsLoading(false);
  }, [inputCircuitJson]);
  const simulationExperimentId = useMemo7(() => {
    if (!circuitJson) return null;
    const simulationElement = circuitJson.find(
      (el) => el.type === "simulation_experiment"
    );
    return simulationElement?.simulation_experiment_id || null;
  }, [circuitJson]);
  const simulationGraphIds = useMemo7(() => {
    if (!circuitJson) return [];
    return circuitJson.filter((el) => el.type === "simulation_transient_voltage_graph").map((el) => el.simulation_transient_voltage_graph_id);
  }, [circuitJson]);
  const simulationSvg = useMemo7(() => {
    if (!circuitJson || !effectiveWidth || !effectiveHeight || !simulationExperimentId)
      return "";
    try {
      return convertCircuitJsonToSchematicSimulationSvg({
        circuitJson,
        simulation_experiment_id: simulationExperimentId,
        simulation_transient_voltage_graph_ids: simulationGraphIds,
        width: effectiveWidth,
        height: effectiveHeight,
        schematicOptions: { colorOverrides }
      });
    } catch (fallbackErr) {
      console.error("Failed to generate fallback schematic SVG:", fallbackErr);
      return "";
    }
  }, [
    circuitJson,
    effectiveWidth,
    effectiveHeight,
    colorOverrides,
    simulationExperimentId,
    simulationGraphIds
  ]);
  useEffect31(() => {
    if (!simulationSvg) {
      setSvgObjectUrl(null);
      return;
    }
    try {
      const blob = new Blob([simulationSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      setSvgObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (error2) {
      console.error("Failed to create SVG object URL:", error2);
      setSvgObjectUrl(null);
    }
  }, [simulationSvg]);
  const containerBackgroundColor = useMemo7(() => {
    if (!simulationSvg) return "transparent";
    const match = simulationSvg.match(
      /<svg[^>]*style="[^"]*background-color:\s*([^;\"]+)/i
    );
    return match?.[1] ?? "transparent";
  }, [simulationSvg]);
  const handleMouseDown = (_e) => {
    setIsDragging(true);
  };
  const handleTouchStart = (_e) => {
    setIsDragging(true);
  };
  useEffect31(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    const handleTouchEnd = () => {
      setIsDragging(false);
    };
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);
  if (isLoading) {
    return /* @__PURE__ */ jsx24(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          minHeight: "300px",
          fontFamily: "sans-serif",
          fontSize: "16px",
          color: "#666",
          ...containerStyle
        },
        className,
        children: "Loading circuit..."
      }
    );
  }
  if (error) {
    return /* @__PURE__ */ jsx24(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fef2f2",
          minHeight: "300px",
          fontFamily: "sans-serif",
          fontSize: "16px",
          color: "#dc2626",
          ...containerStyle
        },
        className,
        children: /* @__PURE__ */ jsxs16("div", { style: { textAlign: "center", padding: "20px" }, children: [
          /* @__PURE__ */ jsx24("div", { style: { fontWeight: "bold", marginBottom: "8px" }, children: "Circuit Conversion Error" }),
          /* @__PURE__ */ jsx24("div", { style: { fontSize: "14px" }, children: error })
        ] })
      }
    );
  }
  if (!simulationSvg) {
    return /* @__PURE__ */ jsxs16(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          minHeight: "300px",
          fontFamily: "sans-serif",
          gap: "12px",
          ...containerStyle
        },
        className,
        children: [
          /* @__PURE__ */ jsx24("div", { style: { fontSize: "16px", color: "#475569", fontWeight: 500 }, children: "No Simulation Found" }),
          /* @__PURE__ */ jsxs16("div", { style: { fontSize: "14px", color: "#64748b" }, children: [
            "Use",
            " ",
            /* @__PURE__ */ jsx24(
              "code",
              {
                style: {
                  backgroundColor: "#e2e8f0",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "13px"
                },
                children: "<analogsimulation />"
              }
            ),
            " ",
            "to create simulations"
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsx24(
    "div",
    {
      ref: (node) => {
        containerRef.current = node;
        transformRef.current = node;
      },
      style: {
        position: "relative",
        backgroundColor: containerBackgroundColor,
        overflow: "hidden",
        minHeight: "300px",
        cursor: isDragging ? "grabbing" : "grab",
        ...containerStyle
      },
      className,
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      children: svgObjectUrl ? /* @__PURE__ */ jsx24(
        "img",
        {
          ref: imgRef,
          src: svgObjectUrl,
          alt: "Circuit Simulation",
          style: {
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "contain"
          }
        }
      ) : /* @__PURE__ */ jsx24(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "300px",
            color: "#666",
            fontFamily: "sans-serif"
          },
          children: "Failed to render SVG"
        }
      )
    }
  );
};
export {
  AnalogSimulationViewer,
  MouseTracker,
  SchematicViewer,
  useMouseEventsOverBoundingBox
};
//# sourceMappingURL=index.js.map