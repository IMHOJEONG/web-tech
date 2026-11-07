import { spawn } from 'node:child_process';
import { once } from 'node:events';
import {
  lstat,
  readFile,
  readdir,
  rename,
  symlink,
  link,
  truncate,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import {
  CONTENT_HTML_MAX_BYTES,
  CONTENT_POSTS_MAX_BYTES,
} from '@web-tech/docs-content-contract';
import {
  PUBLICATION_MANIFEST_MAX_BYTES,
  PUBLICATION_POINTER_MAX_BYTES,
} from '@web-tech/docs-content-contract/publication';
import {
  createPublicationSnapshotLab,
  SnapshotLabError,
  type SnapshotCheckpoint,
} from './snapshot-lab';

type Lab = Awaited<ReturnType<typeof createPublicationSnapshotLab>>;
const encode = (text: string) => new TextEncoder().encode(text);
function input(version = 'V1', path = 'web/note') {
  return {
    index: {
      results: [
        {
          id: path,
          markdownPath: path,
          slug: path.split('/')[1],
          title: `Synthetic ${version}`,
          summary: 'Synthetic summary',
          status: 'published',
          date: '2026-11-06',
          updatedAt: '2026-11-06',
          authorName: 'Synthetic writer',
          authorRole: 'Engineer',
          readMinutes: 1,
          tags: [],
          topicLabel: 'WEB',
        },
      ],
    },
    documents: [
      {
        markdownPath: path,
        html: encode(`<article>${version} 가나다</article>`),
      },
    ],
  };
}
const code = (value: string) =>
  expect.objectContaining({ name: 'SnapshotLabError', code: value });
const bodyPath = (lab: Lab, revision: string) =>
  join(lab.root, 'releases', revision, 'documents', 'web', 'note.html');
async function published(lab: Lab, version = 'V1') {
  const revision = await lab.build(input(version));
  const pointer = await lab.promote(revision, null, { bootstrap: true });
  return { revision, pointer };
}
function barrier() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('isolated publication snapshot lab', () => {
  let lab: Lab;
  afterEach(async () => {
    if (lab) await lab.dispose();
  });

  it('creates only a fresh private temp root and does not publish during build', async () => {
    lab = await createPublicationSnapshotLab();
    expect(lab.root.split('/').at(-1)).toMatch(/^docs-publication-lab-/);
    expect((await lstat(lab.root)).mode & 0o777).toBe(0o700);
    const revision = await lab.build(input());
    expect(revision).toMatch(/^[a-f0-9]{64}$/);
    expect(await lab.readCurrent()).toBeNull();
    expect(await readdir(lab.root)).toEqual(['releases']);
    expect(await readdir(join(lab.root, 'releases'))).toEqual([revision]);
    await expect(lab.promote(revision, null)).rejects.toEqual(
      code('pointer-missing'),
    );
    const pointer = await lab.promote(revision, null, { bootstrap: true });
    expect(pointer.previousGeneration).toBeNull();
    expect((await lab.readCurrent())?.documents[0]?.html).toContain('V1');
  });

  it('pins an old lease, reopens disk state, reuses content identity and rolls back with a new generation', async () => {
    lab = await createPublicationSnapshotLab();
    const v1 = await published(lab);
    expect(await lab.build(input())).toBe(v1.revision);
    const revision2 = await lab.build(input('V2'));
    const p2 = await lab.promote(revision2, v1.pointer.generation);
    expect(p2.previousGeneration).toBe(v1.pointer.generation);
    expect((await lab.readSnapshot(v1.pointer)).documents[0]?.html).toContain(
      'V1',
    );
    expect((await lab.reopen().readCurrent())?.documents[0]?.html).toContain(
      'V2',
    );
    const rollback = await lab.promote(v1.revision, p2.generation);
    expect(rollback.revision).toBe(v1.revision);
    expect(rollback.generation).not.toBe(v1.pointer.generation);
    expect(rollback.generation).not.toBe(p2.generation);
    expect(rollback.previousGeneration).toBe(p2.generation);
    expect((await lab.readCurrent())?.documents[0]?.html).toContain('V1');
  });

  it('canonicalizes document order and accepts an empty publication', async () => {
    lab = await createPublicationSnapshotLab();
    const a = input('A', 'web/a');
    const z = input('Z', 'web/z');
    const revision = await lab.build({
      index: { results: [...z.index.results, ...a.index.results] },
      documents: [...z.documents, ...a.documents],
    });
    const p1 = await lab.promote(revision, null, { bootstrap: true });
    expect(
      (await lab.readCurrent())?.documents.map(
        (document) => document.markdownPath,
      ),
    ).toEqual(['web/a', 'web/z']);
    const empty = await lab.build({ index: { results: [] }, documents: [] });
    await lab.promote(empty, p1.generation);
    expect((await lab.readCurrent())?.documents).toEqual([]);
  });

  it.each([
    'draft',
    'missing',
    'duplicate',
    'extra',
    'traversal',
    'invalid-utf8',
    'oversized-html',
    'oversized-index',
  ])('rejects %s input before any candidate is exposed', async (kind) => {
    lab = await createPublicationSnapshotLab();
    const v1 = await published(lab);
    const original = await readFile(join(lab.root, 'current.json'));
    const value = input('V2');
    switch (kind) {
      case 'draft':
        value.index.results[0]!.status = 'draft';
        break;
      case 'missing':
        value.documents = [];
        break;
      case 'duplicate':
        value.documents.push(value.documents[0]!);
        break;
      case 'extra':
        value.documents.push({
          markdownPath: 'web/extra',
          html: encode('extra'),
        });
        break;
      case 'traversal':
        value.documents[0]!.markdownPath = '../secret';
        break;
      case 'invalid-utf8':
        value.documents[0]!.html = new Uint8Array([0xff]);
        break;
      case 'oversized-html':
        value.documents[0]!.html = new Uint8Array(CONTENT_HTML_MAX_BYTES + 1);
        break;
      case 'oversized-index':
        value.index.results[0]!.summary = 'a'.repeat(CONTENT_POSTS_MAX_BYTES);
        break;
    }
    await expect(lab.build(value)).rejects.toBeInstanceOf(SnapshotLabError);
    expect(await readFile(join(lab.root, 'current.json'))).toEqual(original);
    expect(await readdir(join(lab.root, 'releases'))).toEqual([v1.revision]);
  });

  it.each([
    'body',
    'manifest',
    'missing',
    'extra',
    'symlink',
    'hardlink',
    'directory-symlink',
    'oversized-body',
    'oversized-manifest',
  ])(
    'rejects %s release corruption without changing the current pointer',
    async (kind) => {
      lab = await createPublicationSnapshotLab();
      const v1 = await published(lab);
      const revision = await lab.build(input('V2'));
      const release = join(lab.root, 'releases', revision);
      const body = bodyPath(lab, revision);
      switch (kind) {
        case 'body':
          await writeFile(body, encode('<article>V9 가나다</article>'));
          break;
        case 'manifest':
          await writeFile(join(release, 'manifest.json'), '{}');
          break;
        case 'missing':
          await unlink(body);
          break;
        case 'extra':
          await writeFile(join(release, 'extra.txt'), 'synthetic');
          break;
        case 'symlink':
          await unlink(body);
          await symlink(bodyPath(lab, v1.revision), body);
          break;
        case 'hardlink':
          await unlink(body);
          await link(bodyPath(lab, v1.revision), body);
          break;
        case 'directory-symlink': {
          const original = join(release, 'documents', 'web');
          await rename(original, join(release, 'moved-web'));
          await symlink(join(release, 'moved-web'), original);
          break;
        }
        case 'oversized-body':
          await truncate(body, CONTENT_HTML_MAX_BYTES + 1);
          break;
        case 'oversized-manifest':
          await truncate(
            join(release, 'manifest.json'),
            PUBLICATION_MANIFEST_MAX_BYTES + 1,
          );
          break;
      }
      const original = await readFile(join(lab.root, 'current.json'));
      await expect(
        lab.promote(revision, v1.pointer.generation),
      ).rejects.toBeInstanceOf(SnapshotLabError);
      expect(await readFile(join(lab.root, 'current.json'))).toEqual(original);
      // A hard link also invalidates the old file's single-link invariant; do not hide that corruption.
      if (kind === 'hardlink')
        await expect(lab.readCurrent()).rejects.toEqual(code('unsafe-file'));
      else expect((await lab.readCurrent())?.pointer).toEqual(v1.pointer);
    },
  );

  it.each([
    'candidate-written',
    'release-renamed',
    'pointer-synced',
  ] as SnapshotCheckpoint[])(
    'keeps the old pointer after an injected failure at %s',
    async (phase) => {
      let armed = false;
      lab = await createPublicationSnapshotLab(async (point) => {
        if (armed && point === phase) throw new Error('synthetic-interruption');
      });
      const v1 = await published(lab);
      const before = await readFile(join(lab.root, 'current.json'));
      armed = phase !== 'pointer-synced';
      let revision: string | undefined;
      if (phase === 'pointer-synced') {
        revision = await lab.build(input('V2'));
        armed = true;
      }
      await expect(
        revision
          ? lab.promote(revision, v1.pointer.generation)
          : lab.build(input('V2')),
      ).rejects.toEqual(code('io-failure'));
      expect(await readFile(join(lab.root, 'current.json'))).toEqual(before);
      expect((await lab.reopen().readCurrent())?.pointer).toEqual(v1.pointer);
      expect(
        (await readdir(lab.root)).filter((name) => name.startsWith('.')),
      ).toEqual([]);
    },
  );

  it('verifies actual candidate files after writing, before a release is exposed', async () => {
    let armed = false;
    lab = await createPublicationSnapshotLab(async (phase) => {
      if (armed && phase === 'candidate-written') {
        const candidate = (await readdir(lab.root)).find((name) =>
          name.startsWith('.candidate-'),
        )!;
        await writeFile(
          join(lab.root, candidate, 'documents', 'web', 'note.html'),
          'synthetic-tamper',
        );
      }
    });
    const v1 = await published(lab);
    armed = true;
    await expect(lab.build(input('V2'))).rejects.toEqual(
      code('integrity-failure'),
    );
    expect(await readdir(join(lab.root, 'releases'))).toEqual([v1.revision]);
    expect((await lab.readCurrent())?.pointer).toEqual(v1.pointer);
  });

  it('reports uncertainty after rename instead of pretending the old pointer survived', async () => {
    let armed = false;
    lab = await createPublicationSnapshotLab(async (phase) => {
      if (armed && phase === 'pointer-renamed')
        throw new Error('synthetic-interruption');
    });
    const v1 = await published(lab);
    const revision = await lab.build(input('V2'));
    armed = true;
    await expect(lab.promote(revision, v1.pointer.generation)).rejects.toEqual(
      code('commit-uncertain'),
    );
    const current = await lab.reopen().readCurrent();
    expect(current?.pointer.revision).toBe(revision);
    expect(current?.pointer.previousGeneration).toBe(v1.pointer.generation);
    expect(current?.documents[0]?.html).toContain('V2');
  });

  it('keeps reads atomic while excluding a second writer and rejects a stale expected generation', async () => {
    const reached = barrier();
    const release = barrier();
    let armed = false;
    lab = await createPublicationSnapshotLab(async (phase) => {
      if (armed && phase === 'pointer-synced') {
        reached.resolve();
        await release.promise;
      }
    });
    const v1 = await published(lab);
    const r2 = await lab.build(input('V2'));
    const r3 = await lab.build(input('V3'));
    armed = true;
    const winner = lab.promote(r2, v1.pointer.generation);
    let overlapping: ReturnType<Lab['readCurrent']>[] = [];
    try {
      await reached.promise;
      const reads = await Promise.all(
        Array.from({ length: 12 }, () => lab.readCurrent()),
      );
      expect(
        reads.every(
          (snapshot) => snapshot?.pointer.generation === v1.pointer.generation,
        ),
      ).toBe(true);
      await expect(
        lab.reopen().promote(r3, v1.pointer.generation),
      ).rejects.toEqual(code('locked'));
      await expect(lab.dispose()).rejects.toEqual(code('locked'));
      overlapping = Array.from({ length: 24 }, () => lab.readCurrent());
    } finally {
      release.resolve();
    }
    const p2 = await winner;
    const duringRename = await Promise.all(overlapping);
    expect(
      duringRename.every(
        (snapshot) =>
          snapshot &&
          [v1.pointer.generation, p2.generation].includes(
            snapshot.pointer.generation,
          ),
      ),
    ).toBe(true);
    await expect(lab.promote(r3, v1.pointer.generation)).rejects.toEqual(
      code('generation-conflict'),
    );
    expect((await lab.readCurrent())?.pointer).toEqual(p2);
  });

  it('retains an already opened pointer across replacement without rejecting the old inode', async () => {
    const opened = barrier();
    const finishRead = barrier();
    let armed = false;
    lab = await createPublicationSnapshotLab(async (phase) => {
      if (armed && phase === 'pointer-opened') {
        armed = false;
        opened.resolve();
        await finishRead.promise;
      }
    });
    const v1 = await published(lab);
    const r2 = await lab.build(input('V2'));
    armed = true;
    // Attach rejection handling immediately so a failing regression cannot leak an unhandled rejection.
    const oldRead = lab.readCurrent().then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    let p2;
    try {
      await opened.promise;
      p2 = await lab.promote(r2, v1.pointer.generation);
    } finally {
      finishRead.resolve();
    }
    const old = await oldRead;
    if ('error' in old) throw old.error;
    expect(old.value?.pointer).toEqual(v1.pointer);
    expect(old.value?.documents[0]?.html).toContain('V1');
    expect((await lab.readCurrent())?.pointer).toEqual(p2);
    expect((await lab.readCurrent())?.documents[0]?.html).toContain('V2');
  });

  it('honors a lock held by a separate process and never silently steals a leftover lock', async () => {
    lab = await createPublicationSnapshotLab();
    const v1 = await published(lab);
    const lockPath = join(lab.root, '.publisher.lock');
    const child = spawn(
      process.execPath,
      [
        '-e',
        'const fs=require("node:fs");const fd=fs.openSync(process.argv[1],"wx",0o600);process.stdout.write("locked");setInterval(()=>{},1000);',
        lockPath,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    try {
      await once(child.stdout!, 'data');
      await expect(
        lab.promote(v1.revision, v1.pointer.generation),
      ).rejects.toEqual(code('locked'));
      const exit = once(child, 'exit');
      child.kill('SIGKILL');
      await exit;
      await expect(
        lab.reopen().promote(v1.revision, v1.pointer.generation),
      ).rejects.toEqual(code('locked'));
      expect((await lab.readCurrent())?.pointer).toEqual(v1.pointer);
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        const exit = once(child, 'exit');
        child.kill('SIGKILL');
        await exit;
      }
      await unlink(lockPath).catch(() => undefined);
    }
  });

  it.each(['missing', 'broken', 'oversized', 'symlink', 'hardlink'])(
    'does not silently bootstrap or fall back after a %s pointer',
    async (kind) => {
      lab = await createPublicationSnapshotLab();
      const v1 = await published(lab);
      const path = join(lab.root, 'current.json');
      switch (kind) {
        case 'missing':
          await unlink(path);
          break;
        case 'broken':
          await writeFile(path, '{');
          break;
        case 'oversized':
          await truncate(path, PUBLICATION_POINTER_MAX_BYTES + 1);
          break;
        case 'symlink':
          await unlink(path);
          await symlink(bodyPath(lab, v1.revision), path);
          break;
        case 'hardlink':
          await unlink(path);
          await link(bodyPath(lab, v1.revision), path);
          break;
      }
      await expect(
        lab.promote(v1.revision, v1.pointer.generation),
      ).rejects.toBeInstanceOf(SnapshotLabError);
      await expect(lab.readCurrent()).rejects.toBeInstanceOf(SnapshotLabError);
      await expect(
        lab.promote(v1.revision, null, { bootstrap: true }),
      ).rejects.toBeInstanceOf(SnapshotLabError);
    },
  );

  it('retains first-publication intent after interruption and refuses to silently initialize again', async () => {
    lab = await createPublicationSnapshotLab(async (phase) => {
      if (phase === 'pointer-synced') throw new Error('synthetic-interruption');
    });
    const revision = await lab.build(input());
    await expect(
      lab.promote(revision, null, { bootstrap: true }),
    ).rejects.toEqual(code('io-failure'));
    await expect(lab.readCurrent()).rejects.toEqual(code('pointer-missing'));
    await expect(
      lab.reopen().promote(revision, null, { bootstrap: true }),
    ).rejects.toEqual(code('pointer-missing'));
  });

  it('leaks no path or low-level exception through failed operations', async () => {
    lab = await createPublicationSnapshotLab();
    const result = lab.promote('a'.repeat(64), null, { bootstrap: true });
    await expect(result).rejects.toEqual(code('io-failure'));
    await result.catch((error: SnapshotLabError) => {
      expect(error.message).not.toContain(lab.root);
      expect(error).not.toHaveProperty('cause');
      expect(Object.keys(error)).toEqual(['code', 'name']);
    });
  });
});
