/** Git identity capture that survives spawn-restricted file sandboxes (issue #286).
 *
 * Several harness scripts record a source-identity artifact (HEAD commit,
 * source hash, dirty flag) by shelling out to git with piped stdio. On Windows
 * under a restricted file sandbox, spawnSync EPERMs on every piped child -
 * including git.exe - even though stdio 'inherit'/'ignore' children work. The
 * affected suites died at module scope before a single assertion ran.
 *
 * This helper keeps the primary git path byte-identical on normal machines and
 * degrades to a filesystem-only identity when the spawn is refused:
 *  - HEAD: .git file -> worktree gitdir -> HEAD -> loose/packed ref resolution
 *    (worktree refs first, then the common dir, then packed-refs).
 *  - sourceHash: SHA-256 over the recursive src/ tree on disk (name + bytes),
 *    tracked or not. Like every sourceHash in this repo it is only ever
 *    compared with itself (start vs end stability), so the exact file set
 *    definition differs from 'git ls-files' harmlessly. The result records
 *    which mode produced it so evidence is never silently misleading.
 *  - dirty flag: fs-only mode cannot see the index, so it reports
 *    dirtyUnknown: true instead of guessing.
 *
 * No assertion anywhere is weakened: callers still throw when identity cannot
 * be established at all, and degraded evidence is always labeled.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** A spawnSync error belongs to the sandbox refusal family. */
export function isSpawnRefusal(error) {
  if (!error) return false;
  return error.code === 'EPERM' || error.code === 'EACCES';
}

function isRealDirectory(p) {
  try { readdirSync(p); return true; } catch { return false; }
}

function resolveGitDir(repoRoot) {
  const dotGit = join(repoRoot, '.git');
  if (isRealDirectory(dotGit)) return dotGit; // plain checkout
  try {
    const text = readFileSync(dotGit, 'utf8').trim();
    const m = /gitdir:\s*(.+)/.exec(text);
    if (!m) return null;
    return resolve(repoRoot, m[1].replace(/^"|"$/g, ''));
  } catch { return null; }
}

function commonDir(gitDir) {
  try { return resolve(gitDir, readFileSync(join(gitDir, 'commondir'), 'utf8').trim()); }
  catch { return gitDir; }
}

function readShaFile(path) {
  try {
    const value = readFileSync(path, 'utf8').trim();
    return /^[0-9a-f]{40}$/i.test(value) ? value.toLowerCase() : null;
  } catch { return null; }
}

/** HEAD commit via gitdir files only; null when unresolvable. */
export function headFromFiles(gitDir) {
  try {
    const head = readFileSync(join(gitDir, 'HEAD'), 'utf8').trim();
    const m = /^ref:\s*(.+)$/.exec(head);
    if (!m) return /^[0-9a-f]{40}$/i.test(head) ? head.toLowerCase() : null; // detached HEAD
    const ref = m[1];
    const common = commonDir(gitDir);
    // Worktree-local ref file, then the common dir's loose ref, then packed-refs.
    const packed = () => {
      try {
        const lines = readFileSync(join(common, 'packed-refs'), 'utf8').split(/\r?\n/);
        for (const line of lines) {
          const sha = line.slice(0, 40), name = line.slice(41).trim();
          if (name === ref && /^[0-9a-f]{40}$/i.test(sha)) return sha.toLowerCase();
        }
      } catch {}
      return null;
    };
    return readShaFile(join(gitDir, ref))
      || readShaFile(join(common, ref))
      || packed();
  } catch { return null; }
}

/** Feed the recursive tree (sorted names, then bytes) into a hash. */
export function hashTree(repoRoot, sub, hash) {
  const base = join(repoRoot, sub);
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else {
        hash.update(p.slice(base.length + 1).split('\\').join('/'));
        hash.update(readFileSync(p));
      }
    }
  };
  walk(base);
}

/**
 * Capture repo identity. Never throws for a refused git binary; throws only
 * when neither git nor the filesystem can establish any identity.
 * @returns {{ mode:'git'|'filesystem', commit:string|null, sourceHash:string,
 *   workingTreeDirty:boolean|null, dirtyUnknown:boolean, refusalError:string|null }}
 */
export function gitIdentity(repoRoot, { hashSubdir = 'src' } = {}) {
  const piped = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8', windowsHide: true });
  if (!piped.error && piped.status === 0) {
    const status = spawnSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8', windowsHide: true });
    const hash = createHash('sha256');
    try { hashTree(repoRoot, hashSubdir, hash); } catch { /* keep git-only data */ }
    return {
      mode: 'git',
      commit: piped.stdout.trim(),
      sourceHash: hash.digest('hex'),
      workingTreeDirty: status.status === 0 ? !!status.stdout.trim() : null,
      dirtyUnknown: status.status !== 0,
      refusalError: null,
    };
  }
  if (!isSpawnRefusal(piped.error)) {
    throw Error('git rev-parse failed with status ' + piped.status + ': ' + (piped.stderr || piped.error));
  }
  // Sandbox refused the spawn: filesystem-only identity, clearly labeled.
  const gitDir = resolveGitDir(repoRoot);
  const commit = gitDir ? headFromFiles(gitDir) : null;
  const hash = createHash('sha256');
  try { hashTree(repoRoot, hashSubdir, hash); } catch (e) {
    throw Error('sandbox refused git spawn and filesystem identity also unavailable: ' + e.message);
  }
  return {
    mode: 'filesystem',
    commit,
    sourceHash: hash.digest('hex'),
    workingTreeDirty: null,
    dirtyUnknown: true,
    refusalError: piped.error.code + ': ' + piped.error.message,
  };
}

/** Default repo root for scripts living in scripts/lib. */
export const defaultRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
