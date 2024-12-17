# circuit-to-svg

Circuit to SVG is a library that's used for converting Circuit JSON into an SVG.

Circuit to SVG attaches metadata, classes and ids to the SVG elements to allow
for interaction.

## Metadata

- `<g data-circuit-json-type="schematic_component" data-schematic-component-id="..."` - The id of the schematic component, the
  group contains all the relevant elements for the component.

## Example

Let's consider the following example:

```tsx
const MyCircuit = () => (
  <board width="10mm" height="10mm">
    <resistor name="R1" resistance={1000} schX={-2} />
    <capacitor name="C1" capacitance="1uF" schX={2} />
    <trace from=".R1 .pin2" to=".C1 .pin1" />
  </board>
)
```

Will become the following SVG:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="797" height="894" style="background-color: rgb(245, 241, 237)">
  <style>
    .boundary {
      fill: rgb(245, 241, 237);
    }

    .schematic-boundary {
      fill: none;
      stroke: #fff;
    }

    .component {
      fill: none;
      stroke: rgb(132, 0, 0);
    }

    .chip {
      fill: rgb(255, 255, 194);
      stroke: rgb(132, 0, 0);
    }

    .component-pin {
      fill: none;
      stroke: rgb(132, 0, 0);
    }

    .trace:hover {
      filter: invert(1);
    }

    .trace:hover .trace-crossing-outline {
      opacity: 0;
    }

    .text {
      font-family: sans-serif;
      fill: rgb(0, 150, 0);
    }

    .pin-number {
      fill: rgb(169, 0, 0);
    }

    .port-label {
      fill: rgb(0, 100, 100);
    }

    .component-name {
      fill: rgb(0, 100, 100);
    }
  </style>
  <rect class="boundary" x="0" y="0" width="797" height="894"></rect>
  <g data-circuit-json-type="schematic_component" data-schematic-component-id="schematic_component_0">
    <rect class="component-overlay" x="78.86811460613316" y="429.73733506761596" width="134.20710264125276" height="33.551785171052984" fill="transparent"></rect>
    <path d="M 78.86811460613316 446.51322765314245 L 112.41988709619969 446.51322765314245" stroke="rgb(132, 0, 0)" fill="none" stroke-width="2.5361972951480003px"></path>
    <path d="M 179.52343207633297 446.51322765314245 L 213.07521724738592 446.51322765314245" stroke="rgb(132, 0, 0)" fill="none" stroke-width="2.5361972951480003px"></path>
    <path d="M 145.9716469052798 463.28912023866894 L 179.52341939534634 463.28912023866894 L 179.52341939534634 429.73733506761596 L 112.4198617342266 429.73733506761596 L 112.4198617342266 463.28912023866894 L 145.97164690527958 463.28912023866894" stroke="rgb(132, 0, 0)" fill="none" stroke-width="2.5361972951480003px"></path>
    <text x="143.59516663479377" y="472.3617193317505" dominant-baseline="hanging" text-anchor="middle" font-family="sans-serif" font-size="22.825775656332px">R1</text>
    <text x="143.71715772469034" y="408.95729419250944" dominant-baseline="auto" text-anchor="middle" font-family="sans-serif" font-size="22.825775656332px">1kΩ</text>
    <circle cx="76.08591885434214" cy="446.4680579793156" r="2.5361972951480003px" stroke-width="2.5361972951480003px" fill="none" stroke="rgb(132, 0, 0)"></circle>
    <circle cx="211.46577180585794" cy="446.3987563882258" r="2.5361972951480003px" stroke-width="2.5361972951480003px" fill="none" stroke="rgb(132, 0, 0)"></circle>
  </g>
  <g data-circuit-json-type="schematic_component" data-schematic-component-id="schematic_component_1">
    <rect class="component-overlay" x="583.1218734129795" y="409.2994018456519" width="134.20710264125285" height="67.10354498013322" fill="transparent"></rect>
    <path d="M 717.3289760542324 442.8511743357183 L 660.2909640892178 442.8511743357183" stroke="rgb(132, 0, 0)" fill="none" stroke-width="2.5361972951480003px"></path>
    <path d="M 640.1598980589806 442.8511743357183 L 583.1218734129795 442.8511743357183" stroke="rgb(132, 0, 0)" fill="none" stroke-width="2.5361972951480003px"></path>
    <path d="M 660.2909640892178 476.40294682578514 L 660.2909640892178 409.2994018456519" stroke="rgb(132, 0, 0)" fill="none" stroke-width="2.5361972951480003px"></path>
    <path d="M 640.1598980589805 476.40294682578514 L 640.1598980589806 409.2994018456519" stroke="rgb(132, 0, 0)" fill="none" stroke-width="2.5361972951480003px"></path>
    <text x="649.3839588545285" y="493.9207532060613" dominant-baseline="hanging" text-anchor="middle" font-family="sans-serif" font-size="22.825775656332px">C1</text>
    <text x="650.5270229754516" y="387.39826031819865" dominant-baseline="auto" text-anchor="middle" font-family="sans-serif" font-size="22.825775656332px">1µF</text>
    <circle cx="581.1165275736789" cy="442.7367030708021" r="2.5361972951480003px" stroke-width="2.5361972951480003px" fill="none" stroke="rgb(132, 0, 0)"></circle>
    <circle cx="720.9140811457212" cy="442.80600466189185" r="2.5361972951480003px" stroke-width="2.5361972951480003px" fill="none" stroke="rgb(132, 0, 0)"></circle>
  </g>
  <g class="trace">
    <path d="M 211.46577180585794 446.3987563882258 L 562.0950478600689 446.3987563882258 L 581.1165275736789 446.3987563882258 L 581.1165275736789 442.73670307080215" class="trace-invisible-hover-outline" stroke="rgb(0, 150, 0)" fill="none" stroke-width="20.289578361184002px" stroke-linecap="round" opacity="0" stroke-linejoin="round"></path>
    <path d="M 211.46577180585794 446.3987563882258 L 562.0950478600689 446.3987563882258 L 581.1165275736789 446.3987563882258 L 581.1165275736789 442.73670307080215" stroke="rgb(0, 150, 0)" fill="none" stroke-width="2.5361972951480003px" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
</svg>
```
