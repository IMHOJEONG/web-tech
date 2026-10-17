import * as prettier from "prettier";
import path from "node:path";
import { snapshot, isMain } from "./git-check-snapshot.mjs";

export async function checkFormat(view, cwd = process.cwd()) {
  const failures = [];
  for (const { file, status } of view.changes) {
    if (status === "D") continue;
    const filepath = path.resolve(cwd, file);
    const info = await prettier.getFileInfo(filepath, {
      ignorePath: [
        path.join(cwd, ".gitignore"),
        path.join(cwd, ".prettierignore"),
      ],
    });
    if (info.ignored || !info.inferredParser) continue;
    const config = await prettier.resolveConfig(filepath);
    const text = view.read(file).toString("utf8");
    if (!(await prettier.check(text, { ...config, filepath })))
      failures.push(file);
  }
  return failures;
}

if (isMain(import.meta.url)) {
  try {
    const failures = await checkFormat(snapshot());
    if (failures.length) {
      console.error(
        "Format check failed for staged/committed content:\n" +
          failures.join("\n"),
      );
      console.error(
        "Format only the intended files, review the diff, then stage again. No files were changed.",
      );
      process.exitCode = 1;
    } else console.log("Changed-content format check passed (read-only).");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
