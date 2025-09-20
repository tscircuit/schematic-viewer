import { useCallback, useState } from "react"
import { ControlledSchematicViewer } from "lib/components/ControlledSchematicViewer"
import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"

export default function Example14DoubleClickEdit() {
  const [lastDoubleClickedComponent, setLastDoubleClickedComponent] = useState<
    string | null
  >(null)

  const handleDoubleClick = useCallback(
    ({ schematicComponentId }: { schematicComponentId: string }) => {
      setLastDoubleClickedComponent(schematicComponentId)

      if (typeof window !== "undefined") {
        window.alert(`Open edit dialog for ${schematicComponentId}`)
      }
    },
    [],
  )

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1rem",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ flex: 1, minHeight: 400 }}>
        <ControlledSchematicViewer
          circuitJson={renderToCircuitJson(
            <board width="12mm" height="12mm">
              <resistor
                name="R1"
                resistance={220}
                schX={-3}
                schY={1}
              />
              <capacitor
                name="C1"
                capacitance="10uF"
                schX={3}
                schY={-1}
              />
              <opAmp name="U1" schX={0} schY={0} />
              <trace from=".R1 .pin2" to=".U1 .nonInverting" />
              <trace from=".C1 .pin1" to=".U1 .inverting" />
            </board>,
          )}
          containerStyle={{ height: "100%" }}
          onClickComponent={handleDoubleClick}
        />
      </div>

      <div>
        <p>
          Double-click any component to simulate opening its editing dialog. The
          cursor becomes a pointer to indicate interactivity.
        </p>
        {lastDoubleClickedComponent ? (
          <p>
            Last double-clicked component: <strong>{lastDoubleClickedComponent}</strong>
          </p>
        ) : (
          <p>Double-click a component to see its identifier here.</p>
        )}
      </div>
    </div>
  )
}
