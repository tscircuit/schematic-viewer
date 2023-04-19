import { useEffect, useState } from "react"
import { ProjectComponent } from "schematic-components"
import {
  createProjectBuilder,
  createProjectFromElements,
} from "@tscircuit/builder"
import { createRoot } from "@tscircuit/react-fiber"

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
    if (initialElements) {
      setProject(createProjectFromElements(elements))
      return
    }
    const projectBuilder = createProjectBuilder()
    createRoot()
      .render(children, projectBuilder as any)
      .then(async (elements) => {
        setElements(elements)
        setProject(createProjectFromElements(elements))
      })
  }, [children])

  if (elements.length === 0) return null

  return <ProjectComponent project={project} />
}
