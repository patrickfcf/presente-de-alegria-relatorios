import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
// Preserve the supplied artwork; only resize/pad for platform icon formats.
const source = await readFile("assets/branding/app-icon.jpg");
const version = createHash("sha256").update(source).digest("hex").slice(0, 10);
const pixel = await sharp(source).extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
const background = { r: pixel[0], g: pixel[1], b: pixel[2], alpha: 1 };
const path = (name, ext = "png") => `/icons/presente-${version}-${name}.${ext}`;
for (const [size, name, scale] of [[32,"favicon",1],[180,"apple",0.9],[192,"192",0.9],[512,"512",0.9],[512,"maskable",0.7]]) {
  const inner = Math.floor(size * scale);
  const art = await sharp(source).resize(inner,inner,{fit:"contain",background}).png().toBuffer();
  await sharp({create:{width:size,height:size,channels:3,background}}).composite([{input:art,gravity:"centre"}]).png().toFile("public"+path(name));
}
// ICO container with PNG image data, for browsers requesting an ICO favicon.
const png = await readFile("public"+path("favicon"));
const header = Buffer.alloc(22);
header.writeUInt16LE(1,2); header.writeUInt16LE(1,4);
header[6]=32; header[7]=32; header.writeUInt16LE(1,10); header.writeUInt16LE(32,12);
header.writeUInt32LE(png.length,14); header.writeUInt32LE(22,18);
await writeFile("public"+path("favicon","ico"),Buffer.concat([header,png]));
const manifest = JSON.parse(await readFile("public/manifest.webmanifest","utf8"));
manifest.icons = [
 {src:path("192"),sizes:"192x192",type:"image/png",purpose:"any"},
 {src:path("512"),sizes:"512x512",type:"image/png",purpose:"any"},
 {src:path("maskable"),sizes:"512x512",type:"image/png",purpose:"maskable"},
];
await writeFile("public/manifest.webmanifest",JSON.stringify(manifest,null,2)+"\n");
let html = await readFile("index.html","utf8");
html = html.replace(/    <link rel="(?:icon|apple-touch-icon)"[^>]*>\n/g,"");
html = html.replace('    <link rel="manifest"',`    <link rel="icon" href="${path("favicon","ico")}" sizes="any" />\n    <link rel="icon" href="${path("favicon")}" type="image/png" sizes="32x32" />\n    <link rel="apple-touch-icon" href="${path("apple")}" sizes="180x180" />\n    <link rel="manifest"`);
await writeFile("index.html",html);
console.log("Generated favicon, Apple touch icon and Android icons:",version);
