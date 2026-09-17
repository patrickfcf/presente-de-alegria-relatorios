import sharp from "sharp";
for (const [size, name] of [
  [192, "icon-192"],
  [512, "icon-512"],
  [180, "apple-touch-icon"],
]) {
  await sharp("public/logo.png")
    .resize(Math.floor(size * 0.8), Math.floor(size * 0.8), { fit: "inside" })
    .extend({
      top: Math.ceil(size * 0.325),
      bottom: Math.floor(size * 0.325),
      left: Math.ceil(size * 0.1),
      right: Math.floor(size * 0.1),
      background: "#fff",
    })
    .resize(size, size, { fit: "contain", background: "#fff" })
    .flatten({ background: "#fff" })
    .png()
    .toFile("public/icons/" + name + ".png");
}
