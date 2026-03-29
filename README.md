- CSS in JS vs CSS in CSS

https://www.samsungsds.com/kr/insights/web_component.html

- Material 3 design structure

https://m3.material.io/foundations/layout/understanding-layout/parts-of-layout

- emotion/styled를 사용하기로 정함

// import { spacerCss } from "./spacer-css";
// CSS 문법은 jss pragma 설정 때문에 쓰지 않음
import styled from "@emotion/styled";

// string은 문자열이라 선호하지 않고, object로 변경
// Object는 자동완성을 지원해줌
const Container = styled.div({
display: "flex",
background: "red",
});

- icon은 https://www.radix-ui.com/icons으로 설정

- Tsgo/native-preview 도입 예정
