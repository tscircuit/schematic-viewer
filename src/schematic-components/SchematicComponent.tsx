import { ProjectClass } from "lib/project"
import * as Type from "lib/types"
import * as Component from "./"

interface Props {
  component: {
    source: Type.SourceComponent
    schematic: Type.SchematicComponent
  }
}

export const SchematicComponent = ({ component }: Props) => {
  const { source, schematic } = component
  switch (source.ftype) {
    case "simple_resistor": {
      return <Component.SimpleResistor component={{ source, schematic }} />
    }
    case "simple_capacitor": {
      return <Component.SimpleCapacitor component={{ source, schematic }} />
    }
    default: {
      return <div>unknown ftype: {component.source.ftype}</div>
    }
  }
}

export default SchematicComponent
