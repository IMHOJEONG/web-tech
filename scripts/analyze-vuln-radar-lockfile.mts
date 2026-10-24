import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, posix, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveVerificationBaseline } from "./verification-baseline.mts";

type Dependencies = Record<string, string>;
type Importer = Record<
  string,
  Record<string, { specifier: string; version: string }>
>;
type Snapshot = {
  dependencies?: Dependencies;
  optionalDependencies?: Dependencies;
};
export type Lock = {
  importers: Record<string, Importer>;
  snapshots: Record<string, Snapshot>;
};

export function packageIdentity(snapshot: string) {
  return snapshot.split("(")[0]!;
}

export function collectGraph(
  lock: Lock,
  workspace: string,
  includeDev: boolean,
) {
  const nodes = new Map<string, Map<string, Set<string>>>();
  const contexts = new Set<string>();
  const paths = new Map<string, string[]>();
  const visitedWorkspaces = new Set<string>();
  const unresolved = new Set<string>();

  function visitDependency(
    name: string,
    reference: string,
    from: string,
    path: string[],
  ) {
    if (reference.startsWith("link:")) {
      visitWorkspace(
        posix.normalize(posix.join(from, reference.slice(5))),
        false,
        path,
      );
      return;
    }
    const key =
      `${name}@${reference}` in lock.snapshots
        ? `${name}@${reference}`
        : reference;
    const snapshot = lock.snapshots[key];
    if (!snapshot) {
      unresolved.add(`${from}:${name}@${reference}`);
      return;
    }
    const identity = packageIdentity(key);
    if (!paths.has(identity)) paths.set(identity, [...path, identity]);
    if (contexts.has(key)) return;
    contexts.add(key);
    const edges = nodes.get(identity) ?? new Map<string, Set<string>>();
    nodes.set(identity, edges);
    for (const scope of ["dependencies", "optionalDependencies"] as const) {
      for (const [dependency, target] of Object.entries(
        snapshot[scope] ?? {},
      )) {
        const targetKey =
          `${dependency}@${target}` in lock.snapshots
            ? `${dependency}@${target}`
            : target;
        const edgeName = `${scope}:${dependency}`;
        const versions = edges.get(edgeName) ?? new Set<string>();
        versions.add(packageIdentity(targetKey));
        edges.set(edgeName, versions);
        visitDependency(dependency, target, from, [...path, identity]);
      }
    }
  }

  function visitWorkspace(name: string, dev: boolean, path: string[]) {
    const marker = `${name}:${dev}`;
    if (visitedWorkspaces.has(marker)) return;
    visitedWorkspaces.add(marker);
    const importer = lock.importers[name];
    if (!importer) {
      unresolved.add(`workspace:${name}`);
      return;
    }
    for (const scope of [
      "dependencies",
      "optionalDependencies",
      ...(dev ? ["devDependencies"] : []),
    ]) {
      for (const [dependency, target] of Object.entries(
        importer[scope] ?? {},
      )) {
        visitDependency(dependency, target.version, name, [
          ...path,
          `${name}:${scope}`,
        ]);
      }
    }
  }

  visitWorkspace(workspace, includeDev, []);
  return { nodes, contexts, paths, unresolved: [...unresolved].sort() };
}

function serializedEdges(edges: Map<string, Set<string>> | undefined) {
  return Object.fromEntries(
    [...(edges ?? new Map<string, Set<string>>())]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, targets]) => [key, [...targets].sort()]),
  );
}

export function compareGraphs(
  before: Lock,
  after: Lock,
  workspace: string,
  includeDev: boolean,
) {
  const previous = collectGraph(before, workspace, includeDev);
  const next = collectGraph(after, workspace, includeDev);
  return {
    beforePackages: previous.nodes.size,
    afterPackages: next.nodes.size,
    beforeContexts: previous.contexts.size,
    afterContexts: next.contexts.size,
    added: [...next.nodes.keys()]
      .filter((key) => !previous.nodes.has(key))
      .sort(),
    removed: [...previous.nodes.keys()]
      .filter((key) => !next.nodes.has(key))
      .sort(),
    changedEdges: [...previous.nodes.keys()]
      .filter((key) => next.nodes.has(key))
      .sort()
      .flatMap((key) => {
        const oldEdges = serializedEdges(previous.nodes.get(key));
        const newEdges = serializedEdges(next.nodes.get(key));
        const changes = [
          ...new Set([...Object.keys(oldEdges), ...Object.keys(newEdges)]),
        ]
          .sort()
          .filter(
            (edge) =>
              JSON.stringify(oldEdges[edge]) !== JSON.stringify(newEdges[edge]),
          )
          .map((edge) => ({
            edge,
            before: oldEdges[edge] ?? [],
            after: newEdges[edge] ?? [],
          }));
        return changes.length
          ? [{ package: key, changes, examplePath: next.paths.get(key) }]
          : [];
      }),
    unresolvedBefore: previous.unresolved,
    unresolvedAfter: next.unresolved,
  };
}

async function main() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const baseline = resolveVerificationBaseline(root, process.argv.slice(2));
  const yamlRequire = createRequire(
    join(root, "apps/docs-backend/package.json"),
  );
  const { parseAllDocuments } = yamlRequire("yaml") as {
    parseAllDocuments: (text: string) => Array<{ toJSON: () => unknown }>;
  };
  const parse = (text: string) =>
    parseAllDocuments(text).at(-1)!.toJSON() as Lock;
  const base = baseline.readFile("pnpm-lock.yaml").toString();
  const current = await readFile(join(root, "pnpm-lock.yaml"), "utf8");
  const before = parse(base);
  const after = parse(current);
  const appRequire = createRequire(join(root, "apps/vuln-radar/package.json"));
  const vpRequire = createRequire(appRequire.resolve("vite-plus"));
  const consumers = [
    ["app", appRequire],
    ["React plugin", createRequire(appRequire.resolve("@vitejs/plugin-react"))],
    ["Vite+", vpRequire],
    ["Vitest", createRequire(vpRequire.resolve("vitest"))],
    ["Vitest mocker", createRequire(vpRequire.resolve("@vitest/mocker"))],
  ] as const;
  const resolutions = consumers.map(([name, request]) => {
    const metadata = request("vite/package.json");
    return {
      consumer: name,
      package: metadata.name,
      packageVersion: metadata.version,
      bundledVite: metadata.bundledVersions.vite,
      entry: relative(root, request.resolve("vite")),
    };
  });
  const core = appRequire("vite/package.json");
  const coreRequire = createRequire(appRequire.resolve("vite"));
  const report = {
    checkedAt: new Date().toISOString(),
    baseline: baseline.sha,
    baselineRef: baseline.ref,
    lockfileHashes: {
      before: createHash("sha256").update(base).digest("hex"),
      after: createHash("sha256").update(current).digest("hex"),
    },
    peerResolutions: resolutions,
    corePostcss: {
      declared: core.dependencies.postcss,
      resolved: coreRequire("postcss/package.json").version,
    },
    workspaces: Object.fromEntries(
      Object.keys(before.importers)
        .sort()
        .map((workspace) => [
          workspace,
          {
            production: compareGraphs(before, after, workspace, false),
            withDev: compareGraphs(before, after, workspace, true),
          },
        ]),
    ),
    limits:
      "Static lockfile graph includes optional dependencies for all platforms. Linked workspaces contribute production dependencies, not their development tools. Edge identity normalizes peer suffixes but retains dependency versus optionalDependency scopes; this is not a runtime or deployment equivalence proof.",
  };
  const artifact = join(
    root,
    `docs/verification/artifacts/${new Date().toISOString().replace(/[:.]/g, "-")}-viteplus-lockfile-impact.json`,
  );
  await writeFile(artifact, JSON.stringify(report, null, 2) + "\n");
  console.log(`Evidence: ${artifact}`);
  for (const [workspace, graphs] of Object.entries(report.workspaces)) {
    console.log(
      JSON.stringify({
        workspace,
        production: {
          added: graphs.production.added,
          removed: graphs.production.removed,
          changedEdges: graphs.production.changedEdges.length,
        },
        withDev: {
          added: graphs.withDev.added,
          removed: graphs.withDev.removed,
          changedEdges: graphs.withDev.changedEdges.length,
        },
      }),
    );
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  await main();
