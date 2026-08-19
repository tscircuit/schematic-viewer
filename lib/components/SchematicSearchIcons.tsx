import type { ReactNode } from "react"

interface IconProps {
  size: number
  strokeWidth: number
}

const Icon = ({
  children,
  size,
  strokeWidth,
}: IconProps & { children: ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.34-4.34" />
  </Icon>
)

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
)

export const ComponentIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="8" y="8" width="8" height="8" rx="1" />
    <path d="M7 2v2M12 2v2M17 2v2M7 20v2M12 20v2M17 20v2M2 7h2M2 12h2M2 17h2M20 7h2M20 12h2M20 17h2" />
  </Icon>
)

export const NetIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M15 6a9 9 0 0 0-9 9V3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
  </Icon>
)

export const EnterIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    <path d="m9 10-5 5 5 5" />
  </Icon>
)
