export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}

export function attachToolbar({ seedInput, regenButton, onSeed }) {
  seedInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && seedInput.value.trim()) onSeed(seedInput.value.trim());
  });
  regenButton.addEventListener('click', () => onSeed(randomSeed()));
  return {
    setSeed(seed) {
      seedInput.value = seed;
    },
  };
}
