import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, symlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Run = (file: string, args: string[], cwd: string) => void;

export function installPnpm(
  root: string,
  bootstrap: string,
  bin: string,
  run: Run = (file, args, cwd) => {
    execFileSync(file, args, { cwd, stdio: "inherit" });
  },
) {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf8"),
  );
  const wanted = /^pnpm@(12\.\d+\.\d+)$/.exec(manifest.packageManager)?.[1];
  const bootstrapManifest = JSON.parse(
    readFileSync(path.join(bootstrap, "package.json"), "utf8"),
  );
  if (!wanted || bootstrapManifest.dependencies?.pnpm !== wanted) {
    throw new Error("The exact pnpm 12 bootstrap must match packageManager.");
  }
  if (existsSync(path.join(bin, "pnpm"))) {
    throw new Error("Refusing to overwrite an existing pnpm executable.");
  }

  // No downloaded lifecycle code may execute before npm verifies its signatures.
  const registry = "--registry=https://registry.npmjs.org";
  run(
    "npm",
    ["ci", "--ignore-scripts", "--no-audit", "--no-fund", registry],
    bootstrap,
  );
  run("npm", ["audit", "signatures", registry], bootstrap);

  const platformPackage = `@pnpm/exe.${process.platform}-${process.arch}`;
  const native = path.join(bootstrap, "node_modules", platformPackage);
  const nativeManifest = JSON.parse(
    readFileSync(path.join(native, "package.json"), "utf8"),
  );
  const nativeBinary = path.join(
    native,
    process.platform === "win32" ? "pnpm.exe" : "pnpm",
  );
  if (nativeManifest.version !== wanted || !existsSync(nativeBinary)) {
    throw new Error(
      "The signed host pnpm binary is missing or has the wrong version.",
    );
  }
  const packageDirectory = path.join(bootstrap, "node_modules", "pnpm");
  run(process.execPath, [path.join(packageDirectory, "install.js")], bootstrap);
  const executable = path.join(packageDirectory, "pnpm");
  const actual = execFileSync(executable, ["--version"], {
    cwd: bootstrap,
    encoding: "utf8",
  }).trim();
  if (actual !== wanted)
    throw new Error("Installed pnpm does not match packageManager.");
  mkdirSync(bin, { recursive: true });
  symlinkSync(executable, path.join(bin, "pnpm"));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [root, bootstrap, bin] = process.argv.slice(2);
  if (!root || !bootstrap || !bin) {
    throw new Error(
      "Usage: install-pnpm.mts <repository> <bootstrap> <bin-directory>",
    );
  }
  installPnpm(path.resolve(root), path.resolve(bootstrap), path.resolve(bin));
}
