import type { CircuitJson } from "circuit-json"
import type { PcbBounds } from "./utils/component-details"
import type { JlcPartAvailability } from "./utils/jlc-part-availability"
import type { StyleAnalyzer } from "./utils/load-style-analyzer"

/** Override individual services while retaining the viewer's normal controls. */
export interface SchematicViewerServices {
  /** Defaults to JLCSearch. A null result leaves price and stock unavailable. */
  fetchJlcPartAvailability?: (
    partNumber: string,
    signal: AbortSignal,
  ) => Promise<JlcPartAvailability | null>
  /** Defaults to the SVG service. Undefined omits the footprint image. */
  getFootprintPreviewUrl?: (
    circuitJson: CircuitJson,
    viewBox: PcbBounds,
  ) => string | undefined
  /** Defaults to the CDN loader. May return a bundled analyzer instead. */
  loadStyleAnalyzer?: () => Promise<StyleAnalyzer>
}
