import type { CircuitJson } from "circuit-json"
import { SchematicViewer } from "lib/index"
import { useEffect, useState } from "react"

const CIRCUIT_JSON_URL =
  "https://registry-api.tscircuit.com/snippets/get?snippet_id=1bb7c947-85fc-4cbb-bbbe-d326676f4042"

export default () => {
  const [circuitJson, setCircuitJson] = useState<CircuitJson | null>(null)

  useEffect(() => {
    fetch(CIRCUIT_JSON_URL)
      .then((r) => r.json())
      .then((data) => setCircuitJson(data.snippet.circuit_json as CircuitJson))
      .catch(console.error)
  }, [])

  if (!circuitJson) return <div style={{ padding: 20 }}>Loading circuit...</div>

  return (
    <div style={{ position: "relative", height: "100%" }}>
      <SchematicViewer
        circuitJson={circuitJson}
        containerStyle={{ height: "100%" }}
        debugGrid
        editingEnabled
      />
    </div>
  )
}
