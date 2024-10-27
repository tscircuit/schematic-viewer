import type {
  AnyCircuitElement,
  SchematicComponent as SchematicComponentType,
} from "circuit-json"
import * as Component from "./"

interface Props {
  component: {
    source: any
    schematic: SchematicComponentType
    schematic_children: any[]
    allElements: AnyCircuitElement[]
  }
}

/**
 * @deprecated ftype-style rendering is being deprecated in favor of the builder
 * generating schematic lines directly
 */
export const SchematicComponent = ({ component }: Props) => {
  const { source, schematic, allElements } = component
  if (!source.ftype) return null

  switch (source.ftype) {
    case "simple_resistor":
    case "simple_capacitor":
    case "simple_power_source":
    case "simple_ground":
    case "simple_inductor":
    case "simple_diode": {
      return (
        <Component.SchematicComponentFromSymbol
          component={{ source, schematic }}
        />
      )
    }
    case "simple_chip":
    case "simple_bug": {
      return (
        <Component.SchematicChip
          component={{ source, schematic, allElements }}
        />
      )
    }
    default: {
      return <div>unknown ftype: {component.source.ftype}</div>
    }
  }
}

export default SchematicComponent
