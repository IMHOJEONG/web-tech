import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button } from "@web-tech/ui";

// import { Button } from "./Button";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "components/Button",
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    background: { control: "color" },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {
    // onClick: fn(),
    background: "red",
    border: "1px solid black",
    // borderRadius: "100px",
    children: "test",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Compact: Story = {
  args: {},
};

const ButtonTest = (args: Story) => {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "url(https://www.w3schools.com/cssref/klematis.jpg) ",
      }}
    >
      <Button {...args} />
    </div>
  );
};

export const Medium: Story = {
  args: {
    onClick: () => {
      alert("hi");
    },

    background: "rgba(100, 100, 100, 0.4)",
    border: "1px solid black",

    // borderRadius: "100px",
    fontSize: "100px",

    children: "Compo",
    backdropFilter: "blur(10px)",
  },
  render: (args) => <ButtonTest {...args} />,
};

export const Expanded: Story = {
  args: {
    padding: "1em 2em",
  },
};

// export const large: Story = {
//   args: {
//     size: "small",
//     label: "Button",
//   },
// };

// export const extraLarge: Story = {
//   args: {
//     size: "small",
//     label: "Button",
//   },
// };
