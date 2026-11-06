# Repro: internal Circuit JSON IDs shown in component details

## Source of truth

This fixture **does not construct a `source_component` object manually**. It
compiles a real tscircuit component with `renderToCircuitJson` (backed by
`@tscircuit/core`) and passes the generated `source_component` to the tooltip.

```tsx
const circuitJson = renderToCircuitJson(
  <board>
    <pushbutton
      name="SW1"
      pinLabels={{ pin1: ["A"], pin2: ["B"], pin3: ["A2"], pin4: ["B2"] }}
      internallyConnectedPins={[
        ["pin1", "pin3"],
        ["pin2", "pin4"],
      ]}
    />
  </board>,
)
```

`SW1` is the reference designator in the circuit's JSX source. The compiler
emits its name, type, and internal port references in Circuit JSON. A sample of
the actual generated data is:

```json
{
  "type": "source_component",
  "source_component_id": "source_component_0",
  "name": "SW1",
  "ftype": "simple_push_button",
  "are_pins_interchangeable": true,
  "source_group_id": "source_group_0",
  "internally_connected_source_port_ids": [
    ["source_port_0", "source_port_2"],
    ["source_port_1", "source_port_3"]
  ]
}
```

The port identifiers are generated, **not typed into the fixture**. The
`internallyConnectedPins` prop connects each pair of duplicate contacts
(`1`/`3` and `2`/`4`) without shorting the button's two signal terminals.
This is a generic four-terminal button model, not a claim about the pinout of
a particular manufacturer part. There is no `manufacturer_part_number` in the
output because no manufacturer part was specified or verified. The fixture intentionally does
not invent one.

## Steps to reproduce

1. Run `bun install` and `bun start` from the repository.
2. Open `example40-long-component-details-label` in React Cosmos.
3. Inspect the generated `SW1` component details tooltip.

**Before the fix:** the popup exposes `internally_connected_source_port_ids`
and the generated `source_port_*` values. The long key can overlap the value.

**Expected:** the popup shows actual user-relevant fields (here, `name: SW1`)
without implementation IDs. Those IDs remain present in Circuit JSON for
electrical connectivity. The fix and regression tests are in
[PR #304](https://github.com/tscircuit/schematic-viewer/pull/304).

## Screenshots from the actual generated source component

| Before (base branch) | After (fix in PR #304) |
| --- | --- |
| ![Generated source with internal IDs exposed](https://cdn.creativeclaw.co/u/ab2b5820/images/4de8c808-31c1-437c-a638-f3a40c7ec9af.png) | ![Generated source with internal IDs hidden](https://cdn.creativeclaw.co/u/ab2b5820/images/a7df2995-74a4-4d80-ae02-4bdecd86b18b.png) |

Both images render the HTML emitted by the fixture's actual React component
from the corresponding source branch. This validates the static tooltip
output; it is not a substitute for an interactive browser test. This PR
contains only the reproduction, not the viewer fix.
