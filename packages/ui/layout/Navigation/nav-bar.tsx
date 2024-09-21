import styled from "@emotion/styled";
import { PropsWithChildren } from "react";

const Container = styled.div({});

export function NavBar({ children }: PropsWithChildren) {
  return <Container>{children}</Container>;
}
