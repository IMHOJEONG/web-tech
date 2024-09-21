import styled from "@emotion/styled";
import { PropsWithChildren } from "react";

const Container = styled.div({
  width: "100px",
  height: "100px",
  // borderRadius: "100px",
  border: "1px solid black",
});

export function Pane({ children }: PropsWithChildren) {
  return <Container>{children}</Container>;
}
