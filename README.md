# Diablo: The Dark Awakening (Classic 2.5D Isometric ARPG)

[![TypeScript](https://img.shields.io/badge/language-TypeScript%205-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/bundler-Vite%206-646CFF.svg)](https://vitejs.dev/)
[![HTML5 Canvas](https://img.shields.io/badge/engine-Custom%20Canvas%202.5D-E34F26.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Vitest](https://img.shields.io/badge/tests-Vitest%20(20%2F20%20passing)-green.svg)](https://vitest.dev/)
[![Deploy to GitHub Pages](https://github.com/arron21/diablo-classic-arpg/actions/workflows/deploy.yml/badge.svg)](https://github.com/arron21/diablo-classic-arpg/actions/workflows/deploy.yml)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

A classic Action Role-Playing Game inspired by the original **Diablo (1996)**, running natively in the browser via TypeScript, Vite, and HTML5 Canvas. Built with a custom 2.5D isometric diamond engine and procedural Web Audio synthesis—requiring **zero external image or audio asset dependencies**.

👉 **[Play Live in Browser](https://arron21.github.io/diablo-classic-arpg/)** 👈

---

## 🎮 Key Features

- **Custom 2.5D Isometric Engine**:
  - Authentic 2:1 diamond projection ($64 \times 32\text{px}$) with continuous sub-tile movement and $(gx + gy)$ depth sorting for flawless isometric occlusion.
- **Dynamic Raycast Lighting & Oppressive Fog of War**:
  - Real-time line-of-sight raycasting casting shadows behind walls, quadratic distance falloff, natural torchlight flicker, and unexplored pitch darkness.
- **Responsive Full-Screen Viewport**:
  - Adapts dynamically to `100vw` $\times$ `100vh` with crisp 1:1 pixelated rendering. Press **`F`** or click the fullscreen button for true borderless immersion.
- **Context-Sensitive Diablo Cursors**:
  - **Sword Cursor**: Activates when hovering over any living enemy or boss.
  - **Hand Cursor**: Activates when hovering over barrels, chests, doors, stairs, or ground loot.
  - **Gauntlet Pointer**: Classic armored gauntlet for world navigation and UI button interaction.
- **Adjacent Object Navigation**:
  - Clicking an object from afar automatically paths adjacent to it before interacting. Approaching a barrel triggers a sword swing animation, plays impact smash audio, and breaks the barrel with loot drop chances.
- **Gothic Procedural Dungeons with Wide Hallways**:
  - Multi-floor descent from Tristram Town Hub to Cathedral Level 1 and Catacombs Level 2.
  - **Always $\ge 3$ squares wide hallways** throughout all corridors and turns to guarantee tactical maneuverability and eliminate narrow choke points.
- **The Butcher Boss Encounter**:
  - Blood-splattered lair on Level 2 behind closed reinforced doors.
  - Triggers camera screen-shake and the iconic roar: *"Ah, Fresh Meat!"*.
  - Fast-charging pursuit AI with massive cleave attacks, dropping the unique **The Butcher's Cleaver** (+10 Str, +20 Life, +25% attack speed).
- **Visceral Procedural Web Audio API Synthesis**:
  - Zero audio files needed! Generates sword slashes, shield blocks, gold chimes, level-up fanfares, and monster-specific pain vocalizations (brittle bone clatter for Skeletons, guttural undead groans for Zombies, enraged grunts for The Butcher).
- **Tetris Grid Inventory & Affix Loot**:
  - 10-column $\times$ 4-row spatial inventory grid, paperdoll equipment slots, 4-slot potion belt hotbar, and Diablo 1 prefix/suffix tables (*Godly, King's, Savage, of the Whale, of Haste*).
- **Authentic Gothic HUD**:
  - Liquid Red Health Globe and Blue Mana Globe with glass specular reflections, interactive potion belt, gold pouch counter, and XP progression bar.

---

## 🕹️ Controls Quick Reference

| Action | Control | Description |
| :--- | :--- | :--- |
| **Move** | **Left-Click (Ground)** | Hold to continuously walk along the 8-directional path |
| **Melee Attack** | **Left-Click (Monster)** | Hold to continuously swing blade at target in melee range |
| **Interact / Smash** | **Left-Click (Object)** | Walk adjacent to break barrels, open chests, open doors, take stairs |
| **Pick Up Loot** | **Left-Click (Item)** | Walk to item and store in inventory, belt, or gold purse |
| **Potion Belt** | **Keys 1, 2, 3, 4** | Drink health or mana potions (or click HUD belt slots) |
| **Inventory Panel** | **Key `I`** | Toggle Tetris-style inventory & paperdoll equipment sheet |
| **Character Sheet** | **Key `C`** | Toggle stats sheet and allocate level-up stat points (`+`) |
| **Audio Toggle** | **Key `M`** | Mute or unmute procedural Web Audio synthesizer |
| **Fullscreen** | **Key `F` / Button** | Toggle full-screen mode for true edge-to-edge immersion |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended, v20+ supported)
- npm (v9+)

### Installation
```bash
# Clone the repository
git clone https://github.com/arron21/diablo-classic-arpg.git
cd diablo-classic-arpg

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Run Automated Tests
```bash
npm test
```
Runs the 20-test Vitest suite covering isometric math, A* pathfinding, inventory grid collision, item affixes, and dungeon hallway width constraints.

### Production Build
```bash
npm run build
```
Type-checks TypeScript and compiles production bundles into `dist/`.

---

## 🏛️ Project Architecture

```
src/
├── audio/
│   └── SoundSynth.ts          # Procedural Web Audio API sound synthesizer
├── combat/
│   └── CombatSystem.ts        # To-hit math, damage calculations, block, and blood decals
├── core/
│   ├── Camera.ts              # Smooth following camera with screen-shake
│   ├── Engine.ts              # Main fixed-timestep game loop and scene coordinator
│   └── Input.ts               # Mouse picker and keyboard manager
├── entities/
│   ├── Butcher.ts             # The Butcher boss AI and roar trigger
│   ├── Entity.ts              # Base actor class with hit recovery & animation state
│   ├── Monster.ts             # Skeleton and Zombie AI behaviors
│   └── Player.ts              # The Warrior class attributes, leveling, and equipment stats
├── items/
│   ├── AffixGenerator.ts      # Diablo 1 prefix and suffix loot table generator
│   ├── Inventory.ts           # 10x4 Tetris grid logic, paperdoll slots, and belt
│   └── Item.ts                # Item data types, consumables, and unique items
├── renderer/
│   ├── Cursor.ts              # Custom context-sensitive SVG cursors (Sword, Hand, Gauntlet)
│   ├── Isometric.ts           # 2:1 isometric coordinate math & projection
│   ├── Lighting.ts            # Raycasted Field of View and dynamic torchlight
│   ├── PixelArt.ts            # Programmatic retro pixel-art sprite rasterizer
│   └── SpriteRenderer.ts      # Depth-sorted render pipeline
├── ui/
│   ├── CharacterUI.ts         # Character sheet with stat points allocation
│   ├── HUD.ts                 # Health/Mana globes, belt hotbar, XP bar, buttons
│   └── InventoryUI.ts         # Interactive inventory grid and item tooltips
├── world/
│   ├── DungeonGen.ts          # Cathedral & Catacombs generator (>=3-tile wide hallways)
│   ├── Pathfinding.ts         # 8-directional A* pathfinding with corner-cutting prevention
│   ├── TileMap.ts             # Isometric tile representation and prop states
│   └── TownGen.ts             # Tristram town hub layout
├── main.ts                    # Entry point
└── style.css                  # Responsive full-screen styling
```

---

## 📜 License
MIT License.
