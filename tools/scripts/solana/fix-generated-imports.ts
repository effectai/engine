/**
 * Post-processes codama-generated TypeScript so that every relative
 * import/export specifier has an explicit `.js` extension (or
 * `/index.js` for folder imports).
 *
 * This is required because modules compile with `"module": "NodeNext"`,
 * which enforces Node ESM resolution rules at runtime: extensionless
 * relative specifiers are not allowed. Codama emits them anyway, so
 * we rewrite them here, in place, before tsc runs.
 *
 * Usage:
 *   node --experimental-strip-types fix-generated-imports.ts <module-name>
 *
 * Where <module-name> is the folder under `modules/` whose
 * `clients/js/@generated` tree should be rewritten.
 *
 * Idempotent: running this twice is a no-op.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const moduleName = process.argv[2];
if (!moduleName) {
  console.error(
    "fix-generated-imports: missing <module-name> argument (e.g. 'payment')",
  );
  process.exit(1);
}

const GENERATED_DIR = path.resolve(
  __dirname,
  `../../../modules/${moduleName}/clients/js/@generated`,
);

// Matches: from '...' | from "..." in both `import` and `export` statements,
// capturing the quote style and the specifier.
const SPEC_RE = /(\bfrom\s+)(['"])(\.{1,2}\/[^'"]+?)\2/g;

const walk = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (st.isFile() && full.endsWith(".ts")) out.push(full);
  }
  return out;
};

const resolveSpecifier = (
  fromFile: string,
  specifier: string,
): string | null => {
  // Already has an extension we recognise → leave it alone.
  if (/\.(js|cjs|mjs|json)$/.test(specifier)) return null;

  const baseDir = path.dirname(fromFile);
  const target = path.resolve(baseDir, specifier);

  // Case 1: `<target>.ts` exists → append `.js`
  try {
    if (statSync(`${target}.ts`).isFile()) return `${specifier}.js`;
  } catch {
    // not a file, fall through
  }

  // Case 2: `<target>/index.ts` exists → append `/index.js`
  try {
    if (statSync(path.join(target, "index.ts")).isFile()) {
      return `${specifier.replace(/\/$/, "")}/index.js`;
    }
  } catch {
    // not a directory with index, fall through
  }

  return null;
};

let touched = 0;
let rewrites = 0;

for (const file of walk(GENERATED_DIR)) {
  const original = readFileSync(file, "utf-8");
  const updated = original.replace(SPEC_RE, (match, from, quote, spec) => {
    const resolved = resolveSpecifier(file, spec);
    if (!resolved) return match;
    rewrites += 1;
    return `${from}${quote}${resolved}${quote}`;
  });
  if (updated !== original) {
    writeFileSync(file, updated);
    touched += 1;
  }
}

console.log(
  `fix-generated-imports(${moduleName}): rewrote ${rewrites} specifier(s) across ${touched} file(s)`,
);
