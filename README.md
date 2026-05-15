# ⚔ Ardenmoor

**Souls · Idle · D&D** — A browser-based hybrid RPG.

🎮 **[Play Now → ardenmoor.vercel.app](https://ardenmoor.vercel.app)**

---

## 📋 Patch Notes — v12.0

### ⚔ Multi-Ability System
Each class now has **3 unique abilities** (hotkeys: Q / W / E).

| Class | Q | W | E |
|---|---|---|---|
| 🗡 Rogue | 🌑 Shadowstrike — next hit ×3 crit | 💨 Shadow Dance — +50% dodge 5t | 🩸 Hemorrhage — bleed 4% HP/turn 4t |
| 🔮 Mage | ⚡ Arcane Surge — 3× magic burst | 🔥 Fireball — burn 4% HP/turn 5t | ❄️ Frost Nova — freeze 2t + 40% dmg reduction |
| 🛡 Paladin | ✨ Divine Shield — heal 30% HP + block 2 hits | ⚔️ Divine Smite — 2.5× dmg + stun 2t | 💛 Holy Aura — regen 5% HP/turn 6t |
| 🏹 Archer | 🏹 Barrage — 10 rapid arrows | ☠️ Poison Arrow — poison 3% HP/turn 8t | 🦅 Eagle Eye — +30% crit 5t |

Using any ability puts **all abilities on shared cooldown**.

---

### 🔧 Bug Fixes
- Auto-equip now respects class weapon restrictions (Rogues can't wield Staves, etc.)
- Shop-bought items are never auto-sold
- Archer Barrage no longer lets dead enemies counterattack
- Potion mass-buy now shows total cost (e.g. ×5 (200g))

---

### 🎯 Rarity Rename
Cleaner tier names across the entire game:

| Old | New |
|---|---|
| Common | Common |
| Uncommon | Rare |
| Rare | Epic |
| Epic | Legendary |
| Legendary | Mythic ✦ |

---

### ✦ Gear Bonus System
Every item now rolls **1 random bonus stat** on drop:

| Stat | Effect |
|---|---|
| %DmgRdc | Reduces incoming damage |
| %AtkSpd | Increases attack speed |
| %DgCh | Dodge chance bonus |
| %HlthRgn | Health regeneration |
| %CrDmg | Critical damage multiplier |
| %Chaos | Random bonus effects |

Magnitude scales with rarity: Common +1% → Mythic +1–4%.

---

### ⚡ 5× Combat Speed
New **5× speed** button in the top bar and settings panel.  
Archer Barrage upgraded from 5 arrows → **10 arrows**.

---

### 💊 Auto-Potion
Toggle in the Battle tab — automatically uses your best healing potion when HP drops below **35%**.

---

### 🛒 Shop Comparison
Shop items now show **stat deltas** vs your currently equipped gear in the same slot (green = upgrade, red = downgrade).

---

### ⚖ Balance Changes
- Boss HP scaling reduced: capped at 20 runs, scaling rates halved
- XP formula: kill multiplier reduced (×1.5 → ×0.9), level curve steepened (1.22 → 1.30 exponent)
- Drop rates increased (base 6% → 8%, elite 25% → 28%)
- Cloud saves now auto-browse when opening the Settings panel
- Hemorrhage nerfed: 8% → 4% per tick, 6 → 4 turns, CD 12 → 14

---

## 🏰 Classes

| Class | Style | Key Stats |
|---|---|---|
| 🗡 Rogue | Stealth & crits | High DEX/CRIT, bleeds |
| 🔮 Mage | Burst spellcaster | High INT, fragile |
| 🛡 Paladin | Tank/sustain | High CON/HP, self-heals |
| 🏹 Archer | Balanced hunter | DEX/dodge, poison |

---

## 🗺 Dungeons

| # | Name | Min Level |
|---|---|---|
| 1 | 🕳️ Goblin Warrens | 1 |
| 2 | ⚰️ Crypt of Whispers | 6 |
| 3 | 🍄 Fungal Depths | 13 |
| 4 | 🔥 Infernal Citadel | 22 |
| 5 | 🌊 Sunken Necropolis | 32 |
| 6 | 🌌 Void Sanctum | 45 |

---

## ☁ Cloud Saves
Saves are stored per-device via Supabase. Your saves are private — other players cannot see them. Optional PIN protection available.

---

*Built with Next.js · Supabase · Vercel*
