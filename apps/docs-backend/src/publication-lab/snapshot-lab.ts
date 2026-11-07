import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readdir,
  realpath,
  rename,
  rm,
  unlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CONTENT_HTML_MAX_BYTES,
  CONTENT_POSTS_MAX_BYTES,
} from '@web-tech/docs-content-contract';
import {
  PUBLICATION_MANIFEST_MAX_BYTES,
  PUBLICATION_MAX_DOCUMENTS,
  PUBLICATION_POINTER_MAX_BYTES,
  PUBLICATION_SNAPSHOT_MAX_BYTES,
  createPublicationManifest,
  publicationGenerationSchema,
  publicationIndexSchema,
  publicationPathSchema,
  publicationPointerSchema,
  publicationRevisionSchema,
  verifyPublicationManifest,
  verifyPublicationPointer,
  verifyPublicationSnapshot,
  type PublicationPointer,
} from '@web-tech/docs-content-contract/publication';

type Snapshot = Extract<
  Awaited<ReturnType<typeof verifyPublicationSnapshot>>,
  { ok: true }
>['value'];
export type SnapshotCheckpoint =
  | 'candidate-written'
  | 'release-renamed'
  | 'pointer-synced'
  | 'pointer-renamed'
  | 'pointer-opened';
type Checkpoint = (phase: SnapshotCheckpoint) => Promise<void>;
type LabCode =
  | 'invalid-input'
  | 'integrity-failure'
  | 'unsafe-file'
  | 'too-large'
  | 'locked'
  | 'pointer-missing'
  | 'generation-conflict'
  | 'commit-uncertain'
  | 'io-failure'
  | 'disposed';

export class SnapshotLabError extends Error {
  constructor(readonly code: LabCode) {
    super(`Snapshot lab: ${code}`);
    this.name = 'SnapshotLabError';
  }
}
const reject = (code: LabCode): never => {
  throw new SnapshotLabError(code);
};
const bytes = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8');
const descriptor = (body: Uint8Array) => ({
  bytes: body.byteLength,
  sha256: createHash('sha256').update(body).digest('hex'),
});
const isMissing = (error: unknown) =>
  (error as NodeJS.ErrnoException)?.code === 'ENOENT';

async function directory(path: string) {
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) reject('unsafe-file');
}
async function syncDirectory(path: string) {
  const handle = await open(
    path,
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
  );
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}
async function writeNew(path: string, body: Uint8Array) {
  const handle = await open(path, 'wx', 0o600);
  try {
    await handle.writeFile(body);
    await handle.sync();
  } finally {
    await handle.close();
  }
}
async function readBounded(
  path: string,
  max: number,
  afterOpen?: () => Promise<void>,
  allowReplacedPointer = false,
) {
  // Both path stat and fd stat can observe the old pointer inode after atomic replacement.
  const safeLinks = (links: number) =>
    links === 1 || (allowReplacedPointer && links === 0);
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || !safeLinks(stat.nlink))
    reject('unsafe-file');
  const handle = await open(
    path,
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  );
  try {
    await afterOpen?.();
    const actual = await handle.stat();
    if (!actual.isFile() || !safeLinks(actual.nlink)) reject('unsafe-file');
    if (actual.size > max) reject('too-large');
    const buffer = Buffer.alloc(max + 1);
    let length = 0;
    while (length < buffer.length) {
      const result = await handle.read(
        buffer,
        length,
        buffer.length - length,
        length,
      );
      if (!result.bytesRead) break;
      length += result.bytesRead;
    }
    if (length > max) reject('too-large');
    return buffer.subarray(0, length);
  } finally {
    await handle.close();
  }
}
async function guarded<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof SnapshotLabError) throw error;
    return reject('io-failure');
  }
}

// Only this module's factory constructs stores; no CONTENT_DIR or external root is accepted.
class PublicationSnapshotLab {
  private disposed = false;
  constructor(
    readonly root: string,
    private readonly checkpoint?: Checkpoint,
  ) {}

  reopen() {
    return new PublicationSnapshotLab(this.root, this.checkpoint);
  }

  private async assertRoot() {
    if (this.disposed) reject('disposed');
    await directory(this.root);
    await directory(join(this.root, 'releases'));
  }

  private async locked<T>(action: () => Promise<T>) {
    await this.assertRoot();
    const path = join(this.root, '.publisher.lock');
    const lock = await open(path, 'wx', 0o600).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'EEXIST') return reject('locked');
        throw error;
      },
    );
    try {
      return await action();
    } finally {
      await lock.close();
      await unlink(path);
    }
  }

  async build(input: {
    index: unknown;
    documents: readonly { markdownPath: string; html: Uint8Array }[];
  }) {
    return guarded(async () => {
      const index = publicationIndexSchema.safeParse(input?.index);
      if (
        !index.success ||
        !Array.isArray(input?.documents) ||
        input.documents.length > PUBLICATION_MAX_DOCUMENTS
      )
        return reject('invalid-input');
      const indexBytes = bytes(index.data);
      if (indexBytes.byteLength > CONTENT_POSTS_MAX_BYTES)
        return reject('too-large');
      let total = indexBytes.byteLength;
      const documents = input.documents
        .map((document) => {
          if (
            !publicationPathSchema.safeParse(document?.markdownPath).success ||
            !(document?.html instanceof Uint8Array)
          )
            return reject('invalid-input');
          total += document.html.byteLength;
          if (
            document.html.byteLength > CONTENT_HTML_MAX_BYTES ||
            total > PUBLICATION_SNAPSHOT_MAX_BYTES
          )
            return reject('too-large');
          return {
            markdownPath: document.markdownPath,
            body: new Uint8Array(document.html),
          };
        })
        .sort((a, b) =>
          a.markdownPath < b.markdownPath
            ? -1
            : a.markdownPath > b.markdownPath
              ? 1
              : 0,
        );
      const manifest = await createPublicationManifest({
        schemaVersion: 1,
        formatVersion: 1,
        index: descriptor(indexBytes),
        documents: documents.map((document) => ({
          markdownPath: document.markdownPath,
          ...descriptor(document.body),
        })),
      });
      if (!manifest.ok) return reject('integrity-failure');
      const pointer: PublicationPointer = {
        schemaVersion: 1,
        generation: randomUUID(),
        revision: manifest.value.revision,
        previousGeneration: null,
      };
      const verified = await verifyPublicationSnapshot({
        pointer: bytes(pointer),
        manifest: manifest.value.bytes,
        index: indexBytes,
        documents,
      });
      if (!verified.ok) return reject('integrity-failure');
      return this.locked(async () => {
        const release = join(this.root, 'releases', pointer.revision);
        try {
          await lstat(release);
          await this.readSnapshot(pointer);
          return pointer.revision;
        } catch (error) {
          if (!isMissing(error)) throw error;
        }
        const candidate = await mkdtemp(join(this.root, '.candidate-'));
        let moved = false;
        try {
          await mkdir(join(candidate, 'documents'), { mode: 0o700 });
          const channels = new Set(
            documents.map((document) => document.markdownPath.split('/')[0]!),
          );
          for (const channel of channels)
            await mkdir(join(candidate, 'documents', channel), { mode: 0o700 });
          await writeNew(join(candidate, 'index.json'), indexBytes);
          await writeNew(
            join(candidate, 'manifest.json'),
            manifest.value.bytes,
          );
          for (const document of documents)
            await writeNew(
              join(candidate, 'documents', `${document.markdownPath}.html`),
              document.body,
            );
          for (const channel of channels)
            await syncDirectory(join(candidate, 'documents', channel));
          await syncDirectory(join(candidate, 'documents'));
          await syncDirectory(candidate);
          await this.checkpoint?.('candidate-written');
          await this.readStored(candidate, pointer);
          await rename(candidate, release);
          moved = true;
          await syncDirectory(join(this.root, 'releases'));
          await syncDirectory(this.root);
          await this.checkpoint?.('release-renamed');
          return pointer.revision;
        } finally {
          if (!moved) await rm(candidate, { recursive: true, force: true });
        }
      });
    });
  }

  private async pointer() {
    const path = join(this.root, 'current.json');
    let body: Uint8Array;
    try {
      body = await readBounded(
        path,
        PUBLICATION_POINTER_MAX_BYTES,
        async () => {
          await this.checkpoint?.('pointer-opened');
        },
        true,
      );
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
    const pointer = verifyPublicationPointer(body);
    if (!pointer.ok) return reject('integrity-failure');
    return pointer.value;
  }

  private async initialized() {
    try {
      const marker = await readBounded(join(this.root, 'initialized'), 16);
      if (!marker.equals(Buffer.from('1\n')))
        return reject('integrity-failure');
      return true;
    } catch (error) {
      if (isMissing(error)) return false;
      throw error;
    }
  }

  async readSnapshot(input: unknown): Promise<Snapshot> {
    return guarded(async () => {
      await this.assertRoot();
      const pointer = publicationPointerSchema.safeParse(input);
      if (!pointer.success) return reject('invalid-input');
      const release = join(this.root, 'releases', pointer.data.revision);
      return this.readStored(release, pointer.data);
    });
  }

  private async readStored(
    release: string,
    pointer: PublicationPointer,
  ): Promise<Snapshot> {
    await directory(release);
    const manifestBytes = await readBounded(
      join(release, 'manifest.json'),
      PUBLICATION_MANIFEST_MAX_BYTES,
    );
    const manifest = await verifyPublicationManifest(
      manifestBytes,
      pointer.revision,
    );
    if (!manifest.ok) return reject('integrity-failure');
    const names = await readdir(release);
    if (names.sort().join(',') !== 'documents,index.json,manifest.json')
      return reject('integrity-failure');
    const documentsDir = join(release, 'documents');
    await directory(documentsDir);
    const channels = [
      ...new Set(
        manifest.value.documents.map(
          (document) => document.markdownPath.split('/')[0]!,
        ),
      ),
    ].sort();
    if ((await readdir(documentsDir)).sort().join(',') !== channels.join(','))
      return reject('integrity-failure');
    for (const channel of channels) {
      const path = join(documentsDir, channel);
      await directory(path);
      const expected = manifest.value.documents
        .filter((document) => document.markdownPath.startsWith(`${channel}/`))
        .map((document) => `${document.markdownPath.split('/')[1]}.html`)
        .sort();
      if ((await readdir(path)).sort().join(',') !== expected.join(','))
        return reject('integrity-failure');
    }
    const index = await readBounded(
      join(release, 'index.json'),
      CONTENT_POSTS_MAX_BYTES,
    );
    const documents: { markdownPath: string; body: Uint8Array }[] = [];
    for (const document of manifest.value.documents)
      documents.push({
        markdownPath: document.markdownPath,
        body: await readBounded(
          join(documentsDir, `${document.markdownPath}.html`),
          CONTENT_HTML_MAX_BYTES,
        ),
      });
    const verified = await verifyPublicationSnapshot({
      pointer: bytes(pointer),
      manifest: manifestBytes,
      index,
      documents,
    });
    if (!verified.ok) return reject('integrity-failure');
    return verified.value;
  }

  async readCurrent() {
    return guarded(async () => {
      await this.assertRoot();
      const pointer = await this.pointer();
      const initialized = await this.initialized();
      if (!pointer && initialized) return reject('pointer-missing');
      if (pointer && !initialized) return reject('integrity-failure');
      return pointer ? this.readSnapshot(pointer) : null;
    });
  }

  async promote(
    revisionInput: unknown,
    expectedGeneration: unknown,
    options: { bootstrap?: boolean } = {},
  ) {
    return guarded(async () => {
      const revision = publicationRevisionSchema.safeParse(revisionInput);
      if (
        !revision.success ||
        (expectedGeneration !== null &&
          !publicationGenerationSchema.safeParse(expectedGeneration).success)
      )
        return reject('invalid-input');
      return this.locked(async () => {
        const current = await this.pointer();
        const initialized = await this.initialized();
        if (current && !initialized) return reject('integrity-failure');
        if (
          !current &&
          (initialized || !options.bootstrap || expectedGeneration !== null)
        )
          return reject('pointer-missing');
        if ((current?.generation ?? null) !== expectedGeneration)
          return reject('generation-conflict');
        let generation = randomUUID();
        while (generation === current?.generation) generation = randomUUID();
        const pointer: PublicationPointer = {
          schemaVersion: 1,
          revision: revision.data,
          generation,
          previousGeneration: current?.generation ?? null,
        };
        await this.readSnapshot(pointer);
        // Retain initialization intent if the first pointer write is interrupted.
        if (!initialized) {
          await writeNew(join(this.root, 'initialized'), Buffer.from('1\n'));
          await syncDirectory(this.root);
        }
        const temporary = join(this.root, `.pointer-${randomUUID()}`);
        let renamed = false;
        try {
          await writeNew(temporary, bytes(pointer));
          await this.checkpoint?.('pointer-synced');
          await rename(temporary, join(this.root, 'current.json'));
          renamed = true;
          await syncDirectory(this.root);
          await this.checkpoint?.('pointer-renamed');
          return pointer;
        } catch (error) {
          // Rename may already be visible: do not report an unchanged pointer or blindly roll it back.
          if (renamed) return reject('commit-uncertain');
          throw error;
        } finally {
          if (!renamed) await rm(temporary, { force: true });
        }
      });
    });
  }

  async dispose() {
    return guarded(async () => {
      await this.assertRoot();
      const lock = await open(
        join(this.root, '.publisher.lock'),
        'wx',
        0o600,
      ).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'EEXIST') return reject('locked');
        throw error;
      });
      await lock.close();
      await rm(this.root, { recursive: true });
      this.disposed = true;
    });
  }
}

export async function createPublicationSnapshotLab(checkpoint?: Checkpoint) {
  return guarded(async () => {
    const root = await realpath(
      await mkdtemp(join(tmpdir(), 'docs-publication-lab-')),
    );
    try {
      await mkdir(join(root, 'releases'), { mode: 0o700 });
    } catch (error) {
      await rm(root, { recursive: true, force: true });
      throw error;
    }
    return new PublicationSnapshotLab(root, checkpoint);
  });
}
