import { useCallback, useEffect, useState } from "react"
import { ProjectComponent } from "schematic-components"
import { SuperGrid, toMMSI } from "react-supergrid"
import {
  createProjectBuilder,
  createProjectFromElements,
  findBoundsAndCenter,
  transformSchematicElement,
} from "@tscircuit/builder"
import { createRoot } from "@tscircuit/react-fiber"
import { SchematicElement } from "schematic-components/SchematicElement"
import { collectElementRefs } from "lib/utils/collect-element-refs"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { ErrorBoundary } from "react-error-boundary"
import { identity, compose, scale, translate } from "transformation-matrix"
import { useRenderContext } from "lib/render-context"
import useMeasure from "react-use-measure"
import { SoupTableViewer } from "@tscircuit/table-viewer"

const fallbackRender =
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
}: {
  children?: any

  /** @deprecated */
  elements?: any

  soup?: any

  style?: any
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
    (elements) => {
      const elmBounds = (ref.current as HTMLDivElement).getBoundingClientRect()
      const { center, width, height } = findBoundsAndCenter(elements)
      setElements(elements)
      setProject(createProjectFromElements(elements))
      setTransform(
        compose(
          translate((elmBounds.width ?? 0) / 2, (elmBounds.height ?? 0) / 2),
          // translate(100, 0),
          scale(100, 100, 0, 0),
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
    createRoot()
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
      {elements && <SoupTableViewer elements={elements} />}
    </>
  )
}
