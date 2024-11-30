TypeScript에서 여러 파일을 모아서 한 파일로 내보내려면 `index.ts` 파일을 사용해 각 파일에서 가져온 내용을 `export`하면 됩니다. 이렇게 하면 `index.ts` 파일을 통해 모듈을 한 번에 가져올 수 있어 코드 관리가 편해집니다.

예를 들어, `moduleA.ts`, `moduleB.ts`, `moduleC.ts` 세 개의 파일이 있다고 가정해 보겠습니다.

1. **각 파일 생성 및 내보내기**

   ```typescript
   // moduleA.ts
   export const functionA = () => {
     console.log("Function A");
   };
   ```

   ```typescript
   // moduleB.ts
   export const functionB = () => {
     console.log("Function B");
   };
   ```

   ```typescript
   // moduleC.ts
   export const functionC = () => {
     console.log("Function C");
   };
   ```

2. **index.ts 파일에서 각 모듈 가져와서 내보내기**

   ```typescript
   // index.ts
   export * from "./moduleA";
   export * from "./moduleB";
   export * from "./moduleC";
   ```

3. **다른 파일에서 index.ts를 통해 가져오기**

   `index.ts` 파일이 모듈들을 한 곳에서 모두 내보내기 때문에 다른 파일에서는 `index.ts`를 통해 한 번에 가져올 수 있습니다.

   ```typescript
   // main.ts
   import { functionA, functionB, functionC } from "./index";

   functionA();
   functionB();
   functionC();
   ```

이렇게 하면 `index.ts` 파일을 통해 여러 파일의 내용을 쉽게 import할 수 있습니다.
