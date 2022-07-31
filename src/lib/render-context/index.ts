import createStore from "zustand"
import { Matrix, compose, scale } from "transformation-matrix"

interface RenderContextState {
  camera_transform: Matrix
}

export const useRenderContext = createStore<RenderContextState>()(
  (set, get) => ({
    camera_transform: compose(scale(100, 100, 0, 0)),
  })
)

export const useCameraTransform = () =>
  useRenderContext((s) => s.camera_transform)
