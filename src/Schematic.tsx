import { useCallback, useEffect, useState } from "react"
import { ProjectComponent } from "schematic-components"
import { SuperGrid, toMMSI } from "react-supergrid"
import {
  AnyElement,
  createProjectBuilder,
  createProjectFromElements,
  findBoundsAndCenter,
  transformSchematicElement,
} from "@tscircuit/builder"
import * as builder1 from "@tscircuit/builder"
import TscReactFiber, { createRoot } from "@tscircuit/react-fiber"
import { SchematicElement } from "schematic-components/SchematicElement"
import { collectElementRefs } from "lib/utils/collect-element-refs"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { ErrorBoundary as TypedErrorBoundary } from "react-error-boundary"
import { identity, compose, scale, translate } from "transformation-matrix"
import { useRenderContext } from "lib/render-context"
import useMeasure from "react-use-measure"
import { TableViewer } from "./schematic-components/TableViewer"

const ErrorBoundary = TypedErrorBoundary as any

const fallbackRender: any =
  (elm) =>
  ({ error, resetErrorBoundary }: any) => {
    return (
      <div style={{ color: "red" }}>
        error rendering {elm.type}: {error.toString()}
      </div>
    )
  }

const toMMSINeg = (v: number, z: number) =>
  v >= 0 ? toMMSI(v, z) : `-${toMMSI(-v, z)}`

export const Schematic = ({
  children,
  elements: initialElements,
  soup: initialSoup,
  style,
  showTable = false,
}: {
  children?: any

  /** @deprecated */
  elements?: any

  soup?: any

  style?: any

  showTable?: boolean
}) => {
  initialSoup = initialSoup ?? initialElements ?? []

  const [elements, setElements] = useState<any>(initialSoup ?? [])
  const [project, setProject] = useState<any>(null)
  const setCameraTransform = useRenderContext((s) => s.setCameraTransform)
  const cameraTransform = useRenderContext((s) => s.camera_transform)
  const [boundsRef, bounds] = useMeasure()
  const { ref, setTransform } = useMouseMatrixTransform({
    onSetTransform: (transform) => {
      setCameraTransform(transform)
    },
    // initialTransform: compose(scale(100, 100, 0, 0)),
  })
  const setElementsAndCamera = useCallback(
    (elements: Array<AnyElement>) => {
      const elmBounds = (ref.current as HTMLDivElement).getBoundingClientRect()

      const { center, width, height } = elements.some((e) =>
        e.type.startsWith("schematic_")
      )
        ? findBoundsAndCenter(
            elements.filter((e) => e.type.startsWith("schematic_"))
          )
        : { center: { x: 0, y: 0 }, width: 0.001, height: 0.001 }

      const scaleFactor = Math.min(
        (elmBounds.width ?? 0) / width,
        (elmBounds.height ?? 0) / height,
        100
      )
      setElements(elements)
      setProject(createProjectFromElements(elements))
      setTransform(
        compose(
          translate((elmBounds.width ?? 0) / 2, (elmBounds.height ?? 0) / 2),
          // translate(100, 0),
          scale(scaleFactor, -scaleFactor, 0, 0),
          translate(-center.x, -center.y)
        )
      )
    },
    [setElements, setTransform]
  )

  useEffect(() => {
    if (initialSoup.length > 0) {
      setElementsAndCamera(initialSoup)
      return
    }
    const projectBuilder = createProjectBuilder()
    ;((createRoot ?? TscReactFiber.createRoot) as any)()
      .render(children, projectBuilder as any)
      .then(async (elements) => {
        setElementsAndCamera(elements)
      })
      .catch((e) => {
        console.error("ERROR RENDERING CIRCUIT")
        throw e
      })
  }, [children])

  return (
    <>
      <div
        style={{
          width: "100%",
          backgroundColor: "rgba(255,255,255,0)",
          minHeight: 200,
          overflow: "hidden",
          position: "relative",
          isolation: "isolate",
          cursor: "grab",
          ...style,
        }}
        ref={(el) => {
          ref.current = el
          boundsRef(el)
        }}
      >
        <SuperGrid
          stringifyCoord={(x, y, z) => {
            if (z === 0) return ""
            return `${toMMSINeg(x, z)}, ${toMMSINeg(y, z)}`
          }}
          width={bounds.width}
          height={bounds.height}
          transform={cameraTransform}
        />
        {elements?.map((elm, i) => (
          <ErrorBoundary key={i} fallbackRender={fallbackRender(elm)}>
            <SchematicElement
              element={elm}
              allElements={elements}
              key={JSON.stringify(elm)}
            />
          </ErrorBoundary>
        ))}
      </div>
      {showTable !== false && elements && <TableViewer elements={elements} />}
    </>
  )
}
