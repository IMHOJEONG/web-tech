import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// This corpus is authored test input, never copied from a content checkout.
export const syntheticDocuments = [
  [
    "data/v8/javascript-event-loop-runtime.mdx",
    "JavaScript Event Loop 런타임 노트",
    "javascript-event-loop-runtime",
    "javascript,event-loop,performance",
  ],
  [
    "category/fe/react/server-client-component-boundary.mdx",
    "Server Component와 Client Component 경계",
    "server-client-component-boundary",
    "react,nextjs,architecture",
  ],
  [
    "category/be/node-js/node-brotli-runtime-security.mdx",
    "Brotli synthetic runtime example",
    "node-brotli-runtime-security",
    "nodejs,security,brotli",
  ],
  [
    "category/be/node-js/http-response-streaming-lab.mdx",
    "HTTP synthetic streaming example",
    "http-response-streaming-lab",
    "http,streaming",
  ],
  [
    "category/be/node-js/http-timeout-retry-boundary.mdx",
    "HTTP Timeout과 Retry 경계",
    "http-timeout-retry-boundary",
    "timeout,retry",
  ],
  [
    "category/be/node-js/stream-backpressure-diagnosis.mdx",
    "Backpressure fixture",
    "stream-backpressure-diagnosis",
    "stream,backpressure",
  ],
  [
    "category/be/node-js/tcp-socket-endpoints-lab.mdx",
    "TCP fixture",
    "tcp-socket-endpoints-lab",
    "tcp,socket",
  ],
  [
    "category/be/node-js/event-loop-cpu-delay.mdx",
    "CPU fixture",
    "event-loop-cpu-delay",
    "event-loop,cpu",
  ],
  [
    "category/computer-science/os/process-thread-scheduler.mdx",
    "Scheduler fixture",
    "process-thread-scheduler",
    "os,scheduler",
  ],
  [
    "category/fe/browser/critical-rendering-path-diagnosis.mdx",
    "Rendering fixture",
    "critical-rendering-path-diagnosis",
    "browser,rendering,performance",
  ],
  ["category/fe/react/nextjs.mdx", "Next.js fixture", "nextjs", "react,nextjs"],
  [
    "category/mobile/web/mobile-viewport-height.mdx",
    "모바일 화면 높이: 100vh를 써도 버튼이 가려지는 이유",
    "mobile-viewport-height",
    "mobile,viewport",
  ],
  [
    "data/canvas/readme.md",
    "Canvas fixture",
    "html-in-canvas-paint-record",
    "canvas,browser",
  ],
  [
    "data/shadcn/blocked-aria-hidden.mdx",
    "ARIA fixture",
    "blocked-aria-hidden",
    "accessibility,aria",
  ],
  [
    "data/shadcn/focus-management-checklist.mdx",
    "Focus fixture",
    "focus-management-checklist",
    "accessibility,focus",
  ],
  [
    "data/shadcn/form-error-recovery.mdx",
    "Form fixture",
    "form-error-recovery",
    "forms,validation",
  ],
  ["data/v8/bytecode.mdx", "Bytecode fixture", "bytecode", "v8,bytecode,astro"],
] as const;

const padding = Array.from({ length: 12 }, (_, i) =>
  `Synthetic paragraph ${i + 1}: deterministic layout, keyboard navigation, rendering and scrolling regression input. `.repeat(
    4,
  ),
).join("\n\n");
function body(file: string) {
  if (file.includes("javascript-event-loop"))
    return `## 이벤트 루프를 보는 이유\n\n호출 스택(call stack): 현재 실행 중인 함수 호출을 관리한다. 동기 코드는 실행 도중에 microtask 때문에 끊기지 않는다.\n\n${padding}\n\n## 실무 체크리스트\n\nSynthetic checklist for JavaScript microtask tests.\n\n${padding}\n\n## 참고\n\nMDN: queueMicrotask와 microtask 처리\n`;
  if (file.includes("server-client-component"))
    return "## 경계를 먼저 정해야 하는 이유\n\n서버 컴포넌트와 클라이언트 컴포넌트는 실행 위치가 다르다.\n\nSynthetic React component example.\n\n## 판단 기준\n\n서버에서 가져온 데이터는 직렬화 가능한 props로 클라이언트에 넘긴다.\n";
  if (file.includes("node-brotli"))
    return `## Synthetic Brotli overview\n\nThis is a regression fixture, not an article or runtime advisory.\n\n${padding}\n\n### 1/2 — 압축할 바이트 만들기\n\n${padding}\n\n\`\`\`ts\n${Array.from({ length: 30 }, (_, i) => `const example${i} = ${i};`).join("\n")}\n\`\`\`\n\n### 2/2 — 복원 결과와 실행 버전 출력\n\n${padding}\n\n\`\`\`diff\n- return false;\n+ return BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH;\n\`\`\`\n\n## Fixture ending\n\n${padding}\n`;
  if (file.includes("http-response-streaming"))
    return `## Synthetic image references\n\n${["stages", "completion", "local-architecture", "service-infrastructure"].map((n) => `![Synthetic diagram reference](../../../public/diagrams/http-response-${n}.png)`).join("\n\n")}\n`;
  if (file.includes("critical-rendering"))
    return "## Synthetic resource table\n\n| 리소스 | 초기 화면에 주는 기본 영향 |\n| --- | --- |\n| HTML | DOM 구성의 시작점 |\n| CSS | Synthetic blocking fixture |\n";
  if (file.includes("blocked-aria"))
    return "## Blocked aria-hidden\n\nSynthetic accessibility fixture.\n";
  return "## Synthetic example\n\nDeterministic public test input, not a published blog article.\n";
}

export function writeSyntheticCorpus(appRoot: string) {
  for (const name of ["data", "category"])
    assert.equal(
      fs.existsSync(path.join(appRoot, name)),
      false,
      "only write into empty fixture roots",
    );
  for (const [file, title, slug, tags] of syntheticDocuments) {
    const target = path.join(appRoot, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const summary = file.includes("server-client-component")
      ? "React 기반 앱에서 서버 컴포넌트와 클라이언트 컴포넌트를 나눌 때의 판단 기준을 정리합니다."
      : "Synthetic public regression example.";
    fs.writeFileSync(
      target,
      `---\nstatus: published\ntitle: ${JSON.stringify(title)}\nslug: ${slug}\nsummary: ${JSON.stringify(summary)}\ndate: ${file.includes("node-brotli") ? "2026-11-18" : "2026-11-17"}\nupdatedAt: 2026-11-18\nauthorName: Synthetic CI\nauthorRole: Test fixture\nreadMinutes: 3\ntopicLabel: ${tags.split(",")[0]}\ntags: ${JSON.stringify(tags.split(","))}\n---\n\n${body(file)}`,
    );
  }
  fs.writeFileSync(
    path.join(appRoot, "category/fe/react/test.mdx"),
    "---\nstatus: archived\nslug: test\ntitle: Synthetic archived duplicate\n---\n\nArchived fixture.\n",
  );
  return syntheticDocuments.length;
}

export function preserveCiDirectory(
  source: string,
  destination: string,
  io: Pick<typeof fs, "renameSync" | "cpSync" | "rmSync"> = fs,
) {
  try {
    io.renameSync(source, destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
    // Container bind mounts can prohibit rename even on the same host disk.
    io.cpSync(source, destination, {
      recursive: true,
      errorOnExist: true,
      force: false,
      verbatimSymlinks: true,
    });
    const verify = (from: string, to: string) => {
      const a = fs.lstatSync(from);
      const b = fs.lstatSync(to);
      assert.equal(a.isDirectory(), b.isDirectory());
      assert.equal(a.isFile(), b.isFile());
      assert.equal(a.isSymbolicLink(), b.isSymbolicLink());
      if (a.isDirectory()) {
        const names = fs.readdirSync(from).sort();
        assert.deepEqual(fs.readdirSync(to).sort(), names);
        for (const name of names)
          verify(path.join(from, name), path.join(to, name));
      } else if (a.isFile()) {
        assert.ok(fs.readFileSync(from).equals(fs.readFileSync(to)));
      } else {
        assert.ok(a.isSymbolicLink());
        assert.equal(fs.readlinkSync(from), fs.readlinkSync(to));
      }
    };
    verify(source, destination);
    // Only a guarded ephemeral hosted checkout reaches this operation.
    io.rmSync(source, { recursive: true });
  }
}

type PreparationPhase = "authorization" | "paths" | "backup" | "synthetic";
export function prepareCiDocsContent(
  env: NodeJS.ProcessEnv,
  cwd: string,
  reportPhase: (phase: PreparationPhase) => void = () => {},
) {
  reportPhase("authorization");
  assert.equal(
    env.GITHUB_ACTIONS,
    "true",
    "this command only replaces an ephemeral hosted CI checkout",
  );
  assert.equal(env.RUNNER_ENVIRONMENT, "github-hosted");
  assert.equal(env.DOCS_CI_SYNTHETIC, "1");
  assert.equal(env.DOCS_CONTENT_SOURCE, "legacy");
  assert.equal(
    !!env.DOCS_PRIVATE_CONTENT_SSH_KEY,
    false,
    "private credentials must never reach general PR checks",
  );
  assert.ok(env.GITHUB_WORKSPACE && env.RUNNER_TEMP);
  reportPhase("paths");
  const workspace = fs.realpathSync(env.GITHUB_WORKSPACE);
  assert.equal(fs.realpathSync(cwd), workspace);
  const temporary = fs.realpathSync(env.RUNNER_TEMP);
  assert.equal(
    temporary === workspace || temporary.startsWith(workspace + path.sep),
    false,
  );
  const app = path.join(workspace, "apps/docs");
  assert.equal(
    fs.realpathSync(app),
    app,
    "do not replace a linked application",
  );
  for (const name of ["data", "category"]) {
    const entry = fs.lstatSync(path.join(app, name), { throwIfNoEntry: false });
    if (entry)
      assert.equal(entry.isDirectory() && !entry.isSymbolicLink(), true);
  }
  // Preserve the checkout's original roots outside every build/test discovery path.
  reportPhase("backup");
  const backup = fs.mkdtempSync(path.join(temporary, "original-docs-"));
  fs.chmodSync(backup, 0o700);
  for (const name of ["data", "category"]) {
    const from = path.join(app, name);
    if (!fs.existsSync(from)) continue;
    assert.equal(fs.lstatSync(from).isSymbolicLink(), false);
    preserveCiDirectory(from, path.join(backup, name));
  }
  reportPhase("synthetic");
  return writeSyntheticCorpus(app);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  let phase: PreparationPhase = "authorization";
  try {
    console.info("[docs.ci_synthetic]", {
      documents: prepareCiDocsContent(process.env, process.cwd(), (value) => {
        phase = value;
      }),
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    console.error("[docs.ci_preparation_denied]", {
      phase,
      code: ["EXDEV", "EACCES", "ENOENT", "ERR_ASSERTION"].includes(code ?? "")
        ? code
        : "other",
    });
    console.error(
      "Synthetic CI preparation denied; original local content must not be replaced.",
    );
    process.exitCode = 1;
  }
}
