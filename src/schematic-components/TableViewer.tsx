import { lazy, Suspense } from "react"

const LazyTableViewer = lazy(() =>
  import("@tscircuit/table-viewer").then((m) => ({
    default: m.SoupTableViewer,
  }))
)

export const TableViewer = (params: Parameters<typeof LazyTableViewer>[0]) => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyTableViewer {...params} />
  </Suspense>
)
