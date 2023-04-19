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
    case "simple_power_source": {
      return <Component.SimplePowerSource component={{ source, schematic }} />
    }
    case "simple_ground": {
      return <Component.SimpleGround component={{ source, schematic }} />
    }
    case "simple_inductor": {
      return <Component.SimpleInductor component={{ source, schematic }} />
    }
    case "simple_bug": {
      return <Component.SchematicBug component={{ source, schematic }} />
    }
    case "simple_diode": {
      return <Component.SimpleDiode component={{ source, schematic }} />
    }
    default: {
      return <div>unknown ftype: {component.source.ftype}</div>
    }
  }
}

export default SchematicComponent
