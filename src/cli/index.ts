#!/usr/bin/env node

const handlers: Record<string, () => Promise<{ run: (args: string[]) => Promise<void> | void }>> = {
  start: () => import('./start.js'),
  mcp: () => import('./mcp.js'),
  hook: () => import('./hook.js'),
  record: () => import('./record.js'),
  config: () => import('./config.js'),
};

export async function main(argv: string[]): Promise<number> {
  const [first, ...rest] = argv;
  const isFlag = first?.startsWith('-') ?? false;
  const name = first === undefined || isFlag ? 'start' : first;
  const args = first === undefined || isFlag ? argv : rest;
  const load = handlers[name];
  if (!load) {
    process.stderr.write(`Unknown command: ${name}\nCommands: ${Object.keys(handlers).join(', ')}\n`);
    return 1;
  }
  const mod = await load();
  await mod.run(args);
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  },
);
