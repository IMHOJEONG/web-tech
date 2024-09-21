import { PropsWithChildren } from "react";
import styled from "@emotion/styled";

const Container = styled.div({
  display: "flex",
  background: "red",
  width: "24px",
  height: "50vh",
  borderRadius: "100px",
});

export function Spacer() {
  return <Container />;
}
