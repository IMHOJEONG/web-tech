import styled from "@emotion/styled";
import { PropsWithChildren } from "react";

const Container = styled.div({
  width: "100vw",
  height: "100vh",
  // borderRadius: "12%",
  border: "1px solid black",
});

export function Body({ children }: PropsWithChildren) {
  return <Container>{children}</Container>;
}
