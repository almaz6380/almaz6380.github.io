# almaz6380.github.io

Datenschutz, Impressum und `app-ads.txt` aller Apps, kostenlos auf GitHub Pages.

**Adresse:** https://almaz6380.github.io/

## Warum

Am 28.09.2026 hat Vercel den ganzen Account pausiert, weil das Blob-Kontingent einer App überschritten war. Dadurch waren die Rechtsseiten **aller** Apps tot. Apple und Google verlangen diese Seiten als Pflichtangabe. Mit ihnen fiel auch `app-ads.txt` aus, die AdMob prüft. GitHub Pages hat für öffentliche Repos kein Kontingent, das sie sprengen könnten.

⚠ Das Repo muss **öffentlich** bleiben. Ist es privat, sind alle Seiten weg.

## Pflege

Die Texte werden weiter in den App-Repos gepflegt. Nach jeder Änderung an einem Rechtstext:

```bash
npm install
QUELLEN=/ordner/mit/den/app-klonen npm run erzeugen   # mahjong-app, swaply, mypeak, anigosha, wellbooked
git add -A && git commit && git push
```

Das Skript `werkzeug/erzeugen.mjs` bricht ab, wenn:
- eine Pflichtseite fehlt,
- ein Verweis ins Leere zeigt,
- ein Originaltext sich so geändert hat, dass die GitHub-Ergänzung nicht mehr eingefügt werden kann.

| App | Quelle |
|---|---|
| Mahjong Royale | `mahjong-app/public/{privacy,impressum}.html` |
| Swaply | `swaply/landing/{datenschutz,impressum}.html` |
| FullRep | `mypeak/src/pages/legal/legalContent.js` |
| Anigosha | `anigosha/src/pages/legal/legalContent.ts` |
| WELLbooked | `wellbooked/src/app/(customer)/{datenschutz,impressum,agb,kontakt}/page.tsx` |

Die einzige inhaltliche Änderung: Jede Datenschutzerklärung nennt zusätzlich GitHub als Auslieferer dieser Seiten.

`app-ads.txt` muss direkt unter der Domain liegen. Nur deshalb heißt das Repo `almaz6380.github.io`. Die Weltgeschichte-App liegt in ihrem eigenen Repo unter `/Geschichte/`.
