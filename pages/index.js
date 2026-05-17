import Head from 'next/head';
import Script from 'next/script';

export default function Home() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <title>HEXO IDLE — Souls · Idle · D&D</title>
      </Head>

      {/* Inject Supabase credentials as window globals so game.js can read them */}
      <Script id="sb-config" strategy="beforeInteractive">
        {`window.__SB_URL="${process.env.NEXT_PUBLIC_SUPABASE_URL}";window.__SB_KEY="${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}";`}
      </Script>

      {/* Supabase JS SDK via CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"
        strategy="beforeInteractive"
      />

      <div
        dangerouslySetInnerHTML={{
          __html: `
<div class="notif-stack" id="notif-stack"></div>

<!-- SETTINGS PANEL -->
<div id="settings-panel">
  <div class="card" style="max-width:380px;width:90%;padding:20px">
    <div style="font-family:var(--font-d);font-size:16px;color:var(--gold2);margin-bottom:16px;letter-spacing:1px">⚙ Settings</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:var(--bg2);border-radius:7px;border:1px solid var(--bord)">
        <div><span style="font-size:12px" id="theme-icon">🌙</span> <span style="font-size:12px" id="theme-label">Dark Mode</span></div>
        <button class="btn" id="theme-toggle" onclick="toggleTheme()" style="font-size:11px;padding:3px 12px;min-width:52px">OFF</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:var(--bg2);border-radius:7px;border:1px solid var(--bord)">
        <span style="font-size:12px">🔊 Sound Effects</span>
        <button class="btn" id="sfx-toggle" onclick="toggleSFX()">ON</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:var(--bg2);border-radius:7px;border:1px solid var(--bord)">
        <span style="font-size:12px">⚡ Combat Speed</span>
        <div style="display:flex;gap:4px">
          <button class="speed-btn active" id="spd-1" onclick="setSpeed(1)">1×</button>
          <button class="speed-btn" id="spd-2" onclick="setSpeed(2)">2×</button>
          <button class="speed-btn" id="spd-3" onclick="setSpeed(3)">3×</button>
          <button class="speed-btn" id="spd-5" onclick="setSpeed(5)">5×</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:var(--bg2);border-radius:7px;border:1px solid var(--bord)">
        <span style="font-size:12px">📖 Tutorial</span>
        <button class="btn btn-primary" style="font-size:11px;padding:3px 10px" onclick="showTutorial(0);closeSettings()">Show</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:var(--bg2);border-radius:7px;border:1px solid var(--bord)">
        <span style="font-size:12px">📋 Patch Notes</span>
        <button class="btn" style="font-size:11px;padding:3px 10px;border-color:var(--gold2);color:var(--gold2)" onclick="closeSettings();document.getElementById('s-title').scrollIntoView({behavior:'smooth'});setTimeout(()=>{const b=document.getElementById('patch-notes-box');if(b){b.style.display='block';b.scrollIntoView({behavior:'smooth',block:'center'});}},400)">v12</button>
      </div>
      <div style="padding:10px 13px;background:var(--bg2);border-radius:9px;border:1px solid var(--bord)">
        <div style="font-size:12px;font-weight:600;color:var(--txt);margin-bottom:8px;font-family:var(--font-d);letter-spacing:.4px">💾 Save Management</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          <button class="btn btn-teal" style="font-size:11px;padding:5px 11px" onclick="exportSave()">📤 Export Save</button>
          <button class="btn" style="font-size:11px;padding:5px 11px" onclick="importSavePrompt()">📥 Import Save</button>
        </div>
        <div style="height:1px;background:var(--bord);margin-bottom:10px"></div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="font-size:14px">☁</span>
          <span style="font-size:12px;font-weight:600;color:var(--txt);font-family:var(--font-d);letter-spacing:.3px">Cloud Save</span>
          <span style="font-size:9.5px;color:var(--txt3);font-style:italic">— sync across devices</span>
        </div>
        <div style="display:flex;gap:7px;margin-bottom:7px">
          <div style="flex:2">
            <label style="font-size:10px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.4px;display:block;margin-bottom:4px">SLOT NAME</label>
            <input id="cloud-slot-id" placeholder="e.g. hero1, myrun2…" style="width:100%;background:var(--bg1);border:1px solid var(--bord2);border-radius:6px;padding:6px 10px;font-size:12px;color:var(--txt);font-family:var(--font-b);outline:none;transition:border-color .15s;box-sizing:border-box" onfocus="this.style.borderColor='var(--purple2)'" onblur="this.style.borderColor='var(--bord2)'"/>
          </div>
          <div style="flex:1">
            <label style="font-size:10px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.4px;display:block;margin-bottom:4px">PIN <span style="color:var(--txt3);font-style:italic;font-size:9px">(optional)</span></label>
            <input id="cloud-pin" type="password" placeholder="••••" maxlength="20" style="width:100%;background:var(--bg1);border:1px solid var(--bord2);border-radius:6px;padding:6px 10px;font-size:12px;color:var(--txt);font-family:var(--font-b);outline:none;transition:border-color .15s;box-sizing:border-box" onfocus="this.style.borderColor='var(--purple2)'" onblur="this.style.borderColor='var(--bord2)'"/>
          </div>
        </div>
        <div style="font-size:9.5px;color:var(--txt3);font-family:var(--font-m);margin-bottom:8px;padding:4px 7px;background:var(--bg3);border-radius:5px">🔒 PIN protects your slot from being overwritten or loaded by others. Leave blank for open access.</div>
        <div style="display:flex;gap:6px;margin-bottom:8px">
          <button class="btn btn-primary" style="flex:1;font-size:11px;padding:6px 0" onclick="cloudSave()">☁ Save Online</button>
          <button class="btn btn-gold" style="flex:1;font-size:11px;padding:6px 0" onclick="cloudLoad()">⬇ Load Online</button>
        </div>
        <div id="cloud-status" style="font-size:10.5px;font-family:var(--font-m);min-height:16px;padding:4px 7px;background:var(--bg3);border-radius:5px;color:var(--txt3)"></div>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-red" style="flex:1;font-size:12px" onclick="confirmNewGame()">⚑ New Game</button>
      <button class="btn btn-primary" style="flex:1;font-size:12px" onclick="closeSettings()">Close</button>
    </div>
  </div>
</div>

<!-- ═══ TITLE ═══ -->
<div id="s-title" class="screen active">
  <canvas id="starfield" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
  <div style="position:relative;z-index:2;text-align:center;max-width:480px;padding:32px 20px">
    <svg width="96" height="96" viewBox="0 0 80 80" style="margin-bottom:18px;filter:drop-shadow(0 0 24px rgba(196,144,30,.6));animation:logoFloat 3s ease-in-out infinite">
      <style>@keyframes logoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}</style>
      <circle cx="40" cy="40" r="38" fill="#0a0c12" stroke="#281e78" stroke-width="1.5"/>
      <polygon points="40,12 48,30 68,30 53,42 58,62 40,50 22,62 27,42 12,30 32,30" fill="#281e78" stroke="#5245c2" stroke-width="1"/>
      <polygon points="40,20 46,32 60,32 50,40 54,54 40,45 26,54 30,40 20,32 34,32" fill="#5245c2"/>
      <rect x="36" y="36" width="8" height="18" fill="#e4b440" rx="2"/>
      <rect x="30" y="41" width="20" height="6" fill="#e4b440" rx="2"/>
      <circle cx="40" cy="40" r="3" fill="#ffd468" opacity=".8"/>
    </svg>
    <div class="title-logo">HEXO IDLE</div>
    <div class="title-sub">Souls · Idle · D&amp;D</div>
    <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,var(--bord3),transparent);margin:18px auto"></div>
    <p style="color:var(--txt2);font-size:15px;line-height:1.9;font-style:italic;margin-bottom:28px">Ten dungeons of darkness await.<br/>One champion shall rise to legend.</p>
    <div style="display:flex;flex-direction:column;gap:10px;align-items:center;margin-bottom:20px">
      <button class="btn btn-primary btn-xl" id="btn-continue" style="width:220px;display:none" onclick="continueGame()">▶ Continue Journey</button>
      <button class="btn btn-lg" id="btn-newgame" style="width:220px;background:var(--bg2);border-color:var(--bord2)" onclick="gotoCharSelect()">⚔ New Adventure</button>
      <div id="save-info" style="font-size:11px;color:var(--txt3);font-style:italic;display:none"></div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;gap:16px;font-size:11px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.5px">
      <span>4 Classes</span><div class="title-sep"></div><span>10 Dungeons</span><div class="title-sep"></div><span>Prestige System</span>
    </div>
    <div style="margin-top:20px;font-size:10px;color:var(--txt3)">v12.0 — Auto-saves to browser · ☁ Cloud Save supported</div>
    <div style="margin-top:10px">
      <button class="btn" style="font-size:10.5px;padding:4px 14px;border-color:var(--gold2);color:var(--gold2)" onclick="togglePatchNotes()">📋 What's New in v12</button>
    </div>
    <div id="patch-notes-box" style="display:none;margin-top:10px;padding:12px 14px;background:rgba(20,14,40,.7);border:1px solid var(--gold2);border-radius:10px;text-align:left;max-width:420px;margin-left:auto;margin-right:auto">
      <div style="font-family:var(--font-d);font-size:13px;color:var(--gold2);letter-spacing:.8px;margin-bottom:10px">📋 PATCH NOTES — v12.0</div>
      <div style="font-size:10.5px;color:var(--txt2);font-family:var(--font-m);line-height:1.75;display:flex;flex-direction:column;gap:6px">
        <div><span style="color:var(--purple3);font-family:var(--font-d)">⚔ MULTI-ABILITY SYSTEM</span><br/>Each class now has 3 unique abilities (Q / W / E). Rogue: Shadowstrike · Shadow Dance (+50% dodge 5t) · Hemorrhage (bleed 8% HP/t). Mage: Arcane Surge · Fireball (burn 4% HP/t) · Frost Nova (freeze + 40% dmg reduction). Paladin: Divine Shield · Divine Smite (2.5× dmg + stun) · Holy Aura (regen 5% HP/t). Archer: Barrage · Poison Arrow (3% HP/t) · Eagle Eye (+30% crit 5t).</div>
        <div style="height:1px;background:var(--bord3)"></div>
        <div><span style="color:var(--red3);font-family:var(--font-d)">🔧 BUG FIXES</span><br/>Auto-equip now respects class weapon restrictions. Shop-bought items are never auto-sold. Archer Barrage no longer lets dead enemies counterattack. Potion mass-buy now shows total cost.</div>
        <div style="height:1px;background:var(--bord3)"></div>
        <div><span style="color:var(--amber3);font-family:var(--font-d)">🎯 RARITY RENAME</span><br/>Uncommon → Rare · Old Rare → Epic · Old Epic → Legendary · Old Legendary → Mythic. Cleaner tier names across the board.</div>
        <div style="height:1px;background:var(--bord3)"></div>
        <div><span style="color:var(--purple3);font-family:var(--font-d)">✦ GEAR BONUSES</span><br/>Every item rolls 1 random bonus stat (DmgRdc / AtkSpd / DgCh / HlthRgn / CrDmg / Chaos). Magnitude scales with rarity: Common +1% up to Mythic +1–4%.</div>
        <div style="height:1px;background:var(--bord3)"></div>
        <div><span style="color:var(--green3);font-family:var(--font-d)">⚡ 5× COMBAT SPEED</span><br/>New 5× speed button in the top bar and settings. Archer Barrage upgraded from 5 to 10 arrows.</div>
        <div style="height:1px;background:var(--bord3)"></div>
        <div><span style="color:var(--teal3);font-family:var(--font-d)">💊 AUTO-POTION</span><br/>Toggle in the Battle tab — auto-uses your best healing potion when HP falls below 35%.</div>
        <div style="height:1px;background:var(--bord3)"></div>
        <div><span style="color:var(--blue3);font-family:var(--font-d)">🛒 SHOP COMPARISON</span><br/>Shop items now show stat differences vs your currently equipped gear in the same slot.</div>
        <div style="height:1px;background:var(--bord3)"></div>
        <div><span style="color:var(--gold3);font-family:var(--font-d)">⚖ BALANCE</span><br/>Boss HP scaling reduced (capped at 20 runs, rates halved). XP formula softened for faster leveling. Drop rates increased. Cloud saves now auto-browse on settings open.</div>
      </div>
    </div>
    <div style="margin-top:12px;padding:10px 14px;background:rgba(40,30,120,.25);border:1px solid var(--purple2);border-radius:9px;text-align:left">
      <div style="font-size:10px;color:var(--purple3);font-family:var(--font-d);letter-spacing:.5px;margin-bottom:6px">☁ CLOUD SAVES</div>
      <div id="cloud-slots-list" style="font-size:11px;color:var(--txt3);font-style:italic">Click to browse…</div>
      <button class="btn" style="font-size:10px;padding:3px 9px;margin-top:6px" onclick="showCloudSlots()">🔍 Browse Cloud Saves</button>
    </div>
  </div>
</div>

<!-- ═══ CHAR SELECT ═══ -->
<div id="s-charsel" class="screen">
<div style="max-width:720px;margin:0 auto;padding:18px 0">
  <div style="margin-bottom:16px">
    <div style="font-family:var(--font-d);font-size:22px;color:var(--gold2);letter-spacing:2px">Choose Your Champion</div>
    <p style="color:var(--txt3);font-size:13px;font-style:italic;margin-top:3px">Your legend begins with a single choice.</p>
  </div>
  <div style="height:1px;background:linear-gradient(90deg,var(--bord2),transparent);margin-bottom:18px"></div>
  <div class="g2" style="gap:14px" id="cls-cards"></div>
  <div style="margin-top:14px;text-align:center">
    <button class="btn" onclick="showScreen('s-title')">← Back to Title</button>
  </div>
</div>
</div>

<!-- ═══ MAIN GAME ═══ -->
<div id="s-game" class="screen" style="padding:9px">
<div class="top-bar">
  <div id="hero-top-svg" style="width:26px;height:26px;flex-shrink:0"></div>
  <div style="flex-shrink:0">
    <div style="font-size:12.5px;font-weight:700;color:var(--gold2);font-family:var(--font-d);line-height:1.1" id="top-name">—</div>
    <div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.5px" id="top-sub">—</div>
  </div>
  <div style="width:1px;height:22px;background:var(--bord2);flex-shrink:0"></div>
  <span style="font-size:11px;color:var(--txt3);flex-shrink:0">LVL <span id="top-lvl" style="color:var(--gold2);font-family:var(--font-d);font-size:13px">1</span></span>
  <span style="font-size:11px;color:var(--txt3);flex-shrink:0">🪙 <span id="top-gold" style="color:var(--gold2);font-family:var(--font-d)">0</span></span>
  <span id="top-dng" style="font-size:10px;color:var(--txt3)"></span>
  <span id="top-run" style="font-size:10px;color:var(--amber3);font-family:var(--font-m);display:none"></span>
  <span id="top-prestige" style="display:none"></span>
  <div style="flex:1"></div>
  <div style="display:flex;gap:3px;align-items:center">
    <span style="font-size:9px;color:var(--txt3);font-family:var(--font-d)">SPD</span>
    <button class="speed-btn active" id="spd-t1" onclick="setSpeed(1)">1×</button>
    <button class="speed-btn" id="spd-t2" onclick="setSpeed(2)">2×</button>
    <button class="speed-btn" id="spd-t3" onclick="setSpeed(3)">3×</button>
    <button class="speed-btn" id="spd-t5" onclick="setSpeed(5)">5×</button>
  </div>
  <div style="width:1px;height:16px;background:var(--bord2)"></div>
  <button class="tab-btn active" id="tb-b" onclick="showTab('t-battle','tb-b')">⚔ <span>Battle</span></button>
  <button class="tab-btn" id="tb-d" onclick="showTab('t-dungeon','tb-d')">🗺 <span>Dungeons</span></button>
  <button class="tab-btn" id="tb-s" onclick="showTab('t-sheet','tb-s')">📜 <span>Sheet</span></button>
  <button class="tab-btn" id="tb-bg" onclick="showTab('t-bag','tb-bg')">🎒 <span>Bag</span></button>
  <button class="tab-btn" id="tb-st" onclick="showTab('t-storage','tb-st')">📦 <span>Vault</span></button>
  <button class="tab-btn" id="tb-sh" onclick="showTab('t-shop','tb-sh')">🏪 <span>Shop</span></button>
  <button class="tab-btn" id="tb-a" onclick="showTab('t-achieve','tb-a')">🏆 <span>Feats</span></button>
  <button class="tab-btn" onclick="openSettings()">⚙</button>
</div>

<!-- BATTLE TAB -->
<div id="t-battle" class="tab-c on">
<div class="ml">
<div>
  <div class="card" style="margin-bottom:9px">
    <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px">
      <div id="b-hero-svg" style="width:46px;height:54px;flex-shrink:0"></div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px;color:var(--gold2);font-family:var(--font-d);margin-bottom:5px" id="b-hero-name">—</div>
        <div style="font-size:9.5px;color:var(--txt3);margin-bottom:2px">HP <span id="b-hp-txt" style="color:var(--red3);font-family:var(--font-m)">—</span></div>
        <div class="bar" style="margin-bottom:5px"><div class="bar-fill bar-hp-fill" id="b-hp-bar" style="width:100%"></div></div>
        <div style="font-size:9.5px;color:var(--txt3);margin-bottom:2px">Mana <span id="b-mana-txt" style="color:var(--blue3);font-family:var(--font-m)">—</span></div>
        <div class="bar" style="margin-bottom:5px"><div class="bar-fill bar-mana-fill" id="b-mana-bar" style="width:100%"></div></div>
        <div style="font-size:9.5px;color:var(--txt3);margin-bottom:2px">XP <span id="b-xp-txt" style="color:var(--purple3);font-family:var(--font-m)">—</span></div>
        <div class="bar"><div class="bar-fill bar-xp-fill" id="b-xp-bar" style="width:0%"></div></div>
      </div>
    </div>
    <div class="sfx-bar" id="hero-sfx-bar"></div>
    <div style="margin-top:7px;border-top:1px solid var(--bord);padding-top:7px">
      <div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.5px;margin-bottom:4px">POTIONS <span style="font-size:9px;color:var(--txt3)">(click to use)</span></div>
      <div class="potion-bar" id="potion-bar"></div>
    </div>
    <div style="margin-top:7px;border-top:1px solid var(--bord);padding-top:7px" id="ab-panel"></div>
  </div>
  <div class="card" id="enemy-card" style="margin-bottom:9px;display:none">
    <div style="display:flex;gap:9px;align-items:center;margin-bottom:6px">
      <div id="b-en-svg" style="width:38px;height:38px;flex-shrink:0"></div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:12px;color:var(--red3);font-family:var(--font-d)" id="b-en-name">—</div>
        <div style="font-size:9.5px;color:var(--txt3);margin-bottom:2px" id="b-en-type-txt"></div>
        <div class="bar"><div class="bar-fill bar-en-fill" id="b-en-bar" style="width:100%"></div></div>
        <div style="font-size:9px;color:var(--txt3);font-family:var(--font-m);margin-top:2px">HP <span id="b-en-hp-txt">—</span></div>
      </div>
    </div>
    <div class="sfx-bar" id="enemy-sfx-bar"></div>
  </div>
  <div class="card" style="margin-bottom:9px;padding:10px">
    <div style="font-size:8.5px;color:var(--txt3);text-transform:uppercase;letter-spacing:1.2px;font-family:var(--font-d);margin-bottom:5px">Combat Chronicle</div>
    <div class="log" id="combat-log"></div>
  </div>
  <div style="margin-bottom:8px">
    <div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.6px;text-transform:uppercase;margin-bottom:5px">Floor Progress</div>
    <div id="pips" style="display:flex;align-items:center;gap:4px"></div>
  </div>
  <button class="btn btn-primary btn-lg" id="btn-enter" style="width:100%;margin-bottom:5px" onclick="enterDungeon()">⚔ Enter Dungeon</button>
  <button class="btn" id="btn-pause" style="width:100%;display:none;color:var(--txt2);font-size:12px" onclick="togglePause()">⏸ Pause</button>
  <button class="btn" id="btn-auto-retry" style="width:100%;margin-top:4px;font-size:10.5px;padding:4px 9px;border-color:var(--bord2)" onclick="toggleAutoRetry()">🔄 Auto-Retry: ON</button>
  <button class="btn" id="auto-potion-btn" style="width:100%;margin-top:4px;font-size:10.5px;padding:4px 9px;border-color:var(--bord2)" onclick="toggleAutoPotion()">💊 Auto-Potion: OFF</button>
</div>
<div>
  <div class="battle-arena" style="margin-bottom:9px">
    <div id="arena-scene" style="width:100%;height:200px;position:relative;background:url('/dungeon-bg.png') center/100% 100% no-repeat;border-radius:10px;overflow:hidden">
      <svg width="100%" height="100%" viewBox="0 0 600 200" style="position:absolute;top:0;left:0;pointer-events:none">
        <defs><radialGradient id="floorGrad" cx="50%" cy="100%" r="80%"><stop offset="0%" stop-color="#000" stop-opacity=".35"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
        <rect y="120" width="600" height="80" fill="url(#floorGrad)"/>
        <ellipse cx="200" cy="163" rx="45" ry="6" fill="#000" fill-opacity=".4"/>
        <ellipse cx="400" cy="163" rx="45" ry="6" fill="#000" fill-opacity=".4"/>
      </svg>
      <div class="fighter" style="left:30%;bottom:37px" id="hero-fighter"><svg id="hero-svg-big" width="60" height="80" viewBox="0 0 60 80"></svg></div>
      <div class="fighter" style="right:30%;bottom:37px" id="enemy-fighter"><svg id="enemy-svg-big" width="60" height="80" viewBox="0 0 60 80"></svg></div>
      <div id="dmg-layer" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none"></div>
    </div>
    <div class="battle-hud">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div><div style="font-size:9.5px;color:var(--txt3);font-family:var(--font-d)">Your Hero</div>
          <div style="font-weight:700;font-size:12px;color:var(--gold2);font-family:var(--font-d)" id="arena-hero-name">—</div></div>
        <div style="font-size:11px;color:var(--txt3);font-style:italic;text-align:center;flex:1;padding:0 8px" id="arena-action">Select a dungeon…</div>
        <div style="text-align:right"><div style="font-size:9.5px;color:var(--txt3);font-family:var(--font-d)">Enemy</div>
          <div style="font-weight:700;font-size:12px;color:var(--red3);font-family:var(--font-d)" id="arena-en-name">—</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 44px 1fr;gap:6px;align-items:center">
        <div><div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-m);margin-bottom:2px">HP <span id="arena-hero-hp">—</span></div>
          <div class="bar"><div class="bar-fill bar-hp-fill" id="arena-hero-bar" style="width:100%"></div></div></div>
        <div style="text-align:center;font-size:14px;color:var(--txt3);font-family:var(--font-d)">VS</div>
        <div><div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-m);margin-bottom:2px;text-align:right">HP <span id="arena-en-hp">—</span></div>
          <div class="bar"><div class="bar-fill bar-en-fill" id="arena-en-bar" style="width:100%"></div></div></div>
      </div>
    </div>
  </div>
  <div id="enc-banner" class="enc-banner" style="display:none">
    <div style="font-weight:700;font-family:var(--font-d);font-size:12px;color:var(--gold2);letter-spacing:.5px;margin-bottom:2px" id="enc-title">—</div>
    <div style="font-size:11px;color:var(--txt2);font-style:italic" id="enc-desc">—</div>
  </div>
</div>
</div>
</div>

<!-- DUNGEON TAB -->
<div id="t-dungeon" class="tab-c">
  <div style="font-family:var(--font-d);font-size:10.5px;color:var(--txt3);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">The Dungeons of Hexo Idle</div>
  <div style="display:flex;flex-direction:column;gap:8px" id="dng-list"></div>
</div>

<!-- SHEET TAB -->
<div id="t-sheet" class="tab-c">
<div class="ml">
<div>
<div class="card" style="overflow:hidden;margin-bottom:9px;padding:0">
  <div style="background:var(--bg2);border-bottom:1px solid var(--bord);padding:13px">
    <div style="display:flex;align-items:center;gap:12px">
      <div id="sheet-portrait" style="width:70px;height:78px;flex-shrink:0"></div>
      <div>
        <div style="font-size:16px;font-weight:700;color:var(--gold2);font-family:var(--font-d)" id="sh-name">—</div>
        <div style="font-size:12px;color:var(--txt2);font-style:italic" id="sh-class">—</div>
        <div style="font-size:10.5px;color:var(--txt3)">Level <span id="sh-lvl" style="color:var(--gold2);font-family:var(--font-d)">1</span> · <span id="sh-align">—</span></div>
        <div style="margin-top:4px" id="sh-prestige-badges"></div>
      </div>
    </div>
  </div>
  <div style="padding:11px 13px;border-bottom:1px solid var(--bord)">
    <div style="font-size:8.5px;color:var(--txt3);text-transform:uppercase;letter-spacing:1.2px;font-family:var(--font-d);margin-bottom:7px">Ability Scores</div>
    <div class="g3" style="gap:5px">
      <div class="sbox" data-tip="Melee damage bonus"><div class="v" id="s-str">—</div><div class="l">Strength</div></div>
      <div class="sbox" data-tip="Dodge &amp; rogue/archer bonus"><div class="v" id="s-dex">—</div><div class="l">Dexterity</div></div>
      <div class="sbox" data-tip="Spell power for Mage"><div class="v" id="s-int">—</div><div class="l">Intelligence</div></div>
      <div class="sbox" data-tip="HP per level-up"><div class="v" id="s-con">—</div><div class="l">Constitution</div></div>
      <div class="sbox" data-tip="Mana per level-up"><div class="v" id="s-wis">—</div><div class="l">Wisdom</div></div>
      <div class="sbox" data-tip="Gold multiplier bonus"><div class="v" id="s-cha">—</div><div class="l">Charisma</div></div>
    </div>
  </div>
  <div style="padding:11px 13px;border-bottom:1px solid var(--bord)">
    <div style="font-size:8.5px;color:var(--txt3);text-transform:uppercase;letter-spacing:1.2px;font-family:var(--font-d);margin-bottom:7px">Vitals &amp; Combat</div>
    <div class="g3" style="gap:5px">
      <div class="sbox"><div class="v" id="s-hp">—</div><div class="l">Max HP</div></div>
      <div class="sbox"><div class="v" id="s-mana">—</div><div class="l">Mana</div></div>
      <div class="sbox"><div class="v" id="s-ac">—</div><div class="l">Armor</div></div>
      <div class="sbox"><div class="v" id="s-atk">—</div><div class="l">Atk Bonus</div></div>
      <div class="sbox"><div class="v" id="s-dmg">—</div><div class="l">Damage</div></div>
      <div class="sbox"><div class="v" id="s-crit">—</div><div class="l">Crit %</div></div>
    </div>
  </div>
  <div style="padding:11px 13px;border-bottom:1px solid var(--bord)">
    <div style="font-size:8.5px;color:var(--txt3);text-transform:uppercase;letter-spacing:1.2px;font-family:var(--font-d);margin-bottom:5px">Proficiencies</div>
    <div id="sh-prof" style="font-size:12px;color:var(--txt2);font-style:italic"></div>
  </div>
  <div style="padding:11px 13px">
    <div style="font-size:8.5px;color:var(--txt3);text-transform:uppercase;letter-spacing:1.2px;font-family:var(--font-d);margin-bottom:6px">Legend Log</div>
    <div class="bar" style="margin-bottom:5px"><div class="bar-fill bar-xp-fill" id="sh-xp-bar" style="width:0%"></div></div>
    <div style="font-size:10.5px;color:var(--txt2);margin-bottom:5px;font-family:var(--font-m)">XP: <span id="sh-xp" style="color:var(--purple3)">0</span>/<span id="sh-xpn">100</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10.5px;color:var(--txt3);font-family:var(--font-m)">
      <span>Dungeon Clears: <span id="sh-clears" style="color:var(--gold2)">0</span></span>
      <span>Bosses Slain: <span id="sh-bosses" style="color:var(--red3)">0</span></span>
      <span>Kills: <span id="sh-kills" style="color:var(--teal3)">0</span></span>
      <span>Gold Earned: <span id="sh-totgold" style="color:var(--gold2)">0</span>gp</span>
      <span>Crits Scored: <span id="sh-crits" style="color:var(--gold3)">0</span></span>
      <span>Prestige: <span id="sh-prestige" style="color:var(--purple3)">0</span>×</span>
    </div>
    <div id="prestige-panel" style="display:none;margin-top:12px;padding:10px;background:rgba(40,30,5,.3);border:1px solid var(--amber2);border-radius:8px">
      <div style="font-size:11px;color:var(--gold2);font-family:var(--font-d);margin-bottom:5px">⭐ Prestige Available!</div>
      <div style="font-size:10.5px;color:var(--txt2);margin-bottom:8px">Reset to level 1 — keep your Vault &amp; gain permanent stat bonuses.</div>
      <button class="btn btn-gold" style="font-size:11px;width:100%" onclick="doPrestige()">⭐ Prestige (Requires Lv 50)</button>
    </div>
  </div>
</div>
</div>
<div>
  <div class="card" style="margin-bottom:9px">
    <div style="font-size:8.5px;color:var(--txt3);text-transform:uppercase;letter-spacing:1.2px;font-family:var(--font-d);margin-bottom:9px">Equipment</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px" id="equip-slots"></div>
  </div>
  <div class="card" style="margin-bottom:9px">
    <div style="font-size:8.5px;color:var(--txt3);text-transform:uppercase;letter-spacing:1.2px;font-family:var(--font-d);margin-bottom:8px">⚗ Enchant Equipment</div>
    <div style="font-size:11px;color:var(--txt2);margin-bottom:8px;font-style:italic">Spend gold to permanently upgrade equipped gear.</div>
    <div id="enchant-list"></div>
  </div>
  <div class="card">
    <div style="font-size:8.5px;color:var(--txt3);text-transform:uppercase;letter-spacing:1.2px;font-family:var(--font-d);margin-bottom:8px">Combat Summary</div>
    <div class="g4" id="cs-display"></div>
  </div>
</div>
</div>
</div>

<!-- BAG TAB -->
<div id="t-bag" class="tab-c">
<div class="card">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px">
    <div style="font-family:var(--font-d);font-size:14px;color:var(--gold2)">🎒 Backpack <span style="font-size:11px;color:var(--txt3);font-weight:400">(<span id="bag-ct">0</span>/100)</span></div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
      <button id="auto-equip-btn" class="btn" style="font-size:10.5px;padding:4px 9px;border-color:var(--bord2)" onclick="toggleAutoEquip()">🔄 Auto-Equip: OFF</button>
      <button id="auto-sell-btn" class="btn" style="font-size:10.5px;padding:4px 9px;border-color:var(--bord2)" onclick="toggleAutoSell()">🗑 Auto-Sell: OFF</button>
      <button id="bag-selmode-btn" class="btn" style="font-size:10.5px;padding:4px 9px;border-color:var(--bord2)" onclick="toggleBagSelectMode()">🔲 Select</button>
      <button class="btn" style="font-size:10.5px;padding:4px 9px" onclick="moveBagSelectedToVault()">→ Vault (Sel)</button>
      <button class="btn" style="font-size:10.5px;padding:4px 9px" onclick="bagToVaultAll()">→ Vault All</button>
      <button class="btn btn-gold" style="font-size:10.5px;padding:4px 9px" onclick="bulkSell('bag','common')">Sell Common</button>
      <button class="btn btn-gold" style="font-size:10.5px;padding:4px 9px" onclick="bulkSell('bag','uncommon-')">Sell ≤Rare</button>
      <button class="btn btn-red" style="font-size:10.5px;padding:4px 9px" onclick="bulkSell('bag','all')">Sell All</button>
    </div>
  </div>
  <div id="bag-grid" style="display:grid;grid-template-columns:repeat(10,46px);gap:4px"></div>
  <div class="item-panel" style="margin-top:11px;padding-top:10px;border-top:1px solid var(--bord)" id="bag-detail">
    <div style="font-size:12px;color:var(--txt3);font-style:italic">Click an item to inspect.</div>
  </div>
</div>
</div>

<!-- VAULT TAB -->
<div id="t-storage" class="tab-c">
<div class="card">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px">
    <div style="font-family:var(--font-d);font-size:14px;color:var(--gold2)">📦 Vault <span style="font-size:11px;color:var(--txt3);font-weight:400">(<span id="vault-ct">0</span>/100)</span></div>
    <div style="display:flex;gap:5px;flex-wrap:wrap">
      <button id="vault-selmode-btn" class="btn" style="font-size:10.5px;padding:4px 9px;border-color:var(--bord2)" onclick="toggleVaultSelectMode()">🔲 Select</button>
      <button class="btn" style="font-size:10.5px;padding:4px 9px" onclick="moveVaultSelectedToBag()">→ Bag (Sel)</button>
      <button class="btn" style="font-size:10.5px;padding:4px 9px" onclick="sortVault()">⇅ Sort</button>
      <button class="btn btn-gold" style="font-size:10.5px;padding:4px 9px" onclick="bulkSell('vault','common')">Sell Common</button>
      <button class="btn btn-gold" style="font-size:10.5px;padding:4px 9px" onclick="bulkSell('vault','uncommon-')">Sell ≤Rare</button>
      <button class="btn btn-red" style="font-size:10.5px;padding:4px 9px" onclick="bulkSell('vault','all')">Sell ALL</button>
    </div>
  </div>
  <div id="vault-grid" style="display:grid;grid-template-columns:repeat(10,46px);gap:4px"></div>
  <div class="item-panel" style="margin-top:11px;padding-top:10px;border-top:1px solid var(--bord)" id="vault-detail">
    <div style="font-size:12px;color:var(--txt3);font-style:italic">Click an item to inspect.</div>
  </div>
</div>
</div>

<!-- SHOP TAB -->
<div id="t-shop" class="tab-c">
<div class="card">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
    <div>
      <div style="font-family:var(--font-d);font-size:15px;color:var(--gold2);letter-spacing:.5px">The Merchant's Emporium</div>
      <div style="font-size:10.5px;color:var(--txt3);font-style:italic;margin-top:2px">Gold: <span id="shop-gold" style="color:var(--gold2);font-family:var(--font-m)">0</span> gp — Refresh: <span id="shop-cost" style="color:var(--gold3);font-family:var(--font-m)">50</span> gp</div>
    </div>
    <button class="btn btn-gold" style="font-size:11px;padding:6px 13px" onclick="refreshShop(true)">🔄 Refresh Stock</button>
  </div>
  <div style="padding:9px;background:var(--bg2);border-radius:8px;border:1px solid var(--bord);margin-bottom:10px">
    <div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px">🧪 Potions</div>
    <div style="display:flex;gap:7px;flex-wrap:wrap" id="shop-potions"></div>
  </div>
  <div id="shop-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:9px"></div>
</div>
</div>

<!-- ACHIEVEMENTS TAB -->
<div id="t-achieve" class="tab-c">
<div class="card">
  <div style="font-family:var(--font-d);font-size:15px;color:var(--gold2);margin-bottom:4px;letter-spacing:.5px">Deeds &amp; Feats</div>
  <div style="font-size:11px;color:var(--txt3);font-style:italic;margin-bottom:13px">Your legend etched in stone — <span id="ach-count" style="color:var(--gold2)">0</span>/<span id="ach-total">0</span> unlocked</div>
  <div style="display:flex;flex-direction:column;gap:7px" id="ach-list"></div>
</div>
</div>
</div>
`,
        }}
      />

      {/* Load game logic after DOM is ready */}
      <Script src="/game.js" strategy="afterInteractive" />
    </>
  );
}
