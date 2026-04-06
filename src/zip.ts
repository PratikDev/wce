import { readFile } from "node:fs/promises";

import type { JsonFileInfo } from "./types/types.ts";

type ZipEntry = {
  name: string;
  data: Buffer;
  crc: number;
  size: number;
  date: Date;
  offset: number;
  isDirectory: boolean;
};

function crc32(buffer: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    (Math.floor(date.getSeconds() / 2) & 0x1f);
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);

  return { dosDate, dosTime };
}

function u16(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value, 0);
  return buffer;
}

function u32(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

export async function buildZip(files: JsonFileInfo[]) {
  const entries: ZipEntry[] = [];

  for (const file of files) {
    const data = Buffer.from(await readFile(file.path));
    entries.push({
      name: file.name,
      data,
      crc: crc32(data),
      size: data.length,
      date: new Date(),
      offset: 0,
      isDirectory: false,
    });
  }

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    entry.offset = offset;
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const { dosDate, dosTime } = dosDateTime(entry.date);

    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(dosTime),
      u16(dosDate),
      u32(entry.crc),
      u32(entry.size),
      u32(entry.size),
      u16(nameBuffer.length),
      u16(0),
      nameBuffer,
    ]);

    localParts.push(localHeader, entry.data);
    offset += localHeader.length + entry.data.length;

    const externalAttrs = entry.isDirectory ? 0x10 : 0;
    const centralHeader = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(dosTime),
      u16(dosDate),
      u32(entry.crc),
      u32(entry.size),
      u32(entry.size),
      u16(nameBuffer.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(externalAttrs),
      u32(entry.offset),
      nameBuffer,
    ]);

    centralParts.push(centralHeader);
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localData = Buffer.concat(localParts);
  const endOfCentralDirectory = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDirectory.length),
    u32(localData.length),
    u16(0),
  ]);

  return Buffer.concat([localData, centralDirectory, endOfCentralDirectory]);
}
