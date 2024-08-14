import { NumberWithUnit } from "./util"

export interface SourceComponentBase {
  type: "source_component"
  /** The functional type of this component, e.g. resistor, capacitor etc. */
  ftype?: string
  source_component_id: string
  name: string
}

export interface SimpleResistor extends SourceComponentBase {
  ftype: "simple_resistor"
  // Resistance measured in ohms
  resistance: NumberWithUnit<"ohm">
}

export interface SimpleCapacitor extends SourceComponentBase {
  ftype: "simple_capacitor"
  // Capacitance measured in farads
  capacitance: NumberWithUnit<"farad">
}

export interface SimpleInductor extends SourceComponentBase {
  ftype: "simple_inductor"
  // Inductance measured in henries
  inductance: NumberWithUnit<"henry">
}

export interface SimpleDiode extends SourceComponentBase {
  ftype: "simple_diode"
}

export type LightEmittingDiode = SimpleDiode & {
  ftype: "led"
}

export interface SimpleBug extends SourceComponentBase {
  manufacturerPartNumber: any
  ftype: "simple_bug"
}

export interface SimplePowerSource extends SourceComponentBase {
  ftype: "simple_power_source"
  voltage: NumberWithUnit<"volt">
}

export interface SimpleGround extends SourceComponentBase {
  ftype: "simple_ground"
}

export interface Switch extends SourceComponentBase {
  ftype: "switch"
  closed: boolean
}

export type AnySourceComponent =
  | SimpleResistor
  | SimpleCapacitor
  | SimpleBug
  | SimpleInductor
  | SimplePowerSource
  | SimpleGround
  | Switch
  | SimpleDiode
  | LightEmittingDiode
  | Omit<SourceComponentBase, "ftype">

export type SourceComponentFType = Extract<
  AnySourceComponent,
  { ftype: string }
>["ftype"]
export type SourceComponent<
  T extends SourceComponentFType = SourceComponentFType
> = Extract<AnySourceComponent, { ftype: T }>
