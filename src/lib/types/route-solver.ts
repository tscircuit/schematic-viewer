export type RouteSolver = (params: {
  terminals: Array<{ x: number; y: number }>
  obstacles: Array<{ cx: number; cy: number; w: number; h: number }>
}) => Promise<
  Array<{ from: { x: number; y: number }; to: { x: number; y: number } }>
>
