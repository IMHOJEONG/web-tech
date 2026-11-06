import { z } from "zod";
import { CONTENT_HTML_MAX_BYTES, CONTENT_POSTS_MAX_BYTES } from "./index.ts";
import {
  PUBLICATION_MANIFEST_MAX_BYTES,
  PUBLICATION_MAX_DOCUMENTS,
  PUBLICATION_POINTER_MAX_BYTES,
  publicationIndexSchema,
  publicationManifestSchema,
  publicationPathSchema,
  publicationPointerSchema,
  publicationRevisionSchema,
  type PublicationManifest,
} from "./publication-schema.ts";

export type PublicationArtifact =
  | "pointer"
  | "manifest"
  | "index"
  | "document"
  | "snapshot";
export type PublicationIntegrityError =
  | "missing-artifact"
  | "invalid-bytes"
  | "too-large"
  | "invalid-utf8"
  | "invalid-json"
  | "invalid-schema"
  | "non-canonical-manifest"
  | "size-mismatch"
  | "hash-mismatch"
  | "document-not-found"
  | "index-document-mismatch"
  | "duplicate-artifact"
  | "unexpected-artifact"
  | "crypto-unavailable";
export type PublicationVerification<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: PublicationIntegrityError;
      artifact: PublicationArtifact;
    };

const pass = <T>(value: T): PublicationVerification<T> => ({ ok: true, value });
const fail = (
  code: PublicationIntegrityError,
  artifact: PublicationArtifact,
): PublicationVerification<never> => ({ ok: false, code, artifact });

function parse<T>(
  schema: z.ZodType<T>,
  input: unknown,
  kind: PublicationArtifact,
): PublicationVerification<T> {
  try {
    const parsed = schema.safeParse(input);
    return parsed.success ? pass(parsed.data) : fail("invalid-schema", kind);
  } catch {
    return fail("invalid-schema", kind);
  }
}

function copyBytes(
  input: unknown,
  max: number,
  kind: PublicationArtifact,
): PublicationVerification<Uint8Array<ArrayBuffer>> {
  if (input == null) return fail("missing-artifact", kind);
  try {
    if (!(input instanceof Uint8Array)) return fail("invalid-bytes", kind);
    if (input.byteLength > max) return fail("too-large", kind);
    // Own a stable bounded copy before the first asynchronous digest.
    return pass(new Uint8Array(input));
  } catch {
    return fail("invalid-bytes", kind);
  }
}

function decode(
  bytes: Uint8Array,
  kind: PublicationArtifact,
): PublicationVerification<string> {
  try {
    return pass(
      new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes),
    );
  } catch {
    return fail("invalid-utf8", kind);
  }
}

function json(
  bytes: Uint8Array,
  kind: PublicationArtifact,
): PublicationVerification<unknown> {
  const text = decode(bytes, kind);
  if (!text.ok) return text;
  try {
    return pass(JSON.parse(text.value) as unknown);
  } catch {
    return fail("invalid-json", kind);
  }
}

async function hash(
  bytes: Uint8Array<ArrayBuffer>,
  kind: PublicationArtifact,
): Promise<PublicationVerification<string>> {
  try {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return pass(
      Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join(""),
    );
  } catch {
    return fail("crypto-unavailable", kind);
  }
}

function canonicalManifest(
  manifest: PublicationManifest,
): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(
    JSON.stringify({
      schemaVersion: manifest.schemaVersion,
      formatVersion: manifest.formatVersion,
      index: { bytes: manifest.index.bytes, sha256: manifest.index.sha256 },
      documents: manifest.documents.map((document) => ({
        markdownPath: document.markdownPath,
        bytes: document.bytes,
        sha256: document.sha256,
      })),
    }),
  );
}

export async function createPublicationManifest(input: unknown) {
  const manifest = parse(publicationManifestSchema, input, "manifest");
  if (!manifest.ok) return manifest;
  const bytes = canonicalManifest(manifest.value);
  if (bytes.byteLength > PUBLICATION_MANIFEST_MAX_BYTES)
    return fail("too-large", "manifest");
  const revision = await hash(bytes, "manifest");
  return revision.ok ? pass({ bytes, revision: revision.value }) : revision;
}

export function verifyPublicationPointer(input: unknown) {
  const bytes = copyBytes(input, PUBLICATION_POINTER_MAX_BYTES, "pointer");
  if (!bytes.ok) return bytes;
  const parsed = json(bytes.value, "pointer");
  return parsed.ok
    ? parse(publicationPointerSchema, parsed.value, "pointer")
    : parsed;
}

export async function verifyPublicationManifest(
  input: unknown,
  expectedRevision: unknown,
) {
  const revision = parse(
    publicationRevisionSchema,
    expectedRevision,
    "manifest",
  );
  if (!revision.ok) return revision;
  const bytes = copyBytes(input, PUBLICATION_MANIFEST_MAX_BYTES, "manifest");
  if (!bytes.ok) return bytes;
  const actual = await hash(bytes.value, "manifest");
  if (!actual.ok) return actual;
  if (actual.value !== revision.value) return fail("hash-mismatch", "manifest");
  const parsed = json(bytes.value, "manifest");
  if (!parsed.ok) return parsed;
  const manifest = parse(publicationManifestSchema, parsed.value, "manifest");
  if (!manifest.ok) return manifest;
  const canonical = canonicalManifest(manifest.value);
  if (
    canonical.length !== bytes.value.length ||
    canonical.some((byte, index) => byte !== bytes.value[index])
  )
    return fail("non-canonical-manifest", "manifest");
  return manifest;
}

async function verifyArtifact(
  input: unknown,
  expected: { bytes: number; sha256: string },
  max: number,
  kind: PublicationArtifact,
) {
  const bytes = copyBytes(input, max, kind);
  if (!bytes.ok) return bytes;
  if (bytes.value.byteLength !== expected.bytes)
    return fail("size-mismatch", kind);
  const actual = await hash(bytes.value, kind);
  if (!actual.ok) return actual;
  return actual.value === expected.sha256 ? bytes : fail("hash-mismatch", kind);
}

export async function verifyPublicationIndex(
  input: unknown,
  manifestInput: unknown,
) {
  const manifest = parse(publicationManifestSchema, manifestInput, "manifest");
  if (!manifest.ok) return manifest;
  const bytes = await verifyArtifact(
    input,
    manifest.value.index,
    CONTENT_POSTS_MAX_BYTES,
    "index",
  );
  if (!bytes.ok) return bytes;
  const parsed = json(bytes.value, "index");
  if (!parsed.ok) return parsed;
  const index = parse(publicationIndexSchema, parsed.value, "index");
  if (!index.ok) return index;
  const paths = new Set(index.value.results.map((post) => post.markdownPath));
  if (
    paths.size !== manifest.value.documents.length ||
    manifest.value.documents.some(
      (document) => !paths.has(document.markdownPath),
    )
  )
    return fail("index-document-mismatch", "index");
  return index;
}

export async function verifyPublicationDocument(
  input: unknown,
  manifestInput: unknown,
  pathInput: unknown,
) {
  const manifest = parse(publicationManifestSchema, manifestInput, "manifest");
  if (!manifest.ok) return manifest;
  const path = parse(publicationPathSchema, pathInput, "document");
  if (!path.ok) return path;
  const document = manifest.value.documents.find(
    (entry) => entry.markdownPath === path.value,
  );
  if (!document) return fail("document-not-found", "document");
  return verifyDocument(input, document);
}

async function verifyDocument(
  input: unknown,
  document: PublicationManifest["documents"][number],
) {
  const bytes = await verifyArtifact(
    input,
    document,
    CONTENT_HTML_MAX_BYTES,
    "document",
  );
  if (!bytes.ok) return bytes;
  const html = decode(bytes.value, "document");
  return html.ok
    ? pass({ markdownPath: document.markdownPath, html: html.value })
    : html;
}

const snapshotInputSchema = z
  .object({
    pointer: z.unknown(),
    manifest: z.unknown(),
    index: z.unknown(),
    documents: z
      .array(
        z
          .object({ markdownPath: publicationPathSchema, body: z.unknown() })
          .strict(),
      )
      .max(PUBLICATION_MAX_DOCUMENTS),
  })
  .strict();

// Verifies the complete chain; individual artifact helpers assume trusted metadata.
export async function verifyPublicationSnapshot(input: unknown) {
  const parsed = parse(snapshotInputSchema, input, "snapshot");
  if (!parsed.ok) return parsed;
  const pointer = verifyPublicationPointer(parsed.value.pointer);
  if (!pointer.ok) return pointer;
  const manifest = await verifyPublicationManifest(
    parsed.value.manifest,
    pointer.value.revision,
  );
  if (!manifest.ok) return manifest;
  const index = await verifyPublicationIndex(
    parsed.value.index,
    manifest.value,
  );
  if (!index.ok) return index;
  const bodies = new Map<string, unknown>();
  for (const document of parsed.value.documents) {
    if (bodies.has(document.markdownPath))
      return fail("duplicate-artifact", "snapshot");
    bodies.set(document.markdownPath, document.body);
  }
  const expected = new Set(
    manifest.value.documents.map((document) => document.markdownPath),
  );
  if ([...bodies.keys()].some((path) => !expected.has(path)))
    return fail("unexpected-artifact", "snapshot");
  if (bodies.size !== expected.size)
    return fail("missing-artifact", "document");
  const documents: { markdownPath: string; html: string }[] = [];
  for (const document of manifest.value.documents) {
    const verified = await verifyDocument(
      bodies.get(document.markdownPath),
      document,
    );
    if (!verified.ok) return verified;
    documents.push(verified.value);
  }
  return pass({
    pointer: pointer.value,
    manifest: manifest.value,
    index: index.value,
    documents,
  });
}
