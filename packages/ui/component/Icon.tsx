import styled from "@emotion/styled";
import {
  ForwardRefExoticComponent,
  PropsWithChildren,
  ReactNode,
  RefAttributes,
} from "react";
import { FaceIcon, ImageIcon, SunIcon } from "@radix-ui/react-icons";

const Container = styled.div({
  //   width: "100vw",
  //   height: "100vh",
  // borderRadius: "12%",
  //   border: "1px solid black",
});

interface IconProps {
  icon?: ReactNode;
  text?: string;
}

export function Icon({ children, icon, text }: PropsWithChildren<IconProps>) {
  return (
    <Container>
      {!icon && <FaceIcon />}
      {text}
    </Container>
  );
}
