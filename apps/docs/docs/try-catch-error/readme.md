### catch error typescript 코드 작성 방법

- catch (error)에서 error의 타입은 기본적으로 unknown으로 지정하는 것이 가장 안전한 방법이에요. TypeScript는 catch 구문에서 에러가 어떤 타입이 될지 알 수 없으므로, error의 타입을 unknown으로 간주해야 예상치 못한 오류나 타입 관련 문제가 발생하는 것을 방지할 수 있습니다.

```typescript
try {
  // some code that may throw an error
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

위 코드에서는 error가 Error 인스턴스인지 확인한 후, message와 같은 속성에 안전하게 접근할 수 있도록 하고 있습니다. unknown을 사용하는 이유는 any보다 안전하고, 예기치 않은 에러의 타입에 대한 처리를 강제하여 안정성을 높일 수 있기 때문입니다.

따라서 error의 타입을 unknown으로 지정한 후, instanceof나 타입 검사를 통해 처리하는 것이 좋습니다.
