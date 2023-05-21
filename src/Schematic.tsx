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
  elements: initialElements = [],
}: {
  children?: any
  elements?: any
}) => {
  const [elements, setElements] = useState<any>(initialElements)
  const [project, setProject] = useState<any>(null)
  const { ref, applyTransformToPoint, transform } = useMouseMatrixTransform()

  console.log(transform)

  useEffect(() => {
    if (initialElements.length > 0) {
      setProject(createProjectFromElements(initialElements))
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

  if (elements.length === 0) return null

  return (
    <div ref={ref}>
      {elements.map((elm) => (
        <ErrorBoundary fallbackRender={fallbackRender(elm)}>
          <SchematicElement
            element={elm}
            allElements={elements.map((elm) =>
              transformSchematicElement(elm, transform)
            )}
            key={JSON.stringify(elm)}
          />
        </ErrorBoundary>
      ))}
    </div>
  )

  // return <ProjectComponent project={project} />
}
