import { useEffect, useState } from "react"
import { ProjectComponent } from "schematic-components"
import {
  createProjectBuilder,
  createProjectFromElements,
  transformSchematicElement,
} from "@tscircuit/builder"
import { createRoot } from "@tscircuit/react-fiber"
import { SchematicElement } from "schematic-components/SchematicElement"
import { collectElementRefs } from "lib/utils/collect-element-refs"
import { useMouseMatrixTransform } from "use-mouse-matrix-transform"
import { ErrorBoundary } from "react-error-boundary"
import { identity, compose, scale } from "transformation-matrix"
import { useRenderContext } from "lib/render-context"

const fallbackRender =
  (elm) =>
  ({ error, resetErrorBoundary }: any) => {
    return (
      <div style={{ color: "red" }}>
        error rendering {elm.type}: {error.toString()}
      </div>
    )
  }

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
  const { ref } = useMouseMatrixTransform({
    onSetTransform: (transform) => {
      setCameraTransform(transform)
    },
    initialTransform: compose(scale(100, 100, 0, 0)),
  })

  useEffect(() => {
    if (initialSoup.length > 0) {
      setProject(createProjectFromElements(initialSoup))
      return
    }
    const projectBuilder = createProjectBuilder()
    createRoot()
      .render(children, projectBuilder as any)
      .then(async (elements) => {
        setElements(elements)
        setProject(createProjectFromElements(elements))
      })
      .catch((e) => {
        console.error("ERROR RENDERING CIRCUIT")
        throw e
      })
  }, [children])

  return (
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
      ref={ref}
    >
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
  )
}
