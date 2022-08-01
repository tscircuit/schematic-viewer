import * as Type from "lib/types"
import * as parsel from "parsel-js"

/**
 * Filter elements to match the selector, e.g. to access the left port of a
 * resistor you can do ".R1 > port.left"
 */
export const applySelector = (
  elements: Type.AnyElement[],
  selectorRaw: string
) => {
  const selectorAST = parsel.parse(selectorRaw)
  return applySelectorAST(elements, selectorAST)
}

export const applySelectorAST = (
  elements: Type.AnyElement[],
  selectorAST: parsel.AST
): Type.AnyElement[] => {
  switch (selectorAST.type) {
    case "complex": {
      switch (selectorAST.combinator) {
        case ">": {
          const { left, right } = selectorAST
          if (left.type === "class") {
            // TODO should also check if content matches any element tags
            const matchElms = elements.filter(
              (elm) => "name" in elm && elm.name === left.name
            )
            const childrenOfMatchingElms = matchElms.flatMap((matchElm) =>
              elements.filter(
                (elm) =>
                  elm[`${matchElm.type}_id`] ===
                    matchElm[`${matchElm.type}_id`] && elm !== matchElm
              )
            )
            return applySelectorAST(childrenOfMatchingElms, right)
          } else {
            throw new Error(`unsupported selector class "${left.type}"`)
          }
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
      const conditionsToMatch = selectorAST.list.map((part) => {
        switch (part.type) {
          case "class": {
            return (elm) => "name" in elm && elm.name === part.name
          }
          case "type": {
            if (part.name === "port") part.name = "source_port"
            return (elm) => elm.type === part.name
          }
        }
      })

      return elements.filter((elm) =>
        conditionsToMatch.every((condFn) => condFn(elm))
      )
    }
    default: {
      throw new Error(
        `Couldn't apply selector AST for type: "${selectorAST.type}"`
      )
    }
  }
}
