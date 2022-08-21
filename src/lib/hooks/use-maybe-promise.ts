import { useEffect, useState } from "react"

export const useMaybePromise = <T>(promise: Promise<T> | T): T | null => {
  const [state, setState] = useState<T | null>(null)
  useEffect(() => {
    if (promise instanceof Promise) {
      promise.then(setState)
    } else {
      setState(promise)
    }
  }, [promise])
  return state
}
export default useMaybePromise
