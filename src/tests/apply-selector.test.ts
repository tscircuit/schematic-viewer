import * as Type from "lib/types"
import { createProjectBuilder, ProjectClass } from "lib/project"
import test from "ava"
import parsel from "parsel-js"

const applySelector = (elements: Type.AnyElement[], selectorRaw: string) => {
  const selectorAST = parsel.parse(selectorRaw)
  return applySelectorAST(elements, selectorAST)
}

const applySelectorAST = (
  elements: Type.AnyElement[],
  selectorAST: parsel.AST
): Type.AnyElement[] => {
  switch (selectorAST.type) {
    case "complex": {
      switch (selectorAST.combinator) {
        case ">": {
          return []
        }
        default: {
          throw new Error(
            `Couldn't apply selector AST for complex combinator "${selectorAST.combinator}"`
          )
        }
      }
      return []
    }
    case "compound": {
      return []
    }
    default: {
      throw new Error(
        `Couldn't apply selector AST for type: "${selectorAST.type}"`
      )
    }
  }
}

test("applySelector use css selector to select circuit elements", async (t) => {
  const project = new ProjectClass(
    createProjectBuilder()
      .addGroup((gb) =>
        gb
          .addComponent((cb) =>
            cb.setSourceProperties("simple_resistor", {
              resistance: "10 ohm",
              name: "R1",
            })
          )
          .addComponent((cb) =>
            cb.setSourceProperties("simple_capacitor", {
              name: "C1",
              capacitance: "10 uF",
            })
          )
      )
      .build()
  )
  const elements = project.getElements()
  const selector = ".R1 > port.right"
  /*
  parsel.parse(selector)
  https://projects.verou.me/parsel/?selector=.R1+%3E+port.right
  {
    "type": "complex",
    "combinator": ">",
    "left": {
      "type": "class",
      "content": ".R1",
      "name": "R1",
      "pos": [
        0,
        3
      ]
    },
    "right": {
      "type": "compound",
      "list": [
        {
          "type": "type",
          "content": "port",
          "name": "port",
          "pos": [
            6,
            10
          ]
        },
        {
          "type": "class",
          "content": ".right",
          "name": "right",
          "pos": [
            10,
            16
          ]
        }
      ]
    }
  }
  */
  console.log(applySelector(elements, selector))
  t.pass()
})
