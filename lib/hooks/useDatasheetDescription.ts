import { useEffect, useState } from "react"
import { fetchDatasheetDescription } from "../utils/datasheet-description"

export const useDatasheetDescription = (partNumber?: string) => {
  const chipName = partNumber?.trim()
  const [result, setResult] = useState<{
    chipName: string
    description?: string
    expanded: boolean
  }>()
  const [finishedChipName, setFinishedChipName] = useState<string>()

  useEffect(() => {
    setResult(undefined)
    setFinishedChipName(undefined)
    if (!chipName) return

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
      setFinishedChipName(chipName)
    }, 10000)

    const load = async () => {
      try {
        const description = await fetchDatasheetDescription(
          chipName,
          controller.signal,
        )
        if (!controller.signal.aborted && description) {
          setResult({
            chipName,
            description: description.trim(),
            expanded: false,
          })
        }
      } catch {
        // Missing datasheets and unavailable API responses leave the menu unchanged.
      } finally {
        clearTimeout(timeout)
        if (!controller.signal.aborted) setFinishedChipName(chipName)
      }
    }
    void load()
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [chipName])

  const currentResult = result?.chipName === chipName ? result : undefined
  return {
    description: currentResult?.description,
    expanded: currentResult?.expanded ?? false,
    loading: Boolean(chipName && finishedChipName !== chipName),
    toggleExpanded: () =>
      setResult((previous) =>
        previous && previous.chipName === chipName
          ? { ...previous, expanded: !previous.expanded }
          : previous,
      ),
  }
}
