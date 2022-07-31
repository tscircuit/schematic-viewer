import { ProjectClass } from "lib/project"
import * as Types from "lib/types"
import SchematicComponent from "./SchematicComponent"

interface Props {
  project: Types.Project
}

export const ProjectComponent = ({ project }: Props) => {
  const projectClass = new ProjectClass(project)

  return (
    <>
      {project.schematic_components.map((schematic_component) => (
        <SchematicComponent
          key={schematic_component.schematic_component_id}
          component={{
            source: projectClass.getSourceComponent(
              schematic_component.source_component_id
            ),
            schematic: schematic_component,
          }}
        />
      ))}
    </>
  )
}

export default ProjectComponent
