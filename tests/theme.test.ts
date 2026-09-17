import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const css = readFileSync("src/index.css", "utf8");
const palettes = css.split("@media (prefers-color-scheme: dark)");
function luminance(hex: string) {
  let value = hex.slice(1);
  if (value.length === 3) value = [...value].map((c) => c + c).join("");
  return [0.2126, 0.7152, 0.0722].reduce((sum, weight, i) => {
    const channel = parseInt(value.slice(i * 2, i * 2 + 2), 16) / 255;
    return (
      sum +
      weight *
        (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    );
  }, 0);
}
for (const [index, mode] of ["light", "dark"].entries()) {
  test(`${mode}: text and form borders retain accessible contrast`, () => {
    const tokens = Object.fromEntries(
      [...palettes[index].matchAll(/--([\w-]+):\s*(#[\da-f]+)/g)].map((m) => [
        m[1],
        m[2],
      ]),
    );
    const pairs: [string, string, number][] = [
      ...["text", "text-secondary", "muted", "primary"].flatMap((foreground) =>
        ["background", "surface", "surface-soft", "surface-accent"].map(
          (background): [string, string, number] => [foreground, background, 4.5],
        ),
      ),
      ["success", "success-bg", 4.5],
      ["warning", "warning-bg", 4.5],
      ["error", "error-bg", 4.5],
      ["on-action", "action", 4.5],
      ["on-action", "action-hover", 4.5],
      ["control-border", "surface", 3],
    ];
    for (const [foreground, background, minimum] of pairs) {
      const values = [
        luminance(tokens[foreground]),
        luminance(tokens[background]),
      ].sort((a, b) => a - b);
      expect(
        (values[1] + 0.05) / (values[0] + 0.05),
        `${foreground} on ${background}`,
      ).toBeGreaterThanOrEqual(minimum);
    }
  });
}
