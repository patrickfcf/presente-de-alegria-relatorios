import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { publicPages, publicPath, siteOrigin, websiteSchema } from "../shared/seo.ts";
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const template = await readFile('dist/index.html','utf8');
const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
const socialImage = siteOrigin + manifest.icons.find(icon => icon.sizes === '512x512' && icon.purpose === 'any').src;
const schema = JSON.stringify(websiteSchema).replaceAll('<','\\u003c');
const hash = createHash('sha256').update(schema).digest('base64');
const links = publicPages.map(p=>`<a href="${publicPath(p.path)}">${escape(p.heading)}</a>`).join(' · ');
for (const page of publicPages) {
  const canonical = siteOrigin + publicPath(page.path);
  let html = template.replace(/<title>.*?<\/title>/s,`<title>${escape(page.title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/,`<meta name="description" content="${escape(page.description)}" />`)
    .replace('noindex,nofollow','index,follow,max-image-preview:large');
  html = html.replace('</head>',`<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="website" /><meta property="og:locale" content="pt_BR" />
<meta property="og:site_name" content="Presente de Alegria" />
<meta property="og:title" content="${escape(page.title)}" /><meta property="og:description" content="${escape(page.description)}" />
<meta property="og:url" content="${canonical}" /><meta property="og:image" content="${socialImage}" />
<meta property="og:image:alt" content="Símbolo do Presente de Alegria" /><meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escape(page.title)}" /><meta name="twitter:description" content="${escape(page.description)}" />
<meta name="twitter:image" content="${socialImage}" />
<script type="application/ld+json">${schema}</script></head>`);
  html = html.replace('<div id="root"></div>',`<div id="root"><main><img src="/logo.png" width="157" alt="Presente de Alegria" /><h1>${escape(page.heading)}</h1><p>${escape(page.description)}</p><nav aria-label="Páginas públicas">${links}</nav><p><a href="https://presentedealegria.org.br/voluntario/">Quero ser voluntário</a> · <a href="/#/minha-celula">Minha célula</a></p><noscript>Ative o JavaScript para consultar as publicações atualizadas e usar o aplicativo.</noscript></main></div>`);
  await mkdir('dist'+page.path,{recursive:true});
  await writeFile('dist'+page.path+'/index.html',html);
}
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`);
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicPages.map(p=>`<url><loc>${siteOrigin+publicPath(p.path)}</loc></url>`).join('')}</urlset>`);
let headers = await readFile('dist/_headers','utf8');
headers = headers.replace("script-src 'self';",`script-src 'self' 'sha256-${hash}';`);
headers += '\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\nhttps://:preview.:project.pages.dev/*\n  X-Robots-Tag: noindex, nofollow\n';
await writeFile('dist/_headers',headers);
await writeFile('dist/404.html','<!doctype html><html lang="pt-BR"><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Página não encontrada | Presente de Alegria</title><h1>Página não encontrada</h1><p><a href="/sobre/">Conheça o Presente de Alegria</a></p></html>');
console.log('Generated public SEO pages, sitemap, social metadata and crawler directives.');
