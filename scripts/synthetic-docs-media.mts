import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { getArticleDiagramSources } from "../apps/docs/lib/article-diagram-sources.ts";

export const syntheticImages = [
  ...[
    "stages",
    "completion",
    "local-architecture",
    "service-infrastructure",
  ].flatMap((name) => {
    const sources = getArticleDiagramSources(
      `/diagrams/http-response-${name}.png`,
    )!;
    return [
      {
        pathname: sources.portrait,
        width: 720,
        height: sources.portraitHeight,
      },
      {
        pathname: sources.landscape,
        width: 1600,
        height: sources.landscapeHeight,
      },
    ];
  }),
  { pathname: "/diagrams/tcp-socket-endpoints.png", width: 720, height: 480 },
] as const;

function chunk(type: string, bytes: Buffer) {
  const data = Buffer.concat([Buffer.from(type), bytes]);
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  const size = Buffer.alloc(4);
  size.writeUInt32BE(bytes.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([size, data, checksum]);
}

export function syntheticPng(width: number, height: number) {
  assert.ok(Number.isInteger(width) && width > 0 && width <= 1600);
  assert.ok(Number.isInteger(height) && height > 0 && height <= 1600);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  const pixels = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      const shade = (Math.floor(x / 80) + Math.floor(y / 80)) % 2 ? 215 : 235;
      pixels[offset] = shade;
      pixels[offset + 1] = shade;
      pixels[offset + 2] = shade;
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function assertSyntheticImageTargets(
  appRoot: string,
  allowExisting = false,
) {
  appRoot = path.resolve(appRoot);
  for (const { pathname } of syntheticImages) {
    const target = path.join(appRoot, "public", pathname);
    let current = path.dirname(target);
    while (current !== path.resolve(appRoot)) {
      const entry = fs.lstatSync(current, { throwIfNoEntry: false });
      assert.ok(!entry || (entry.isDirectory() && !entry.isSymbolicLink()));
      current = path.dirname(current);
    }
    const entry = fs.lstatSync(target, { throwIfNoEntry: false });
    assert.ok(
      !entry || (allowExisting && entry.isFile() && !entry.isSymbolicLink()),
      "never overwrite application media",
    );
  }
}

export function writeSyntheticImages(appRoot: string) {
  appRoot = path.resolve(appRoot);
  assertSyntheticImageTargets(appRoot);
  for (const { pathname, width, height } of syntheticImages) {
    const target = path.join(appRoot, "public", pathname);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, syntheticPng(width, height), { flag: "wx" });
  }
}
