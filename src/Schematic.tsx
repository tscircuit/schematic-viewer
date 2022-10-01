import { useEffect, useState } from "react"
import { ProjectComponent } from "schematic-components"
import {
  createProjectBuilder,
  createProjectFromElements,
} from "@tscircuit/builder"
import { createRoot } from "@tscircuit/react-fiber"

export const Schematic = ({ children }) => {
  const [elements, setElements] = useState([])

  useEffect(() => {
    // TODO re-use project builder
    const projectBuilder = createProjectBuilder()
    createRoot()
      .render(children, projectBuilder as any)
      .then((elements) => setElements(elements))
  }, [children])

  if (elements.length === 0) return null

  return <ProjectComponent project={createProjectFromElements(elements)} />
}
