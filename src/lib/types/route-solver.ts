export type RouteSolver = (params: {
  terminals: Array<{
    x: number
    y: number
    facing_direction?: "up" | "down" | "left" | "right"
  }>
  obstacles: Array<{ cx: number; cy: number; w: number; h: number }>
}) => Promise<
  Array<{ from: { x: number; y: number }; to: { x: number; y: number } }>
>
