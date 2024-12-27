import Debug from "debug"

export const debug = Debug("schematic-viewer")

export const enableDebug = () => {
  Debug.enable("schematic-viewer*")
}

export default debug
