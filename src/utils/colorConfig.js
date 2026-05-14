import rawColorConfig from "../assets/config_color.json";

const normalize = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");

const normalizedEntries = Object.entries(rawColorConfig).map(([key, value]) => [
  normalize(key),
  value,
]);

const normalizedMap = new Map(normalizedEntries);

const findClosestMatch = (normalizedColor) => {
  let bestMatch = null;

  for (const [key, value] of normalizedMap.entries()) {
    if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
      if (!bestMatch || key.length > bestMatch.key.length) {
        bestMatch = { key, value };
      }
    }
  }

  return bestMatch ? bestMatch.value : null;
};

export const resolveColor = (colorName) => {
  if (!colorName) return "transparent";

  const raw = String(colorName).trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) return raw;

  if (rawColorConfig[raw]) return rawColorConfig[raw];

  const normalized = normalize(raw);
  if (normalizedMap.has(normalized)) return normalizedMap.get(normalized);

  const closest = findClosestMatch(normalized);
  if (closest) return closest;

  return raw;
};

export const getColorConfig = () => rawColorConfig;
