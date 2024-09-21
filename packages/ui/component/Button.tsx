import styled from "@emotion/styled";
import { PropsWithChildren, ReactNode } from "react";

const Container = styled.button({
  //   width: "100vw",
  //   height: "100vh",
  // borderRadius: "12%",
  //   border: "1px solid black",
});

interface ButtonProps {
  icon?: ReactNode;
  text?: string;
}

export function Button({
  children,
  icon,
  text,
}: PropsWithChildren<ButtonProps>) {
  return <Container>{children}</Container>;
}
