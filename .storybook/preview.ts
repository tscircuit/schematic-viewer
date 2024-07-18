import type { Preview } from "@storybook/react"

import "react-data-grid/lib/styles.css"

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    diffThreshold: 0.2,
  },
}

export default preview
