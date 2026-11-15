export const getDescriptionPreview = (description: string) =>
  Array.from(description).slice(0, 140).join("")

export const fetchDatasheetDescription = async (
  chipName: string,
  signal: AbortSignal,
): Promise<string | undefined> => {
  const response = await fetch(
    `https://api.tscircuit.com/datasheets/get?chip_name=${encodeURIComponent(chipName)}`,
    { signal },
  )
  if (!response.ok) return
  const data = await response.json()
  const description = data?.datasheet?.ai_description
  if (
    !signal.aborted &&
    typeof description === "string" &&
    description.trim()
  ) {
    return description.trim()
  }
}
