export type SIPrefix =
  | "y"
  | "yocto"
  | "z"
  | "zepto"
  | "atto"
  | "a"
  | "femto"
  | "f"
  | "u"
  | "micro"
  | "d"
  | "deci"
  | "c"
  | "centi"
  | "m"
  | "milli"
  | "k"
  | "kilo"
  | "M"
  | "G"
  | "T"
  | "P"
  | "E"
  | "Z"
  | "Y"
export type Unit = "ohm" | "farad" | "H" | "Ω" | "henry" | "m" | "meter"
export type NumberWithUnit =
  | `${number}${Unit}`
  | `${number} ${Unit}`
  | `${number}${SIPrefix}${Unit}`
  | `${number} ${SIPrefix}${Unit}`
