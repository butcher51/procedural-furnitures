import { existsSync, readFileSync } from 'node:fs';

export function loadRegressions(type) {
  const url = new URL(`../regressions/${type}.json`, import.meta.url);
  return existsSync(url) ? JSON.parse(readFileSync(url, 'utf8')) : [];
}

export function knownBadEntries(regressions) {
  return regressions.filter((entry) => entry.status === 'known-bad');
}

export function isKnownBad(failure, regressions) {
  return knownBadEntries(regressions).some(
    (entry) => entry.seed === failure.seed && (!entry.invariant || failure.message.startsWith(entry.invariant))
  );
}

export function excuseKnownBad(failures, regressions) {
  return failures.filter((failure) => !isKnownBad(failure, regressions));
}
