import { createRenderContextStore } from "lib/render-context"
import { useMemo } from "react"
import { createContext } from "react"

export const StoreContext = createContext(null)

export const ContextProviders = ({ children }: { children?: any }) => {
  const store = useMemo(() => createRenderContextStore(), [])

  return (
    <StoreContext.Provider value={store as any}>
      {children}
    </StoreContext.Provider>
  )
}
