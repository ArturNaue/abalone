# CLAUDE.md – Abalone PWA

> Projektspezifische Anweisungen für KI-Assistenten (Claude Code / Cowork).  
> Ergänzt die Root-Regeln unter `../../CLAUDE.md`.

---

## Projektübersicht

**Projekt:** Abalone PWA  
**Status:** ✅ Fertig – Release `Final-2026-05-31`  
**URL:** [artur.ch/apps/Abalone](https://artur.ch/apps/Abalone/)  
**Repo:** [github.com/ArturNaue/abalone](https://github.com/ArturNaue/abalone)

---

## Technischer Stack (IST)

| Tool | Version |
|---|---|
| React | 19 |
| TypeScript | 6 |
| Vite | 8 |
| Tailwind CSS | 4 (via `@tailwindcss/vite`) |
| vite-plugin-pwa | 1.3 |
| Schrift | Exo 2 (Google Fonts) |

> **Tailwind v4-Besonderheit:** Kein `tailwind.config.js` für Utilities nötig.  
> Utility-Klassen werden in `src/index.css` innerhalb `@layer utilities { }` manuell definiert (Scanner-Bug mit dem aktuellen Setup). Neue Klassen dort eintragen!

---

## Spielregeln (Implementiert)

- **Weiss beginnt** (nicht Schwarz – wurde während Entwicklung geändert)
- 14 weisse Kugeln oben, 14 schwarze Kugeln unten (klassische Formation)
- Siegbedingung: 6 gegnerische Kugeln vom Brett schieben
- Zugtypen: Inline, Sidestep, Sumito (3>2, 3>1, 2>1)
- Blockade bei Gleichstand (3=3) korrekt implementiert

---

## Architektur

```
src/
├── App.tsx              # Layout (oben+unten gespiegelt), Controls, SW-Update-Overlay
├── main.tsx             # SW-Registrierung, controllerchange → location.reload()
├── index.css            # Alle CSS-Utilities (manuell, wegen Tailwind v4 Scanner-Bug)
├── components/
│   └── GameBoard.tsx    # Spielfeld, PlayerOverlay, Statusbalken, SVG
├── reducers/
│   └── gameReducer.ts   # useReducer, GameState, History-Stack (Undo/Redo)
├── types/
│   └── game.ts          # PlayerColor, HexCoord, BoardState, GameSnapshot, GameState
└── utils/
    ├── hexGeometry.ts   # Axiale Hex-Koordinaten, generateAbaloneBoard, getInitialBoard
    └── gameLogic.ts     # getLegalMoves (inline/sidestep/sumito), executeMove
```

---

## Layout-Konzept

Die App ist für **Pass & Play auf einem flach liegenden Gerät** konzipiert:

```
[© oben]  [2-Spieler oben]  [ABALONE oben]  [Buttons oben]   ← alles 180° gedreht
┌──────────────────────────────────────────────────────────┐
│ [Schwarz flipped]  [Status oben flipped]  [Weiss flipped]│
│                                                          │
│               SVG-Spielfeld (61 Hexfelder)               │
│                                                          │
│ [Schwarz normal]   [Status unten]         [Weiss normal] │
└──────────────────────────────────────────────────────────┘
[Buttons unten]  [ABALONE unten]  [2-Spieler unten]  [©]
```

- Oberer Spieler (Weiss, Kugeln oben): liest von der anderen Seite
- Unterer Spieler (Schwarz, Kugeln unten): liest normal
- Statusbalken leuchtet amber auf, wenn der jeweilige Spieler am Zug ist

---

## Wichtige Implementierungsdetails

### CSS-Utilities
Neue Tailwind-ähnliche Klassen **immer** in `src/index.css` unter `@layer utilities { }` eintragen – nicht als className direkt verwenden ohne Eintrag dort.

### Responsive Breakpoints
```css
/* Standard (Desktop) */
.player-card { padding: 6px 10px; min-width: 80px; }
.player-card-name { font-size: 15px; }
.player-card-score { font-size: 24px; }
.board-container { padding-top: 79px; padding-bottom: 79px; }

/* ≤ 520px */
/* ≤ 390px */
/* → Details in src/index.css */
```

### SVG-Gradients (IDs in board-svg)
- `marbleBlack` / `marbleBlackSelected` – schwarze Kugel (3D)
- `marbleWhite` / `marbleWhiteSelected` – weisse Kugel (3D)
- `cellBg` – leere Mulde
- `cellBgTarget` – Zielfeld (amber, pulsiert)

### PWA Auto-Update
1. `updatefound`-Event auf SW-Registration → `sw-update-start` CustomEvent
2. App zeigt Overlay (`app-update-overlay`) + blockiert Interaktion
3. `controllerchange` → `location.reload()` (nur wenn `navigator.onLine`)

---

## Element-IDs (Referenz)

Alle Container haben eindeutige IDs – siehe [README.md § Element-IDs Referenz](README.md#element-ids-referenz).

---

## Offene Punkte / Backlog

| Feature | Priorität | Notizen |
|---|---|---|
| LocalStorage-Persistenz | Mittel | Spielstand nach App-Neustart wiederherstellen |
| Exo 2 lokal einbinden | Niedrig | Für 100% Offline (aktuell: Google Fonts benötigt 1. Start online) |
| Sieger-Screen / Animation | Niedrig | Aktuell nur Text im Statusbalken |
| Statistiken | Niedrig | Gewonnene Spiele, Züge pro Partie |

---

## Deployment

```bash
npm run build   # → dist/ erzeugen
# dist/-Inhalt via FTP nach public_html/apps/Abalone/ hochladen
# .htaccess mitübertragen (beginnt mit Punkt – in FTP-Client sichtbar machen)
```

Detaillierte Anleitung: [README.md § Deployment](README.md#deployment-auf-arturch)
