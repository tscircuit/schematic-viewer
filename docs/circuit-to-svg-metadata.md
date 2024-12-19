# circuit-to-svg

Circuit to SVG is a library that's used for converting Circuit JSON into an SVG.

Circuit to SVG attaches metadata, classes and ids to the SVG elements to allow
for interaction.

## Metadata

- `<g data-circuit-json-type="schematic_component" data-schematic-component-id="..."` - The id of the schematic component, the
  group contains all the relevant elements for the component.
- `<g data-circuit-json-type="schematic_trace" data-schematic-trace-id="..."` - The id of the schematic trace, the
  group contains all the relevant elements for the trace.

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
<svg xmlns="http://www.w3.org/2000/svg" width="1728" height="421" style="background-color: rgb(245, 241, 237)" data-real-to-screen-transform="matrix(264.7769766545,0,0,-264.7769766545,861.6939778772,210.5)">
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
  <rect class="boundary" x="0" y="0" width="1728" height="421"></rect>
  <g class="grid">
    <line x1="-197.41392874079997" y1="421.0000000000242" x2="-197.41392874079997" y2="-2.4243718144134618e-11" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="67.36304791370003" y1="421.0000000000242" x2="67.36304791370003" y2="-2.4243718144134618e-11" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="332.14002456820003" y1="421.0000000000242" x2="332.14002456820003" y2="-2.4243718144134618e-11" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="596.9170012227" y1="421.0000000000242" x2="596.9170012227" y2="-2.4243718144134618e-11" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="861.6939778772" y1="421.0000000000242" x2="861.6939778772" y2="-2.4243718144134618e-11" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="1126.4709545317" y1="421.0000000000242" x2="1126.4709545317" y2="-2.4243718144134618e-11" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="1391.2479311862" y1="421.0000000000242" x2="1391.2479311862" y2="-2.4243718144134618e-11" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="1656.0249078407" y1="421.0000000000242" x2="1656.0249078407" y2="-2.4243718144134618e-11" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="1920.8018844952" y1="421.0000000000242" x2="1920.8018844952" y2="-2.4243718144134618e-11" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="31.938350863210758" y1="475.2769766545" x2="1696.0616491367432" y2="475.2769766545" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="31.938350863210758" y1="210.5" x2="1696.0616491367432" y2="210.5" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <line x1="31.938350863210758" y1="-54.276976654500004" x2="1696.0616491367432" y2="-54.276976654500004" stroke="rgb(181, 181, 181)" stroke-width="2.647769766545" stroke-opacity="0.5"></line>
    <text x="-199.91392874079997" y="470.2769766545" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-4,-1</text>
    <text x="-199.91392874079997" y="205.5" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-4,0</text>
    <text x="-199.91392874079997" y="-59.276976654500004" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-4,1</text>
    <text x="64.86304791370003" y="470.2769766545" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-3,-1</text>
    <text x="64.86304791370003" y="205.5" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-3,0</text>
    <text x="64.86304791370003" y="-59.276976654500004" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-3,1</text>
    <text x="329.64002456820003" y="470.2769766545" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-2,-1</text>
    <text x="329.64002456820003" y="205.5" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-2,0</text>
    <text x="329.64002456820003" y="-59.276976654500004" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-2,1</text>
    <text x="594.4170012227" y="470.2769766545" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-1,-1</text>
    <text x="594.4170012227" y="205.5" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-1,0</text>
    <text x="594.4170012227" y="-59.276976654500004" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">-1,1</text>
    <text x="859.1939778772" y="470.2769766545" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">0,-1</text>
    <text x="859.1939778772" y="205.5" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">0,0</text>
    <text x="859.1939778772" y="-59.276976654500004" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">0,1</text>
    <text x="1123.9709545317" y="470.2769766545" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">1,-1</text>
    <text x="1123.9709545317" y="205.5" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">1,0</text>
    <text x="1123.9709545317" y="-59.276976654500004" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">1,1</text>
    <text x="1388.7479311862" y="470.2769766545" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">2,-1</text>
    <text x="1388.7479311862" y="205.5" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">2,0</text>
    <text x="1388.7479311862" y="-59.276976654500004" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">2,1</text>
    <text x="1653.5249078407" y="470.2769766545" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">3,-1</text>
    <text x="1653.5249078407" y="205.5" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">3,0</text>
    <text x="1653.5249078407" y="-59.276976654500004" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">3,1</text>
    <text x="1918.3018844952" y="470.2769766545" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">4,-1</text>
    <text x="1918.3018844952" y="205.5" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">4,0</text>
    <text x="1918.3018844952" y="-59.276976654500004" fill="rgb(181, 181, 181)" font-size="52.955395330900004" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">4,1</text>
  </g>
  <g data-circuit-json-type="schematic_component" data-schematic-component-id="schematic_component_0" style="">
    <rect class="component-overlay" x="196.61371724601327" y="174.45583073493046" width="280.2222914667798" height="70.05559272496805" fill="transparent"></rect>
    <path d="M 196.61371724601327 209.48362709741448 L 266.66928349328373 209.48362709741448" stroke="rgb(132, 0, 0)" fill="none" stroke-width="5.29553953309px"></path>
    <path d="M 406.78041598782505 209.48362709741448 L 476.83600871279305 209.48362709741448" stroke="rgb(132, 0, 0)" fill="none" stroke-width="5.29553953309px"></path>
    <path d="M 336.7248232628566 244.5114234598985 L 406.78038951012707 244.5114234598985 L 406.78038951012707 174.45583073493046 L 266.6692305378881 174.45583073493046 L 266.6692305378881 244.5114234598985 L 336.72482326285615 244.5114234598985" stroke="rgb(132, 0, 0)" fill="none" stroke-width="5.29553953309px"></path>
    <text x="331.762770331863" y="263.45486577694686" dominant-baseline="hanging" text-anchor="middle" font-family="sans-serif" font-size="47.659855797809996px">R1</text>
    <text x="332.0174857834045" y="131.06743655760317" dominant-baseline="auto" text-anchor="middle" font-family="sans-serif" font-size="47.659855797809996px">1kΩ</text>
    <circle cx="190.80453685591092" cy="209.38931353832953" r="5.29553953309px" stroke-width="5.29553953309px" fill="none" stroke="rgb(132, 0, 0)"></circle>
    <circle cx="473.4755122804894" cy="209.2446129205882" r="5.29553953309px" stroke-width="5.29553953309px" fill="none" stroke="rgb(132, 0, 0)"></circle>
  </g>
  <g data-circuit-json-type="schematic_component" data-schematic-component-id="schematic_component_1" style="">
    <rect class="component-overlay" x="1249.4875293817756" y="131.78175188522167" width="280.22229146678" height="140.11113249454112" fill="transparent"></rect>
    <path d="M 1529.7098208485556 201.83731813249176 L 1410.6153608759655 201.83731813249176" stroke="rgb(132, 0, 0)" fill="none" stroke-width="5.29553953309px"></path>
    <path d="M 1368.5820158320637 201.83731813249176 L 1249.4875293817756 201.83731813249176" stroke="rgb(132, 0, 0)" fill="none" stroke-width="5.29553953309px"></path>
    <path d="M 1410.6153608759655 271.8928843797628 L 1410.6153608759655 131.78175188522167" stroke="rgb(132, 0, 0)" fill="none" stroke-width="5.29553953309px"></path>
    <path d="M 1368.5820158320637 271.8928843797628 L 1368.5820158320637 131.78175188522167" stroke="rgb(132, 0, 0)" fill="none" stroke-width="5.29553953309px"></path>
    <text x="1387.8417077700283" y="308.4697849218618" dominant-baseline="hanging" text-anchor="middle" font-family="sans-serif" font-size="47.659855797809996px">C1</text>
    <text x="1390.2284074375918" y="86.05251741268826" dominant-baseline="auto" text-anchor="middle" font-family="sans-serif" font-size="47.659855797809996px">1µF</text>
    <circle cx="1245.3003992283566" cy="201.5983039556664" r="5.29553953309px" stroke-width="5.29553953309px" fill="none" stroke="rgb(132, 0, 0)"></circle>
    <circle cx="1537.1954631440433" cy="201.74300457340775" r="5.29553953309px" stroke-width="5.29553953309px" fill="none" stroke="rgb(132, 0, 0)"></circle>
  </g>
  <g class="trace" data-circuit-json-type="schematic_trace" data-schematic-trace-id="schematic_trace_0">
    <path d="M 473.47551228048934 209.2446129205882 L 1205.5838527301817 209.2446129205882 L 1245.3003992283566 209.2446129205882 L 1245.3003992283566 201.59830395566638" class="trace-invisible-hover-outline" stroke="rgb(0, 150, 0)" fill="none" stroke-width="42.36431626472px" stroke-linecap="round" opacity="0" stroke-linejoin="round"></path>
    <path d="M 473.47551228048934 209.2446129205882 L 1205.5838527301817 209.2446129205882 L 1245.3003992283566 209.2446129205882 L 1245.3003992283566 201.59830395566638" stroke="rgb(0, 150, 0)" fill="none" stroke-width="5.29553953309px" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
</svg>
```
