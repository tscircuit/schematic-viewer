import { Switch } from "../schematic-components/Switch"

export const OpenSwitch = () => (
  <svg width="200" height="120">
    <Switch
      schematic_component_id="switch1"
      rotation={0}
      size={{ width: 100, height: 60 }}
      center={{ x: 100, y: 60 }}
      type={"schematic_component"}
      source_component_id={""}
    />
  </svg>
)

export const ClosedSwitch = () => (
  <svg width="200" height="120">
    <Switch
      schematic_component_id="switch2"
      rotation={0}
      size={{ width: 100, height: 60 }}
      center={{ x: 100, y: 60 }}
      closed={true}
      type={"schematic_component"}
      source_component_id={""}
    />
  </svg>
)

export const RotatedSwitch = () => (
  <svg width="200" height="120">
    <Switch
      schematic_component_id="switch3"
      rotation={90}
      size={{ width: 100, height: 60 }}
      center={{ x: 100, y: 60 }}
      type={"schematic_component"}
      source_component_id={""}
    />
  </svg>
)

export default {
  title: "Circuit Components/Switch",
  component: Switch,
}
