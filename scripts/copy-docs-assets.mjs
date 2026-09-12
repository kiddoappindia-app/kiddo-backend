import { cpSync, mkdirSync } from 'node:fs';

const source = new URL('../src/docs/portal/', import.meta.url);
const target = new URL('../dist/docs/portal/', import.meta.url);

mkdirSync(new URL('../dist/docs/', import.meta.url), { recursive: true });
cpSync(source, target, { recursive: true });

console.log('KidDo portal assets copied to dist/docs/portal');
