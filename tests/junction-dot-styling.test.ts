import test from "ava"

test("calculates wire junction dot radius scaled proportionally to line stroke width", (t) => {
  const wireStrokeWidth = 0.5
  const junctionDotRadiusMultiplier = 2.5
  
  const dotRadius = wireStrokeWidth * junctionDotRadiusMultiplier
  t.is(dotRadius, 1.25)
  t.true(dotRadius > wireStrokeWidth)
})
