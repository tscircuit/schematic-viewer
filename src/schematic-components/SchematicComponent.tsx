import { ProjectClass } from "lib/project"
import * as Type from "lib/types"
import SimpleResistor from "./SimpleResistor"

interface Props {
  component: {
    source: Type.SourceComponent
    schematic: Type.SchematicComponent
  }
}

export const SchematicComponent = ({ component }: Props) => {
  switch (component.source.ftype) {
    case "simple_resistor": {
      return <SimpleResistor component={component} />
    }
    default: {
      return <div>unknown ftype: {component.source.ftype}</div>
    }
  }
}

export default SchematicComponent
