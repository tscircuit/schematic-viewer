import {
  createStore as createZustandStore,
  useStore as useZustandStore,
  UseBoundStore,
} from "zustand"
import { Matrix, compose, scale } from "transformation-matrix"
import { useContext } from "react"
import { StoreContext } from "schematic-components/"

interface RenderContextState {
  camera_transform: Matrix
  setCameraTransform: (transform: Matrix) => void
}

export const createRenderContextStore = () =>
  createZustandStore<RenderContextState>((set) => ({
    camera_transform: compose(scale(100, 100, 0, 0)),
    setCameraTransform: (transform: Matrix) =>
      set({ camera_transform: transform }),
  }))

export const useGlobalStore = <T = RenderContextState>(
  s?: (state: RenderContextState) => T,
): T => {
  const store = useContext(StoreContext)

  return useZustandStore(store as any, s as any)
}
