import { useEffect, useState } from "react"
import { ProjectComponent } from "schematic-components"
import {
  createProjectBuilder,
  createProjectFromElements,
} from "@tscircuit/builder"
import { createRoot } from "@tscircuit/react-fiber"
import { SchematicElement } from "schematic-components/SchematicElement"
import { collectElementRefs } from "lib/utils/collect-element-refs"

export const Schematic = ({
  children,
  elements: initialElements = [],
}: {
  children?: any
  elements?: any
}) => {
  const [elements, setElements] = useState<any>(initialElements)
  const [project, setProject] = useState<any>(null)

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
    <>
      {elements.map((elm) => (
        <SchematicElement
          element={elm}
          allElements={elements}
          key={JSON.stringify(elm)}
        />
      ))}
    </>
  )

  // return <ProjectComponent project={project} />
}
