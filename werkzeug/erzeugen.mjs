// Erzeugt die Rechtsseiten aller Apps aus deren eigenen Repositories.
//
//   npm install && QUELLEN=/pfad/zu/den/klonen npm run erzeugen
//
// QUELLEN ist der Ordner, in dem mahjong-app, swaply, mypeak, anigosha und
// wellbooked nebeneinander liegen (Vorgabe: der Ordner über diesem Repo).
//
// --- Wofür (30.09.2026) ------------------------------------------------------
//
// Am 28.09. hat Vercel den gesamten Account pausiert, weil eine App ihr
// Blob-Kontingent überschritten hatte. Damit waren Datenschutz und Impressum
// ALLER Apps tot — und die verlangen Apple und Google als Pflichtangabe. Mit
// ihnen lag app-ads.txt tot, die AdMob prüft.
//
// GitHub Pages hat für öffentliche Repositories kein Kontingent. Die Texte
// bleiben in den App-Repos gepflegt; dieses Skript macht daraus statische
// Seiten und wird nach jeder Änderung an einem Rechtstext neu ausgeführt.
//
// Einzige inhaltliche Änderung gegenüber den Originalen: Jede
// Datenschutzerklärung nennt zusätzlich GitHub als Auslieferer dieser Seiten.
// Die Vercel-Absätze bleiben, weil Backends und Web-Fassungen weiter dort
// liegen.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUELLEN = path.resolve(process.env.QUELLEN ?? path.join(ROOT, '..'));
const TMP = path.join(ROOT, 'werkzeug', '.tmp');

const STAND_DE = '30. September 2026';
const STAND_EN = '30 September 2026';
const APP_ADS = 'google.com, pub-8860791993288062, DIRECT, f08c47fec0942fa0\n';

const GITHUB_DE =
  'GitHub, Inc. (USA), ein Unternehmen der Microsoft Corporation: Auslieferung dieser Rechtstexte über GitHub Pages (almaz6380.github.io). Dabei fallen technisch notwendige Server-Protokolle (IP-Adresse, Zeitpunkt, aufgerufene Seite, User-Agent) an. Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren Auslieferung (Art. 6 Abs. 1 lit. f DSGVO), abgesichert durch EU-Standardvertragsklauseln. Wir selbst werten diese Protokolle nicht aus.';
const GITHUB_EN =
  'GitHub, Inc. (USA), a Microsoft Corporation company: delivery of these legal texts via GitHub Pages (almaz6380.github.io). Technically necessary server logs (IP address, time, requested page, user agent) are generated. The legal basis is our legitimate interest in secure delivery (Art. 6(1)(f) GDPR), safeguarded by EU standard contractual clauses. We do not analyse these logs ourselves.';

const q = (...p) => path.join(QUELLEN, ...p);
const lies = (datei) => readFileSync(datei, 'utf8');
function schreib(rel, inhalt) {
  const ziel = path.join(ROOT, rel);
  mkdirSync(path.dirname(ziel), { recursive: true });
  writeFileSync(ziel, inhalt);
}

// Ersetzt genau einmal — findet das Muster nicht (Originaltext geändert), soll
// der Lauf laut scheitern statt still eine Seite ohne Ergänzung zu erzeugen.
function ersetze(text, muster, neu, wo) {
  const treffer = typeof muster === 'string' ? text.split(muster).length - 1 : (text.match(new RegExp(muster, 'g')) ?? []).length;
  if (treffer !== 1) throw new Error(`${wo}: Muster ${muster} ${treffer}× gefunden, erwartet 1×`);
  return text.replace(muster, neu);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Klartext mit \n → Absätze. E-Mail-Adressen werden anklickbar.
function absaetze(body) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>\n').replace(/[\w.+-]+@[\w-]+\.[\w.]+[a-z]/g, (m) => `<a href="mailto:${m}">${m}</a>`)}</p>`)
    .join('\n');
}

const CSS = `
:root{color-scheme:light dark;--bg:#fafaf9;--fg:#1c1917;--muted:#57534e;--link:#1d4ed8;--line:#e7e5e4}
@media (prefers-color-scheme:dark){:root{--bg:#1c1917;--fg:#f5f5f4;--muted:#a8a29e;--link:#93c5fd;--line:#44403c}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:46rem;margin:0 auto;padding:2rem 16px 3rem}
h1{font-size:1.75rem;line-height:1.25;margin:.5rem 0 .25rem}
h2{font-size:1.15rem;margin:2rem 0 .25rem}
h3{font-size:1rem;margin:1.25rem 0 .25rem}
p,li{overflow-wrap:anywhere}
a{color:var(--link)}
.app{color:var(--muted);font-weight:600;margin:0}
.stand{color:var(--muted);font-size:.9rem;margin-top:0}
.sprache{float:right;font-size:.9rem}
footer{margin-top:3rem;padding-top:1rem;border-top:1px solid var(--line);font-size:.9rem;color:var(--muted)}
footer a{margin-right:1rem;display:inline-block}
`.trim();

function seite({ lang, app, title, inhalt, sprachwechsel, links }) {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} – ${esc(app)}</title>
<style>${CSS}</style>
</head>
<body>
<main>
${sprachwechsel ? `<a class="sprache" href="${sprachwechsel.href}" hreflang="${sprachwechsel.lang}">${sprachwechsel.label}</a>` : ''}
<p class="app">${esc(app)}</p>
${inhalt}
<footer>${links.map((l) => `<a href="${l.href}">${esc(l.label)}</a>`).join('')}</footer>
</main>
</body>
</html>
`;
}

// Fügt nach dem Absatz, der mit `anker` beginnt, den GitHub-Absatz ein.
function mitGithub(sections, anker, zusatz, wo) {
  const s = sections.find((x) => x.body.split(/\n\s*\n/).some((p) => p.trim().startsWith(anker)));
  if (!s) throw new Error(`${wo}: kein Absatz beginnt mit „${anker}“`);
  const teile = s.body.split(/\n\s*\n/);
  const i = teile.findIndex((p) => p.trim().startsWith(anker));
  teile.splice(i + 1, 0, zusatz);
  return sections.map((x) => (x === s ? { ...x, body: teile.join('\n\n') } : x));
}

// --- FullRep und Anigosha: Texte liegen als Datenobjekt vor ------------------

async function ausDaten({ ordner, app, datei, docs, anker, stand }) {
  const mod = await import(pathToFileURL(datei).href);
  const alle = mod.legalDocs;
  for (const lang of ['de', 'en']) {
    const links = docs.map((d) => ({ href: `${d.datei[lang]}.html`, label: alle[d.key][lang].title }));
    for (const d of docs) {
      const doc = alle[d.key][lang];
      let sections = doc.sections;
      let aktualisiert = stand(doc, lang, false);
      if (d.key === 'privacy') {
        sections = mitGithub(sections, anker[lang], lang === 'de' ? GITHUB_DE : GITHUB_EN, `${app} ${lang}`);
        aktualisiert = stand(doc, lang, true);
      }
      const anders = lang === 'de' ? 'en' : 'de';
      const inhalt = [
        `<h1>${esc(doc.title)}</h1>`,
        aktualisiert ? `<p class="stand">${esc(aktualisiert)}</p>` : '',
        ...sections.map((s) => `<section>\n<h2>${esc(s.heading)}</h2>\n${absaetze(s.body)}\n</section>`),
      ].join('\n');
      schreib(`${ordner}/${d.datei[lang]}.html`, seite({
        lang, app, title: doc.title, inhalt, links,
        sprachwechsel: { href: `${d.datei[anders]}.html`, lang: anders, label: anders === 'en' ? 'English' : 'Deutsch' },
      }));
    }
  }
}

// --- WELLbooked: Next.js-Seiten, per React statisch gerendert ----------------

async function wellbooked() {
  const esbuild = await import('esbuild');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { createElement } = await import('react');
  const stubs = path.join(ROOT, 'werkzeug', 'wellbooked-stubs.jsx');
  const seiten = [
    { key: 'datenschutz', label: 'Datenschutz' },
    { key: 'impressum', label: 'Impressum' },
    { key: 'agb', label: 'AGB' },
    { key: 'kontakt', label: 'Kontakt' },
  ];
  const links = seiten.map((s) => ({ href: `${s.key}.html`, label: s.label }));
  mkdirSync(TMP, { recursive: true });
  for (const s of seiten) {
    const out = path.join(TMP, `wb-${s.key}.mjs`);
    await esbuild.build({
      entryPoints: [q('wellbooked', 'src', 'app', '(customer)', s.key, 'page.tsx')],
      bundle: true, format: 'esm', platform: 'node', outfile: out, jsx: 'automatic',
      external: ['react', 'react/jsx-runtime', 'react-dom'], logLevel: 'error',
      plugins: [{
        name: 'stubs',
        setup(b) {
          b.onResolve({ filter: /^@\/components\/legal\/LegalPage$|^\.\/CookieConsentControl$/ }, () => ({ path: stubs }));
        },
      }],
    });
    const mod = await import(pathToFileURL(out).href + `?t=${Date.now()}`);
    let html = renderToStaticMarkup(createElement(mod.default));
    const title = mod.metadata?.title ?? s.label;
    html = html
      .replace(/href="\/(impressum|datenschutz|agb|kontakt)"/g, 'href="$1.html"')
      .replace(/href="\/fuer-anbieter"/g, 'href="https://www.wellbooked.at/fuer-anbieter"');
    if (s.key === 'datenschutz') {
      html = ersetze(html, /(<li>Vercel, Inc\. \(USA; Hosting der Web-App[^<]*<\/li>)/, `$1<li>${esc(GITHUB_DE)}</li>`, 'wellbooked');
      html = ersetze(html, /Stand: [^<]+</, `Stand: ${STAND_DE}<`, 'wellbooked');
    }
    if (/href="\/(?!\/)/.test(html)) throw new Error(`wellbooked/${s.key}: absoluter Pfad übrig, der hier ins Leere zeigt`);
    schreib(`wellbooked/${s.key}.html`, seite({ lang: 'de', app: 'WELLbooked!', title, inhalt: html, links }));
  }
}

// --- Mahjong und Swaply: schon statisches HTML ------------------------------

function mahjong() {
  let p = lies(q('mahjong-app', 'public', 'privacy.html'));
  let i = lies(q('mahjong-app', 'public', 'impressum.html'));
  const ohneVercel = (t, wo) => ersetze(t, /\n[ \t]*<!-- Vercel Web Analytics[^\n]*-->\n[ \t]*<script defer src="\/_vercel\/insights\/script\.js"><\/script>/, '', wo);
  p = ohneVercel(p, 'mahjong privacy');
  i = ohneVercel(i, 'mahjong impressum');
  p = p.replace(/href="\/impressum\.html"/g, 'href="impressum.html"');
  i = i.replace(/href="\/privacy\.html"/g, 'href="datenschutz.html"');
  p = ersetze(p, 'rufen unsere Webseite nicht auf.</p>', `rufen unsere Webseite nicht auf.</p>\n  <p>${esc(GITHUB_DE)}</p>`, 'mahjong de');
  p = ersetze(p, 'do not call our website.</p>', `do not call our website.</p>\n  <p>${esc(GITHUB_EN)}</p>`, 'mahjong en');
  p = ersetze(p, 'Stand: 17. September 2026', `Stand: ${STAND_DE}`, 'mahjong de');
  p = ersetze(p, 'Last updated: September 17, 2026', 'Last updated: September 30, 2026', 'mahjong en');
  schreib('mahjong/datenschutz.html', p);
  schreib('mahjong/impressum.html', i);
}

function swaply() {
  let d = lies(q('swaply', 'landing', 'datenschutz.html'));
  let i = lies(q('swaply', 'landing', 'impressum.html'));
  // Der Zurück-Link zeigt auf die Landingpage, die hier nicht liegt.
  const ohneZurueck = (t, wo) => ersetze(t, /\n[ \t]*<a class="back" href="\.\/">[^<]*<\/a>/, '', wo);
  d = ohneZurueck(d, 'swaply datenschutz');
  i = ohneZurueck(i, 'swaply impressum');
  d = ersetze(d, 'href="impressum"', 'href="impressum.html"', 'swaply datenschutz');
  i = ersetze(i, 'href="datenschutz"', 'href="datenschutz.html"', 'swaply impressum');
  d = ersetze(d, /(EU-Standardvertragsklauseln\.\n[ \t]*<\/li>)/, `$1\n      <li><strong>Hosting dieser Rechtstexte (GitHub):</strong> ${esc(GITHUB_DE)}</li>`, 'swaply');
  d = ersetze(d, 'Stand: 17. September 2026', `Stand: ${STAND_DE}`, 'swaply');
  schreib('swaply/datenschutz.html', d);
  schreib('swaply/impressum.html', i);
  copyFileSync(q('swaply', 'landing', 'icon.png'), path.join(ROOT, 'swaply', 'icon.png'));
  mkdirSync(path.join(ROOT, 'swaply', 'fonts'), { recursive: true });
  for (const f of ['fredoka-latin.woff2', 'nunito-latin.woff2']) copyFileSync(q('swaply', 'landing', 'fonts', f), path.join(ROOT, 'swaply', 'fonts', f));
}

// --- Lauf -------------------------------------------------------------------

for (const o of ['mahjong', 'swaply', 'fullrep', 'anigosha', 'wellbooked']) rmSync(path.join(ROOT, o), { recursive: true, force: true });

mahjong();
swaply();

await ausDaten({
  ordner: 'fullrep', app: 'FullRep', datei: q('mypeak', 'src', 'pages', 'legal', 'legalContent.js'),
  docs: [
    { key: 'privacy', datei: { de: 'datenschutz', en: 'privacy' } },
    { key: 'imprint', datei: { de: 'impressum', en: 'imprint' } },
    { key: 'terms', datei: { de: 'nutzungsbedingungen', en: 'terms' } },
    { key: 'health', datei: { de: 'gesundheit', en: 'health' } },
  ],
  anker: { de: 'Vercel, Inc.', en: 'Vercel, Inc.' },
  stand: (doc, lang, neu) => (neu ? (lang === 'de' ? `Stand: ${STAND_DE}` : `Last updated: ${STAND_EN}`) : doc.updated),
});

// Anigosha schreibt TypeScript; esbuild entfernt die Typen.
{
  const src = q('anigosha', 'src', 'pages', 'legal', 'legalContent.ts');
  mkdirSync(TMP, { recursive: true });
  const js = path.join(TMP, 'anigosha-legal.mjs');
  const esbuild = await import('esbuild');
  await esbuild.build({ entryPoints: [src], outfile: js, format: 'esm', platform: 'node', logLevel: 'error' });
  const { LAST_UPDATED } = await import(pathToFileURL(js).href);
  await ausDaten({
    ordner: 'anigosha', app: 'Anigosha', datei: js,
    docs: [
      { key: 'privacy', datei: { de: 'datenschutz', en: 'privacy' } },
      { key: 'imprint', datei: { de: 'impressum', en: 'imprint' } },
      { key: 'terms', datei: { de: 'nutzungsbedingungen', en: 'terms' } },
      { key: 'deletion', datei: { de: 'konto-loeschen', en: 'delete-account' } },
    ],
    anker: { de: 'Vercel:', en: 'Vercel:' },
    stand: (_doc, lang, neu) => `${lang === 'de' ? 'Stand' : 'Last updated'}: ${neu ? '30.09.2026' : LAST_UPDATED}`,
  });
}

await wellbooked();

writeFileSync(path.join(ROOT, 'app-ads.txt'), APP_ADS);
writeFileSync(path.join(ROOT, '.nojekyll'), '');
rmSync(TMP, { recursive: true, force: true });

// --- Gegenprobe --------------------------------------------------------------

const PFLICHT = [
  'index.html', 'app-ads.txt',
  'mahjong/datenschutz.html', 'mahjong/impressum.html',
  'swaply/datenschutz.html', 'swaply/impressum.html',
  'fullrep/datenschutz.html', 'fullrep/privacy.html', 'fullrep/impressum.html', 'fullrep/imprint.html',
  'anigosha/datenschutz.html', 'anigosha/privacy.html', 'anigosha/impressum.html', 'anigosha/imprint.html',
  'anigosha/konto-loeschen.html', 'anigosha/delete-account.html',
  'wellbooked/datenschutz.html', 'wellbooked/impressum.html', 'wellbooked/agb.html', 'wellbooked/kontakt.html',
];
const fehler = [];
for (const f of PFLICHT) if (!existsSync(path.join(ROOT, f))) fehler.push(`fehlt: ${f}`);
if (readFileSync(path.join(ROOT, 'app-ads.txt'), 'utf8') !== APP_ADS) fehler.push('app-ads.txt weicht ab');

function htmlDateien(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    if (n === 'node_modules' || n.startsWith('.')) return [];
    return statSync(p).isDirectory() ? htmlDateien(p) : n.endsWith('.html') ? [p] : [];
  });
}
for (const f of htmlDateien(ROOT)) {
  const t = readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);
  if (t.includes('/_vercel/')) fehler.push(`${rel}: Vercel-Skript`);
  for (const [, ziel] of t.matchAll(/(?:href|src)="([^"#]*)(?:#[^"]*)?"/g)) {
    if (!ziel || /^(https?:|mailto:)/.test(ziel)) continue;
    if (ziel.startsWith('/')) { fehler.push(`${rel}: absoluter Pfad ${ziel}`); continue; }
    const p = path.resolve(path.dirname(f), ziel);
    if (!existsSync(p) || (statSync(p).isDirectory() && !existsSync(path.join(p, 'index.html')))) fehler.push(`${rel}: Verweis ins Leere ${ziel}`);
  }
  for (const u of t.matchAll(/url\("([^"]+)"\)/g)) if (!existsSync(path.resolve(path.dirname(f), u[1]))) fehler.push(`${rel}: fehlende Datei ${u[1]}`);
}
for (const f of ['mahjong/datenschutz.html', 'swaply/datenschutz.html', 'fullrep/datenschutz.html', 'fullrep/privacy.html', 'anigosha/datenschutz.html', 'anigosha/privacy.html', 'wellbooked/datenschutz.html']) {
  if (existsSync(path.join(ROOT, f)) && !readFileSync(path.join(ROOT, f), 'utf8').includes('GitHub, Inc.')) fehler.push(`${f}: GitHub-Hinweis fehlt`);
}
if (fehler.length) {
  console.error('FEHLER:\n  ' + fehler.join('\n  '));
  process.exit(1);
}
console.log(`Fertig: ${htmlDateien(ROOT).length} Seiten, app-ads.txt, alle Verweise geprüft.`);
