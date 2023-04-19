import { useMaybePromise } from "lib/hooks"
import { ProjectClass } from "@tscircuit/builder"
import * as Types from "lib/types"
import * as Components from "./"

interface Props {
  project: Types.Project | Promise<Types.Project>
}

export const ProjectComponent = ({ project: $project }: Props) => {
  const project = useMaybePromise($project)

  if (!project) return <span>loading</span>

  const projectClass = new ProjectClass(project as any)

  return (
    <>
      {project.schematic_components.map((schematic_component) => (
        <Components.SchematicComponent
          key={schematic_component.schematic_component_id}
          component={{
            source: projectClass.getSourceComponent(
              schematic_component.source_component_id
            ),
            schematic: schematic_component,
          }}
        />
      ))}
      {project.schematic_ports.map((schematic_port) => (
        <Components.SchematicPort
          key={schematic_port.schematic_port_id}
          port={{
            source: projectClass.getSourcePort(
              schematic_port.schematic_port_id
            ),
            schematic: schematic_port,
          }}
        />
      ))}
      {project.schematic_traces.map((schematic_trace) => (
        <Components.SchematicTrace
          key={schematic_trace.schematic_trace_id}
          trace={{
            source: projectClass.getSourceTrace(
              schematic_trace.source_trace_id
            ),
            schematic: schematic_trace,
          }}
        />
      ))}
      {project.schematic_texts.map((schematic_text) => (
        <Components.SchematicText
          key={schematic_text.schematic_text_id}
          schematic_text={schematic_text}
        />
      ))}
    </>
  )
}

export default ProjectComponent
