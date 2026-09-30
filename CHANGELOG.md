# Changelog

All notable changes to the **Diablo: The Dark Awakening** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-09-30

### Added
- **GitHub Repository Publishing**: Published repository to public GitHub at [https://github.com/arron21/diablo-classic-arpg](https://github.com/arron21/diablo-classic-arpg).
- Added comprehensive project `README.md` with feature breakdown, controls table, architecture map, and build instructions.
- Added production `.gitignore` filtering `node_modules/`, `dist/`, and local logs.

---

## [1.4.0] - 2026-09-29

### Added
- **Wide Gothic Corridors ($\ge 3$ Squares Wide Always)**:
  - Both horizontal and vertical hallway segments now carve a perpendicular 3-tile wide slice along the entire length ($y-1, y, y+1$ for horizontal segments, and $x-1, x, x+1$ for vertical segments).
  - Corner and elbow junctions are carved as full $3 \times 3$ blocks to eliminate single-tile bottlenecks around turns.
  - Expanded dungeon map dimensions to $56 \times 56$ with increased room spacing ($\ge 4$ tiles padding) to accommodate wide hallways and room entrances.
  - Added unit test suite in `tests/dungeon.test.ts` mathematically verifying that every passable corridor tile in generated dungeons has a hallway width $\ge 3$.

### Changed
- Updated room entrance thresholds and door placement in `src/world/DungeonGen.ts` to accommodate 3-tile wide hallway openings while keeping the Butcher's chamber securely locked until opened.

---

## [1.3.0] - 2026-09-29

### Added
- **Context-Sensitive Diablo Cursors** (`src/renderer/Cursor.ts`):
  - **Sword Cursor**: Activates when hovering over any living monster (Skeleton, Zombie) or The Butcher boss.
  - **Hand Cursor**: Activates when hovering over interactive objects (barrels, chests, doors, stairs, ground loot).
  - **Armored Gauntlet Cursor**: Default navigation cursor for world traversal.
  - **Pointer**: Standard UI pointer for HUD buttons and panel controls.
- **Visceral Monster Hit & Pain Audio** (`src/audio/SoundSynth.ts`):
  - Added punchy physical weapon impact transients on all hits.
  - Added monster-specific pain vocalizations and reactions:
    - **Skeletons**: High-pitched brittle bone clatter and skull fracture rattle.
    - **Zombies**: Undead guttural pain groans (*"Urrghh!"*) and wet slashes.
    - **The Butcher**: Deep, enraged demonic grunt roars (*"Hrrrooomph!"*).
  - Added monster-specific death sounds (bone shatter heaps for skeletons, collapsing death groans for zombies and the Butcher).
  - Added automated Web Audio context wake-up on first user interaction.

---

## [1.2.0] - 2026-09-29

### Fixed
- **Object Interaction Navigation**:
  - Fixed bug where clicking barrels or chests would break/open them instantly from across the room.
  - Clicking an object from afar (distance $> 1.55$ tiles) now queues a `pendingInteraction` and uses A* pathfinding to walk adjacent to it first.
  - Upon arrival, the Warrior turns to face the barrel, plays the weapon swing animation, produces the sword whoosh and impact smash sound, and breaks the barrel.
  - Added barrel loot drop chances (~50% chance of gold or health/mana potions on smash).
  - Applied adjacent navigation logic to barrels, chests, closed doors, ground loot, and staircases.

---

## [1.1.0] - 2026-09-29

### Added
- **Responsive Full-Screen Viewport**:
  - Removed fixed $1024 \times 640$ frame constraint; canvas now dynamically fills `100vw` $\times$ `100vh` with automatic window resize handling.
  - Added native browser fullscreen toggle via **`F`** key and top-right **`[F] Fullscreen`** button.
  - Preserved crisp 1:1 pixelated rendering with `image-rendering: pixelated`.

### Fixed
- **HUD Layout & Interactivity**:
  - Fixed text collision between `Gold: 100` and the `Char (C)` button by moving the gold counter beside the Life Globe.
  - Properly spaced out `Char (C)`, `Inv (I)`, and `Audio (M)` buttons.
  - Made HUD buttons and the 4 belt potion slots clickable directly with the mouse.

---

## [1.0.0] - 2026-09-29

### Added
- **Initial Release of Diablo: The Dark Awakening**:
  - **Custom 2.5D Isometric Engine**: Diamond grid coordinate projection (64x32px, 2:1 ratio), continuous sub-tile movement, and $(gx + gy)$ depth sorting.
  - **Dynamic Raycast Lighting**: Real-time line-of-sight raycasting casting shadows behind walls, quadratic distance falloff, torchlight flicker, and unexplored pitch darkness.
  - **Procedural Retro Pixel-Art Generator**: Renders tiles, walls, props, items, and character animations programmatically with zero external asset dependencies.
  - **Procedural World & Multi-Floor Descent**:
    - Floor 0: Tristram Town Hub with town square, NPC merchants, and cathedral entrance.
    - Floor 1: Cathedral Upper Halls with procedural rooms, stone corridors, doors, barrels, chests, skeletons, and zombies.
    - Floor 2: The Catacombs with blood-stained chambers and The Butcher boss encounter.
  - **8-Directional A\* Pathfinding**: Includes corner-cutting prevention across diagonal walls.
  - **Diablo-Style Tactical Combat**: Real-time melee combat with attack windup, hit recovery stun, dexterity-scaled shield blocking, floating combat text, and blood decals.
  - **The Butcher Boss Encounter**: Fast pursuit AI, heavy cleave attacks, screen-shake roar (*"Ah, Fresh Meat!"*), and unique **The Butcher's Cleaver** drop.
  - **RPG Character & Inventory System**:
    - The Warrior class with Strength, Dexterity, Vitality, Magic, XP progression, and level-up stat point allocation.
    - 10x4 Tetris-style spatial inventory grid, paperdoll equipment slots, 4-slot potion belt, and hover tooltips.
    - Diablo 1 prefix and suffix loot affix generator (*Godly, King's, Savage, of the Whale, of Haste*).
  - **Gothic HUD & Web Audio Synthesizer**:
    - Liquid Red Health Globe and Blue Mana Globe with glass specular reflections.
    - Pure Web Audio API procedural synthesizer for sword swings, flesh hits, shield blocks, gold chimes, level-up fanfares, and dark ambient drone.
  - **Automated Testing Suite**: Vitest suite covering isometric math, A* pathfinding, inventory grid collision, and item affixes.
