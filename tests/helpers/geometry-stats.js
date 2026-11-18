export function geometryStats(object) {
  let triangles = 0;
  let drawCalls = 0;
  let checksum = 0;
  object.updateMatrixWorld(true);
  object.traverse((o) => {
    if (!o.isMesh) return;
    drawCalls++;
    const g = o.geometry;
    triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
    const pos = g.attributes.position.array;
    for (let i = 0; i < pos.length; i++) checksum += pos[i] * ((i % 7) + 1);
  });
  return { triangles, drawCalls, checksum: Math.round(checksum * 1e4) / 1e4 };
}
