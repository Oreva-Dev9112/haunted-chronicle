import type { Snapshot } from "./types";

export type { Snapshot } from "./types";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonical(obj[k])).join(",") + "}";
  }
  return JSON.stringify(value) ?? "null";
}

/** Canonical JSON: keys sorted at every level, no whitespace. */
export function printSnapshot(snapshot: Snapshot): string {
  return canonical(snapshot);
}

export type SnapshotParseResult = { snapshot: Snapshot } | { error: string };

class FieldError extends Error {
  constructor(readonly field: string, reason: string) {
    super(`invalid field "${field}": ${reason}`);
  }
}

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function str(o: Obj, key: string, at: string): string {
  const v = o[key];
  if (typeof v !== "string") throw new FieldError(`${at}${key}`, "expected string");
  return v;
}

function int(o: Obj, key: string, at: string): number {
  const v = o[key];
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
    throw new FieldError(`${at}${key}`, "expected non-negative integer");
  }
  return v;
}

function bool(o: Obj, key: string, at: string): boolean {
  const v = o[key];
  if (typeof v !== "boolean") throw new FieldError(`${at}${key}`, "expected boolean");
  return v;
}

function list<T>(o: Obj, key: string, at: string, each: (item: Obj, path: string) => T): T[] {
  const v = o[key];
  if (!Array.isArray(v)) throw new FieldError(`${at}${key}`, "expected array");
  return v.map((item, i) => {
    const path = `${at}${key}[${i}]`;
    if (!isObj(item)) throw new FieldError(path, "expected object");
    return each(item, path + ".");
  });
}

function build(raw: unknown): Snapshot {
  if (!isObj(raw)) throw new FieldError("(root)", "expected object");
  return {
    projectName: str(raw, "projectName", ""),
    files: list(raw, "files", "", (f, p) => ({ path: str(f, "path", p) })),
    omittedFileCount: int(raw, "omittedFileCount", ""),
    importEdges: list(raw, "importEdges", "", (e, p) => ({
      from: str(e, "from", p),
      to: str(e, "to", p),
    })),
    tasks: list(raw, "tasks", "", (t, p) => ({
      specName: str(t, "specName", p),
      line: int(t, "line", p),
      text: str(t, "text", p),
      done: bool(t, "done", p),
    })),
    testFailures: list(raw, "testFailures", "", (t, p) => ({
      testFile: str(t, "testFile", p),
      message: str(t, "message", p),
      stackFrames: list(t, "stackFrames", p, (s, sp) => ({
        path: str(s, "path", sp),
        line: int(s, "line", sp),
      })),
    })),
    secretFindings: list(raw, "secretFindings", "", (s, p) => ({
      path: str(s, "path", p),
      line: int(s, "line", p),
      pattern: str(s, "pattern", p),
    })),
  };
}

/** Parses Snapshot JSON. Never throws; returns `{ error }` naming the invalid field. */
export function parseSnapshot(text: string): SnapshotParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as Json;
  } catch {
    return { error: 'invalid field "(root)": not valid JSON' };
  }
  try {
    return { snapshot: build(raw) };
  } catch (e) {
    if (e instanceof FieldError) return { error: e.message };
    return { error: 'invalid field "(root)": unreadable' };
  }
}
