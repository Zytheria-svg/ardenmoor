# ⚔ Hexo Idle

**Souls · Idle · D&D** — A browser-based hybrid RPG.

🎮 **[Play Now → ardenmoor.vercel.app](https://ardenmoor.vercel.app)**

---

## 📋 Patch Notes — v13.0

### 🎮 Game Renamed — Hexo Idle
Ardenmoor is now **Hexo Idle**. Title screen, browser tab, and all in-game references updated.

---

### 🗺 10 Dungeons
Expanded from 6 to **10 dungeons**. Four new dungeons added, all unlock levels rebalanced to +5 per tier:

| # | Name | Min Level |
|---|---|---|
| 1 | 🕳️ Goblin Warrens | 1 |
| 2 | ⚰️ Crypt of Whispers | 6 |
| 3 | 🍄 Fungal Depths | 11 |
| 4 | 🔥 Infernal Citadel | 16 |
| 5 | 🌊 Sunken Necropolis | 21 |
| 6 | 🌋 Ashen Wastes | 26 |
| 7 | 💎 Crystal Catacombs | 31 |
| 8 | 🌑 Shadow Citadel | 36 |
| 9 | 🕳 Abyssal Maw | 41 |
| 10 | 🌌 Void Sanctum | 46 |

---


### ⭐ XP Draught Potion
New potion in the shop — doubles all XP gained for **10 turns**. Price: **1,000g**.

---

### 🗄 Vault Expanded
Vault storage increased from 80 → **100 slots**.

---

### 🎉 Level 50 — Run Complete
Reaching level 50 now displays a special congratulations message.

---

### ⭐ Prestige Cost
Prestige now costs **10,000g** per reset.

---

### ⚖ Balance Changes — XP Rework

**Flat 500,000 XP per level** (no curve).

**Standardized enemy XP:**
| Enemy Type | XP |
|---|---|
| Normal | 2,000 |
| Elite | 4,000 |
| Boss | 12,000 |

**Dungeon XP scaling:** When a new dungeon unlocks, all previous dungeons give 10× less XP — encouraging progression while keeping earlier dungeons farmable early on.

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
- Auto-equip now respects class weapon restrictions
- Shop-bought items are never auto-sold
- Archer Barrage no longer lets dead enemies counterattack
- Potion mass-buy now shows total cost

---

### ✦ Gear Bonus System
Every item rolls **1 random bonus stat** on drop. Magnitude scales with rarity: Common +1% → Mythic +1–4%.

---

### ⚡ 5× Combat Speed
New **5× speed** button. Archer Barrage upgraded from 5 → **10 arrows**.

---

### 💊 Auto-Potion
Automatically uses your best healing potion when HP drops below **35%**.

---

### ⚖ Balance Changes
- Boss HP scaling capped at 20 runs, rates halved
- XP kill multiplier reduced, level curve steepened
- Drop rates increased (base 6% → 8%, elite 25% → 28%)

---

## 🏰 Classes

| Class | Style | Key Stats |
|---|---|---|
| 🗡 Rogue | Stealth & crits | High DEX/CRIT, bleeds |
| 🔮 Mage | Burst spellcaster | High INT, fragile |
| 🛡 Paladin | Tank/sustain | High CON/HP, self-heals |
| 🏹 Archer | Balanced hunter | DEX/dodge, poison |

---

## ☁ Cloud Saves
Saves are stored per-device via Supabase. Optional PIN protection available.

---

*Built with Next.js · Supabase · Vercel*
