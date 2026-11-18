export function splitSpan(start, end, count, gap) {
  const size = Math.max(0.001, (end - start - (count - 1) * gap) / count);
  return Array.from({ length: count }, (_, i) => ({ center: start + size / 2 + i * (size + gap), size }));
}
