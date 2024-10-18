import { useRenderedCircuit } from "@tscircuit/core"
import { findBoundsAndCenter } from "@tscircuit/soup-util"
import type { AnyCircuitElement } from "circuit-json"
import { useGlobalStore } from "lib/render-context"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { ErrorBoundary as TypedErrorBoundary } from "react-error-boundary"
import { SuperGrid, toMMSI } from "react-supergrid"
import useMeasure from "react-use-measure"
import { ContextProviders } from "schematic-components"
import { SchematicElement } from "schematic-components/SchematicElement"
import {
  applyToPoint,
  compose,
  inverse,
  Matrix,
  scale,
  translate,
} from "transformation-matrix"
import { TableViewer } from "./schematic-components/TableViewer"

const ErrorBoundary = TypedErrorBoundary as any

const fallbackRender: any =
  (elm) =>
  ({ error, resetErrorBoundary }: any) => {
    return (
      <div style={{ color: "red" }}>
        error rendering {elm.type}: {error.toString()}
      </div>
    )
  }

const toMMSINeg = (v: number, z: number) =>
  v >= 0 ? toMMSI(v, z) : `-${toMMSI(-v, z)}`

export interface SchematicProps {
  children?: any
  soup?: AnyCircuitElement[]
  style?: React.CSSProperties
  showTable?: boolean
  _soupPostProcessor?: (soup: AnyCircuitElement[]) => AnyCircuitElement[]
}

export const Schematic = (props: SchematicProps) => {
  return (
    <ContextProviders>
      <SchematicWithoutContext {...props} />
    </ContextProviders>
  )
}

export const SchematicWithoutContext = ({
  children,
  soup,
  style,
  showTable = false,
  _soupPostProcessor,
}: SchematicProps) => {
  const {
    circuitJson: circuitJsonFromChildren,
    error: errorFromChildren,
    isLoading,
  } = useRenderedCircuit(children)

  const [elements, setElements] = useState<AnyCircuitElement[]>([])
  const { setCameraTransform } = useGlobalStore()
  const [boundsRef, bounds] = useMeasure()
  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<Matrix>(compose(translate(0, 0), scale(1, 1)))
  const isDraggingRef = useRef(false)
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const [, forceUpdate] = useState({})

  const updateTransform = useCallback(
    (newTransform: Matrix) => {
      transformRef.current = newTransform
      setCameraTransform(newTransform)
      forceUpdate({})
    },
    [setCameraTransform],
  )

  useEffect(() => {
    let processedElements: AnyCircuitElement[] = []
    if (circuitJsonFromChildren && (!soup || soup.length === 0)) {
      processedElements = circuitJsonFromChildren as AnyCircuitElement[]
    } else if (soup && soup.length > 0) {
      processedElements = soup
    }

    if (processedElements.length > 0) {
      if (_soupPostProcessor) {
        processedElements = _soupPostProcessor(processedElements)
      }
      setElements(processedElements)
    }
  }, [circuitJsonFromChildren, soup, _soupPostProcessor])

  useEffect(() => {
    if (elements.length > 0 && containerRef.current) {
      const elmBounds = containerRef.current.getBoundingClientRect()

      const { center, width, height } = elements.some((e) =>
        e.type.startsWith("schematic_"),
      )
        ? findBoundsAndCenter(
            elements.filter((e) => e.type.startsWith("schematic_")),
          )
        : { center: { x: 0, y: 0 }, width: 0.001, height: 0.001 }

      const scaleFactor = Math.min(
        (elmBounds.width ?? 0) / width,
        (elmBounds.height ?? 0) / height,
        100,
      )

      const newTransform = compose(
        translate((elmBounds.width ?? 0) / 2, (elmBounds.height ?? 0) / 2),
        scale(scaleFactor, -scaleFactor, 0, 0),
        translate(-center.x, -center.y),
      )

      updateTransform(newTransform)
    }
  }, [elements, bounds.width, bounds.height, updateTransform])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true
    lastMousePosRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return

      const dx = e.clientX - lastMousePosRef.current.x
      const dy = e.clientY - lastMousePosRef.current.y
      lastMousePosRef.current = { x: e.clientX, y: e.clientY }

      const scale = transformRef.current.a // Assuming uniform scaling
      const dragSensitivity = 150 / scale // Adjust this value to change drag speed

      const newTransform = compose(
        translate(dx * dragSensitivity, dy * dragSensitivity),
        transformRef.current,
      )
      updateTransform(newTransform)
    },
    [updateTransform],
  )

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      const scaleMultiplier = Math.pow(0.999, e.deltaY)

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        const inverseTransform = inverse(transformRef.current)
        const transformedPoint = applyToPoint(inverseTransform, {
          x: mouseX,
          y: mouseY,
        })

        const newTransform = compose(
          transformRef.current,
          translate(transformedPoint.x, transformedPoint.y),
          scale(scaleMultiplier, scaleMultiplier),
          translate(-transformedPoint.x, -transformedPoint.y),
        )

        updateTransform(newTransform)
      }
    },
    [updateTransform],
  )

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
      return () => {
        container.removeEventListener("wheel", handleWheel)
      }
    }
  }, [handleWheel])

  if (errorFromChildren) {
    return <div>Error: {errorFromChildren.message}</div>
  }

  return (
    <>
      <div
        style={{
          width: "100%",
          backgroundColor: "rgba(255,255,255,0)",
          minHeight: 200,
          overflow: "hidden",
          position: "relative",
          isolation: "isolate",
          cursor: isDraggingRef.current ? "grabbing" : "grab",
          ...style,
        }}
        ref={(el) => {
          containerRef.current = el
          boundsRef(el)
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <SuperGrid
          stringifyCoord={(x, y, z) => {
            if (z === 0) return ""
            return `${toMMSINeg(x, z)}, ${toMMSINeg(y, z)}`
          }}
          width={bounds.width}
          height={bounds.height}
          transform={transformRef.current}
        />
        {elements?.map((elm, i) => (
          <ErrorBoundary key={i} fallbackRender={fallbackRender(elm)}>
            <SchematicElement
              element={elm}
              allElements={elements}
              key={JSON.stringify(elm)}
            />
          </ErrorBoundary>
        ))}
      </div>
      {showTable !== false && elements && <TableViewer elements={elements as any} />}
    </>
  )
}
