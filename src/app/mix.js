import { createRng, weightedPick } from '../core/rng.js';

export const ALL_ID = 'all';
export const ALL_COUNT = 120;
export const ALL_ENTRY = { id: ALL_ID, label: 'All' };

export function pickType(seed, number, definitions) {
  const rng = createRng(`${seed}-all-${number}`);
  return weightedPick(rng, definitions.map((definition) => [definition, definition.mixWeight ?? 1]));
}

const pluralOf = (definition) => definition.plural ?? `${definition.label.toLowerCase()}s`;

export function createScene(typeId, seed, definitions) {
  if (typeId === ALL_ID) {
    const sceneSeed = `${seed}-all`;
    const meanSpacing = definitions.reduce((sum, d) => sum + d.cell.spacing ** 2, 0) / definitions.length;
    return {
      id: ALL_ID,
      label: 'All',
      plural: 'furniture',
      mixed: true,
      count: ALL_COUNT,
      gridSize: Math.ceil(Math.sqrt(ALL_COUNT)),
      spacing: Math.sqrt(meanSpacing),
      spacingZ: Math.sqrt(meanSpacing),
      resolve: (number) => ({ definition: pickType(seed, number, definitions), seed: sceneSeed }),
    };
  }
  const definition = definitions.find((d) => d.id === typeId);
  return {
    id: definition.id,
    label: definition.label,
    plural: pluralOf(definition),
    mixed: false,
    count: definition.cell.gridSize ** 2,
    gridSize: definition.cell.gridSize,
    spacing: definition.cell.spacing,
    spacingZ: definition.cell.spacingZ ?? definition.cell.spacing,
    resolve: () => ({ definition, seed }),
  };
}
