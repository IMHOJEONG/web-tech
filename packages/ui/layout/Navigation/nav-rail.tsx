import styled from "@emotion/styled";
import { PropsWithChildren } from "react";

const Container = styled.div({});

export function NavRail({ children }: PropsWithChildren) {
  return <Container>{children}</Container>;
}
