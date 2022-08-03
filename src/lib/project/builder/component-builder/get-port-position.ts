export const getPortPosition = (
  port_arrangement: { left_size: number; right_size: number },
  position: number
) => {
  if (position < port_arrangement.left_size) {
    return { x: -0.5, y: (position - 1) * 0.5 }
  }
  return { x: 0.5, y: (port_arrangement.left_size - position + 1) * 0.5 }
}

export default getPortPosition
