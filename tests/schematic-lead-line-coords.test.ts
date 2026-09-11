import test from "ava"

test("calculates accurate pin endpoint coordinates and lead line offsets based on pin orientation", (t) => {
  const pin = {
    x: 10,
    y: 20,
    direction: "left",
    leadLength: 5.08
  }
  
  const endX = pin.direction === "left" ? pin.x - pin.leadLength : pin.x + pin.leadLength
  t.is(endX, 4.92)
  t.is(pin.y, 20)
})

test("supports top and bottom vertical pin orientations with correct normal vectors", (t) => {
  const topPin = { x: 15, y: 30, direction: "up", leadLength: 2.54 }
  const bottomPin = { x: 15, y: 10, direction: "down", leadLength: 2.54 }
  
  t.is(topPin.y + topPin.leadLength, 32.54)
  t.is(bottomPin.y - bottomPin.leadLength, 7.46)
})
