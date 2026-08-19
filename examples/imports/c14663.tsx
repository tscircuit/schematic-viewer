import type { CapacitorProps } from "@tscircuit/props"

export const CC0603KRX7R9BB104 = (
  props: Omit<CapacitorProps, "capacitance">,
) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="100nF"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      manufacturerPartNumber="CC0603KRX7R9BB104"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin2"]}
            pcbX="0.700024mm"
            pcbY="0mm"
            width="0.7999984mm"
            height="0.8999982mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.700024mm"
            pcbY="0mm"
            width="0.7999984mm"
            height="0.8999982mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -0.2801874, y: -0.7095744 },
              { x: -1.0801604, y: -0.7095744 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.2802636, y: -0.7100316 },
              { x: 1.0802366, y: -0.7100316 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.2801874, y: 0.7101078 },
              { x: -1.0801604, y: 0.7101078 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.2802636, y: 0.7096252 },
              { x: 1.0802366, y: 0.7096252 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.3899134, y: -0.3997452 },
              { x: -1.3899134, y: 0.400304 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.390015, y: 0.3997706 },
              { x: 1.390015, y: -0.4002532 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.0801858, y: 0.7096252 },
              { x: 1.2992771, y: 0.61886935 },
              { x: 1.390015, y: 0.3997706 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.390015, y: -0.4002024 },
              { x: 1.2992681, y: -0.6192847 },
              { x: 1.0801858, y: -0.7100316 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.0801096, y: -0.7095744 },
              { x: -1.2991755, y: -0.61881855 },
              { x: -1.3899134, y: -0.3997452 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.3899134, y: 0.4002278 },
              { x: -1.2991935, y: 0.619334 },
              { x: -1.0801096, y: 0.7101078 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.0127mm"
            pcbY="1.7112mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.647, y: 0.9612 },
              { x: 1.6216, y: 0.9612 },
              { x: 1.6216, y: -0.9612 },
              { x: -1.647, y: -0.9612 },
              { x: -1.647, y: 0.9612 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C14663.obj?uuid=ac9b32e974bc448eab36b1293f859dcb",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C14663.step?uuid=ac9b32e974bc448eab36b1293f859dcb",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.4 },
      }}
      {...restProps}
    />
  )
}
