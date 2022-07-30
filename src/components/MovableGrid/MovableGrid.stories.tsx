import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import { MovableGrid } from "./"

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "MovableGrid",
  component: MovableGrid,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as ComponentMeta<typeof MovableGrid>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof MovableGrid> = (args) => (
  <MovableGrid {...args} />
)

export const Primary = Template.bind({})
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  primary: true,
  label: "MovableGrid",
}
