import { JSDOM } from "jsdom"

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
})

// @ts-ignore
globalThis.document = dom.window.document
globalThis.window = dom.window as any
globalThis.Element = dom.window.Element
globalThis.Node = dom.window.Node
globalThis.MouseEvent = dom.window.MouseEvent
globalThis.SVGElement = dom.window.SVGElement
globalThis.SVGGElement = dom.window.SVGGElement
