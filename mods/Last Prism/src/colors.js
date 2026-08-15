export function hueToHex(hue) {
  const h = ((hue % 360) + 360) % 360;
  const k = (offset) => (offset + h / 30) % 12;
  const channel = (offset) =>
    Math.round(
      255 *
        (0.5 -
          0.5 * Math.max(-1, Math.min(k(offset) - 3, 9 - k(offset), 1))),
    );
  return (channel(0) << 16) | (channel(8) << 8) | channel(4);
}

export function hexToLightColor(color) {
  return [
    ((color >> 16) & 255) / 255,
    ((color >> 8) & 255) / 255,
    (color & 255) / 255,
    1,
  ];
}
