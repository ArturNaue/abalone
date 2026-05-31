# Abalone PWA

Ein puristisches Abalone-Brettspiel als Progressive Web App – optimiert für zwei Spieler auf demselben Gerät (Pass & Play), auch vollständig offline spielbar.

🔗 **Live:** [artur.ch/apps/Abalone](https://artur.ch/apps/Abalone/)  
📦 **Repo:** [github.com/ArturNaue/abalone](https://github.com/ArturNaue/abalone)  
🏷️ **Aktueller Release:** `Final-2026-05-31`

---

## Features

| Feature | Status |
|---|---|
| Vollständige Spiellogik (Inline, Sidestep, Sumito) | ✅ |
| Pass & Play – 2 Spieler, 1 Gerät | ✅ |
| Gespiegeltes Layout – beide Seiten les- und spielbar | ✅ |
| Undo / Redo (unbegrenzt) | ✅ |
| Spielernamen inline anpassbar | ✅ |
| 3D-Kugeln via SVG-Gradienten + Lichtreflexion | ✅ |
| Exo 2 Schrift (Google Fonts) | ✅ |
| Responsive Design (Mobile + Desktop, 3 Breakpoints) | ✅ |
| PWA: offline spielbar, installierbar (Homescreen) | ✅ |
| Auto-Update + Ladeanzeige bei neuer Version | ✅ |
| Attribution-Link © A.N. 05/2026 | ✅ |
| Eindeutige Element-IDs für alle Container | ✅ |

---

## Techstack

| Tool | Version | Zweck |
|---|---|---|
| React | 19 | UI-Framework |
| TypeScript | 6 | Typsicherheit |
| Vite | 8 | Build-Tool |
| Tailwind CSS | 4 | Styling (via `@tailwindcss/vite`) |
| vite-plugin-pwa | 1.3 | Service Worker, Manifest |
| Workbox | – | Precaching, Offline-Strategie |
| Exo 2 | – | Schrift (Google Fonts) |

---

## Lokale Entwicklung

### Voraussetzungen
- Node.js ≥ 18
- npm ≥ 9

### Setup

```bash
git clone https://github.com/ArturNaue/abalone.git
cd abalone
npm install
npm run dev
```

→ App läuft auf `http://localhost:5173`

### Build

```bash
npm run build
```

→ Erzeugt `dist/` mit allen statischen Dateien inkl. Service Worker.

### PWA-Icons neu generieren

```bash
node generate-icons.js
```

→ Erzeugt `public/pwa-192x192.png` und `public/pwa-512x512.png`.

---

## Projektstruktur

```
abalone/
├── src/
│   ├── App.tsx                  # Haupt-Layout, Controls, Update-Overlay, Attribution
│   ├── main.tsx                 # Einstiegspunkt, SW-Registrierung + controllerchange
│   ├── index.css                # Tailwind-Utilities, responsive Klassen, Animationen
│   ├── components/
│   │   └── GameBoard.tsx        # SVG-Brett, 3D-Kugeln, PlayerOverlay-Cards, Statusbalken
│   ├── reducers/
│   │   └── gameReducer.ts       # Spielzustand (useReducer), History-Stack
│   ├── types/
│   │   └── game.ts              # TypeScript-Typen, currentSnapshot()
│   └── utils/
│       ├── hexGeometry.ts       # Hex-Koordinaten, Board-Generierung, isValidLine
│       └── gameLogic.ts         # getLegalMoves, executeMove, Sumito-Logik
├── public/
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── .claude/
│   └── launch.json              # Preview-Server-Konfiguration (Dev-Tool)
├── generate-icons.js            # Node-Skript für PWA-Icons (kein npm nötig)
├── vite.config.ts               # base: '/apps/Abalone/', PWA-Konfiguration
├── tailwind.config.js           # Tailwind v3-Kompatibilitätsdatei (v4 via Plugin)
├── tsconfig.json                # TypeScript-Konfiguration
├── CLAUDE.md                    # Projektanforderungen & IST-Stand für KI-Assistenten
└── README.md                    # Diese Datei
```

---

## Spiellogik

### Koordinatensystem
Das Spielfeld nutzt **axiale Hex-Koordinaten** `(q, r)`. Mittelpunkt = `(0, 0)`, Radius 4 Felder → 61 Mulden.

### Startaufstellung
Klassische Formation – **Weiss beginnt**. 14 weisse Kugeln oben, 14 schwarze Kugeln unten.

### Zugtypen
| Typ | Beschreibung |
|---|---|
| **Inline** | 1–3 Kugeln bewegen sich entlang ihrer Linie |
| **Sidestep** | 1–3 Kugeln bewegen sich quer zur Linie |
| **Sumito** | Inline-Zug schiebt gegnerische Kugeln (3>2, 3>1, 2>1) |

### State-Management
`useReducer` mit `GameState` → History-Stack für Undo/Redo.

```typescript
type GameAction =
  | { type: 'EXECUTE_MOVE'; selectedHexes: HexCoord[]; move: Move }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_PLAYER_NAME'; player: PlayerColor; name: string }
  | { type: 'NEW_GAME' }
```

---

## Element-IDs Referenz

Alle interaktiven Container und Elemente haben eindeutige IDs für gezielte CSS/JS-Anpassungen.

### App.tsx
| ID | Element |
|---|---|
| `app-root` | Haupt-Wrapper |
| `app-update-overlay` | Vollbild-Overlay beim SW-Update |
| `app-update-spinner` | Ladekreis |
| `app-update-message` | „Neue Version wird geladen…" |
| `app-update-submessage` | „Die App startet automatisch neu." |
| `app-controls-top/bottom` | Button-Gruppe (Undo / Redo / Neu starten) |
| `app-btn-undo-top/bottom` | Undo-Button |
| `app-btn-redo-top/bottom` | Redo-Button |
| `app-btn-new-top/bottom` | Neu-starten-Button |
| `app-heading-top/bottom` | „ABALONE"-Titel |
| `app-subtitle-top/bottom` | „2-Spieler Offline Modus" |
| `app-attribution-top/bottom` | © A.N.-Link |
| `app-board-section` | `<main>` um das Spielfeld |

### GameBoard.tsx
| ID | Element |
|---|---|
| `board-container` | Spielfeld-Rahmen |
| `board-row-top/bottom` | Flex-Zeile mit Cards + Statusbalken |
| `board-card-black-top/bottom` | Schwarz-Spielercard |
| `board-card-white-top/bottom` | Weiss-Spielercard |
| `board-card-*-marble` | Kugelindikator in der Card |
| `board-card-*-name-btn` | Name-Button (Anzeigemodus) |
| `board-card-*-name-input` | Name-Input (Bearbeitungsmodus) |
| `board-card-*-score` | Punktzahl |
| `board-status-top/bottom` | Statusbalken „… am Zug" |
| `board-svg` | SVG-Spielfläche |

---

## Deployment auf artur.ch

### 1. Build erstellen
```bash
npm run build
```

### 2. Dateien hochladen
Den **Inhalt** von `dist/` nach `public_html/apps/Abalone/` via FTP hochladen.

> ⚠️ `.htaccess` beginnt mit Punkt – sicherstellen, dass sie übertragen wird  
> (FileZilla: *Server → Versteckte Dateien anzeigen*)

### 3. `.htaccess` (liegt in `dist/`)
```apache
RewriteEngine On
RewriteBase /apps/Abalone/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /apps/Abalone/index.html [L]
```

### 4. PWA-Update-Mechanismus
- Beim App-Start prüft der Service Worker ob eine neue `sw.js` auf dem Server liegt
- Falls ja: neue Assets werden heruntergeladen → **Ladeanzeige blockiert das Spiel**
- Nach dem Download: Seite lädt automatisch mit der neuen Version neu
- **Offline:** kein Update-Check, Spiel läuft vollständig aus dem Cache

---

## Bekannte Einschränkungen

- **Google Fonts (Exo 2)** benötigen beim _allerersten_ Start eine Internetverbindung. Danach vom Browser gecacht. Für vollständig offline-fähigen Betrieb: Schrift lokal einbinden.
- **LocalStorage-Persistenz** nicht implementiert – Spielstand geht beim Schliessen der App verloren.

---

## Offene Features (Backlog)

- [ ] LocalStorage: Spielstand speichern und beim nächsten Start fortsetzen
- [ ] Exo 2 als lokale Schriftdatei einbinden (volle Offline-Unterstützung)
- [ ] Sieger-Animation / -Screen
- [ ] Statistiken (Gewonnene Spiele, Zuganzahl)

---

## Lizenz

© Artur Naue, 05/2026 – [artur.ch](https://www.artur.ch)
