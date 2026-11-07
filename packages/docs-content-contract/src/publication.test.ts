import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { CONTENT_HTML_MAX_BYTES, CONTENT_POSTS_MAX_BYTES } from "./index.ts";
import {
  PUBLICATION_MANIFEST_MAX_BYTES,
  PUBLICATION_MAX_DOCUMENTS,
  PUBLICATION_POINTER_MAX_BYTES,
  PUBLICATION_SNAPSHOT_MAX_BYTES,
  createPublicationManifest,
  publicationGenerationSchema,
  publicationManifestSchema,
  publicationPointerSchema,
  publicationRevisionSchema,
  verifyPublicationDocument,
  verifyPublicationIndex,
  verifyPublicationManifest,
  verifyPublicationPointer,
  verifyPublicationSnapshot,
  type PublicationVerification,
} from "./publication.ts";

const encode = (text: string) => new TextEncoder().encode(text);
const json = (value: unknown) => encode(JSON.stringify(value));
const sha = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const descriptor = (bytes: Uint8Array) => ({
  bytes: bytes.byteLength,
  sha256: sha(bytes),
});
const generation = "00000000-0000-4000-8000-000000000001";
const previous = "00000000-0000-4000-8000-000000000002";
function post(path = "web/note") {
  return {
    authorName: "Synthetic writer",
    authorRole: "Engineer",
    date: "2026-11-06",
    id: path,
    markdownPath: path,
    readMinutes: 1,
    slug: path.split("/")[1]!,
    status: "published",
    summary: "Synthetic summary",
    tags: [],
    title: "Synthetic note",
    topicLabel: "WEB",
    updatedAt: "2026-11-06",
  };
}
function fixture(
  html = "<article>가나다 🙂</article>",
  index = json({ results: [post()] }),
) {
  const body = encode(html);
  const manifest = {
    schemaVersion: 1,
    formatVersion: 1,
    index: descriptor(index),
    documents: [{ markdownPath: "web/note", ...descriptor(body) }],
  };
  const bytes = json(manifest);
  const pointer = {
    schemaVersion: 1,
    generation,
    revision: sha(bytes),
    previousGeneration: null,
  };
  return {
    html,
    body,
    index,
    manifest,
    bytes,
    pointer,
    snapshot: {
      pointer: json(pointer),
      manifest: bytes,
      index,
      documents: [{ markdownPath: "web/note", body }],
    },
  };
}
function failed(
  result: PublicationVerification<unknown>,
  code?: string,
  artifact?: string,
) {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected verification failure");
  if (code) assert.equal(result.code, code);
  if (artifact) assert.equal(result.artifact, artifact);
  assert.deepEqual(Object.keys(result).sort(), ["artifact", "code", "ok"]);
}

test("publication revision and generation reject non-canonical identities", async (t) => {
  assert.equal(
    publicationRevisionSchema.safeParse("a".repeat(64)).success,
    true,
  );
  for (const [name, value] of [
    ["missing", undefined],
    ["short", "a".repeat(63)],
    ["long", "a".repeat(65)],
    ["uppercase", "A".repeat(64)],
    ["non-hex", "z".repeat(64)],
    ["padded", ` ${"a".repeat(64)}`],
  ] as const)
    await t.test(name, () =>
      assert.equal(publicationRevisionSchema.safeParse(value).success, false),
    );
  assert.equal(publicationGenerationSchema.safeParse(generation).success, true);
  for (const value of [
    "g1",
    "00000000-0000-0000-0000-000000000000",
    "00000000-0000-4000-0000-000000000001",
    ` ${generation}`,
  ])
    assert.equal(publicationGenerationSchema.safeParse(value).success, false);
});

test("pointer is strict, required and does not treat hashes as authorization", async (t) => {
  const f = fixture();
  assert.equal(verifyPublicationPointer(json(f.pointer)).ok, true);
  assert.equal(
    verifyPublicationPointer(
      json({ ...f.pointer, previousGeneration: previous }),
    ).ok,
    true,
  );
  const { previousGeneration: omitted, ...missing } = f.pointer;
  void omitted;
  for (const [name, value] of [
    ["missing previous", missing],
    ["self generation", { ...f.pointer, previousGeneration: generation }],
    ["unsupported version", { ...f.pointer, schemaVersion: 2 }],
    ["extra URL", { ...f.pointer, url: "https://synthetic.invalid" }],
    ["invalid revision", { ...f.pointer, revision: "r1" }],
  ] as const)
    await t.test(name, () =>
      assert.equal(publicationPointerSchema.safeParse(value).success, false),
    );
  failed(verifyPublicationPointer(undefined), "missing-artifact");
  failed(verifyPublicationPointer(encode("{")), "invalid-json");
  failed(verifyPublicationPointer(new Uint8Array([0xff])), "invalid-utf8");
  failed(verifyPublicationPointer("not bytes"), "invalid-bytes");
});

test("canonical manifest encoding matches independent SHA-256 over exact UTF-8 bytes", async () => {
  const f = fixture();
  const created = await createPublicationManifest(f.manifest);
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.deepEqual(created.value.bytes, f.bytes);
  assert.equal(created.value.revision, sha(f.bytes));
  const verified = await verifyPublicationManifest(
    created.value.bytes,
    created.value.revision,
  );
  assert.equal(verified.ok, true);
  if (verified.ok) {
    assert.ok(Object.isFrozen(verified.value));
    assert.ok(Object.isFrozen(verified.value.documents));
    assert.ok(Object.isFrozen(verified.value.documents[0]));
  }
});

test("manifest rejects missing fields, unsafe paths, duplicates and unsupported versions", async (t) => {
  const f = fixture();
  const entry = f.manifest.documents[0]!;
  const { index: omitted, ...noIndex } = f.manifest;
  void omitted;
  const cases = [
    ["zero", { ...f.manifest, index: { ...f.manifest.index, bytes: 0 } }],
    [
      "index overflow",
      {
        ...f.manifest,
        index: { ...f.manifest.index, bytes: CONTENT_POSTS_MAX_BYTES + 1 },
      },
    ],
    [
      "HTML overflow",
      {
        ...f.manifest,
        documents: [{ ...entry, bytes: CONTENT_HTML_MAX_BYTES + 1 }],
      },
    ],
    ["missing index", noIndex],
    ["missing documents", { ...f.manifest, documents: undefined }],
    ["missing hash", { ...f.manifest, index: { bytes: 10 } }],
    ["missing length", { ...f.manifest, index: { sha256: "a".repeat(64) } }],
    ["extra root", { ...f.manifest, revision: "a".repeat(64) }],
    [
      "extra entry",
      {
        ...f.manifest,
        documents: [{ ...entry, url: "https://synthetic.invalid" }],
      },
    ],
    ["schema version", { ...f.manifest, schemaVersion: 2 }],
    ["format version", { ...f.manifest, formatVersion: 2 }],
    ["duplicate", { ...f.manifest, documents: [entry, entry] }],
    [
      "unsorted",
      {
        ...f.manifest,
        documents: [{ ...entry, markdownPath: "web/z" }, entry],
      },
    ],
    ["negative", { ...f.manifest, index: { ...f.manifest.index, bytes: -1 } }],
    ["fraction", { ...f.manifest, index: { ...f.manifest.index, bytes: 1.5 } }],
  ] as const;
  for (const [name, value] of cases)
    await t.test(name, () =>
      assert.equal(publicationManifestSchema.safeParse(value).success, false),
    );
  for (const path of [
    "../secret",
    "web/../note",
    "web/a/b",
    "web/%2e%2e",
    "web/Note",
    " web/note",
    "web\\note",
  ])
    assert.equal(
      publicationManifestSchema.safeParse({
        ...f.manifest,
        documents: [{ ...entry, markdownPath: path }],
      }).success,
      false,
    );
});

test("manifest digest rejects equal-size tampering and non-canonical JSON even with matching digest", async () => {
  const f = fixture();
  const altered = f.bytes.slice();
  altered[0] = 91;
  failed(
    await verifyPublicationManifest(altered, f.pointer.revision),
    "hash-mismatch",
  );
  for (const bytes of [
    encode(JSON.stringify(f.manifest, null, 2)),
    encode(`${JSON.stringify(f.manifest)}\n`),
    encode(
      JSON.stringify({
        documents: f.manifest.documents,
        index: f.manifest.index,
        formatVersion: 1,
        schemaVersion: 1,
      }),
    ),
    encode(
      JSON.stringify(f.manifest).replace(
        '"schemaVersion":1',
        '"schemaVersion":1,"schemaVersion":1',
      ),
    ),
  ])
    failed(
      await verifyPublicationManifest(bytes, sha(bytes)),
      "non-canonical-manifest",
    );
  const malformed = encode("{");
  failed(
    await verifyPublicationManifest(malformed, sha(malformed)),
    "invalid-json",
  );
  const invalidUtf8 = new Uint8Array([0xff]);
  failed(
    await verifyPublicationManifest(invalidUtf8, sha(invalidUtf8)),
    "invalid-utf8",
  );
});

test("valid snapshot binds pointer, manifest, index and Unicode HTML", async () => {
  const f = fixture();
  const result = await verifyPublicationSnapshot(f.snapshot);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.documents[0]?.html, f.html);
  assert.notEqual(f.body.length, f.html.length);
});

test("whole snapshot rejects missing, duplicate, extra and mixed-generation artifacts", async (t) => {
  const f = fixture();
  for (const field of ["pointer", "manifest", "index", "documents"] as const)
    await t.test(`missing ${field}`, async () => {
      const input: Record<string, unknown> = { ...f.snapshot };
      delete input[field];
      failed(await verifyPublicationSnapshot(input));
    });
  failed(
    await verifyPublicationSnapshot({ ...f.snapshot, documents: [] }),
    "missing-artifact",
    "document",
  );
  failed(
    await verifyPublicationSnapshot({
      ...f.snapshot,
      documents: [...f.snapshot.documents, ...f.snapshot.documents],
    }),
    "duplicate-artifact",
  );
  failed(
    await verifyPublicationSnapshot({
      ...f.snapshot,
      documents: [{ markdownPath: "web/extra", body: f.body }],
    }),
    "unexpected-artifact",
  );
  failed(
    await verifyPublicationSnapshot({
      ...f.snapshot,
      documents: [{ markdownPath: "web/note" }],
    }),
    "invalid-schema",
  );
  failed(
    await verifyPublicationSnapshot({
      ...f.snapshot,
      documents: [{ markdownPath: "web/note", body: null }],
    }),
    "missing-artifact",
  );
  const other = fixture("<article>라마바 🙂</article>");
  failed(
    await verifyPublicationSnapshot({ ...f.snapshot, manifest: other.bytes }),
    "hash-mismatch",
    "manifest",
  );
  failed(
    await verifyPublicationSnapshot({
      ...f.snapshot,
      documents: other.snapshot.documents,
    }),
    "hash-mismatch",
    "document",
  );
});

test("body length, digest and UTF-8 must agree with the descriptor", async () => {
  const f = fixture();
  failed(
    await verifyPublicationDocument(
      f.body.subarray(0, -1),
      f.manifest,
      "web/note",
    ),
    "size-mismatch",
  );
  const changed = f.body.slice();
  changed[0] = 33;
  failed(
    await verifyPublicationDocument(changed, f.manifest, "web/note"),
    "hash-mismatch",
  );
  failed(
    await verifyPublicationDocument(f.body, f.manifest, "web/unknown"),
    "document-not-found",
  );
  failed(
    await verifyPublicationDocument(f.body, f.manifest, "../secret"),
    "invalid-schema",
  );
  const invalid = new Uint8Array([0xff]);
  failed(
    await verifyPublicationDocument(
      invalid,
      {
        ...f.manifest,
        documents: [{ markdownPath: "web/note", ...descriptor(invalid) }],
      },
      "web/note",
    ),
    "invalid-utf8",
  );
});

test("index digest, complete path set and canonical post identities are checked", async (t) => {
  const f = fixture();
  const edited = f.index.slice();
  edited[0] = 91;
  failed(await verifyPublicationIndex(edited, f.manifest), "hash-mismatch");
  const cases = [
    ["missing document", { results: [] }, "index-document-mismatch"],
    [
      "extra document",
      { results: [post(), post("web/extra")] },
      "index-document-mismatch",
    ],
    ["duplicate", { results: [post(), post()] }, "invalid-schema"],
    [
      "wrong id",
      { results: [{ ...post(), id: "web/other" }] },
      "invalid-schema",
    ],
    [
      "wrong slug",
      { results: [{ ...post(), slug: "other" }] },
      "invalid-schema",
    ],
    ["draft", { results: [{ ...post(), status: "draft" }] }, "invalid-schema"],
    [
      "extra field",
      { results: [{ ...post(), privateNote: "synthetic-private-marker" }] },
      "invalid-schema",
    ],
  ] as const;
  for (const [name, input, code] of cases)
    await t.test(name, async () => {
      const bytes = json(input);
      failed(
        await verifyPublicationIndex(bytes, {
          ...f.manifest,
          index: descriptor(bytes),
        }),
        code,
      );
    });
});

test("pointer and manifest enforce byte limits before decoding", async () => {
  const f = fixture();
  const padded = new Uint8Array(PUBLICATION_POINTER_MAX_BYTES).fill(32);
  padded.set(json(f.pointer));
  assert.equal(verifyPublicationPointer(padded).ok, true);
  failed(
    verifyPublicationPointer(new Uint8Array(PUBLICATION_POINTER_MAX_BYTES + 1)),
    "too-large",
  );
  failed(
    await verifyPublicationManifest(
      new Uint8Array(PUBLICATION_MANIFEST_MAX_BYTES + 1),
      f.pointer.revision,
    ),
    "too-large",
  );
  const atLimit = new Uint8Array(PUBLICATION_MANIFEST_MAX_BYTES).fill(32);
  atLimit.set(f.bytes);
  failed(
    await verifyPublicationManifest(atLimit, sha(atLimit)),
    "non-canonical-manifest",
  );
});

test("HTML accepts exactly the limit and rejects one extra byte", async () => {
  const f = fixture("a".repeat(CONTENT_HTML_MAX_BYTES));
  assert.equal(
    (await verifyPublicationDocument(f.body, f.manifest, "web/note")).ok,
    true,
  );
  failed(
    await verifyPublicationDocument(
      new Uint8Array(CONTENT_HTML_MAX_BYTES + 1),
      f.manifest,
      "web/note",
    ),
    "too-large",
  );
});

test("index accepts exactly the limit and rejects one extra byte", async () => {
  const base = post();
  const blank = json({ results: [{ ...base, summary: "" }] });
  const index = json({
    results: [
      { ...base, summary: "a".repeat(CONTENT_POSTS_MAX_BYTES - blank.length) },
    ],
  });
  assert.equal(index.length, CONTENT_POSTS_MAX_BYTES);
  const f = fixture(undefined, index);
  assert.equal((await verifyPublicationIndex(index, f.manifest)).ok, true);
  failed(
    await verifyPublicationIndex(
      new Uint8Array(CONTENT_POSTS_MAX_BYTES + 1),
      f.manifest,
    ),
    "too-large",
  );
});

test("manifest bounds artifact count and total declared payload without loading bodies", () => {
  const f = fixture();
  const documents = Array.from(
    { length: PUBLICATION_MAX_DOCUMENTS + 1 },
    (_, index) => ({
      markdownPath: `web/n-${String(index).padStart(5, "0")}`,
      bytes: 1,
      sha256: "a".repeat(64),
    }),
  );
  assert.equal(
    publicationManifestSchema.safeParse({ ...f.manifest, documents }).success,
    false,
  );
  const large = Array.from({ length: 64 }, (_, index) => ({
    markdownPath: `web/n-${String(index).padStart(3, "0")}`,
    bytes: CONTENT_HTML_MAX_BYTES,
    sha256: "a".repeat(64),
  }));
  assert.equal(
    large.reduce((total, document) => total + document.bytes, 0),
    PUBLICATION_SNAPSHOT_MAX_BYTES,
  );
  assert.equal(
    publicationManifestSchema.safeParse({ ...f.manifest, documents: large })
      .success,
    false,
  );
  large[0]!.bytes -= f.index.byteLength;
  assert.equal(
    publicationManifestSchema.safeParse({ ...f.manifest, documents: large })
      .success,
    true,
  );
  assert.equal(
    publicationManifestSchema.safeParse({
      ...f.manifest,
      documents: documents.slice(0, PUBLICATION_MAX_DOCUMENTS),
    }).success,
    true,
  );
});

test("empty publication and rollback with a new generation retain valid content identity", async () => {
  const index = json({ results: [] });
  const manifest = {
    schemaVersion: 1,
    formatVersion: 1,
    index: descriptor(index),
    documents: [],
  };
  const created = await createPublicationManifest(manifest);
  assert.equal(created.ok, true);
  if (!created.ok) return;
  for (const pointer of [
    {
      schemaVersion: 1,
      generation,
      revision: created.value.revision,
      previousGeneration: null,
    },
    {
      schemaVersion: 1,
      generation: previous,
      revision: created.value.revision,
      previousGeneration: generation,
    },
  ])
    assert.equal(
      (
        await verifyPublicationSnapshot({
          pointer: json(pointer),
          manifest: created.value.bytes,
          index,
          documents: [],
        })
      ).ok,
      true,
    );
});

test("multi-document verification checks the complete chain without filesystem access", async () => {
  const paths = Array.from(
    { length: 256 },
    (_, index) => `web/n-${String(index).padStart(4, "0")}`,
  );
  const documents = paths.map((markdownPath) => ({
    markdownPath,
    body: encode(`<p>${markdownPath}</p>`),
  }));
  const index = json({ results: paths.map((path) => post(path)) });
  const created = await createPublicationManifest({
    schemaVersion: 1,
    formatVersion: 1,
    index: descriptor(index),
    documents: documents.map(({ markdownPath, body }) => ({
      markdownPath,
      ...descriptor(body),
    })),
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const pointer = json({
    ...fixture().pointer,
    revision: created.value.revision,
  });
  const result = await verifyPublicationSnapshot({
    pointer,
    manifest: created.value.bytes,
    index,
    documents,
  });
  assert.equal(result.ok, true);
  if (result.ok)
    assert.deepEqual(
      result.value.documents.map((document) => document.markdownPath),
      paths,
    );
});

test("verification owns bytes across awaits and respects a Uint8Array subview", async () => {
  const f = fixture();
  const source = f.bytes.slice();
  const pending = verifyPublicationManifest(source, f.pointer.revision);
  source.fill(0);
  assert.equal((await pending).ok, true);
  const padded = new Uint8Array(f.body.length + 10);
  padded.set(f.body, 5);
  assert.equal(
    (
      await verifyPublicationDocument(
        padded.subarray(5, -5),
        f.manifest,
        "web/note",
      )
    ).ok,
    true,
  );
  const body = f.body.slice();
  const html = verifyPublicationDocument(body, f.manifest, "web/note");
  body.fill(0);
  const result = await html;
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.html, f.html);
});

test("whole snapshot owns every byte view before its first await", async () => {
  const f = fixture();
  const view = (bytes: Uint8Array) => {
    const padded = new Uint8Array(bytes.length + 10);
    padded.set(bytes, 5);
    return padded.subarray(5, -5);
  };
  const input = {
    pointer: view(f.snapshot.pointer),
    manifest: view(f.snapshot.manifest),
    index: view(f.snapshot.index),
    documents: [{ markdownPath: "web/note", body: view(f.body) }],
  };
  const pending = verifyPublicationSnapshot(input);
  for (const bytes of [
    input.pointer,
    input.manifest,
    input.index,
    input.documents[0]!.body,
  ])
    bytes.fill(0);
  input.documents[0]!.markdownPath = "web/changed";
  const result = await pending;
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.documents[0]?.html, f.html);
    assert.equal(result.value.index.results[0]?.markdownPath, "web/note");
  }
});

test("whole snapshot bounds actual aggregate bytes before copying or hashing", async (t) => {
  const digest = t.mock.method(globalThis.crypto.subtle, "digest", async () => {
    throw new Error("must not hash oversized input");
  });
  const f = fixture();
  const body = new Uint8Array(CONTENT_HTML_MAX_BYTES);
  failed(
    await verifyPublicationSnapshot({
      ...f.snapshot,
      documents: Array.from({ length: 64 }, (_, i) => ({
        markdownPath: `web/n-${i}`,
        body,
      })),
    }),
    "too-large",
    "snapshot",
  );
  failed(
    await verifyPublicationSnapshot({
      ...f.snapshot,
      documents: [
        {
          markdownPath: "web/note",
          body: new Uint8Array(CONTENT_HTML_MAX_BYTES + 1),
        },
      ],
    }),
    "too-large",
    "document",
  );
  failed(
    await verifyPublicationSnapshot({ ...f.snapshot, index: null }),
    "missing-artifact",
    "index",
  );
  assert.equal(digest.mock.callCount(), 0);
});

test("failures contain no input bytes, paths, metadata or accessor exceptions", async () => {
  const f = fixture();
  const marker = "synthetic-confidential-marker";
  const results = [
    await verifyPublicationDocument(encode(marker), f.manifest, "web/note"),
    await createPublicationManifest({
      get schemaVersion() {
        throw new Error(marker);
      },
    }),
    verifyPublicationPointer(encode(marker)),
  ];
  for (const result of results) {
    failed(result);
    assert.equal(JSON.stringify(result).includes(marker), false);
    assert.equal(JSON.stringify(result).includes("web/note"), false);
  }
});

test("hash provider failure is closed and oversized inputs never reach hashing", async (t) => {
  const digest = t.mock.method(globalThis.crypto.subtle, "digest", async () => {
    throw new Error("synthetic-provider-failure");
  });
  const f = fixture();
  failed(
    await verifyPublicationManifest(
      new Uint8Array(PUBLICATION_MANIFEST_MAX_BYTES + 1),
      f.pointer.revision,
    ),
    "too-large",
  );
  failed(
    await verifyPublicationDocument(
      new Uint8Array(CONTENT_HTML_MAX_BYTES + 1),
      f.manifest,
      "web/note",
    ),
    "too-large",
  );
  assert.equal(digest.mock.callCount(), 0);
  failed(
    await verifyPublicationManifest(f.bytes, f.pointer.revision),
    "crypto-unavailable",
  );
  failed(await createPublicationManifest(f.manifest), "crypto-unavailable");
});
