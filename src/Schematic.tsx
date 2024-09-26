import {
  AnyElement,
  createProjectBuilder,
  createProjectFromElements,
  findBoundsAndCenter,
} from "@tscircuit/builder"
import TscReactFiber, { createRoot } from "@tscircuit/react-fiber"
import { AnyCircuitElement } from "circuit-json"
import { useGlobalStore } from "lib/render-context"
import { useCallback, useEffect, useState } from "react"
import { ErrorBoundary as TypedErrorBoundary } from "react-error-boundary"
import { SuperGrid, toMMSI } from "react-supergrid"
import useMeasure from "react-use-measure"
import { ContextProviders } from "schematic-components"
import { SchematicElement } from "schematic-components/SchematicElement"
import { compose, scale, translate } from "transformation-matrix"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
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

export interface SchematicProps {
  children?: any

  /** @deprecated use soup */
  elements?: any

  soup?: AnyCircuitElement[]

  style?: any

  showTable?: boolean

  _soupPostProcessor?: (soup: AnyCircuitElement[]) => AnyCircuitElement[]
}

export const Schematic = (props: SchematicProps) => {
  return (
    <ContextProviders>
      <SchematicWithoutContext {...props} />
    </ContextProviders>
  )
}

export const SchematicWithoutContext = ({
  children,
  elements: initialElements,
  soup: initialSoup,
  style,
  showTable = false,
  _soupPostProcessor,
}: SchematicProps) => {
  initialSoup = initialSoup ?? initialElements ?? []

  const [elements, setElements] = useState<any>(initialSoup ?? [])
  const [project, setProject] = useState<any>(null)
  const { setCameraTransform, camera_transform: cameraTransform } =
    useGlobalStore()
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
        e.type.startsWith("schematic_"),
      )
        ? findBoundsAndCenter(
            elements.filter((e) => e.type.startsWith("schematic_")),
          )
        : { center: { x: 0, y: 0 }, width: 0.001, height: 0.001 }

      const scaleFactor = Math.min(
        (elmBounds.width ?? 0) / width,
        (elmBounds.height ?? 0) / height,
        100,
      )
      setElements(elements)
      setProject(createProjectFromElements(elements))
      setTransform(
        compose(
          translate((elmBounds.width ?? 0) / 2, (elmBounds.height ?? 0) / 2),
          scale(scaleFactor, -scaleFactor, 0, 0),
          translate(-center.x, -center.y),
        ),
      )
    },
    [setElements, setTransform],
  )

  useEffect(() => {
    if (initialSoup.length > 0) {
      setElementsAndCamera(initialSoup as any)
      return
    }
    const projectBuilder = createProjectBuilder()
    ;((createRoot ?? TscReactFiber.createRoot) as any)()
      .render(children, projectBuilder as any)
      .then(async (elements) => {
        if (_soupPostProcessor) {
          elements = _soupPostProcessor(elements)
        }
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
