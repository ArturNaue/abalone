# Abalone PWA

Ein puristisches Abalone-Brettspiel als Progressive Web App – optimiert für zwei Spieler auf demselben Gerät (Pass & Play), auch vollständig offline spielbar.

🔗 **Live:** [artur.ch/apps/Abalone](https://artur.ch/apps/Abalone/)  
📦 **Repo:** [github.com/ArturNaue/abalone](https://github.com/ArturNaue/abalone)

---

## Features

| Feature | Status |
|---|---|
| Vollständige Spiellogik (Inline, Sidestep, Sumito) | ✅ |
| Pass & Play – 2 Spieler, 1 Gerät | ✅ |
| Gespiegeltes Layout (beide Seiten lesbar) | ✅ |
| Undo / Redo (unbegrenzt) | ✅ |
| Spielernamen anpassbar | ✅ |
| PWA: offline spielbar, installierbar | ✅ |
| Auto-Update beim Start (online) | ✅ |
| 3D-Kugeln via SVG-Gradienten | ✅ |
| Responsive (Mobile + Desktop) | ✅ |

---

## Techstack

| Tool | Version | Zweck |
|---|---|---|
| React | 19 | UI-Framework |
| TypeScript | 6 | Typsicherheit |
| Vite | 8 | Build-Tool |
| Tailwind CSS | 4 | Styling |
| vite-plugin-pwa | 1.3 | Service Worker, Manifest |
| Workbox | – | Precaching, Offline |

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
│   ├── App.tsx                  # Haupt-Layout, Undo/Redo, Update-Overlay
│   ├── main.tsx                 # Einstiegspunkt, SW-Registrierung
│   ├── index.css                # Tailwind + globale Styles
│   ├── components/
│   │   └── GameBoard.tsx        # SVG-Brett, Kugeln, Player-Cards
│   ├── reducers/
│   │   └── gameReducer.ts       # Spielzustand (useReducer)
│   ├── types/
│   │   └── game.ts              # TypeScript-Typen, currentSnapshot()
│   └── utils/
│       ├── hexGeometry.ts       # Hex-Koordinaten, Board-Generierung
│       └── gameLogic.ts         # Zugvalidierung, Sumito, Zug-Ausführung
├── public/
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── generate-icons.js            # Node-Skript für PWA-Icons
├── vite.config.ts               # Vite + PWA-Konfiguration
├── tailwind.config.js
└── tsconfig.json
```

---

## Spiellogik

### Koordinatensystem
Das Spielfeld nutzt **axiale Hex-Koordinaten** `(q, r)`. Mittelpunkt = `(0, 0)`, Radius 4 Felder → 61 Mulden.

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
- Beim Start prüft der Service Worker ob eine neue `sw.js` auf dem Server liegt
- Falls ja: neue Assets werden heruntergeladen → Ladeanzeige erscheint
- Nach dem Download: Seite lädt automatisch mit der neuen Version neu
- **Offline:** kein Update-Check, Spiel läuft aus dem Cache

---

## Bekannte Einschränkungen

- **Google Fonts (Exo 2)** benötigen beim _allerersten_ Start eine Internetverbindung. Danach vom Browser gecacht. Für vollständig offline-fähigen Betrieb: Schrift lokal einbinden.
- **LocalStorage-Persistenz** noch nicht implementiert – Spielstand geht beim Schliessen der App verloren.

---

## Offene Features (Backlog)

- [ ] LocalStorage: Spielstand speichern und fortsetzen
- [ ] Exo 2 als lokale Schriftdatei einbinden (volle Offline-Unterstützung)
- [ ] Sieger-Animation / -Screen
- [ ] Statistiken (Gewonnene Spiele, Zuganzahl)

---

## Lizenz

© Artur Naue, 05/2026 – [artur.ch](https://www.artur.ch)
