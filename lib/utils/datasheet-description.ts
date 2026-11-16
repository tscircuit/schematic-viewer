export const fetchDatasheetDescription = async (
  chipName: string,
  signal: AbortSignal,
  platformFetch: typeof fetch = fetch,
): Promise<string | null> => {
  const response = await platformFetch(
    `https://api.tscircuit.com/datasheets/get?chip_name=${encodeURIComponent(chipName)}`,
    { signal },
  )
  if (!response.ok) throw new Error("Datasheet lookup failed")
  const data = await response.json()
  const description = data?.datasheet?.ai_description
  return typeof description === "string" && description.trim()
    ? description.trim()
    : null
}
