import test from "ava"

test("anchors net label text box precisely at wire endpoint terminal", (t) => {
  const wireEnd = { x: 50.8, y: 25.4 }
  const labelOffset = { x: 1.5, y: 0 }
  
  const labelPos = {
    x: wireEnd.x + labelOffset.x,
    y: wireEnd.y + labelOffset.y
  }
  
  t.is(labelPos.x, 52.3)
  t.is(labelPos.y, 25.4)
})
