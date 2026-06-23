export function fitWithinBox(width, height, maxSide) {
  const longest = Math.max(width, height);
  if (!longest || longest <= maxSide) {
    return { width, height };
  }

  const scale = maxSide / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
