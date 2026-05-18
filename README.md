# ⚔ Hexo Idle

**Souls · Idle · D&D** — A browser-based hybrid RPG.

🎮 **[Play Now → ardenmoor.vercel.app](https://ardenmoor.vercel.app)**

---

## 📋 Patch Notes — v13.0

- 🎮 Game renamed to **Hexo Idle**
- 🗺 Expanded to **10 dungeons**, unlock levels rebalanced
- 🎨 New dungeon backgrounds and hero sprites for all classes
- ⭐ New **XP Draught** potion in shop
- 🗄 Vault expanded to **100 slots**
- 🎉 Special message on reaching level 50
- ⚖ XP requirements and enemy rewards rebalanced
- 💰 Prestige now costs gold
- ☁ Automatic cloud sync across devices
- 🔧 Various bug fixes

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
