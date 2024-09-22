import { css } from "@emotion/react";
import styled from "@emotion/styled";
import {
  ComponentProps,
  CSSProperties,
  PropsWithChildren,
  ReactNode,
} from "react";

//   width: "100vw",
//   height: "100vh",
// borderRadius: "12%",
//   border: "1px solid black",

export interface ButtonProps extends ComponentProps<"button"> {
  background?: string;
  border?: string;
  borderRadius?: string;
  fontSize?: string;
  padding?: string;
  backdropFilter?: string;
  onClick?: () => void;
}

// 이 방식으로 스타일 컴포넌트 작성 방식 고정
const Container = styled.button((props: ButtonProps) => ({
  background: props.background,
  border: props.border,
  borderRadius: props.borderRadius,
  fontSize: props.fontSize,
  padding: props.padding,
  backdropFilter: props.backdropFilter,
}));

export function Button({ children, ...props }: PropsWithChildren<ButtonProps>) {
  return <Container {...props}>{children}</Container>;
}
