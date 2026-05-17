
// ═══════════════════════════════════════
// STARFIELD
// ═══════════════════════════════════════
(function(){
  const c=document.getElementById('starfield');if(!c)return;
  const ctx=c.getContext('2d');let stars=[];
  const init=()=>{c.width=innerWidth;c.height=innerHeight;stars=Array.from({length:140},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.4+.3,a:Math.random(),da:Math.random()*.007+.002}))};
  const draw=()=>{ctx.clearRect(0,0,c.width,c.height);stars.forEach(s=>{s.a+=s.da;if(s.a>1||s.a<0)s.da*=-1;ctx.globalAlpha=s.a*.55;ctx.fillStyle='#585c80';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;requestAnimationFrame(draw)};
  init();draw();addEventListener('resize',init);
})();

// ═══════════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════════
let audioCtx=null,sfxOn=true;
function getAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
function playTone(freq,dur,type='square',vol=.06,detune=0){
  if(!sfxOn)return;
  try{const a=getAudio();const g=a.createGain();const o=a.createOscillator();o.type=type;o.frequency.value=freq;o.detune.value=detune;g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+dur);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+dur);}catch(e){}
}
const SFX={
  hit:()=>{playTone(180,.12,'sawtooth',.05);setTimeout(()=>playTone(140,.1,'sawtooth',.03),60)},
  crit:()=>{playTone(280,.08,'square',.07);setTimeout(()=>playTone(420,.15,'square',.06),50);setTimeout(()=>playTone(560,.12,'square',.04),120)},
  enemyHit:()=>playTone(100,.15,'sawtooth',.04),
  levelUp:()=>{[330,415,494,622,740].forEach((f,i)=>setTimeout(()=>playTone(f,.18,'sine',.08),i*80))},
  loot:()=>playTone(523,.12,'sine',.05),
  legendary:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,.22,'sine',.08),i*70))},
  buy:()=>{playTone(392,.1,'sine',.06);setTimeout(()=>playTone(523,.15,'sine',.06),80)},
  death:()=>{playTone(220,.2,'sawtooth',.06);setTimeout(()=>playTone(165,.3,'sawtooth',.05),150);setTimeout(()=>playTone(110,.4,'sawtooth',.04),350)},
  ability:()=>{[220,277,330].forEach((f,i)=>setTimeout(()=>playTone(f,.15,'square',.06),i*50))},
  bossAppear:()=>{playTone(55,.3,'sawtooth',.08);setTimeout(()=>playTone(73,.25,'sawtooth',.07),200)},
  potion:()=>{playTone(440,.1,'sine',.07);setTimeout(()=>playTone(660,.15,'sine',.06),80)},
  prestige:()=>{[262,330,392,523,660,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,.2,'sine',.09),i*90))},
};
function toggleSFX(){sfxOn=!sfxOn;document.getElementById('sfx-toggle').textContent=sfxOn?'ON':'OFF';}

// ═══════════════════════════════════════
// SPEED
// ═══════════════════════════════════════
let gameSpeed=1;
let potCD=0;
function setSpeed(s){
  gameSpeed=s;
  ['1','2','3','5'].forEach(n=>{
    const b1=document.getElementById('spd-'+n),b2=document.getElementById('spd-t'+n);
    if(b1)b1.className='speed-btn'+(n==s?' active':'');
    if(b2)b2.className='speed-btn'+(n==s?' active':'');
  });
}

// ═══════════════════════════════════════
// SAVE / LOAD
// ═══════════════════════════════════════
const SK='ardenmoor_v6';
function saveGame(){if(!G)return;try{localStorage.setItem(SK,JSON.stringify({G,ts:Date.now()}));}catch(e){}}
function loadGame(){try{const r=localStorage.getItem(SK)||localStorage.getItem('ardenmoor_v5');return r?JSON.parse(r):null;}catch(e){return null;}}
function exportSave(){if(!G){alert('No game to export.');return;}const s=localStorage.getItem(SK)||'';const a=document.createElement('a');a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(s);a.download='ardenmoor_save.json';a.click();}
function importSavePrompt(){const txt=prompt('Paste your save data here:');if(!txt)return;try{const p=JSON.parse(txt);if(!p.G)throw 0;localStorage.setItem(SK,txt);location.reload();}catch(e){alert('Invalid save data.');}}
let _aSaveT=null;
function queueSave(){clearTimeout(_aSaveT);_aSaveT=setTimeout(saveGame,1500);}
window.addEventListener('beforeunload',()=>{if(G)saveGame();});

// ═══════════════════════════════════════
// CLOUD SAVE / LOAD — Supabase backend
// ═══════════════════════════════════════
let _sb = null;
function getSB(){
  if(!_sb){
    const url=window.__SB_URL,key=window.__SB_KEY;
    if(!url||!key){console.warn('Supabase env vars not set');return null;}
    _sb=window.supabase.createClient(url,key);
  }
  return _sb;
}

function getDeviceId(){
  let id=localStorage.getItem('ardenmoor_uid');
  if(!id){id='u'+Math.random().toString(36).slice(2,10);localStorage.setItem('ardenmoor_uid',id);}
  return id;
}
function getCloudSlotName(){
  const uid=getDeviceId();
  const v=(document.getElementById('cloud-slot-id')||{}).value||'';
  const name=v.trim().replace(/[^a-zA-Z0-9_\-]/g,'').slice(0,32)||'default';
  return uid+'_'+name;
}
function getCloudDisplaySlot(slotName){
  const uid=getDeviceId();
  return slotName.startsWith(uid+'_')?slotName.slice(uid.length+1):slotName;
}
function getCloudPin(){
  const el=document.getElementById('cloud-pin');
  return el&&el.value.trim()?el.value.trim():undefined;
}
function setCloudStatus(msg,ok){
  const el=document.getElementById('cloud-status');
  if(el){el.textContent=msg;el.style.color=ok===true?'var(--green3)':ok===false?'var(--red3)':'var(--txt3)';}
}
async function _promptPin(slotName){
  return new Promise(resolve=>{
    const pin=window.prompt('🔒 Slot "'+slotName+'" is PIN-protected.\nEnter PIN to continue:','');
    resolve(pin&&pin.trim()?pin.trim():undefined);
  });
}

async function cloudSave(){
  if(!G){push('No game to save!');return;}
  const sb=getSB();if(!sb){push('☁️ Supabase not configured','bad');return;}
  const slot=getCloudSlotName();
  const pin=getCloudPin();
  setCloudStatus('⏳ Saving to cloud…',null);
  try{
    const{data:existing}=await sb.from('cloud_saves').select('pin,protected').eq('slot_name',slot).maybeSingle();
    if(existing&&existing.protected&&existing.pin!==pin){
      if(!pin){const entered=await _promptPin(slot);if(!entered){setCloudStatus('✗ PIN required',false);return;}
        return cloudSave();}
      setCloudStatus('✗ Wrong PIN for slot "'+slot+'"',false);push('🔒 Wrong PIN — cloud save blocked','bad');return;
    }
    const row={slot_name:slot,char_name:G.charName||'Hero',level:G.level||1,cls:G.cls||'rogue',
      save_data:G,protected:!!pin,pin:pin||null,updated_at:new Date().toISOString()};
    const{error}=await sb.from('cloud_saves').upsert(row,{onConflict:'slot_name'});
    if(error)throw error;
    setCloudStatus('✓ '+(pin?'🔒 ':'')+'Saved to cloud slot: '+slot,true);
    push('☁️ Cloud saved to "'+slot+'"'+(pin?' 🔒':''),'info');
  }catch(e){setCloudStatus('✗ Cloud save failed: '+e.message,false);push('☁️ Save failed: '+e.message,'bad');}
}

async function cloudLoad(){
  const sb=getSB();if(!sb){push('☁️ Supabase not configured','bad');return;}
  const slot=getCloudSlotName();
  let pin=getCloudPin();
  setCloudStatus('⏳ Loading from cloud…',null);
  try{
    const{data,error}=await sb.from('cloud_saves').select('*').eq('slot_name',slot).maybeSingle();
    if(error||!data){setCloudStatus('✗ No cloud save found for slot: '+slot,false);return;}
    if(data.protected){
      if(!pin){pin=await _promptPin(slot);if(!pin){setCloudStatus('✗ PIN required',false);return;}}
      if(data.pin!==pin){setCloudStatus('✗ Wrong PIN for slot "'+slot+'"',false);return;}
    }
    const gData=data.save_data;
    if(!gData)throw new Error('Empty save data');
    localStorage.setItem(SK,JSON.stringify({G:gData,ts:Date.now()}));
    setCloudStatus('✓ Loaded from cloud! Restarting…',true);
    push('☁️ Slot "'+slot+'" loaded!','info');
    setTimeout(()=>location.reload(),800);
  }catch(e){setCloudStatus('✗ Cloud load failed: '+e.message,false);}
}

async function showCloudSlots(){
  const sb=getSB();
  const el=document.getElementById('cloud-slots-list');if(!el)return;
  if(!sb){el.textContent='⚠️ Supabase not configured.';return;}
  el.textContent='⏳ Loading…';
  try{
    const uid=getDeviceId();
    const{data:slots,error}=await sb.from('cloud_saves').select('slot_name,char_name,level,cls,protected,updated_at').like('slot_name',uid+'_%').order('updated_at',{ascending:false});
    if(error)throw error;
    if(!slots||!slots.length){el.textContent='No cloud saves found.';return;}
    el.innerHTML='';
    slots.forEach(s=>{
      const clsIcon={rogue:'🗡',mage:'🔮',paladin:'🛡',archer:'🏹'}[s.cls]||'⚔';
      const lockIcon=s.protected?'🔒 ':'';
      const when=new Date(s.updated_at).toLocaleDateString();
      const displayName=getCloudDisplaySlot(s.slot_name);
      const btn=document.createElement('button');
      btn.className='btn btn-gold';btn.style.cssText='font-size:11px;padding:4px 10px;margin:3px';
      btn.textContent=clsIcon+' '+lockIcon+'Load: '+displayName+' — '+s.char_name+' LV'+s.level+' ('+when+')';
      btn.onclick=async()=>{
        let pin=s.protected?await _promptPin(s.slot_name):undefined;
        if(s.protected&&!pin)return;
        const{data,error}=await sb.from('cloud_saves').select('*').eq('slot_name',s.slot_name).single();
        if(error||!data){push('Failed to load cloud slot','bad');return;}
        if(data.protected&&data.pin!==pin){push('🔒 Wrong PIN for slot "'+s.slot_name+'"','bad');return;}
        localStorage.setItem(SK,JSON.stringify({G:data.save_data,ts:Date.now()}));
        push('☁️ Slot "'+s.slot_name+'" loaded! Restarting…','info');
        setTimeout(()=>location.reload(),800);
      };
      const del=document.createElement('button');
      del.className='btn btn-red';del.style.cssText='font-size:10px;padding:3px 7px;margin:3px';
      del.textContent='✕';del.title='Delete cloud slot';
      del.onclick=async()=>{
        let pin=s.protected?await _promptPin(s.slot_name):undefined;
        if(s.protected&&!pin)return;
        if(s.protected){
          const{data:row}=await sb.from('cloud_saves').select('pin').eq('slot_name',s.slot_name).single();
          if(row&&row.pin!==pin){push('🔒 Wrong PIN — cannot delete slot','bad');return;}
        }
        await sb.from('cloud_saves').delete().eq('slot_name',s.slot_name);
        showCloudSlots();
      };
      el.appendChild(btn);el.appendChild(del);
    });
  }catch(e){el.textContent='✗ Could not reach cloud server.';}
}

// ═══════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════
function openSettings(){document.getElementById('settings-panel').classList.add('open');syncThemeBtn();showCloudSlots();}
function togglePatchNotes(){const b=document.getElementById('patch-notes-box');if(b){const shown=b.style.display!=='none';b.style.display=shown?'none':'block';if(!shown)b.scrollIntoView({behavior:'smooth',block:'center'});}}
function closeSettings(){document.getElementById('settings-panel').classList.remove('open');}

function toggleTheme(){
  const dark=document.body.classList.toggle('dark-theme');
  localStorage.setItem('ardenmoor_theme',dark?'dark':'light');
  syncThemeBtn();
}
function syncThemeBtn(){
  const dark=document.body.classList.contains('dark-theme');
  const btn=document.getElementById('theme-toggle');
  const icon=document.getElementById('theme-icon');
  const lbl=document.getElementById('theme-label');
  if(btn){btn.textContent=dark?'ON':'OFF';btn.className='btn'+(dark?' btn-primary':'');}
  if(icon)icon.textContent=dark?'🌙':'☀️';
  if(lbl)lbl.textContent=dark?'Dark Mode':'Light Mode';
}
(function applyStoredTheme(){
  if(localStorage.getItem('ardenmoor_theme')==='dark')document.body.classList.add('dark-theme');
})();

// ═══════════════════════════════════════
// TUTORIAL
// ═══════════════════════════════════════
const TUT_STEPS=[
  {title:'Welcome to Ardenmoor!',body:'You are a lone champion delving into six cursed dungeons. Each dungeon has 5 floors + a boss. Clear the boss to progress your legend!',icon:'⚔'},
  {title:'Combat',body:'Once you enter a dungeon, combat runs automatically. Your hero attacks, dodges, and uses passives — but you can click abilities and potions manually!',icon:'🗡️'},
  {title:'Abilities & Mana',body:'Each class has a unique ability. Use it wisely — it costs Mana and has a cooldown. Mana regenerates each combat round.',icon:'✨'},
  {title:'Loot & Equipment',body:'Enemies drop items of Common→Legendary rarity. Equip them from your Bag via the Sheet tab. Gear up to survive deeper dungeons!',icon:'🎒'},
  {title:'Potions',body:'Buy potions from the Shop. They sit in your quick-slot bar. Click them mid-combat to heal or restore mana!',icon:'🧪'},
  {title:'Prestige',body:'Reach level 50 to Prestige — reset to level 1 but gain permanent bonuses and a gold star. Multiple prestiges unlock legendary power!',icon:'⭐'},
];
let tutStep=0;
function showTutorial(step){
  tutStep=step;
  const existing=document.getElementById('tut-overlay');if(existing)existing.remove();
  if(step>=TUT_STEPS.length)return;
  const s=TUT_STEPS[step];
  const el=document.createElement('div');el.className='tut-overlay';el.id='tut-overlay';
  el.innerHTML=`<div class="tut-card">
    <div style="text-align:center;margin-bottom:14px"><span style="font-size:36px">${s.icon}</span></div>
    <div style="font-family:var(--font-d);font-size:17px;color:var(--gold2);text-align:center;margin-bottom:12px">${s.title}</div>
    <div style="font-size:13px;color:var(--txt2);text-align:center;line-height:1.7;margin-bottom:20px;font-style:italic">${s.body}</div>
    <div style="display:flex;align-items:center;gap:8px">
      <div style="font-size:10px;color:var(--txt3);font-family:var(--font-m)">${step+1}/${TUT_STEPS.length}</div>
      <div style="flex:1;height:2px;background:var(--bord);border-radius:1px"><div style="width:${((step+1)/TUT_STEPS.length*100).toFixed(0)}%;height:100%;background:var(--purple2);border-radius:1px"></div></div>
      ${step>0?`<button class="btn" style="font-size:11px;padding:4px 10px" onclick="showTutorial(${step-1})">← Back</button>`:''}
      ${step<TUT_STEPS.length-1?`<button class="btn btn-primary" style="font-size:11px;padding:4px 12px" onclick="showTutorial(${step+1})">Next →</button>`:`<button class="btn btn-primary" style="font-size:11px;padding:4px 12px" onclick="document.getElementById('tut-overlay').remove()">Let's Play!</button>`}
    </div>
  </div>`;
  document.body.appendChild(el);
}

// ═══════════════════════════════════════
// GAME DATA
// ═══════════════════════════════════════
const CLS={
  rogue:{n:'Rogue',align:'Chaotic Neutral',str:8,dex:16,int:10,con:10,wis:10,cha:12,hp:80,mana:60,crit:20,dmg:[8,15],ac:13,atk:5,
    prof:'Stealth, Sleight of Hand, Acrobatics',col:'#1e8870',badge:'background:#083028;color:#28b898',
    desc:'Master of shadows and swift strikes. High crit, bleeds enemies before they react.',
    allowedWeapons:['Dagger','Sword'],
    abs:[
      {name:'Shadowstrike',icon:'🌑',tip:'Triple crit window for 1 hit',mana:25,cd:9,eff:'shadow'},
      {name:'Shadow Dance',icon:'💨',tip:'+50% dodge chance for 5 turns',mana:20,cd:8,eff:'dance'},
      {name:'Hemorrhage',icon:'🩸',tip:'Bleed 4% HP/turn for 4 turns',mana:30,cd:14,eff:'hemorrhage'}
    ]},
  mage:{n:'Mage',align:'Neutral',str:6,dex:8,int:18,con:8,wis:14,cha:10,hp:60,mana:120,crit:10,dmg:[12,22],ac:10,atk:7,
    prof:'Arcana, History, Investigation',col:'#5245c2',badge:'background:#281e78;color:#8878ee',
    desc:'Weaver of arcane forces. Devastating INT-scaled spell damage, but fragile.',
    allowedWeapons:['Staff'],
    abs:[
      {name:'Arcane Surge',icon:'⚡',tip:'Deal 3× magic burst instantly',mana:40,cd:11,eff:'surge'},
      {name:'Fireball',icon:'🔥',tip:'Burns enemy 4% HP/turn for 5 turns',mana:35,cd:9,eff:'fireball'},
      {name:'Frost Nova',icon:'❄️',tip:'Stun 2 turns + 40% dmg reduction',mana:45,cd:14,eff:'frost'}
    ]},
  paladin:{n:'Paladin',align:'Lawful Good',str:14,dex:8,int:10,con:16,wis:12,cha:14,hp:90,mana:80,crit:8,dmg:[10,18],ac:15,atk:4,
    prof:'Athletics, Insight, Persuasion',col:'#b87818',badge:'background:#3e2204;color:#d89428',
    desc:'Divine warrior of sacred steel. Good survivability with passive holy self-healing (nerfed from godlike).',
    allowedWeapons:['Sword'],
    abs:[
      {name:'Divine Shield',icon:'✨',tip:'Heal 30% HP + block 2 hits',mana:35,cd:13,eff:'shield'},
      {name:'Divine Smite',icon:'⚔️',tip:'2.5× damage + stun 2 turns',mana:40,cd:11,eff:'smite'},
      {name:'Holy Aura',icon:'💛',tip:'Regen 5% HP/turn for 6 turns',mana:30,cd:10,eff:'aura'}
    ]},
  archer:{n:'Archer',align:'True Neutral',str:10,dex:16,int:10,con:12,wis:12,cha:8,hp:90,mana:70,crit:15,dmg:[9,17],ac:14,atk:5,
    prof:'Perception, Survival, Nature',col:'#1f6830',badge:'background:#122e18;color:#46be6c',
    desc:'Swift hunter. Balanced stats, bonus dodge, poison arrows. Rapid 10-arrow barrage.',
    allowedWeapons:['Bow','Dagger'],
    abs:[
      {name:'Barrage',icon:'🏹',tip:'Fire 10 rapid arrows instantly',mana:30,cd:10,eff:'barrage'},
      {name:'Poison Arrow',icon:'☠️',tip:'Poison 3% HP/turn for 8 turns',mana:25,cd:9,eff:'poison_arrow'},
      {name:'Eagle Eye',icon:'🦅',tip:'+30% crit chance for 5 turns',mana:20,cd:8,eff:'eagle_eye'}
    ]}
};

const DUNGEONS=[
  {id:0,n:'Goblin Warrens',em:'🕳️',col:'#1f6830',desc:'Shallow caves reeking of mildew.',minLvl:1,xm:1,gm:1,eArmor:0,
   en:[{n:'Goblin Scout',hp:32,dmg:[4,9],xp:15,g:4},{n:'Cave Rat',hp:28,dmg:[3,7],xp:10,g:3},{n:'Kobold Grunt',hp:38,dmg:[5,11],xp:18,g:5},{n:'Goblin Shaman',hp:55,dmg:[8,15],xp:25,g:8}],
   boss:{n:'Warchief Grix',hp:420,dmg:[14,24],xp:140,g:65,loot:'Grix\'s War Idol'}},
  {id:1,n:'Crypt of Whispers',em:'⚰️',col:'#5245c2',desc:'Ancient tombs. The restless dead hunger.',minLvl:6,xm:1.7,gm:1.7,eArmor:6,
   en:[{n:'Skeleton Warrior',hp:130,dmg:[18,28],xp:42,g:14},{n:'Ghoul',hp:160,dmg:[22,34],xp:54,g:17},{n:'Shadow Wraith',hp:110,dmg:[16,26],xp:48,g:15},{n:'Tomb Guardian',hp:200,dmg:[26,40],xp:65,g:20}],
   boss:{n:'Lich Vareth',hp:1400,dmg:[32,50],xp:420,g:180,loot:'Vareth\'s Phylactery'}},
  {id:2,n:'Fungal Depths',em:'🍄',col:'#8c5c08',desc:'Toxic spores fill the air.',minLvl:13,xm:2.4,gm:2.4,eArmor:18,
   en:[{n:'Spore Zombie',hp:360,dmg:[38,58],xp:90,g:32},{n:'Myconid Elder',hp:440,dmg:[46,68],xp:115,g:40},{n:'Carrion Crawler',hp:320,dmg:[34,52],xp:100,g:36},{n:'Otyugh',hp:540,dmg:[55,80],xp:135,g:50}],
   boss:{n:'The Blooming Death',hp:4800,dmg:[65,95],xp:950,g:420,loot:'Sporeweaver\'s Heart'}},
  {id:3,n:'Infernal Citadel',em:'🔥',col:'#b02828',desc:'Brimstone and hellfire.',minLvl:22,xm:3.5,gm:3.5,eArmor:40,
   en:[{n:'Hell Hound',hp:800,dmg:[70,105],xp:180,g:80},{n:'Chain Devil',hp:980,dmg:[88,128],xp:230,g:100},{n:'Fire Elemental',hp:720,dmg:[65,98],xp:200,g:90},{n:'Pit Fiend Scout',hp:1200,dmg:[105,150],xp:280,g:120}],
   boss:{n:'Arch-Devil Malphas',hp:14000,dmg:[120,175],xp:2400,g:1000,loot:'Malphas\'s Brand'}},
  {id:4,n:'Sunken Necropolis',em:'🌊',col:'#164488',desc:'A cursed city beneath black waves.',minLvl:32,xm:5,gm:5,eArmor:80,
   en:[{n:'Drowned Knight',hp:2200,dmg:[150,210],xp:380,g:190},{n:'Sea Wraith',hp:1900,dmg:[138,195],xp:420,g:200},{n:'Aboleth Spawn',hp:2600,dmg:[170,240],xp:460,g:210},{n:'Kraken Cultist',hp:2400,dmg:[160,225],xp:500,g:220}],
   boss:{n:'The Drowned King',hp:38000,dmg:[200,280],xp:5500,g:2200,loot:'Crown of the Deep'}},
  {id:5,n:'Void Sanctum',em:'🌌',col:'#5245c2',desc:"Reality fractures. The Void God's eye opens.",minLvl:45,xm:8,gm:8,eArmor:150,
   en:[{n:'Void Stalker',hp:5500,dmg:[280,390],xp:900,g:450},{n:'Reality Shredder',hp:5000,dmg:[300,420],xp:960,g:470},{n:'Chaos Elemental',hp:6500,dmg:[330,460],xp:1100,g:500},{n:'Dimensional Horror',hp:7500,dmg:[360,500],xp:1300,g:550}],
   boss:{n:"Xal'Zareth, Void God",hp:120000,dmg:[380,540],xp:18000,g:9000,loot:"Xal'Zareth's Eye"}}
];

// ═══════════════════════════════════════
// POTIONS
// ═══════════════════════════════════════
const POTIONS={
  hp_s:{name:'Minor Healing',icon:'🧪',desc:'Restore 30% HP',price:40,eff:'hp_s'},
  hp_l:{name:'Greater Healing',icon:'🍷',desc:'Restore 70% HP',price:100,eff:'hp_l'},
  mana:{name:'Mana Draught',icon:'💧',desc:'Restore 50% Mana',price:60,eff:'mana'},
  speed:{name:'Haste Tonic',icon:'⚗️',desc:'3× combat speed for 5 rounds',price:80,eff:'speed'},
  crit:{name:'Sharpening Oil',icon:'🫙',desc:'+15% crit for 8 rounds',price:90,eff:'crit'},
};

function usePotion(type){
  const p=POTIONS[type];
  if(!G||!G.inCombat){push('Can only use potions in combat!');return;}
  if(potCD>0){push('⏳ Potion on cooldown! ('+potCD+' turns)');return;}
  const ct=(G.potions||{})[type]||0;
  if(ct<=0){push('No '+p.name+' left!');return;}
  G.potions[type]--;
  G.potionsUsed=(G.potionsUsed||0)+1;
  potCD=4;
  SFX.potion();
  if(type==='hp_s'){const h=Math.floor(G.maxHp*.3);G.hp=Math.min(G.maxHp,G.hp+h);logMsg('🧪 Minor Healing: +'+h+' HP','good');flashFx('hero-svg-big','heal-flash');}
  else if(type==='hp_l'){const h=Math.floor(G.maxHp*.7);G.hp=Math.min(G.maxHp,G.hp+h);logMsg('🍷 Greater Healing: +'+h+' HP','good');flashFx('hero-svg-big','heal-flash');}
  else if(type==='mana'){const m=Math.floor(G.maxMana*.5);G.mana=Math.min(G.maxMana,G.mana+m);logMsg('💧 Mana restored: +'+m,'info');}
  else if(type==='speed'){addStatus('hero','haste',5,{icon:'⚗️',label:'Haste',cls:'sfx-regen'});logMsg('⚗️ Haste! Combat speed tripled for 5 rounds','info');}
  else if(type==='crit'){addStatus('hero','crit_up',8,{icon:'🫙',label:'+Crit',cls:'sfx-shield'});logMsg('🫙 Sharpening Oil: +15% crit for 8 rounds','info');}
  renderHeroBars();renderPotionBar();queueSave();
}

function renderPotionBar(){
  const bar=document.getElementById('potion-bar');if(!bar||!G)return;
  bar.innerHTML='';
  G.potions=G.potions||{};
  Object.entries(POTIONS).forEach(([k,p])=>{
    const ct=G.potions[k]||0;
    const s=document.createElement('div');
    s.className='pot-slot'+(ct===0?' empty':'');
    s.title=p.name+' — '+p.desc+(ct?' ('+ct+' left)':' (none)');
    s.innerHTML=`${p.icon}<span class="pot-ct">${ct>0?ct:''}</span>`;
    if(ct>0)s.onclick=()=>usePotion(k);
    bar.appendChild(s);
  });
}

function renderShopPotions(){
  const div=document.getElementById('shop-potions');if(!div||!G)return;
  div.innerHTML='';
  Object.entries(POTIONS).forEach(([k,p])=>{
    const ct=(G.potions||{})[k]||0;
    const ok1=G.gold>=p.price,ok5=G.gold>=p.price*5,ok10=G.gold>=p.price*10;
    const d=document.createElement('div');
    d.style.cssText='display:flex;align-items:center;gap:7px;padding:7px 10px;background:var(--bg1);border:1px solid var(--bord);border-radius:7px;min-width:140px';
    d.innerHTML=`<span style="font-size:20px">${p.icon}</span>
      <div style="flex:1"><div style="font-size:11px;color:var(--txt);font-family:var(--font-b)">${p.name}</div>
      <div style="font-size:9px;color:var(--txt3);font-style:italic">${p.desc}</div>
      <div style="font-size:9px;color:var(--txt3);font-family:var(--font-m)">Owned: ${ct} · ${p.price}gp each</div></div>
      <div style="display:flex;flex-direction:column;gap:3px;flex-shrink:0">
        <button class="btn btn-gold" style="font-size:9.5px;padding:2px 7px" onclick="buyPotion('${k}',1)" ${!ok1?'disabled':''}>×1 (${p.price}g)</button>
        <button class="btn btn-gold" style="font-size:9.5px;padding:2px 7px" onclick="buyPotion('${k}',5)" ${!ok5?'disabled':''}>×5 (${p.price*5}g)</button>
        <button class="btn btn-gold" style="font-size:9.5px;padding:2px 7px" onclick="buyPotion('${k}',10)" ${!ok10?'disabled':''}>×10 (${p.price*10}g)</button>
      </div>`;
    div.appendChild(d);
  });
}

function buyPotion(type,qty=1){
  const p=POTIONS[type];const total=p.price*qty;
  if(G.gold<total){push('Need '+total+'gp!');return;}
  G.gold-=total;
  G.potions=G.potions||{};
  G.potions[type]=(G.potions[type]||0)+qty;
  push('Bought '+qty+'× '+p.name+' ('+total+'gp)');SFX.buy();
  renderAll();renderShopPotions();renderPotionBar();queueSave();
}

// ═══════════════════════════════════════
// STATUS EFFECTS
// ═══════════════════════════════════════
let heroStatus={},enemyStatus={};

function addStatus(target,key,rounds,meta){
  if(target==='hero')heroStatus[key]={rounds,meta};
  else enemyStatus[key]={rounds,meta};
  renderStatusBars();
}
function tickStatuses(){
  ['hero','enemy'].forEach(t=>{
    const s=t==='hero'?heroStatus:enemyStatus;
    Object.keys(s).forEach(k=>{s[k].rounds--;if(s[k].rounds<=0)delete s[k];});
  });
  renderStatusBars();
}
function clearStatuses(){heroStatus={};enemyStatus={};renderStatusBars();}
function renderStatusBars(){
  ['hero','enemy'].forEach(t=>{
    const bar=document.getElementById(t+'-sfx-bar');if(!bar)return;
    const s=t==='hero'?heroStatus:enemyStatus;
    bar.innerHTML=Object.values(s).map(e=>`<span class="sfx-pill ${e.meta.cls}">${e.meta.icon} ${e.meta.label} ${e.rounds}t</span>`).join('');
  });
}

// ═══════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════
const ACHIEVEMENTS=[
  {id:'a1',icon:'🩸',n:'First Blood',desc:'Win your first battle',chk:g=>g.killed>=1},
  {id:'a2',icon:'🏰',n:'Dungeon Delver',desc:'Clear a dungeon boss',chk:g=>g.bosses>=1},
  {id:'a3',icon:'⭐',n:'Journeyman',desc:'Reach level 10',chk:g=>g.level>=10},
  {id:'a4',icon:'🌟',n:'Veteran',desc:'Reach level 25',chk:g=>g.level>=25},
  {id:'a5',icon:'💫',n:'Legend',desc:'Reach level 50',chk:g=>g.level>=50},
  {id:'a6',icon:'💰',n:'Gold Fever',desc:'Earn 1,000 total gold',chk:g=>g.totalGold>=1000},
  {id:'a7',icon:'🏆',n:'Treasure Hoard',desc:'Earn 10,000 total gold',chk:g=>g.totalGold>=10000},
  {id:'a8',icon:'⚔️',n:'Slayer',desc:'Defeat 100 enemies',chk:g=>g.killed>=100},
  {id:'a9',icon:'💀',n:'Reaper',desc:'Defeat 500 enemies',chk:g=>g.killed>=500},
  {id:'a10',icon:'✨',n:"Fortune's Chosen",desc:'Find a legendary item',chk:g=>g.legendaryFound},
  {id:'a11',icon:'🔮',n:'Power Unleashed',desc:'Use class ability 10 times',chk:g=>g.abilityUses>=10},
  {id:'a12',icon:'👑',n:'Bossslayer',desc:'Defeat 5 dungeon bosses',chk:g=>g.bosses>=5},
  {id:'a13',icon:'🌌',n:'Void Walker',desc:'Unlock the Void Sanctum',chk:g=>g.level>=38},
  {id:'a14',icon:'🗡️',n:'Shadowmaster',desc:'Score 50 critical hits',chk:g=>(g.crits||0)>=50},
  {id:'a15',icon:'🛒',n:'Patron',desc:'Buy 10 items from the shop',chk:g=>(g.shopBuys||0)>=10},
  {id:'a16',icon:'⭐',n:'Transcendent',desc:'Complete your first Prestige',chk:g=>(g.prestige||0)>=1},
  {id:'a17',icon:'🌠',n:'Mythic',desc:'Complete 3 Prestiges',chk:g=>(g.prestige||0)>=3},
  {id:'a18',icon:'🧪',n:'Alchemist',desc:'Use 20 potions',chk:g=>(g.potionsUsed||0)>=20},
  {id:'a19',icon:'⚗️',n:'Forgemaster',desc:'Enchant an item',chk:g=>(g.enchants||0)>=1},
  {id:'a20',icon:'🪙',n:'Millionaire',desc:'Earn 100,000 total gold',chk:g=>g.totalGold>=100000},
];

// ═══════════════════════════════════════
// ITEM DATA
// ═══════════════════════════════════════
const ITEM_TYPES=['Sword','Dagger','Staff','Bow','Shield','Helmet','Chestplate','Gauntlets','Boots','Ring','Amulet','Cloak'];
const PREFIXES=['Iron','Steel','Mithril','Adamantine','Shadow','Blessed','Cursed','Ancient','Void','Celestial','Dragon','Runic','Elven','Dwarven','Obsidian','Forsaken','Radiant','Infernal','Phantom','Gilded','Bone','Storm','Venom','Sacred','Glacial','Ashen','Blood','Thornwood','Spectral','Soulbound','Silver','Midnight','Ember','Crystal','Wyrmscale','Shadowforged','Ironblood','Deathly','Warlord\'s','Moonlit'];
const SUFFIXES=['of Power','of Swiftness','of the Void','of Flames','of Frost','of Fortune','of the Wraith','of Legends','of Eternity','of the Fallen','of Ruin','of Dominion','of the Abyss','of Twilight','of the Hunt','of Vengeance','of the Deep','of Starfall','of Corruption','of the Ancients','of Endurance','of the Damned','of Echoes','of the Rift','of Bloodshed',''];
const RARITY_M={common:1,rare:1.5,epic:2.2,legendary:3.5,mythic:6};
const RARITY_C={common:'#484a62',rare:'#146050',epic:'#3870c4',legendary:'#8878ee',mythic:'#e4b440'};
const ISVG={
  Sword:`<svg viewBox="0 0 28 28"><polygon points="14,2 12,5 16,5" fill="#d8d8d8"/><rect x="12.5" y="4" width="3" height="16" rx="1" fill="#b0b0b0"/><line x1="13.2" y1="5" x2="13.2" y2="19" stroke="#e8e8e8" stroke-width=".8"/><rect x="7" y="19" width="14" height="2.5" rx="1" fill="#8b6914"/><rect x="12" y="21.5" width="4" height="5" rx="1.5" fill="#6b4a0a"/><circle cx="15" cy="7" r=".8" fill="#fff" opacity=".5"/></svg>`,
  Dagger:`<svg viewBox="0 0 28 28"><polygon points="14,3 11.5,15 16.5,15" fill="#b0b8d0"/><polygon points="14,3 13,10 15,10" fill="#d8e0f0"/><rect x="9" y="15" width="10" height="2" rx=".8" fill="#2044b0"/><rect x="12" y="17" width="4" height="8" rx="1.5" fill="#102060"/><line x1="14" y1="5" x2="14" y2="14" stroke="#e0e8f8" stroke-width=".7"/></svg>`,
  Staff:`<svg viewBox="0 0 28 28"><rect x="13" y="9" width="2.5" height="18" rx="1" fill="#6040b0"/><line x1="14.2" y1="10" x2="14.2" y2="26" stroke="#9070e0" stroke-width=".7"/><circle cx="14" cy="7" r="6" fill="#100830"/><circle cx="14" cy="7" r="4.5" fill="#2010a0" opacity=".9"/><circle cx="14" cy="7" r="2.8" fill="#5040d0"/><circle cx="14" cy="7" r="1.3" fill="#c0b0ff"/><circle cx="14" cy="7" r=".5" fill="#fff" opacity=".8"/><line x1="9" y1="2" x2="14" y2="7" stroke="#8060d0" stroke-width=".8" opacity=".5"/><line x1="19" y1="2" x2="14" y2="7" stroke="#8060d0" stroke-width=".8" opacity=".5"/></svg>`,
  Bow:`<svg viewBox="0 0 28 28"><path d="M8 3 Q22 14 8 25" stroke="#5c3a10" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M8 3 Q20 14 8 25" stroke="#9b6e2a" stroke-width="1.5" fill="none" stroke-linecap="round"/><line x1="8" y1="3" x2="8" y2="25" stroke="#c8a050" stroke-width=".9"/><line x1="8" y1="14" x2="23" y2="14" stroke="#c8a050" stroke-width="1"/><polygon points="21,12 25,14 21,16" fill="#c8a050"/><circle cx="8" cy="3" r="1.5" fill="#8b5e20"/><circle cx="8" cy="25" r="1.5" fill="#8b5e20"/></svg>`,
  Shield:`<svg viewBox="0 0 28 28"><path d="M14 3 L23 7 L23 18 Q14 26 14 26 Q5 22 5 18 L5 7 Z" fill="#181c28"/><path d="M14 3 L23 7 L23 18 Q14 26 14 26 Q5 22 5 18 L5 7 Z" fill="none" stroke="#c8a020" stroke-width="1.5"/><line x1="14" y1="6" x2="14" y2="22" stroke="#c8a020" stroke-width="1"/><line x1="6.5" y1="13" x2="21.5" y2="13" stroke="#c8a020" stroke-width="1"/><circle cx="14" cy="13" r="2.5" fill="#c8a020"/><circle cx="14" cy="13" r="1.2" fill="#e8d060"/></svg>`,
  Helmet:`<svg viewBox="0 0 28 28"><path d="M5 21 Q5 7 14 7 Q23 7 23 21 L23 24 L5 24 Z" fill="#181c28"/><path d="M5 21 Q5 7 14 7 Q23 7 23 21" fill="none" stroke="#70788e" stroke-width="1.5"/><rect x="5" y="21" width="18" height="3" rx=".8" fill="#242840"/><rect x="9.5" y="14" width="9" height="4.5" rx="1" fill="#060810" stroke="#c8a020" stroke-width=".8"/><path d="M4 13 Q2 8 5 7" stroke="#70788e" stroke-width="1" fill="none"/><path d="M24 13 Q26 8 23 7" stroke="#70788e" stroke-width="1" fill="none"/><circle cx="14" cy="10" r="1.5" fill="#c8a020" opacity=".6"/></svg>`,
  Chestplate:`<svg viewBox="0 0 28 28"><rect x="5" y="9" width="18" height="16" rx="2" fill="#181c28" stroke="#70788e" stroke-width="1.5"/><rect x="7" y="5" width="5" height="6" rx="1" fill="#1c2030" stroke="#70788e" stroke-width="1"/><rect x="16" y="5" width="5" height="6" rx="1" fill="#1c2030" stroke="#70788e" stroke-width="1"/><line x1="14" y1="9" x2="14" y2="25" stroke="#70788e" stroke-width="1"/><ellipse cx="10" cy="16" rx="3" ry="4" fill="#242840" stroke="#70788e" stroke-width=".8"/><ellipse cx="18" cy="16" rx="3" ry="4" fill="#242840" stroke="#70788e" stroke-width=".8"/><line x1="5" y1="19" x2="23" y2="19" stroke="#70788e" stroke-width=".8" opacity=".5"/></svg>`,
  Gauntlets:`<svg viewBox="0 0 28 28"><rect x="8" y="15" width="12" height="10" rx="2" fill="#181c28" stroke="#3870c4" stroke-width="1.5"/><rect x="9" y="8" width="10" height="9" rx="1.5" fill="#1c2238" stroke="#3870c4" stroke-width="1"/><rect x="10" y="5" width="3" height="5" rx="1" fill="#243060" stroke="#3870c4" stroke-width=".8"/><rect x="15" y="5" width="3" height="5" rx="1" fill="#243060" stroke="#3870c4" stroke-width=".8"/><line x1="8" y1="18" x2="20" y2="18" stroke="#3870c4" stroke-width=".8" opacity=".5"/><line x1="8" y1="21" x2="20" y2="21" stroke="#3870c4" stroke-width=".8" opacity=".3"/></svg>`,
  Boots:`<svg viewBox="0 0 28 28"><path d="M7 7 L7 21 L19 21 L21 19 L15 17 L15 7 Z" fill="#181c28"/><path d="M7 7 L7 21 L19 21 L21 19 L15 17 L15 7 Z" stroke="#2c6830" stroke-width="1.5" fill="none"/><rect x="7" y="21" width="14" height="3" rx="1" fill="#1c2820" stroke="#2c6830" stroke-width=".8"/><line x1="7" y1="17" x2="15" y2="17" stroke="#2c6830" stroke-width="1"/><line x1="10" y1="10" x2="10" y2="17" stroke="#2c6830" stroke-width=".8" opacity=".5"/></svg>`,
  Ring:`<svg viewBox="0 0 28 28"><circle cx="14" cy="17" r="8" fill="none" stroke="#c8a020" stroke-width="2.5"/><circle cx="14" cy="17" r="5.5" fill="none" stroke="#e8c040" stroke-width=".8" opacity=".4"/><ellipse cx="14" cy="9" rx="3.5" ry="3" fill="#e8c040"/><ellipse cx="14" cy="9" rx="2" ry="1.8" fill="#ff8080"/><circle cx="14" cy="9" r=".7" fill="#fff" opacity=".7"/><circle cx="14" cy="17" r="2.5" fill="none" stroke="#e8c040" stroke-width=".8" opacity=".3"/></svg>`,
  Amulet:`<svg viewBox="0 0 28 28"><path d="M14 3 Q12 3 12 5 L12 8 L9 8 Q8 8 8 10 L8 11 L20 11 Q20 9 19 9 L16 8 L16 5 Q16 3 14 3Z" fill="#606878"/><path d="M7 11 L6 22 L14 26 L22 22 L21 11Z" fill="#181430" stroke="#8060e0" stroke-width="1.5"/><circle cx="14" cy="18" r="4.5" fill="#1a0a50"/><circle cx="14" cy="18" r="3" fill="#5030c0"/><circle cx="14" cy="18" r="1.5" fill="#c0a0ff"/><circle cx="14" cy="18" r=".6" fill="#fff" opacity=".8"/></svg>`,
  Cloak:`<svg viewBox="0 0 28 28"><path d="M14 4 L21 7 L23 23 L14 27 L5 23 L7 7 Z" fill="#0a0e18"/><path d="M14 4 L21 7 L23 23 L14 27 L5 23 L7 7 Z" stroke="#7060e0" stroke-width="1.5" fill="none"/><circle cx="14" cy="6" r="2.5" fill="#7060e0"/><line x1="10" y1="11" x2="18" y2="11" stroke="#7060e0" stroke-width=".8" opacity=".6"/><line x1="9" y1="15" x2="19" y2="15" stroke="#7060e0" stroke-width=".8" opacity=".4"/><line x1="10" y1="19" x2="18" y2="19" stroke="#7060e0" stroke-width=".8" opacity=".3"/><path d="M9 7 Q6 10 7 21" stroke="#7060e0" stroke-width=".8" fill="none" opacity=".4"/><path d="M19 7 Q22 10 21 21" stroke="#7060e0" stroke-width=".8" fill="none" opacity=".4"/></svg>`
};

// ═══════════════════════════════════════
// SVG CHARACTERS
// ═══════════════════════════════════════
function heroSVG(cls,w,h){
  const HERO_IMGS={
    rogue:'/hero-rogue.png',
    mage:'/hero-mage.png',
    paladin:'/hero-paladin.png',
    archer:'/hero-archer.png'
  };
  const src=HERO_IMGS[cls]||HERO_IMGS.rogue;
  return `<img src="${src}" width="${w}" height="${h}" style="object-fit:contain;image-rendering:auto;mix-blend-mode:screen;filter:drop-shadow(0 2px 8px rgba(0,0,0,.8))" />`;
}

function enemySVG(name,w,h){
  const n=name.toLowerCase().replace(/[★✦]/g,'').trim();
  let body='';
  if(n.includes('goblin')||n.includes('kobold')){
    body=`<polygon points="15,22 10,8 20,18" fill="#1a5c28"/><polygon points="45,22 50,8 40,18" fill="#1a5c28"/>
    <polygon points="15,22 11.5,10 18.5,19" fill="#8b3a3a" opacity=".35"/>
    <polygon points="45,22 48.5,10 41.5,19" fill="#8b3a3a" opacity=".35"/>
    <ellipse cx="30" cy="26" rx="16" ry="14" fill="#1f7030"/>
    <ellipse cx="30" cy="19" rx="12" ry="7" fill="#155020" opacity=".6"/>
    <ellipse cx="24" cy="25" rx="4.5" ry="5" fill="#050e05"/>
    <ellipse cx="36" cy="25" rx="4.5" ry="5" fill="#050e05"/>
    <ellipse cx="24" cy="25" rx="2.5" ry="3" fill="#d4c020"/>
    <ellipse cx="36" cy="25" rx="2.5" ry="3" fill="#d4c020"/>
    <ellipse cx="24.5" cy="24.5" rx="1" ry="1.5" fill="#000"/>
    <ellipse cx="36.5" cy="24.5" rx="1" ry="1.5" fill="#000"/>
    <circle cx="25" cy="24" r=".5" fill="#fff" opacity=".7"/>
    <circle cx="37" cy="24" r=".5" fill="#fff" opacity=".7"/>
    <circle cx="28" cy="30.5" r="1.2" fill="#0a2010"/><circle cx="32" cy="30.5" r="1.2" fill="#0a2010"/>
    <path d="M23 33 Q30 38 37 33" stroke="#050e05" stroke-width="1.5" fill="none"/>
    <polygon points="26,33 27.5,33 26.8,37" fill="#e8e0c8"/><polygon points="32.5,33 34,33 33.2,37" fill="#e8e0c8"/>
    <path d="M18 40 Q14 56 15 72 L24 72 L26 56 L30 58 L34 56 L36 72 L45 72 Q46 56 42 40 Q36 36 30 36 Q24 36 18 40Z" fill="#0d2c14"/>
    <path d="M22 40 Q30 44 38 40 L36 52 Q30 54 24 52Z" fill="#164820" opacity=".7"/>
    <path d="M18 40 Q10 48 11 62 Q14 66 16 62 Q15 52 20 46Z" fill="#0d2c14"/>
    <path d="M42 40 Q50 48 49 62 Q46 66 44 62 Q45 52 40 46Z" fill="#0d2c14"/>
    <ellipse cx="13" cy="63" rx="4" ry="3.5" fill="#1f7030"/>
    <ellipse cx="47" cy="63" rx="4" ry="3.5" fill="#1f7030"/>
    <rect x="46" y="50" width="2" height="13" rx="1" fill="#909090" transform="rotate(12,47,56)"/>
    <rect x="43.5" y="58" width="6" height="1.5" rx=".5" fill="#7a4020" transform="rotate(12,46.5,58.5)"/>`;
  } else if(n.includes('rat')){
    body=`<path d="M42 68 Q54 64 56 52 Q58 42 52 38" stroke="#6a5040" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="28" cy="56" rx="18" ry="14" fill="#2a2218"/>
    <ellipse cx="22" cy="52" rx="8" ry="6" fill="#342c20" opacity=".6"/>
    <ellipse cx="34" cy="58" rx="8" ry="6" fill="#1e1810" opacity=".6"/>
    <ellipse cx="22" cy="38" rx="14" ry="12" fill="#2a2218"/>
    <ellipse cx="16" cy="42" rx="8" ry="6" fill="#241e14"/>
    <ellipse cx="10" cy="42" rx="4" ry="3" fill="#c06080"/>
    <line x1="10" y1="40" x2="-2" y2="36" stroke="#c0b090" stroke-width=".8" opacity=".7"/>
    <line x1="10" y1="42" x2="-2" y2="42" stroke="#c0b090" stroke-width=".8" opacity=".7"/>
    <line x1="10" y1="44" x2="-2" y2="48" stroke="#c0b090" stroke-width=".8" opacity=".7"/>
    <line x1="14" y1="40" x2="22" y2="36" stroke="#c0b090" stroke-width=".8" opacity=".6"/>
    <circle cx="22" cy="34" r="4" fill="#120e08"/>
    <circle cx="22" cy="34" r="2.5" fill="#d02020"/>
    <circle cx="23" cy="33" r=".7" fill="#fff" opacity=".8"/>
    <ellipse cx="28" cy="26" rx="5" ry="7" fill="#2a2218"/><ellipse cx="28" cy="26" rx="3" ry="4.5" fill="#b07080" opacity=".5"/>
    <rect x="11" y="43" width="3" height="5" rx=".5" fill="#e8e0c0"/>
    <rect x="16" y="43" width="3" height="5" rx=".5" fill="#e8e0c0"/>
    <ellipse cx="20" cy="70" rx="6" ry="3" fill="#241e14"/>
    <ellipse cx="36" cy="70" rx="6" ry="3" fill="#241e14"/>
    <line x1="17" y1="71" x2="14" y2="76" stroke="#2a2218" stroke-width="2"/>
    <line x1="20" y1="72" x2="20" y2="78" stroke="#2a2218" stroke-width="2"/>
    <line x1="23" y1="71" x2="26" y2="76" stroke="#2a2218" stroke-width="2"/>`;
  } else if(n.includes('lich')||n.includes('skeleton')||n.includes('tomb')||n.includes('bone')){
    body=`<path d="M14 42 Q12 60 10 76 L20 76 L24 58 L30 60 L36 58 L40 76 L50 76 Q48 60 46 42 Q40 38 30 38 Q20 38 14 42Z" fill="#0a0814"/>
    <path d="M22 42 Q30 46 38 42 L36 54 Q30 56 24 54Z" fill="#181228" opacity=".8"/>
    <rect x="27" y="36" width="6" height="4" rx="1" fill="#c8cad8"/>
    <ellipse cx="30" cy="26" rx="14" ry="14" fill="#c8cad8"/>
    <ellipse cx="20" cy="28" rx="4" ry="3" fill="#b0b2be" opacity=".6"/>
    <ellipse cx="40" cy="28" rx="4" ry="3" fill="#b0b2be" opacity=".6"/>
    <ellipse cx="24" cy="24" rx="5.5" ry="6" fill="#04040c"/>
    <ellipse cx="36" cy="24" rx="5.5" ry="6" fill="#04040c"/>
    <ellipse cx="24" cy="24" rx="2" ry="2.5" fill="#5080ff" opacity=".7"/>
    <ellipse cx="36" cy="24" rx="2" ry="2.5" fill="#5080ff" opacity=".7"/>
    <path d="M27 30 L30 34 L33 30Z" fill="#04040c"/>
    <path d="M22 36 L38 36" stroke="#b0b2be" stroke-width="1.5"/>
    <rect x="24" y="36" width="3" height="4" rx=".5" fill="#c8cad8"/>
    <rect x="28.5" y="36" width="3" height="4" rx=".5" fill="#c8cad8"/>
    <rect x="33" y="36" width="3" height="4" rx=".5" fill="#c8cad8"/>
    <ellipse cx="12" cy="60" rx="5" ry="3.5" fill="#c8cad8"/>
    <line x1="10" y1="58" x2="8" y2="54" stroke="#c8cad8" stroke-width="1.5"/>
    <line x1="12" y1="57" x2="12" y2="53" stroke="#c8cad8" stroke-width="1.5"/>
    <line x1="14" y1="58" x2="16" y2="54" stroke="#c8cad8" stroke-width="1.5"/>
    <line x1="50" y1="38" x2="54" y2="78" stroke="#503880" stroke-width="2.5"/>
    <circle cx="50" cy="36" r="5" fill="#04040c" stroke="#5080ff" stroke-width="1.5"/>
    <circle cx="50" cy="36" r="2" fill="#2030a0" opacity=".8"/>
    <circle cx="50" cy="36" r="1" fill="#80a0ff"/>`;
  } else if(n.includes('ghoul')||n.includes('wraith')||n.includes('shadow')||n.includes('sea')){
    body=`<path d="M18 62 Q14 74 16 80 Q20 76 22 68" fill="#140c2c" opacity=".8"/>
    <path d="M30 64 Q28 76 30 80 Q32 76 30 64" fill="#140c2c" opacity=".7"/>
    <path d="M42 62 Q46 74 44 80 Q40 76 38 68" fill="#140c2c" opacity=".8"/>
    <path d="M24 60 Q18 70 20 76" fill="#140c2c" opacity=".5"/>
    <path d="M36 60 Q42 70 40 76" fill="#140c2c" opacity=".5"/>
    <ellipse cx="30" cy="50" rx="20" ry="22" fill="#0c0820" opacity=".9"/>
    <ellipse cx="30" cy="46" rx="14" ry="16" fill="#180f38" opacity=".7"/>
    <ellipse cx="30" cy="30" rx="16" ry="16" fill="#0c0820"/>
    <ellipse cx="24" cy="28" rx="4.5" ry="3.5" fill="#6830c8" opacity=".5"/>
    <ellipse cx="36" cy="28" rx="4.5" ry="3.5" fill="#6830c8" opacity=".5"/>
    <ellipse cx="24" cy="28" rx="2.5" ry="2" fill="#c090ff"/>
    <ellipse cx="36" cy="28" rx="2.5" ry="2" fill="#c090ff"/>
    <path d="M22 36 Q30 40 38 36 Q34 42 30 42 Q26 42 22 36Z" fill="#04020c"/>
    <path d="M10 38 Q4 46 8 56 Q12 52 14 44 Q14 40 10 38Z" fill="#0c0820" opacity=".7"/>
    <path d="M50 38 Q56 46 52 56 Q48 52 46 44 Q46 40 50 38Z" fill="#0c0820" opacity=".7"/>
    <circle cx="16" cy="22" r="1.5" fill="#8050e0" opacity=".6"/>
    <circle cx="44" cy="18" r="1" fill="#8050e0" opacity=".5"/>
    <circle cx="8" cy="44" r="1.2" fill="#8050e0" opacity=".4"/>
    <circle cx="52" cy="40" r="1.5" fill="#8050e0" opacity=".5"/>`;
  } else if(n.includes('devil')||n.includes('fiend')||n.includes('hell')||n.includes('pit')){
    body=`<path d="M16 38 Q2 28 4 16 Q8 24 14 30Z" fill="#5c0808" opacity=".8"/>
    <path d="M44 38 Q58 28 56 16 Q52 24 46 30Z" fill="#5c0808" opacity=".8"/>
    <path d="M22 16 Q18 6 22 2 Q24 8 24 16Z" fill="#6c1010"/>
    <path d="M38 16 Q42 6 38 2 Q36 8 36 16Z" fill="#6c1010"/>
    <ellipse cx="30" cy="22" rx="14" ry="14" fill="#8c1818"/>
    <ellipse cx="24" cy="22" rx="5" ry="4.5" fill="#100202"/>
    <ellipse cx="36" cy="22" rx="5" ry="4.5" fill="#100202"/>
    <ellipse cx="24" cy="22" rx="3" ry="2.5" fill="#ff2020"/>
    <ellipse cx="36" cy="22" rx="3" ry="2.5" fill="#ff2020"/>
    <ellipse cx="24" cy="22" rx="1.2" ry="1" fill="#ff8040" opacity=".8"/>
    <ellipse cx="36" cy="22" rx="1.2" ry="1" fill="#ff8040" opacity=".8"/>
    <circle cx="28" cy="27" r="1.5" fill="#6c1010"/><circle cx="32" cy="27" r="1.5" fill="#6c1010"/>
    <path d="M22 30 Q30 35 38 30" stroke="#4a0808" stroke-width="1.5" fill="none"/>
    <polygon points="25,30 27,30 26,35" fill="#e8d0c0"/>
    <polygon points="30,31 32,31 31,36" fill="#e8d0c0"/>
    <polygon points="33,30 35,30 34,35" fill="#e8d0c0"/>
    <path d="M18 36 Q14 52 12 70 L20 70 L24 54 L30 56 L36 54 L40 70 L48 70 Q46 52 42 36 Q36 32 30 32 Q24 32 18 36Z" fill="#5c0808"/>
    <ellipse cx="25" cy="44" rx="5" ry="6" fill="#6c1010" opacity=".7"/>
    <ellipse cx="35" cy="44" rx="5" ry="6" fill="#6c1010" opacity=".7"/>
    <path d="M18 36 Q8 46 8 60 Q10 64 14 60 Q12 50 18 44Z" fill="#5c0808"/>
    <path d="M42 36 Q52 46 52 60 Q50 64 46 60 Q48 50 42 44Z" fill="#5c0808"/>
    <ellipse cx="11" cy="62" rx="5" ry="3.5" fill="#6c1010"/>
    <line x1="8" y1="60" x2="5" y2="56" stroke="#300404" stroke-width="1.5"/>
    <line x1="11" y1="59" x2="11" y2="55" stroke="#300404" stroke-width="1.5"/>
    <line x1="14" y1="60" x2="17" y2="56" stroke="#300404" stroke-width="1.5"/>
    <ellipse cx="49" cy="62" rx="5" ry="3.5" fill="#6c1010"/>
    <line x1="46" y1="60" x2="43" y2="56" stroke="#300404" stroke-width="1.5"/>
    <line x1="49" y1="59" x2="49" y2="55" stroke="#300404" stroke-width="1.5"/>
    <line x1="52" y1="60" x2="55" y2="56" stroke="#300404" stroke-width="1.5"/>
    <path d="M30 70 Q36 74 42 70 Q50 68 52 76 L48 76 Q46 72 40 72 Q34 76 30 72Z" fill="#5c0808"/>`;
  } else if(n.includes('mushroom')||n.includes('myconid')||n.includes('spore')||n.includes('bloom')||n.includes('carrion')||n.includes('otyugh')){
    body=`<path d="M22 44 Q20 62 22 76 L38 76 Q40 62 38 44 Q34 40 30 40 Q26 40 22 44Z" fill="#2c0a0a"/>
    <line x1="26" y1="44" x2="24" y2="74" stroke="#3c1010" stroke-width="1" opacity=".7"/>
    <line x1="30" y1="42" x2="30" y2="76" stroke="#3c1010" stroke-width="1" opacity=".5"/>
    <line x1="34" y1="44" x2="36" y2="74" stroke="#3c1010" stroke-width="1" opacity=".7"/>
    <path d="M8 40 Q30 46 52 40" stroke="#4a0808" stroke-width="1" fill="none" opacity=".7"/>
    <line x1="14" y1="40" x2="12" y2="44" stroke="#4a0808" stroke-width=".8" opacity=".6"/>
    <line x1="20" y1="42" x2="18" y2="46" stroke="#4a0808" stroke-width=".8" opacity=".6"/>
    <line x1="30" y1="44" x2="30" y2="48" stroke="#4a0808" stroke-width=".8" opacity=".6"/>
    <line x1="40" y1="42" x2="42" y2="46" stroke="#4a0808" stroke-width=".8" opacity=".6"/>
    <line x1="46" y1="40" x2="48" y2="44" stroke="#4a0808" stroke-width=".8" opacity=".6"/>
    <ellipse cx="30" cy="34" rx="26" ry="14" fill="#6c0e0e"/>
    <circle cx="20" cy="30" r="3.5" fill="#e8c0b0" opacity=".8"/>
    <circle cx="30" cy="26" r="4" fill="#e8c0b0" opacity=".8"/>
    <circle cx="40" cy="30" r="3.5" fill="#e8c0b0" opacity=".8"/>
    <circle cx="14" cy="36" r="2" fill="#e8c0b0" opacity=".6"/>
    <circle cx="46" cy="36" r="2" fill="#e8c0b0" opacity=".6"/>
    <circle cx="16" cy="30" r="4" fill="#6c0e0e" opacity=".4"/>
    <circle cx="44" cy="26" r="3.5" fill="#6c0e0e" opacity=".4"/>
    <ellipse cx="30" cy="40" rx="10" ry="6" fill="#3c1010" opacity=".8"/>
    <circle cx="26" cy="39" r="3" fill="#080202"/>
    <circle cx="34" cy="39" r="3" fill="#080202"/>
    <circle cx="26" cy="39" r="2" fill="#cc2020"/>
    <circle cx="34" cy="39" r="2" fill="#cc2020"/>
    <circle cx="27" cy="38" r=".6" fill="#ff8060" opacity=".8"/>
    <circle cx="35" cy="38" r=".6" fill="#ff8060" opacity=".8"/>
    <path d="M22 48 Q10 52 8 62 Q14 62 18 56 Q18 52 22 50Z" fill="#2c0a0a"/>
    <path d="M38 48 Q50 52 52 62 Q46 62 42 56 Q42 52 38 50Z" fill="#2c0a0a"/>`;
  } else if(n.includes('elemental')){
    body=`<circle cx="30" cy="40" r="26" fill="none" stroke="#d89428" stroke-width="1.5" opacity=".25"/>
    <circle cx="30" cy="40" r="22" fill="none" stroke="#d89428" stroke-width="1" opacity=".4"/>
    <path d="M16 22 Q10 30 14 40 Q18 34 20 28Z" fill="#c87820" opacity=".5"/>
    <path d="M44 22 Q50 30 46 40 Q42 34 40 28Z" fill="#c87820" opacity=".5"/>
    <path d="M8 48 Q6 58 14 64 Q14 56 16 50Z" fill="#d89428" opacity=".4"/>
    <path d="M52 48 Q54 58 46 64 Q46 56 44 50Z" fill="#d89428" opacity=".4"/>
    <path d="M18 62 Q14 72 20 76 Q22 68 24 64Z" fill="#c87820" opacity=".4"/>
    <path d="M42 62 Q46 72 40 76 Q38 68 36 64Z" fill="#c87820" opacity=".4"/>
    <ellipse cx="30" cy="40" rx="18" ry="22" fill="#0e0800" opacity=".9"/>
    <ellipse cx="30" cy="40" rx="12" ry="16" fill="#1e1200" opacity=".8"/>
    <ellipse cx="30" cy="38" rx="5" ry="6" fill="#e09020"/>
    <ellipse cx="30" cy="38" rx="3" ry="4" fill="#ffd060"/>
    <ellipse cx="24" cy="34" rx="4" ry="3.5" fill="#100800"/>
    <ellipse cx="36" cy="34" rx="4" ry="3.5" fill="#100800"/>
    <ellipse cx="24" cy="34" rx="2.5" ry="2" fill="#e09020" opacity=".8"/>
    <ellipse cx="36" cy="34" rx="2.5" ry="2" fill="#e09020" opacity=".8"/>
    <ellipse cx="24" cy="34" rx="1.2" ry="1" fill="#ffd060"/>
    <ellipse cx="36" cy="34" rx="1.2" ry="1" fill="#ffd060"/>
    <path d="M20 36 L16 30 L22 34 L18 26" stroke="#ffd060" stroke-width="1" fill="none" opacity=".7"/>
    <path d="M40 36 L44 30 L38 34 L42 26" stroke="#ffd060" stroke-width="1" fill="none" opacity=".7"/>
    <rect x="4" y="36" width="8" height="6" rx="2" fill="#3c2808" transform="rotate(-20,8,39)"/>
    <rect x="48" y="34" width="7" height="5" rx="2" fill="#3c2808" transform="rotate(15,51.5,36.5)"/>`;
  } else if(n.includes('void')||n.includes('chaos')||n.includes('xal')||n.includes('reality')||n.includes('dimensional')){
    body=`<circle cx="30" cy="38" r="28" fill="#04020c" opacity=".6"/>
    <path d="M10 54 Q2 62 6 72 Q10 66 14 60Z" fill="#180830" opacity=".8"/>
    <path d="M8 44 Q-2 48 0 60 Q6 54 10 50Z" fill="#180830" opacity=".7"/>
    <path d="M50 54 Q58 62 54 72 Q50 66 46 60Z" fill="#180830" opacity=".8"/>
    <path d="M52 44 Q62 48 60 60 Q54 54 50 50Z" fill="#180830" opacity=".7"/>
    <path d="M18 66 Q14 76 18 80 Q22 74 24 68Z" fill="#180830" opacity=".7"/>
    <path d="M42 66 Q46 76 42 80 Q38 74 36 68Z" fill="#180830" opacity=".7"/>
    <ellipse cx="30" cy="38" rx="22" ry="26" fill="#080418"/>
    <ellipse cx="30" cy="38" rx="16" ry="20" fill="none" stroke="#4028a0" stroke-width="1" opacity=".5"/>
    <ellipse cx="30" cy="38" rx="10" ry="13" fill="none" stroke="#4028a0" stroke-width="1" stroke-dasharray="3 2" opacity=".6"/>
    <ellipse cx="24" cy="28" rx="5" ry="4" fill="#04020c"/>
    <ellipse cx="24" cy="28" rx="3.5" ry="2.5" fill="#7040e0" opacity=".7"/>
    <ellipse cx="24" cy="28" rx="2" ry="1.5" fill="#c0a0ff"/>
    <ellipse cx="36" cy="28" rx="5" ry="4" fill="#04020c"/>
    <ellipse cx="36" cy="28" rx="3.5" ry="2.5" fill="#7040e0" opacity=".7"/>
    <ellipse cx="36" cy="28" rx="2" ry="1.5" fill="#c0a0ff"/>
    <ellipse cx="30" cy="20" rx="4" ry="3.5" fill="#04020c"/>
    <ellipse cx="30" cy="20" rx="2.5" ry="2" fill="#7040e0" opacity=".8"/>
    <ellipse cx="30" cy="20" rx="1.5" ry="1.2" fill="#e0c0ff"/>
    <circle cx="20" cy="38" r="2.5" fill="#04020c"/>
    <circle cx="20" cy="38" r="1.5" fill="#8050e0" opacity=".8"/>
    <circle cx="40" cy="38" r="2.5" fill="#04020c"/>
    <circle cx="40" cy="38" r="1.5" fill="#8050e0" opacity=".8"/>
    <path d="M18 46 Q30 52 42 46 Q38 56 30 58 Q22 56 18 46Z" fill="#04020c"/>
    <line x1="22" y1="46" x2="20" y2="52" stroke="#4028a0" stroke-width=".8"/>
    <line x1="27" y1="48" x2="26" y2="54" stroke="#4028a0" stroke-width=".8"/>
    <line x1="33" y1="48" x2="34" y2="54" stroke="#4028a0" stroke-width=".8"/>
    <line x1="38" y1="46" x2="40" y2="52" stroke="#4028a0" stroke-width=".8"/>
    <circle cx="10" cy="28" r="1.5" fill="#8050e0" opacity=".5"/>
    <circle cx="50" cy="32" r="1.5" fill="#8050e0" opacity=".5"/>`;
  } else if(n.includes('boss')||n.includes('king')||n.includes('warchief')||n.includes('arch')||n.includes('drowned')){
    body=`<path d="M14 40 Q8 58 10 78 L18 78 L22 56 L30 58 L38 56 L42 78 L50 78 Q52 58 46 40Z" fill="#1a1408"/>
    <path d="M16 38 Q14 52 14 66 L20 66 L24 52 L30 54 L36 52 L40 66 L46 66 Q46 52 44 38 Q38 34 30 34 Q22 34 16 38Z" fill="#282018"/>
    <path d="M20 38 Q30 44 40 38 L38 52 Q30 54 22 52Z" fill="#3c2c10"/>
    <circle cx="30" cy="44" r="5" fill="#1a1408" stroke="#c8a020" stroke-width="1.5"/>
    <path d="M28 42 L30 40 L32 42 L32 46 L28 46Z" fill="#c8a020" opacity=".8"/>
    <ellipse cx="16" cy="38" rx="6" ry="4" fill="#3c2c10"/>
    <ellipse cx="44" cy="38" rx="6" ry="4" fill="#3c2c10"/>
    <path d="M16 38 Q8 48 8 62 L14 60 Q12 50 18 44Z" fill="#282018"/>
    <rect x="7" y="54" width="8" height="8" rx="1" fill="#3c2c10" stroke="#c8a020" stroke-width="1"/>
    <path d="M44 38 Q52 48 52 62 L46 60 Q48 50 42 44Z" fill="#282018"/>
    <rect x="45" y="54" width="8" height="8" rx="1" fill="#3c2c10" stroke="#c8a020" stroke-width="1"/>
    <path d="M16 22 Q16 10 30 10 Q44 10 44 22 L44 30 Q38 36 30 36 Q22 36 16 30Z" fill="#282018"/>
    <path d="M18 22 Q18 14 30 14 Q42 14 42 22" fill="#1a1408"/>
    <rect x="20" y="22" width="7" height="3" rx="1" fill="#c8a020" opacity=".8"/>
    <rect x="33" y="22" width="7" height="3" rx="1" fill="#c8a020" opacity=".8"/>
    <path d="M18 14 L16 6 L22 12 L30 8 L38 12 L44 6 L42 14Z" fill="#c8a020"/>
    <circle cx="22" cy="11" r="1.5" fill="#cc2020"/>
    <circle cx="30" cy="8" r="2" fill="#e0c020"/>
    <circle cx="38" cy="11" r="1.5" fill="#2060cc"/>
    <rect x="24" y="30" width="12" height="6" rx="1" fill="#3c2c10" stroke="#c8a020" stroke-width=".8"/>
    <rect x="50" y="24" width="3" height="46" rx="1" fill="#707080"/>
    <rect x="48" y="22" width="7" height="4" rx="1" fill="#c8a020"/>
    <circle cx="51.5" cy="20" r="3.5" fill="#3c2c10" stroke="#c8a020" stroke-width="1.5"/>
    <line x1="10" y1="14" x2="6" y2="10" stroke="#c8a020" stroke-width="1" opacity=".5"/>
    <line x1="50" y1="14" x2="54" y2="10" stroke="#c8a020" stroke-width="1" opacity=".5"/>`;
  } else {
    body=`<path d="M18 38 Q14 54 12 72 L20 72 L24 56 L30 58 L36 56 L40 72 L48 72 Q46 54 42 38 Q36 34 30 34 Q24 34 18 38Z" fill="#100818"/>
    <path d="M22 38 Q30 42 38 38 L36 50 Q30 52 24 50Z" fill="#1c1028" opacity=".8"/>
    <ellipse cx="30" cy="24" rx="14" ry="13" fill="#100818"/>
    <polygon points="22,18 18,8 24,16" fill="#200c28"/>
    <polygon points="38,18 42,8 36,16" fill="#200c28"/>
    <ellipse cx="25" cy="23" rx="4.5" ry="4" fill="#06040e"/>
    <ellipse cx="35" cy="23" rx="4.5" ry="4" fill="#06040e"/>
    <ellipse cx="25" cy="23" rx="2.5" ry="2.5" fill="#a020c0" opacity=".7"/>
    <ellipse cx="35" cy="23" rx="2.5" ry="2.5" fill="#a020c0" opacity=".7"/>
    <ellipse cx="25" cy="23" rx="1.2" ry="1.2" fill="#e060ff"/>
    <ellipse cx="35" cy="23" rx="1.2" ry="1.2" fill="#e060ff"/>
    <circle cx="28" cy="28" r="1.5" fill="#060410"/><circle cx="32" cy="28" r="1.5" fill="#060410"/>
    <path d="M22 32 Q30 36 38 32" stroke="#060410" stroke-width="1.5" fill="none"/>
    <polygon points="25,32 27,32 26,36" fill="#d0c8b0"/>
    <polygon points="31,32 33,32 32,36" fill="#d0c8b0"/>
    <path d="M18 38 Q8 46 8 60 Q10 64 14 60 Q12 50 20 44Z" fill="#100818"/>
    <path d="M42 38 Q52 46 52 60 Q50 64 46 60 Q48 50 40 44Z" fill="#100818"/>
    <ellipse cx="11" cy="62" rx="4.5" ry="3" fill="#180c24"/>
    <line x1="8" y1="60" x2="5" y2="56" stroke="#100818" stroke-width="1.5"/>
    <line x1="11" y1="59" x2="11" y2="55" stroke="#100818" stroke-width="1.5"/>
    <line x1="14" y1="60" x2="17" y2="56" stroke="#100818" stroke-width="1.5"/>
    <ellipse cx="49" cy="62" rx="4.5" ry="3" fill="#180c24"/>
    <line x1="46" y1="60" x2="43" y2="56" stroke="#100818" stroke-width="1.5"/>
    <line x1="49" y1="59" x2="49" y2="55" stroke="#100818" stroke-width="1.5"/>
    <line x1="52" y1="60" x2="55" y2="56" stroke="#100818" stroke-width="1.5"/>`;
  }
  return`<svg width="${w}" height="${h}" viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
let G=null,cTimer=null,paused=false,abCDs=[0,0,0],shieldHits=0,shadowReady=false,retryTimer=null;
let bagSel=new Set(),vaultSel=new Set(),bagSelectMode=false,vaultSelectMode=false;

// ═══════════════════════════════════════
// OFFLINE PROGRESS
// ═══════════════════════════════════════
function calcOfflineProgress(saveTs){
  if(!saveTs||!G)return;
  const elapsed=Math.min(Date.now()-saveTs,3*3600*1000); // max 3hr
  const mins=Math.floor(elapsed/60000);
  if(mins<2)return;
  const dng=DUNGEONS[G.activeDungeon];
  const killsPerMin=Math.max(1,Math.floor(1+G.level*.05));
  const kills=Math.floor(mins*killsPerMin*.5);
  const en=dng.en[0];
  const xpG=Math.floor(en.xp*dng.xm*kills);
  const goldG=Math.floor(en.g*dng.gm*kills*(1+G.cha*.01));
  G.xp+=xpG;G.gold+=goldG;G.totalGold+=goldG;G.killed+=kills;
  while(G.xp>=G.xpNext)levelUp();
  const offBanner=document.createElement('div');offBanner.className='offline-banner';
  offBanner.innerHTML=`⏰ <b>Offline ${mins} min:</b> +${xpG.toLocaleString()} XP, +${goldG.toLocaleString()} gold, +${kills} kills`;
  const gameEl=document.getElementById('s-game');if(gameEl)gameEl.insertBefore(offBanner,gameEl.firstChild);
  setTimeout(()=>offBanner.remove(),8000);
  push(`Welcome back! +${goldG}gp offline`,'info');
}

// ═══════════════════════════════════════
// TITLE
// ═══════════════════════════════════════
function initTitle(){
  const save=loadGame();
  const cb=document.getElementById('btn-continue'),nb=document.getElementById('btn-newgame'),si=document.getElementById('save-info');
  if(save&&save.G){
    cb.style.display='block';nb.textContent='⚔ New Adventure';
    si.style.display='block';si.textContent=`Last save: ${save.G.charName} — Level ${save.G.level}${save.G.prestige?` ⭐×${save.G.prestige}`:''}`;
  } else {nb.textContent='⚔ Begin Adventure';}
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',initTitle);}else{initTitle();}

function continueGame(){
  const s=loadGame();if(!s||!s.G){push('No save found!');return;}
  G=Object.assign({legendaryFound:false,abilityUses:0,achievements:[],shopRefreshes:0,crits:0,shopBuys:0,prestige:0,potions:{},potionsUsed:0,enchants:0,statusTickMult:1,autoRetry:true,autoSell:false,autoPotion:false},s.G);
  if(typeof G.autoSell!=='boolean')G.autoSell=false;
  if(typeof G.autoPotion!=='boolean')G.autoPotion=false;
  // FIX: always reset combat state on load so Enter button works
  clearTimeout(cTimer);cTimer=null;
  G.inCombat=false;G.enemy=null;paused=false;
  abCDs=[0,0,0];shieldHits=0;shadowReady=false;
  heroStatus={};enemyStatus={};
  document.getElementById('btn-enter').style.display='block';
  document.getElementById('btn-pause').style.display='none';
  document.getElementById('enemy-card').style.display='none';
  document.getElementById('enc-banner').style.display='none';
  showScreen('s-game');renderAll();showTab('t-battle','tb-b');refreshShop(false);updateHeroVisuals();
  setTimeout(()=>setArenaBg(null),0);
  calcOfflineProgress(s.ts);
  push('⚔ Welcome back, '+G.charName+'!');
}

function gotoCharSelect(){
  showScreen('s-charsel');
  const cc=document.getElementById('cls-cards');cc.innerHTML='';
  Object.entries(CLS).forEach(([k,c])=>{
    const d=document.createElement('div');d.className='cls-card';
    d.innerHTML=`<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      ${heroSVG(k,50,60)}<div>
      <h3 style="font-family:var(--font-d);font-size:16px;color:${c.col}">${c.n}</h3>
      <span class="badge" style="${c.badge}">${c.align}</span></div></div>
      <p style="font-size:13px;color:var(--txt2);margin-bottom:10px;line-height:1.5;font-style:italic">${c.desc}</p>
      <div class="g3" style="gap:5px;font-size:11px;margin-bottom:9px">
        ${['str','dex','int','con','wis','cha'].map(s=>`<div class="card-inner" style="text-align:center"><div style="color:var(--txt3);font-size:8.5px;font-family:var(--font-d);letter-spacing:.5px">${s.toUpperCase()}</div><div style="color:${c.col};font-weight:700;font-family:var(--font-d);font-size:14px">${c[s]}</div></div>`).join('')}
      </div>
      <div style="padding:8px 10px;background:var(--bg0);border-radius:7px;border:1px solid var(--bord);margin-bottom:8px">
        <div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.5px;margin-bottom:5px">CLASS ABILITIES</div>
        ${c.abs.map(ab=>`<div style="font-size:11px;color:${c.col};margin-bottom:1px">${ab.icon} <b>${ab.name}</b> — <span style="color:var(--txt2);font-size:10px">${ab.tip}</span></div><div style="font-size:9.5px;color:var(--txt3);margin-bottom:4px;font-family:var(--font-m)">✨ ${ab.mana}mp · CD: ${ab.cd}t</div>`).join('')}
      </div>
      <div style="font-size:10.5px;color:var(--txt3);font-family:var(--font-m)">❤ ${c.hp} HP · ✨ ${c.mana} Mana · 🎯 ${c.crit}% crit</div>`;
    d.onclick=()=>startGame(k);
    d.onmouseover=()=>d.style.borderColor=c.col;
    d.onmouseout=()=>d.style.borderColor='var(--bord)';
    cc.appendChild(d);
  });
}

function startGame(cls){
  const c=CLS[cls];
  const titles={rogue:'Shadowblade',mage:'Archmage',paladin:'Lightbringer',archer:'Wanderer'};
  G={cls,charName:c.n+' the '+titles[cls],
    level:1,xp:0,xpNext:100,gold:80,str:c.str,dex:c.dex,int:c.int,con:c.con,wis:c.wis,cha:c.cha,
    maxHp:c.hp,hp:c.hp,maxMana:c.mana,mana:c.mana,crit:c.crit,baseDmg:[...c.dmg],baseAC:c.ac,atkBonus:c.atk,
    equip:{head:null,chest:null,hands:null,feet:null,weapon:null,offhand:null,ring:null,neck:null},
    bag:[],vault:[],inCombat:false,enemy:null,step:0,clears:0,bosses:0,totalGold:80,killed:0,
    activeDungeon:0,shopItems:[],legendaryFound:false,abilityUses:0,achievements:[],shopRefreshes:0,crits:0,shopBuys:0,
    prestige:0,prestigeBonus:{str:0,dex:0,int:0,con:0,wis:0,cha:0,hp:0,mana:0,crit:0},
    potions:{hp_s:2},potionsUsed:0,enchants:0,dungeonRuns:[0,0,0,0,0,0],autoEquip:false,autoRetry:true,autoSell:false,autoPotion:false};
  abCDs=[0,0,0];shieldHits=0;shadowReady=false;heroStatus={};enemyStatus={};
  showScreen('s-game');renderAll();showTab('t-battle','tb-b');refreshShop(false);updateHeroVisuals();
  setTimeout(()=>setArenaBg(null),0);
  push('⚔ '+G.charName+' enters Ardenmoor!','info');saveGame();
  // Show tutorial for first time players
  showTutorial(0);
}

function confirmNewGame(){
  if(!confirm('Start a new game? All progress will be lost.'))return;
  clearTimeout(cTimer);G=null;paused=false;abCDs=[0,0,0];shieldHits=0;shadowReady=false;heroStatus={};enemyStatus={};
  localStorage.removeItem(SK);closeSettings();initTitle();showScreen('s-title');
}

// ═══════════════════════════════════════
// PRESTIGE SYSTEM
// ═══════════════════════════════════════
function doPrestige(){
  if(!G||G.level<50){push('Requires level 50!');return;}
  if(!confirm('Prestige? You will reset to level 1 but keep your Vault and gain permanent bonuses.'))return;
  clearTimeout(cTimer);G.inCombat=false;G.enemy=null;paused=false;
  G.prestige=(G.prestige||0)+1;
  // Permanent bonus per prestige
  G.prestigeBonus=G.prestigeBonus||{str:0,dex:0,int:0,con:0,wis:0,cha:0,hp:0,mana:0,crit:0};
  G.prestigeBonus.str+=2;G.prestigeBonus.dex+=2;G.prestigeBonus.int+=2;
  G.prestigeBonus.con+=2;G.prestigeBonus.wis+=2;G.prestigeBonus.cha+=2;
  G.prestigeBonus.hp+=30;G.prestigeBonus.mana+=20;G.prestigeBonus.crit+=1;
  // Reset but keep vault & gold (30%)
  const savedVault=[...G.vault];const savedGold=Math.floor(G.gold*.3);
  const c=CLS[G.cls];const pb=G.prestigeBonus;
  G.level=1;G.xp=0;G.xpNext=100;G.gold=savedGold+200;
  G.str=c.str+pb.str;G.dex=c.dex+pb.dex;G.int=c.int+pb.int;
  G.con=c.con+pb.con;G.wis=c.wis+pb.wis;G.cha=c.cha+pb.cha;
  G.maxHp=c.hp+pb.hp;G.hp=G.maxHp;G.maxMana=c.mana+pb.mana;G.mana=G.maxMana;
  G.crit=c.crit+pb.crit;G.baseDmg=[...c.dmg];G.baseAC=c.ac;G.atkBonus=c.atk;
  G.equip={head:null,chest:null,hands:null,feet:null,weapon:null,offhand:null,ring:null,neck:null};
  G.bag=[];G.vault=savedVault;G.step=0;G.inCombat=false;G.enemy=null;
  abCDs=[0,0,0];shieldHits=0;shadowReady=false;heroStatus={};enemyStatus={};
  document.getElementById('btn-enter').style.display='block';
  document.getElementById('btn-pause').style.display='none';
  document.getElementById('enemy-card').style.display='none';
  document.getElementById('enc-banner').style.display='none';
  SFX.prestige();
  push('⭐ PRESTIGE '+G.prestige+'! Reborn stronger!','lvl');
  showLvlUpOverlay('⭐');
  renderAll();updateHeroVisuals();showTab('t-battle','tb-b');queueSave();
}

// ═══════════════════════════════════════
// ENCHANTING
// ═══════════════════════════════════════
function renderEnchantList(){
  const div=document.getElementById('enchant-list');if(!div||!G)return;
  const slots=Object.keys(G.equip);
  const equipped=slots.filter(s=>G.equip[s]);
  if(!equipped.length){div.innerHTML='<div style="font-size:11px;color:var(--txt3);font-style:italic">Equip items first to enchant them.</div>';return;}
  div.innerHTML='';
  equipped.forEach(slot=>{
    const item=G.equip[slot];
    const enchLevel=item.enchantLevel||0;
    const cost=Math.floor(item.value*(1+enchLevel*0.8)*1.5+100);
    const canAfford=G.gold>=cost;
    const row=document.createElement('div');row.className='enchant-row';row.style.marginBottom='5px';
    row.innerHTML=`<div style="flex:1">
      <div style="font-size:11px;color:${RARITY_C[item.rarity]};font-family:var(--font-d)">${item.name} <span style="font-size:9px;color:var(--purple3)">+${enchLevel}</span></div>
      <div style="font-size:9px;color:var(--txt3);font-family:var(--font-m)">Boosts all stats by +${Math.round(8+enchLevel*4)}%</div>
    </div>
    <button class="btn btn-primary" style="font-size:10px;padding:3px 9px" onclick="enchantItem('${slot}')" ${!canAfford?'disabled':''}>⚗ ${cost}gp</button>`;
    div.appendChild(row);
  });
}

function enchantItem(slot){
  const item=G.equip[slot];if(!item)return;
  const enchLevel=item.enchantLevel||0;
  const cost=Math.floor(item.value*(1+enchLevel*0.8)*1.5+100);
  if(G.gold<cost){push('Not enough gold!');return;}
  G.gold-=cost;
  item.enchantLevel=(item.enchantLevel||0)+1;
  const mult=1.08+enchLevel*.04;
  item.stats.dmg=Math.floor(item.stats.dmg*mult);
  item.stats.ac=Math.floor(item.stats.ac*mult);
  item.stats.crit=Math.floor(item.stats.crit*mult);
  item.stats.hp=Math.floor(item.stats.hp*mult);
  item.value=Math.floor(item.value*1.5);
  G.enchants=(G.enchants||0)+1;
  SFX.legendary();push('⚗ Enchanted! '+item.name+' +'+item.enchantLevel,'lvl');
  renderAll();renderSheet();queueSave();
}

// ═══════════════════════════════════════
// RENDER ALL
// ═══════════════════════════════════════
function renderAll(){
  if(!G)return;
  document.getElementById('top-name').textContent=G.charName;
  document.getElementById('top-sub').textContent=CLS[G.cls].n.toUpperCase()+' · LV'+G.level;
  document.getElementById('top-lvl').textContent=G.level;
  document.getElementById('top-gold').textContent=G.gold.toLocaleString();
  const d=DUNGEONS[G.activeDungeon];
  document.getElementById('top-dng').textContent=d.em+' '+d.n;
  const tr=document.getElementById('top-run');
  if(tr){const runs=(G.dungeonRuns||[])[G.activeDungeon]||0;if(runs>0){tr.style.display='inline';tr.textContent='R'+runs+' '+'★'.repeat(Math.min(runs,5));}else tr.style.display='none';}
  const tp=document.getElementById('top-prestige');
  if(G.prestige>0){tp.style.display='inline';tp.innerHTML=`<span class="prestige-badge">⭐×${G.prestige}</span>`;}
  else tp.style.display='none';
  const pp=document.getElementById('prestige-panel');
  if(pp)pp.style.display=G.level>=50?'block':'none';
  renderHeroBars();renderDungeonList();renderPips();renderAbPanel();renderPotionBar();checkAch();
}

function renderHeroBars(){
  if(!G)return;
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  const bar=(id,pct)=>{const e=document.getElementById(id);if(e)e.style.width=pct+'%';};
  set('b-hero-name',G.charName+' (Lv'+G.level+')');
  set('b-hp-txt',Math.floor(G.hp)+'/'+G.maxHp);
  set('b-mana-txt',Math.floor(G.mana)+'/'+G.maxMana);
  set('b-xp-txt',G.xp+'/'+G.xpNext);
  bar('b-hp-bar',pct(G.hp,G.maxHp));bar('b-mana-bar',pct(G.mana,G.maxMana));bar('b-xp-bar',pct(G.xp,G.xpNext));
  set('arena-hero-hp',Math.floor(G.hp)+'/'+G.maxHp);
  bar('arena-hero-bar',pct(G.hp,G.maxHp));
  set('arena-hero-name',G.charName);
}

function updateHeroVisuals(){
  if(!G)return;
  const s=heroSVG(G.cls,90,150);
  const big=document.getElementById('hero-svg-big');if(big)big.outerHTML=s.replace('<svg ','<svg id="hero-svg-big" ');
  const mini=document.getElementById('b-hero-svg');if(mini)mini.innerHTML=heroSVG(G.cls,46,54);
  const top=document.getElementById('hero-top-svg');if(top)top.innerHTML=heroSVG(G.cls,26,26);
  const port=document.getElementById('sheet-portrait');if(port)port.innerHTML=heroSVG(G.cls,70,78);
}

function setEnemyVisual(en){
  const s=enemySVG(en.n,60,80);
  const big=document.getElementById('enemy-svg-big');if(big)big.outerHTML=s.replace('<svg ','<svg id="enemy-svg-big" ');
  const mini=document.getElementById('b-en-svg');if(mini)mini.innerHTML=enemySVG(en.n,38,38);
  document.getElementById('enemy-card').style.display='block';
  document.getElementById('b-en-name').textContent=en.n+(en.isBoss?' 👑':'')+(en.isElite?' ⚡':'');
  document.getElementById('b-en-type-txt').textContent=en.isBoss?'★ Boss Encounter':en.isElite?'⚡ Elite Enemy':'';
  document.getElementById('b-en-type-txt').style.color=en.isBoss?'var(--red3)':'var(--amber3)';
  document.getElementById('arena-en-name').textContent=en.n+(en.isBoss?' 👑':'');
  updateEnemyBars();
}

function renderDungeonList(){
  const div=document.getElementById('dng-list');if(!div)return;div.innerHTML='';
  DUNGEONS.forEach((d,i)=>{
    const locked=G.level<d.minLvl,sel=G.activeDungeon===i;
    const runs=(G.dungeonRuns||[])[i]||0;
    const dc=document.createElement('div');dc.className='dng-card'+(locked?' locked':'')+(sel?' sel':'');
    dc.innerHTML=`<div style="display:flex;align-items:center;gap:12px">
      <div style="font-size:28px;flex-shrink:0">${d.em}</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:13px;font-family:var(--font-d);color:${sel?'var(--red3)':d.col}">${d.n}${sel?'<span style="font-size:8.5px;letter-spacing:.5px;margin-left:5px">● ACTIVE</span>':''}</div>
        <div style="font-size:11px;color:var(--txt3);font-style:italic;margin:2px 0">${d.desc}</div>
        <div style="font-size:9.5px;color:var(--txt3);font-family:var(--font-m)">Min LVL ${d.minLvl} · XP ×${d.xm} · Gold ×${d.gm} · Boss: ${d.boss.n}</div>
        ${(()=>{const er=[0.15,0.20,0.27,0.35,0.44,0.55][i]||0.15;const br=[0.30,0.38,0.48,0.58,0.70,0.85][i]||0.30;const rr=[0.08,0.10,0.13,0.16,0.20,0.25][i]||0.08;const bossP=runs>0?Math.round(Math.pow(1+br,runs)*100):100;const p2pct=Math.round(Math.min(0.50+runs*0.07,0.82)*100);const dsTag=runs>=3?' <b style="color:var(--red3)">⚡DS</b>':'';return runs>0?`<div style="font-size:9px;color:var(--amber3);font-family:var(--font-m);margin-top:3px">⚔ Run ${runs+1} &nbsp;·&nbsp; Enemies <b>${Math.round((1+runs*er)*100)}%</b> &nbsp;·&nbsp; Boss <b>${bossP}%</b> · P2@${p2pct}%${dsTag} &nbsp;·&nbsp; Rewards <b style="color:var(--green3)">${Math.round((1+runs*rr)*100)}%</b></div><div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-m);margin-top:1px">Boss scales exponentially ×${Math.round((1+br)*10)/10} per run · ⚡Double Strike unlocks run 3</div>`:`<div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-m);margin-top:2px">Each clear: +${Math.round(er*100)}% enemy · ×${Math.round((1+br)*10)/10} boss (compound) · +${Math.round(rr*100)}% reward</div>`;})()}
      </div>
      ${!locked?`<button class="btn" style="font-size:10.5px;padding:4px 9px;flex-shrink:0" onclick="setDungeon(${i})">${sel?'✓ Active':'Select'}</button>`:`<span style="font-size:11px;color:var(--txt3);flex-shrink:0">🔒 LVL ${d.minLvl}</span>`}
    </div>`;
    div.appendChild(dc);
  });
}

function renderPips(){
  const c=document.getElementById('pips');if(!c)return;c.innerHTML='';
  for(let i=0;i<=5;i++){
    const p=document.createElement('div');const isBoss=i===5;
    p.className='pip'+(isBoss?' boss-pip':'');
    const done=i<G.step,act=i===G.step,bossDone=isBoss&&G.step>5;
    if(bossDone)p.classList.add('boss-done');else if(done)p.classList.add('done');else if(act)p.classList.add('act');
    p.textContent=isBoss?'👑':i+1;
    c.appendChild(p);
    if(i<5){const l=document.createElement('div');l.style.cssText='flex:1;height:1px;background:'+(done?'var(--green2)':'var(--bord)');c.appendChild(l);}
  }
}

function renderAbPanel(){
  const p=document.getElementById('ab-panel');if(!p||!G)return;
  const abs=CLS[G.cls].abs;
  p.innerHTML=abs.map((ab,i)=>{
    const onCD=abCDs[i]>0,canUse=!onCD&&G.mana>=ab.mana&&G.inCombat&&G.enemy;
    const pct=onCD?Math.max(0,(1-abCDs[i]/ab.cd)*100):100;
    return `<div class="ab-btn${onCD?' cooldown':canUse?' ready':''}" onclick="useAbility(${i})" style="display:flex;align-items:center;gap:7px;margin-bottom:4px">
      <span style="font-size:18px;flex-shrink:0;width:22px;text-align:center;display:inline-block">${ab.icon}</span>
      <div style="flex:1">
        <div style="font-size:10px;font-weight:700;font-family:var(--font-d);color:${onCD?'var(--txt3)':canUse?'var(--txt)':'var(--txt2)'}">${ab.name}</div>
        <div style="font-size:8.5px;color:var(--txt3);margin-bottom:2px">${ab.tip}</div>
        <div class="bar" style="height:3px"><div class="bar-fill bar-ab-fill" style="width:${pct}%;transition:width .5s"></div></div>
      </div>
      <div style="font-size:9.5px;color:var(--txt3);font-family:var(--font-m);flex-shrink:0;text-align:right">
        ${onCD?'⏳'+abCDs[i]:'✨'+ab.mana+'mp'}<br><span style="font-size:8.5px">${canUse?'READY':onCD?'CD':'—'}</span>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════
// DUNGEON LOGIC
// ═══════════════════════════════════════
function setDungeon(i){G.activeDungeon=i;G.step=0;renderDungeonList();renderPips();push('Dungeon: '+DUNGEONS[i].n);setArenaBg(i);}

function setArenaBg(idx){
  const el=document.getElementById('arena-scene');
  if(!el)return;
  const file=idx!=null?`/bg-${idx+1}.png`:`/dungeon-bg.png`;
  const filters=[
    'contrast(1.1) saturate(1.3) brightness(1.4)',  // 1 Goblin Warrens
    'contrast(1.1) saturate(1.3) brightness(1.4)',  // 2 Crypt of Whispers
    'contrast(1.1) saturate(1.3) brightness(1.4)',  // 3 Fungal Depths
    'contrast(1.1) saturate(1.3) brightness(1.4)',  // 4 Infernal Citadel
    'contrast(1.1) saturate(1.3) brightness(1.4)',  // 5 Sunken Necropolis
    'contrast(1.1) saturate(1.3) brightness(1.4)',  // 6 Void Sanctum
  ];
  let bg=document.getElementById('arena-bg-layer');
  if(!bg){
    bg=document.createElement('div');
    bg.id='arena-bg-layer';
    bg.style.cssText='position:absolute;inset:0;z-index:0;';
    el.insertBefore(bg,el.firstChild);
  }
  bg.style.backgroundImage=`url('${file}')`;
  bg.style.backgroundSize='100% 100%';
  bg.style.backgroundPosition='center center';
  bg.style.backgroundRepeat='no-repeat';
  bg.style.filter=idx!=null?filters[idx]:'contrast(1.1) saturate(1.3) brightness(1.4)';
  el.style.backgroundImage='none';
}

function enterDungeon(){
  if(G.inCombat)return;
  document.getElementById('btn-enter').style.display='none';
  document.getElementById('btn-pause').style.display='block';
  document.getElementById('enc-banner').style.display='none';
  setArenaBg(G.activeDungeon);
  G.inCombat=true;G.step=0;heroStatus={};enemyStatus={};spawnNext();cTimer=setTimeout(combatTick,tickDelay());
}

function togglePause(){
  paused=!paused;
  document.getElementById('btn-pause').textContent=paused?'▶ Resume':'⏸ Pause';
  if(!paused)cTimer=setTimeout(combatTick,tickDelay());
}

function tickDelay(){
  let base=Math.max(300,Math.floor((1400-G.level*12)/gameSpeed));
  if(heroStatus.haste)base=Math.floor(base/3);
  return base;
}

function spawnNext(){
  const d=DUNGEONS[G.activeDungeon];
  const isBoss=G.step>=5,isTreasure=!isBoss&&Math.random()<.09,isElite=!isBoss&&!isTreasure&&Math.random()<.12;
  if(isTreasure){
    const gold=Math.floor((28+G.level*7)*d.gm*(1+G.cha*.01));
    G.enemy={n:'Treasure Chest',hp:1,maxHp:1,dmg:[0,0],xp:0,g:gold,isBoss:false,isTreasure:true,isElite:false};
    showBanner('💰 Treasure Room!','A glittering chest sits unguarded. Easy loot!');
  } else if(isBoss){
    const runs=(G.dungeonRuns||[])[G.activeDungeon]||0;
    // EXPONENTIAL boss scaling — compound growth per run: D0=30% D1=38% D2=48% D3=58% D4=70% D5=85% per run
    const bossRunRate=[0.08,0.10,0.13,0.16,0.20,0.25][G.activeDungeon]||0.08;
    const rewardRate=[0.08,0.10,0.13,0.16,0.20,0.25][G.activeDungeon]||0.08;
    const cappedRuns=Math.min(runs,20);
    const runBonus=cappedRuns>0?Math.pow(1+bossRunRate,cappedRuns):1;
    const rewardBonus=1+runs*rewardRate;
    const hp=d.boss.hp*(1+G.level*.05)*runBonus;
    const bDmg=d.boss.dmg.map(v=>Math.floor(v*runBonus));
    // Phase 2 triggers earlier each run: run0=50%, run1=57%, run2=64%... cap 82%
    const phase2Threshold=Math.min(0.50+runs*0.07,0.82);
    // Run 3+: boss unlocks double strike during phase 2
    const canDoubleStrike=runs>=3;
    const stars=runs>0?' '+'★'.repeat(Math.min(runs,5)):'';
    const runDesc=runs>0?'Run '+(runs+1)+' — '+Math.round(runBonus*100)+'% power · Phase 2 at '+Math.round(phase2Threshold*100)+'%HP'+(canDoubleStrike?' · ⚡DOUBLE STRIKE':''):'Defeat it to clear the dungeon!';
    G.enemy={n:d.boss.n+stars,hp,maxHp:hp,dmg:bDmg,xp:Math.floor(d.boss.xp*rewardBonus),g:Math.floor(d.boss.g*(1+G.cha*.015)*rewardBonus),isBoss:true,isTreasure:false,isElite:false,phase2:false,phase2Threshold,canDoubleStrike,loot:d.boss.loot};
    showBanner('⚠️ BOSS — '+d.boss.n+'!',runDesc);
    SFX.bossAppear();
  } else {
    const runs=(G.dungeonRuns||[])[G.activeDungeon]||0;
    // Enemy scaling stacks per dungeon tier: D0=+15% D1=+20% D2=+27% D3=+35% D4=+44% D5=+55% per run
    const enemyRunRate=[0.05,0.07,0.09,0.11,0.14,0.18][G.activeDungeon]||0.05;
    const rewardRate=[0.08,0.10,0.13,0.16,0.20,0.25][G.activeDungeon]||0.08;
    const runBonus=1+runs*enemyRunRate;
    const rewardBonus=1+runs*rewardRate;
    const edef=d.en[Math.floor(Math.random()*d.en.length)];
    const scale=(1+G.level*.14)*runBonus;const hpMul=isElite?2.2:1;const dmgMul=isElite?1.8:1;
    const hp=edef.hp*scale*hpMul,dmg=[Math.floor(edef.dmg[0]*dmgMul*runBonus),Math.floor(edef.dmg[1]*dmgMul*runBonus)];
    G.enemy={n:(isElite?'Elite ':'')+edef.n,hp,maxHp:hp,dmg,xp:Math.floor(edef.xp*(isElite?2:1)*rewardBonus),g:Math.floor(edef.g*(isElite?2:1)*d.gm*(1+G.cha*.01)*rewardBonus),isBoss:false,isTreasure:false,isElite};
    if(isElite)showBanner('⚡ Elite Encounter!',G.enemy.n+' — tougher & more rewarding!');
    else document.getElementById('enc-banner').style.display='none';
  }
  clearStatuses();
  setEnemyVisual(G.enemy);
  setAction(G.enemy.isTreasure?'Opening the chest…':G.enemy.isBoss?'⚠️ BOSS BATTLE!':G.enemy.isElite?'⚡ ELITE!':'Encounter!');
  logMsg((G.enemy.isBoss?'⚠️ BOSS: ':G.enemy.isTreasure?'💰 TREASURE: ':G.enemy.isElite?'⚡ ELITE: ':'')+G.enemy.n+' appears!',G.enemy.isBoss?'boss':G.enemy.isElite?'crit':'');
  renderPips();
}

function showBanner(t,d){
  document.getElementById('enc-banner').style.display='block';
  document.getElementById('enc-title').textContent=t;
  document.getElementById('enc-desc').textContent=d;
}

// ═══════════════════════════════════════
// COMBAT TICK
// ═══════════════════════════════════════
function combatTick(){
  if(!G.inCombat||paused||!G.enemy)return;

  // Ability DOTs fire BEFORE tickStatuses so the last round still procs
  if(enemyStatus.fireball&&G.enemy){const fd=Math.floor((G.enemy.maxHp||G.enemy.hp)*.04);G.enemy.hp-=fd;logMsg('🔥 Fireball burns: '+fd+' dmg','info');updateEnemyBars();if(G.enemy.hp<=0){enemyDied();return;}}
  if(enemyStatus.hemorrhage&&G.enemy){const hd=Math.floor((G.enemy.maxHp||G.enemy.hp)*.04);G.enemy.hp-=hd;logMsg('🩸 Hemorrhage: '+hd+' dmg','info');updateEnemyBars();if(G.enemy.hp<=0){enemyDied();return;}}
  if(enemyStatus.poison_arrow&&G.enemy){const pad=Math.floor((G.enemy.maxHp||G.enemy.hp)*.03);G.enemy.hp-=pad;logMsg('☠️ Poison Arrow: '+pad+' dmg','info');updateEnemyBars();if(G.enemy.hp<=0){enemyDied();return;}}
  if(heroStatus.aura){const ah=Math.floor(G.maxHp*.05);G.hp=Math.min(G.maxHp,G.hp+ah);logMsg('💛 Holy Aura: +'+ah+' HP','good');flashFx('hero-svg-big','heal-flash');}

  tickStatuses();

  // Treasure
  if(G.enemy.isTreasure){
    const drops=1+Math.floor(Math.random()*2);
    for(let i=0;i<drops;i++)lootItem(genItem(G.activeDungeon,G.level,'rare'));
    G.gold+=G.enemy.g;G.totalGold+=G.enemy.g;
    logMsg('💰 Looted! +'+G.enemy.g+'gp, '+drops+' items!','good');
    popGold(G.enemy.g);SFX.loot();
    G.enemy=null;document.getElementById('enemy-card').style.display='none';document.getElementById('enc-banner').style.display='none';
    renderAll();queueSave();
    setTimeout(()=>{G.step++;spawnNext();if(!paused)cTimer=setTimeout(combatTick,tickDelay());},1100/gameSpeed);
    return;
  }

  abCDs=abCDs.map(v=>v>0?v-1:0);renderAbPanel();
  if(potCD>0)potCD=Math.max(0,potCD-1);

  // Boss phase 2 — triggers earlier each run
  const p2thresh=G.enemy.phase2Threshold||0.50;
  if(G.enemy.isBoss&&!G.enemy.phase2&&G.enemy.hp<=G.enemy.maxHp*p2thresh){
    G.enemy.phase2=true;
    G.enemy.dmg=G.enemy.dmg.map(v=>Math.floor(v*1.4));
    const p2label=p2thresh>0.55?'⚠️ Phase 2 at '+Math.round(p2thresh*100)+'% HP — EARLY ENRAGE!':'⚠️ Boss Phase 2! Damage increased!';
    logMsg('💥 '+G.enemy.n+' enrages — Phase 2! ('+Math.round(p2thresh*100)+'% threshold)','boss');
    push(p2label,'boss');SFX.bossAppear();
    addStatus('enemy','enrage',99,{icon:'💢',label:'Enrage',cls:'sfx-burn'});
  }

  // Compute damage
  const gear=calcGear();
  const str2=G.str+Math.floor(G.level*.5);
  const intB=G.cls==='mage'?Math.floor(G.int*.5):0;
  const dexB=(G.cls==='rogue'||G.cls==='archer')?Math.floor(G.dex*.3):0;
  const dMin=G.baseDmg[0]+gear.dmg+Math.floor((str2+intB+dexB)/4);
  const dMax=G.baseDmg[1]+gear.dmg+Math.floor((str2+intB+dexB)/3)+1;
  let dmg=Math.floor(dMin+Math.random()*(dMax-dMin));
  // Apply dungeon enemy armor — higher dungeons resist gear from previous tiers
  const eArmor=DUNGEONS[G.activeDungeon].eArmor||0;
  dmg=Math.max(1,dmg-eArmor);
  const critBonus=(heroStatus.crit_up?15:0)+(heroStatus.eagle_eye?30:0);
  const critPct=(G.crit+gear.crit+critBonus)*(shadowReady?3:1);
  const isCrit=Math.random()*100<critPct;
  if(isCrit){dmg=Math.floor(dmg*2.2);flashFx('hero-svg-big','crit-flash');G.crits=(G.crits||0)+1;SFX.crit();}
  else SFX.hit();
  if(shadowReady)shadowReady=false;

  // Bleeding DOT from rogue
  if(G.cls==='rogue'&&Math.random()<.25&&!enemyStatus.bleed){
    addStatus('enemy','bleed',3,{icon:'🩸',label:'Bleed',cls:'sfx-poison'});
  }

  G.enemy.hp-=dmg;
  // Apply bleed damage
  if(enemyStatus.bleed){const bd=Math.floor(dmg*.15+G.level*.5);G.enemy.hp-=bd;logMsg('🩸 Bleed: '+bd+' dmg','info');}
  popDmg(dmg,isCrit,true);flashFx('enemy-svg-big','hit-flash');
  logMsg('⚔ Hit '+(G.enemy.n.replace(/★+/g,'').trim())+' for '+dmg+(isCrit?' 💥CRIT!':'')+'!',isCrit?'crit':'');
  updateEnemyBars();
  if(G.enemy.hp<=0){enemyDied();return;}
  // ── Specialty item proc effects (enemy survived the hit) ──
  for(const _si of Object.values(G.equip)){if(!_si||!_si.specialty||!G.enemy)continue;const _sp=_si.specialty.type;
    if(_sp==='burn'&&Math.random()<.30&&!enemyStatus.burn){addStatus('enemy','burn',3,{icon:'🔥',label:'Burn',cls:'sfx-burn'});logMsg('🔥 '+_si.specialty.label+'!','info');}
    if(_sp==='venom'&&!enemyStatus.poison){addStatus('enemy','poison',5,{icon:'☠️',label:'Venom',cls:'sfx-poison'});logMsg('☠️ Venom spreads!','info');}
    if(_sp==='stun'&&Math.random()<.15&&!enemyStatus.stun){addStatus('enemy','stun',1,{icon:'😵',label:'Stun',cls:'sfx-stun'});logMsg('⚡ Thunder stuns!','info');}
    if(_sp==='lifesteal'){const _lh=Math.floor(dmg*.25);G.hp=Math.min(G.maxHp,G.hp+_lh);if(_lh>0)logMsg('💀 Lifesteal: +'+_lh+'HP','good');}
    if(_sp==='storm'&&G.enemy){const _sd=Math.floor(dmg*.15);G.enemy.hp-=_sd;logMsg('🌩️ Chain lightning: '+_sd,'info');updateEnemyBars();if(G.enemy.hp<=0){enemyDied();return;}}
    if(_sp==='void'&&G.enemy){const _vd=Math.floor(dmg*.30);G.enemy.hp-=_vd;logMsg('🌀 Void rift: '+_vd,'info');updateEnemyBars();if(G.enemy.hp<=0){enemyDied();return;}}
    if(_sp==='bleed'&&isCrit&&!enemyStatus.bleed){addStatus('enemy','bleed',10,{icon:'🩸',label:'Bleed',cls:'sfx-poison'});logMsg('🩸 Bloodthirst: massive bleed!','crit');}
  }

  // Enemy attacks
  if(shieldHits>0){shieldHits--;logMsg('🛡 Divine Shield absorbs the blow!','good');}
  else if(Object.values(G.equip).some(_s=>_s&&_s.specialty&&_s.specialty.type==='chill')&&Math.random()<.20){
    logMsg('❄️ Frost Chill — enemy attack frozen!','good');
  } else{
    const rawDmg=G.enemy.dmg[0]+Math.floor(Math.random()*(G.enemy.dmg[1]-G.enemy.dmg[0]+1));
    const ac=G.baseAC+gear.ac+Math.floor(G.level*.3);
    const ghostBonus=Object.values(G.equip).some(_s=>_s&&_s.specialty&&_s.specialty.type==='ghost')?25:0;
    const danceBonus=heroStatus.dance?50:0;
    const dodge=(G.cls==='rogue'||G.cls==='archer')?18+Math.floor(G.dex/3)+ghostBonus+danceBonus:5+ghostBonus+danceBonus;
    if(Math.random()*100<dodge){logMsg('💨 Dodged!','good');}
    else{
      let ad=Math.max(1,rawDmg-Math.floor((ac-10)/2));
      // Frost Nova shield — 40% damage reduction
      if(heroStatus.frost_shield){ad=Math.max(1,Math.floor(ad*.6));logMsg('🧊 Frost Shield: damage reduced!','good');}
      // Stun
      if(heroStatus.stun){logMsg('😵 Stunned! Took double damage!','warn');ad*=2;}
      // Enemy poison/burn
      if(heroStatus.poison){const pd=Math.floor(G.maxHp*.04);G.hp-=pd;logMsg('☠ Poison: '+pd+' dmg','warn');}
      G.hp-=ad;popDmg(ad,false,false);flashFx('hero-svg-big','hit-flash');logMsg('🩸 '+G.enemy.n+' hits for '+ad+'!');SFX.enemyHit();
      // Some enemies apply status
      if(G.enemy.isBoss&&Math.random()<.18&&!heroStatus.stun){
        addStatus('hero','stun',1,{icon:'😵',label:'Stun',cls:'sfx-stun'});logMsg('😵 Stunned!','warn');
      }
      // Double strike: run 3+ bosses can hit twice per turn during phase 2 (40% chance)
      if(G.enemy.isBoss&&G.enemy.canDoubleStrike&&G.enemy.phase2&&Math.random()<0.40){
        const ds=Math.max(1,Math.floor(rawDmg*0.65)-Math.floor((ac-10)/2));
        G.hp-=ds;popDmg(ds,false,false);flashFx('hero-svg-big','hit-flash');
        logMsg('⚡ '+G.enemy.n+' DOUBLE STRIKES for '+ds+'!','warn');SFX.enemyHit();
      }
    }
  }

  G.mana=Math.min(G.maxMana,G.mana+5);

  // Paladin passive (nerfed: triggers at 30% HP instead of 45%, heals less)
  if(G.cls==='paladin'&&G.mana>=35&&G.hp<G.maxHp*.30){
    const h=Math.floor(10+G.level*1.6);G.hp=Math.min(G.maxHp,G.hp+h);G.mana-=35;
    logMsg('✨ Holy Mend +'+h+' HP','good');flashFx('hero-svg-big','heal-flash');
    addStatus('hero','regen',1,{icon:'✨',label:'Regen',cls:'sfx-regen'});
  }

  // Mage mana burn
  if(G.cls==='mage'&&G.mana>=10){
    const bDmg=Math.floor(G.int*.3+G.level*.2);G.enemy.hp-=bDmg;G.mana-=3;
    if(bDmg>0)logMsg('🔵 Arcane burn: '+bDmg+' dmg','info');
    updateEnemyBars();if(G.enemy.hp<=0){enemyDied();return;}
  }

  // Archer poison
  if(G.cls==='archer'&&Math.random()<.2){
    const pDmg=Math.floor(G.dex*.2+G.level*.3);G.enemy.hp-=pDmg;
    logMsg('☠ Poison: '+pDmg+' dmg','info');updateEnemyBars();if(G.enemy.hp<=0){enemyDied();return;}
  }

  // Auto-potion: use best available potion when HP drops below 35%
  if(G.autoPotion&&potCD<=0&&G.hp/G.maxHp<0.35){
    if((G.potions?.hp_l||0)>0)usePotion('hp_l');
    else if((G.potions?.hp_s||0)>0)usePotion('hp_s');
  }
  renderHeroBars();
  if(G.hp<=0){heroDied();return;}
  if(!paused)cTimer=setTimeout(combatTick,tickDelay());
}

function enemyDied(){
  const d=DUNGEONS[G.activeDungeon];
  const xpG=Math.floor(G.enemy.xp*d.xm*0.9);
  G.xp+=xpG;G.gold+=G.enemy.g;G.totalGold+=G.enemy.g;G.killed++;
  const isBoss=G.enemy.isBoss;
  if(isBoss){
    G.bosses++;G.clears++;
    G.dungeonRuns=G.dungeonRuns||[0,0,0,0,0,0];
    G.dungeonRuns[G.activeDungeon]=(G.dungeonRuns[G.activeDungeon]||0)+1;
    const newRun=G.dungeonRuns[G.activeDungeon];
    const _br=[0.30,0.38,0.48,0.58,0.70,0.85][G.activeDungeon]||0.30;
    const _rr=[0.08,0.10,0.13,0.16,0.20,0.25][G.activeDungeon]||0.08;
    const _nextPower=Math.round(Math.pow(1+_br,newRun)*100);
    const _nextP2=Math.round(Math.min(0.50+newRun*0.07,0.82)*100);
    const _nextDS=newRun>=3?' · ⚡ DOUBLE STRIKE':'';
    logMsg('🏆 DUNGEON CLEARED! Run '+newRun+' complete! Next boss: '+_nextPower+'% power · Phase 2 at '+_nextP2+'%HP'+_nextDS+' · '+Math.round((1+newRun*_rr)*100)+'% rewards','boss');
    push('👑 Run '+newRun+' done! Next boss: '+_nextPower+'% power'+(newRun>=3?' · ⚡ Double Strike':''),'boss');
    showBossClearScreen(G.enemy);
  }
  logMsg('✅ '+G.enemy.n+' slain! +'+xpG+'xp +'+G.enemy.g+'gp','good');
  popGold(G.enemy.g);
  // Specialty: Divine Ward heals 5% maxHP on every kill
  if(Object.values(G.equip).some(_s=>_s&&_s.specialty&&_s.specialty.type==='holy')){const _hh=Math.floor(G.maxHp*.05);G.hp=Math.min(G.maxHp,G.hp+_hh);if(_hh>0)logMsg('✨ Divine Ward: +'+_hh+'HP on kill','good');}
  const dropRate=isBoss?.85:G.enemy.isElite?.28:.08+G.level*.001;
  if(Math.random()<dropRate){const item=genItem(G.activeDungeon,G.level,isBoss?'epic':undefined);lootItem(item);if(item.rarity==='mythic'){G.legendaryFound=true;SFX.legendary();push('🟡 MYTHIC LOOT: '+item.name,'loot');}}
  // Boss unique loot
  if(isBoss){const uItem=genBossItem(G.activeDungeon,G.level);lootItem(uItem);SFX.legendary();push('👑 Unique Boss Drop: '+uItem.name,'loot');}
  while(G.xp>=G.xpNext)levelUp();
  G.step++;if(isBoss)G.step=0;
  G.enemy=null;document.getElementById('enemy-card').style.display='none';document.getElementById('arena-en-name').textContent='—';
  G.hp=Math.min(G.maxHp,G.hp+Math.floor(G.maxHp*.03));
  G.mana=Math.min(G.maxMana,G.mana+Math.floor(G.maxMana*.06));
  clearStatuses();renderAll();queueSave();
  const delay=isBoss?3500:Math.floor(950/gameSpeed);
  setTimeout(()=>{spawnNext();if(!paused)cTimer=setTimeout(combatTick,tickDelay());},delay);
}

function showBossClearScreen(en){
  // Don't block flow, just show notif for now — the full modal would interfere with next spawn
  // Show a fancy overlay briefly
  const el=document.createElement('div');el.style.cssText='position:fixed;inset:0;z-index:9985;display:flex;align-items:center;justify-content:center;background:rgba(5,6,8,.7);backdrop-filter:blur(4px);animation:lvlIn 3s ease forwards';
  el.innerHTML=`<div style="background:linear-gradient(135deg,rgba(62,34,4,.85),rgba(20,10,5,.9));border:1px solid var(--amber2);border-radius:14px;padding:28px 36px;text-align:center;box-shadow:var(--shadow-gold),0 0 60px rgba(196,144,30,.25);max-width:340px;width:90%">
    <div style="font-size:40px;margin-bottom:8px">👑</div>
    <div style="font-family:var(--font-d);font-size:10px;color:var(--txt3);letter-spacing:3px;text-transform:uppercase;margin-bottom:6px">Boss Slain</div>
    <div style="font-family:var(--font-d);font-size:20px;color:var(--gold2);margin-bottom:8px">${en.n}</div>
    <div style="font-size:11px;color:var(--txt2);font-style:italic;margin-bottom:14px">Dungeon ${DUNGEONS[G.activeDungeon].n} cleared!<br>A unique boss drop has been added to your bag.</div>
    <div style="font-size:10px;color:var(--txt3);font-family:var(--font-m)">+${en.xp} XP · +${en.g} GP · Unique Item</div>
  </div>`;
  document.body.appendChild(el);setTimeout(()=>el.remove(),3200);
}

function heroDied(){
  G.hp=G.maxHp;G.mana=G.maxMana;G.inCombat=false;G.enemy=null;G.step=0;
  document.getElementById('btn-enter').style.display='block';
  document.getElementById('btn-pause').style.display='none';
  document.getElementById('enemy-card').style.display='none';
  document.getElementById('enc-banner').style.display='none';
  clearTimeout(cTimer);clearTimeout(retryTimer);clearStatuses();
  logMsg('💔 Defeated! Returned to dungeon entrance — HP & Mana restored.','warn');
  renderHeroBars();renderPips();push('Defeated — back to floor 1!');SFX.death();
  if(G.autoRetry){
    let cd=3;
    setAction('💔 Fallen… retrying in '+cd+'s');
    retryTimer=setInterval(()=>{
      cd--;
      if(cd<=0){clearInterval(retryTimer);retryTimer=null;if(!G.inCombat)enterDungeon();}
      else setAction('💔 Fallen… retrying in '+cd+'s');
    },1000);
  } else {
    setAction('Fallen in battle…');
  }
  queueSave();
}

function toggleAutoPotion(){
  if(!G)return;
  G.autoPotion=!G.autoPotion;
  const btn=document.getElementById('auto-potion-btn');
  if(btn){btn.textContent='💊 Auto-Potion: '+(G.autoPotion?'ON':'OFF');btn.style.borderColor=G.autoPotion?'var(--green2)':'var(--bord2)';btn.style.color=G.autoPotion?'var(--green3)':'';}
  push('Auto-Potion '+(G.autoPotion?'ON — uses best potion at <35% HP':'OFF'),'info');queueSave();
}
function toggleAutoRetry(){
  if(!G)return;
  G.autoRetry=!G.autoRetry;
  const btn=document.getElementById('btn-auto-retry');
  if(btn)btn.textContent='🔄 Auto-Retry: '+(G.autoRetry?'ON':'OFF');
  if(!G.autoRetry&&retryTimer){clearInterval(retryTimer);retryTimer=null;setAction('Fallen in battle…');}
}

function levelUp(){
  G.xp-=G.xpNext;G.level++;G.xpNext=Math.floor(100*Math.pow(1.30,G.level-1));
  const _hpCap={rogue:12,mage:10,paladin:18,archer:13}[G.cls]||12;
  const hg=Math.min(_hpCap,Math.floor(7+G.con*.45+Math.random()*4+1));
  const mg=Math.floor(5+G.wis*.4+Math.random()*4);
  G.maxHp+=hg;G.maxMana+=mg;G.hp=Math.min(G.maxHp,G.hp+hg);G.mana=Math.min(G.maxMana,G.mana+mg);
  G.str+=G.cls==='paladin'?2:1;G.dex+=(G.cls==='rogue'||G.cls==='archer')?2:G.cls==='mage'?0:1;
  G.int+=G.cls==='mage'?2:1;G.con+=G.cls==='paladin'?2:G.cls==='mage'?0:1;G.wis++;
  if(G.level%5===0){G.crit+=1;logMsg('🎖 Milestone Lv'+G.level+': +1% crit!','info');}
  if(G.level%10===0){G.cha+=2;logMsg('🎖 Milestone Lv'+G.level+': +2 Charisma!','info');}
  logMsg('🌟 LEVEL UP → '+G.level+' | +'+hg+' HP +'+mg+' Mana','info');
  push('Level Up! → '+G.level,'lvl');showLvlUpOverlay(G.level);SFX.levelUp();renderAll();updateHeroVisuals();
}

function showLvlUpOverlay(lvl){
  const el=document.createElement('div');el.className='lvlup-overlay';
  el.innerHTML=`<div class="lvlup-inner"><div style="font-size:12px;color:var(--purple3);font-family:var(--font-d);letter-spacing:2px;margin-bottom:8px">LEVEL UP</div>
    <div style="font-size:46px;font-family:var(--font-d);color:var(--gold2);text-shadow:0 0 30px rgba(228,180,64,.6)">${lvl}</div>
    <div style="font-size:12px;color:var(--txt2);font-style:italic;margin-top:6px">The legend grows stronger</div></div>`;
  document.body.appendChild(el);setTimeout(()=>el.remove(),1400);
}

// ═══════════════════════════════════════
// CLASS ABILITY
// ═══════════════════════════════════════
function useAbility(idx=0){
  if(!G||!G.inCombat||!G.enemy)return;
  const ab=CLS[G.cls].abs[idx];
  if(abCDs[idx]>0){push('Ability on cooldown! ('+abCDs[idx]+' turns)');return;}
  if(G.mana<ab.mana){push('Not enough mana! Need '+ab.mana);return;}
  G.mana-=ab.mana;G.abilityUses++;abCDs=abCDs.map(()=>ab.cd);SFX.ability();
  const gear=calcGear();
  const str2=G.str+Math.floor(G.level*.5);
  const intB=G.cls==='mage'?Math.floor(G.int*.5):0;
  const dexB=(G.cls==='rogue'||G.cls==='archer')?Math.floor(G.dex*.3):0;
  const dMin=G.baseDmg[0]+gear.dmg+Math.floor((str2+intB+dexB)/4);
  const dMax=G.baseDmg[1]+gear.dmg+Math.floor((str2+intB+dexB)/3)+1;

  if(ab.eff==='shadow'){
    shadowReady=true;
    logMsg('🌑 Shadowstrike — next hit guaranteed CRIT ×3!','info');
    push('🌑 Shadowstrike: mega-crit ready!');
  } else if(ab.eff==='dance'){
    addStatus('hero','dance',5,{icon:'💨',label:'Dance',cls:'sfx-regen'});
    logMsg('💨 Shadow Dance — +50% dodge for 5 turns!','good');
    push('💨 Shadow Dance: +50% dodge!');
  } else if(ab.eff==='hemorrhage'){
    addStatus('enemy','hemorrhage',4,{icon:'🩸',label:'Hemorrhage',cls:'sfx-poison'});
    logMsg('🩸 Hemorrhage! Enemy bleeds 4% HP/turn for 4 turns!','crit');
    push('🩸 Hemorrhage applied!');
  } else if(ab.eff==='surge'){
    const dmg=Math.floor((dMin+Math.random()*(dMax-dMin))*(3.2+Math.random()*.8));
    G.enemy.hp-=dmg;popDmg(dmg,true,true);flashFx('enemy-svg-big','crit-flash');G.crits++;
    logMsg('⚡ Arcane Surge! '+dmg+' arcane damage!','crit');push('⚡ Arcane Surge: '+dmg+' damage!');
    updateEnemyBars();if(G.enemy.hp<=0){enemyDied();return;}
  } else if(ab.eff==='fireball'){
    addStatus('enemy','fireball',5,{icon:'🔥',label:'Burn',cls:'sfx-burn'});
    logMsg('🔥 Fireball! Burns enemy 4% HP/turn for 5 turns!','crit');
    push('🔥 Fireball: enemy burning!');
  } else if(ab.eff==='frost'){
    addStatus('enemy','stun',2,{icon:'❄️',label:'Frozen',cls:'sfx-stun'});
    addStatus('hero','frost_shield',2,{icon:'🧊',label:'FrostShield',cls:'sfx-shield'});
    logMsg('❄️ Frost Nova! Enemy frozen 2 turns + 40% dmg reduction!','good');
    push('❄️ Frost Nova: enemy frozen!');
  } else if(ab.eff==='shield'){
    const h=Math.floor(G.maxHp*.28);G.hp=Math.min(G.maxHp,G.hp+h);shieldHits=2;
    logMsg('✨ Divine Shield! +'+h+' HP + 2-hit immunity!','good');
    push('✨ Divine Shield: +'+h+' HP!');flashFx('hero-svg-big','heal-flash');renderHeroBars();
    addStatus('hero','shield',2,{icon:'🛡',label:'Shield',cls:'sfx-shield'});
  } else if(ab.eff==='smite'){
    const sDmg=Math.floor((dMin+Math.random()*(dMax-dMin))*2.5);
    G.enemy.hp-=sDmg;popDmg(sDmg,true,true);flashFx('enemy-svg-big','crit-flash');G.crits++;
    addStatus('enemy','stun',2,{icon:'😵',label:'Stunned',cls:'sfx-stun'});
    logMsg('⚔️ Divine Smite! '+sDmg+' holy damage + 2-turn stun!','crit');
    push('⚔️ Divine Smite: '+sDmg+' damage!');
    updateEnemyBars();if(G.enemy.hp<=0){enemyDied();return;}
  } else if(ab.eff==='aura'){
    addStatus('hero','aura',6,{icon:'💛',label:'HolyAura',cls:'sfx-regen'});
    logMsg('💛 Holy Aura! Regen 5% HP/turn for 6 turns!','good');
    push('💛 Holy Aura: healing over time!');
  } else if(ab.eff==='barrage'){
    let total=0;
    for(let i=0;i<10;i++){
      const adm=Math.floor(dMin*.7+Math.random()*(dMax*.7-dMin*.7));
      G.enemy.hp-=adm;total+=adm;
      setTimeout(()=>popDmg(adm,false,true),i*80);
    }
    logMsg('🏹 Barrage! 10 arrows for '+total+' total!','crit');push('🏹 Barrage: '+total+' damage!');
    updateEnemyBars();if(G.enemy.hp<=0){clearTimeout(cTimer);setTimeout(()=>enemyDied(),300);return;}
  } else if(ab.eff==='poison_arrow'){
    addStatus('enemy','poison_arrow',8,{icon:'☠️',label:'Poison',cls:'sfx-poison'});
    logMsg('☠️ Poison Arrow! Poisons enemy 3% HP/turn for 8 turns!','crit');
    push('☠️ Poison Arrow: enemy poisoned!');
  } else if(ab.eff==='eagle_eye'){
    addStatus('hero','eagle_eye',5,{icon:'🦅',label:'EagleEye',cls:'sfx-shield'});
    logMsg('🦅 Eagle Eye! +30% crit for 5 turns!','good');
    push('🦅 Eagle Eye: precision mode!');
  }
  renderHeroBars();renderAbPanel();
}

// ═══════════════════════════════════════
// ITEMS & GENERATION
// ═══════════════════════════════════════
function toggleAutoEquip(){
  G.autoEquip=!G.autoEquip;
  const btn=document.getElementById('auto-equip-btn');
  if(btn){btn.textContent='🔄 Auto-Equip: '+(G.autoEquip?'ON':'OFF');btn.style.borderColor=G.autoEquip?'var(--green2)':'var(--bord2)';btn.style.color=G.autoEquip?'var(--green3)':'';}
  push('Auto-Equip '+(G.autoEquip?'enabled — better items will be equipped automatically.':'disabled.'),'info');
  queueSave();
}
function itemScore(it){return(it.stats.dmg||0)*2+(it.stats.ac||0)*1.5+(it.stats.crit||0)*3+(it.stats.hp||0)*0.2;}
function toggleAutoSell(){
  G.autoSell=!G.autoSell;
  const btn=document.getElementById('auto-sell-btn');
  if(btn){btn.textContent='🗑 Auto-Sell: '+(G.autoSell?'ON':'OFF');btn.style.borderColor=G.autoSell?'var(--red2)':'var(--bord2)';btn.style.color=G.autoSell?'var(--red3)':'';}
  push('Auto-Sell '+(G.autoSell?'ON — Common/Rare/Epic sold on pickup (boss drops & specialties exempt)':'OFF'),'info');queueSave();
}
function lootItem(item){
  // Auto-sell: skip shop-bought items, boss drops, and specialty items
  const _sellRars=['common','rare','epic'];
  if(G.autoSell&&_sellRars.includes(item.rarity)&&!item.isBossDrop&&!item.specialty&&!item.fromShop){
    G.gold+=item.value;G.totalGold+=item.value;
    logMsg('💰 Auto-sold '+rarSym(item.rarity)+' '+item.name+' +'+item.value+'gp','good');
    renderAll();queueSave();return;
  }
  if(G.autoEquip&&item.slot){
    const cur=G.equip[item.slot];
    // Respect weapon class restrictions for auto-equip
    const weaponTypes=['Sword','Dagger','Staff','Bow'];
    if(item.slot==='weapon'&&weaponTypes.includes(item.type)){
      const allowed=CLS[G.cls].allowedWeapons||[];
      if(!allowed.includes(item.type)){if(G.bag.length<100)G.bag.push(item);else if(G.vault.length<80)G.vault.push(item);return;}
    }
    if(!cur||itemScore(item)>itemScore(cur)){
      const old=G.equip[item.slot];
      G.equip[item.slot]=item;
      if(old){if(G.bag.length<100)G.bag.push(old);else if(G.vault.length<80)G.vault.push(old);}
      logMsg('🔄 Auto-Equipped: '+item.name+' ('+item.slot+')','good');
      push('🔄 Auto-Equipped: '+item.name,'loot');
      renderAll();return;
    }
  }
  if(G.bag.length<100){G.bag.push(item);logMsg(rarSym(item.rarity)+' Loot: '+item.name);}
  else if(G.vault.length<80){G.vault.push(item);logMsg(rarSym(item.rarity)+' → Vault: '+item.name);}
  else logMsg('⚠ Bags full! '+item.name+' lost!');
}
function rarSym(r){return{common:'◻',rare:'🟢',epic:'🔵',legendary:'🟣',mythic:'🟡'}[r]||'◻';}

// ── Specialty items: keyword-named items with unique combat effects ──
const SPECIALTY_POOL=[
  {n:'Flamebrand Sword',type:'Sword',specialty:{type:'burn',icon:'🔥',label:'Soulfire',desc:'30% chance to burn enemy each turn (5%HP/turn for 3 turns)'}},
  {n:'Glacial Dagger',type:'Dagger',specialty:{type:'chill',icon:'❄️',label:'Frost Chill',desc:'20% chance to freeze enemy attack each turn'}},
  {n:'Venomfang Dagger',type:'Dagger',specialty:{type:'venom',icon:'☠️',label:'Venom Coat',desc:'Poisons enemy on every strike (5 turns)'}},
  {n:'Thunderstrike Staff',type:'Staff',specialty:{type:'stun',icon:'⚡',label:'Thunder',desc:'15% chance to stun enemy for 1 turn'}},
  {n:'Soulreaper Sword',type:'Sword',specialty:{type:'lifesteal',icon:'💀',label:'Lifesteal',desc:'Heals 25% of all damage dealt'}},
  {n:'Divineward Shield',type:'Shield',specialty:{type:'holy',icon:'✨',label:'Divine Ward',desc:'Heals 5% max HP after every enemy kill'}},
  {n:'Wraith Cloak',type:'Cloak',specialty:{type:'ghost',icon:'👻',label:'Ghost Step',desc:'+25% dodge chance on top of class dodge'}},
  {n:'Bloodthirst Sword',type:'Sword',specialty:{type:'bleed',icon:'🩸',label:'Bloodthirst',desc:'Critical hits apply massive 10-turn bleed'}},
  {n:'Stormweaver Bow',type:'Bow',specialty:{type:'storm',icon:'🌩️',label:'Stormweaver',desc:'Chain lightning hits for +15% extra damage'}},
  {n:'Voidstone Amulet',type:'Amulet',specialty:{type:'void',icon:'🌀',label:'Void Rift',desc:'Each hit tears a void rift for +30% bonus damage'}},
];
const GEAR_BONUS_TYPES=['dmgrdc','atckspd','dgch','hlthrgn','crdmg','ch'];
const GEAR_BONUS_LABELS={dmgrdc:'%DmgRdc',atckspd:'%AtkSpd',dgch:'%DgCh',hlthrgn:'%HlthRgn',crdmg:'%CrDmg',ch:'%Chaos'};
function rollGearBonus(rar){
  const maxByRar={common:1,rare:2,epic:3,legendary:4,mythic:4};
  const max=maxByRar[rar]||1;
  const type=GEAR_BONUS_TYPES[Math.floor(Math.random()*GEAR_BONUS_TYPES.length)];
  const val=Math.ceil(Math.random()*max);
  return{type,val,label:GEAR_BONUS_LABELS[type]};
}
function genItem(dIdx,lvl,minRar){
  // 4% chance: generate a specialty item (not when minRar is forced)
  if(Math.random()<.04&&!minRar){
    const sp=SPECIALTY_POOL[Math.floor(Math.random()*SPECIALTY_POOL.length)];
    const dungeonMult=1+dIdx*0.42;const rm=RARITY_M.epic;const b=lvl*rm*dungeonMult;
    return{name:sp.n,type:sp.type,rarity:'epic',slot:typeSlot(sp.type),enchantLevel:0,dungeonTier:dIdx,specialty:sp.specialty,
      bonus:rollGearBonus('epic'),
      stats:{dmg:Math.floor(b*.7+Math.random()*b*.4),ac:Math.floor(b*.4+Math.random()*b*.3),crit:Math.floor(Math.random()*4.5*rm),hp:Math.floor(b*1.9+Math.random()*b)},
      value:Math.floor(b*4)};
  }
  const t=ITEM_TYPES[Math.floor(Math.random()*ITEM_TYPES.length)];
  const pre=PREFIXES[Math.floor(Math.random()*PREFIXES.length)];
  const suf=SUFFIXES[Math.floor(Math.random()*SUFFIXES.length)];
  const roll=Math.random();
  let rar;
  if(roll<.48)rar='common';else if(roll<.70)rar='rare';else if(roll<.86)rar='epic';else if(roll<.95)rar='legendary';else rar='mythic';
  if(minRar==='rare'&&rar==='common')rar='rare';
  if(minRar==='epic'&&(rar==='common'||rar==='rare'))rar='epic';
  const rm=RARITY_M[rar];
  // Items from deeper dungeons are inherently stronger
  const dungeonMult=1+dIdx*0.42;
  const b=lvl*rm*dungeonMult;
  const name=suf?pre+' '+t+' '+suf:pre+' '+t;
  return{name,type:t,rarity:rar,slot:typeSlot(t),enchantLevel:0,dungeonTier:dIdx,bonus:rollGearBonus(rar),
    stats:{dmg:Math.floor(b*.7+Math.random()*b*.4),ac:Math.floor(b*.4+Math.random()*b*.3),crit:Math.floor(Math.random()*4.5*rm),hp:Math.floor(b*1.9+Math.random()*b)},
    value:Math.floor(b*2.6)};
}

function genBossItem(dIdx,lvl){
  const d=DUNGEONS[dIdx];
  const clsWeapon={rogue:'Dagger',mage:'Staff',paladin:'Sword',archer:'Bow'};
  const weaponPool=G?[clsWeapon[G.cls]]:['Sword'];
  const armorPool=['Chestplate','Helmet','Ring','Amulet','Boots','Gauntlets'];
  const t=Math.random()<.6?weaponPool[0]:armorPool[Math.floor(Math.random()*armorPool.length)];
  const dungeonMult=1+dIdx*0.42;
  // Boss drops: 55% mythic (unique name), 28% legendary, 17% epic
  const rarRoll=Math.random();
  const dropRar=rarRoll<.55?'mythic':rarRoll<.83?'legendary':'epic';
  const isMyth=dropRar==='mythic';
  const rm=RARITY_M[dropRar];
  const b=lvl*rm*dungeonMult;
  const pre=PREFIXES[Math.floor(Math.random()*PREFIXES.length)];
  const suf=SUFFIXES[Math.floor(Math.random()*SUFFIXES.length)];
  const name=isMyth?d.boss.loot:(pre+' '+t+(suf?' '+suf:''));
  return{name,type:t,rarity:dropRar,slot:typeSlot(t),enchantLevel:0,isBossDrop:true,dungeonTier:dIdx,bonus:rollGearBonus(dropRar),
    stats:{dmg:Math.floor(b*(isMyth?1.2:.85)),ac:Math.floor(b*(isMyth?.8:.55)),crit:Math.floor((isMyth?4:2)+Math.random()*(isMyth?6:4)),hp:Math.floor(b*(isMyth?2.5:1.7))},
    value:Math.floor(b*(isMyth?6:3))};
}

function typeSlot(t){return{Sword:'weapon',Dagger:'weapon',Staff:'weapon',Bow:'weapon',Shield:'offhand',Helmet:'head',Chestplate:'chest',Gauntlets:'hands',Boots:'feet',Ring:'ring',Amulet:'neck',Cloak:'offhand'}[t]||'weapon';}
function calcGear(){let dmg=0,ac=0,crit=0,hp=0;Object.values(G.equip).forEach(i=>{if(i){dmg+=i.stats.dmg;ac+=i.stats.ac;crit+=i.stats.crit;hp+=i.stats.hp;}});return{dmg,ac,crit,hp};}

// ═══════════════════════════════════════
// EQUIPMENT
// ═══════════════════════════════════════
function unequip(slot){
  const i=G.equip[slot];if(!i)return;
  if(G.bag.length<100){G.bag.push(i);G.equip[slot]=null;renderSheet();push('Unequipped: '+i.name);}
  else push('Bag full!');
}

function renderSheet(){
  if(!G)return;updateHeroVisuals();
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  set('sh-name',G.charName);set('sh-class',CLS[G.cls].n+' · '+CLS[G.cls].align);
  set('sh-lvl',G.level);set('sh-align',CLS[G.cls].align);
  ['str','dex','int','con','wis','cha'].forEach(s=>set('s-'+s,G[s]));
  const g=calcGear();const mhp=G.maxHp+g.hp;
  set('s-hp',mhp);set('s-mana',G.maxMana);set('s-ac',G.baseAC+g.ac+Math.floor(G.level*.3));
  set('s-atk','+'+(G.atkBonus+Math.floor(G.level/3)));
  set('s-dmg',(G.baseDmg[0]+g.dmg)+'–'+(G.baseDmg[1]+g.dmg));
  set('s-crit',(G.crit+g.crit)+'%');
  set('sh-xp',G.xp);set('sh-xpn',G.xpNext);
  const xb=document.getElementById('sh-xp-bar');if(xb)xb.style.width=pct(G.xp,G.xpNext)+'%';
  set('sh-clears',G.clears);set('sh-bosses',G.bosses);set('sh-kills',G.killed);set('sh-totgold',G.totalGold.toLocaleString());
  set('sh-crits',G.crits||0);set('sh-prestige',G.prestige||0);
  set('sh-prof',CLS[G.cls].prof);
  // Prestige badges
  const pb=document.getElementById('sh-prestige-badges');
  if(pb)pb.innerHTML=(G.prestige||0)>0?'⭐'.repeat(Math.min(G.prestige,10)):' ';
  // Equipment slots
  const SLOTS={head:'Head',chest:'Chest',hands:'Hands',feet:'Feet',weapon:'Weapon',offhand:'Off-hand',ring:'Ring',neck:'Neck'};
  const es=document.getElementById('equip-slots');es.innerHTML='';
  Object.entries(SLOTS).forEach(([k,lbl])=>{
    const item=G.equip[k];const d=document.createElement('div');d.className='eq-row';
    d.innerHTML=`<div style="width:26px;height:26px;flex-shrink:0">${item?ISVG[item.type]||'':'<div style="color:var(--bord3);font-size:14px;line-height:1">—</div>'}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.3px">${lbl}</div>
        <div style="font-size:11px;font-weight:500;color:${item?RARITY_C[item.rarity]:'var(--txt3)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item?item.name+(item.enchantLevel?' +'+item.enchantLevel:''):'Empty'}</div>
        ${item?`<div style="font-size:9px;color:var(--txt3);font-family:var(--font-m)">+${item.stats.dmg}⚔ +${item.stats.ac}🛡 +${item.stats.crit}%🎯 +${item.stats.hp}❤</div>`:''}</div>
      ${item?`<button class="btn btn-red" style="font-size:9.5px;padding:2px 7px;flex-shrink:0" onclick="unequip('${k}')">✕</button>`:''}`;
    es.appendChild(d);
  });
  const csd=document.getElementById('cs-display');
  csd.innerHTML=`<div class="sbox"><div class="v">${mhp}</div><div class="l">Max HP</div></div>
    <div class="sbox"><div class="v">${G.baseAC+g.ac+Math.floor(G.level*.3)}</div><div class="l">Armor</div></div>
    <div class="sbox"><div class="v">${G.baseDmg[0]+g.dmg}–${G.baseDmg[1]+g.dmg}</div><div class="l">Damage</div></div>
    <div class="sbox"><div class="v">${G.crit+g.crit}%</div><div class="l">Crit</div></div>`;
  renderEnchantList();
  const pp=document.getElementById('prestige-panel');if(pp)pp.style.display=G.level>=50?'block':'none';
}

// ═══════════════════════════════════════
// BAG / VAULT
// ═══════════════════════════════════════
function toggleBagSelectMode(){
  bagSelectMode=!bagSelectMode;
  if(!bagSelectMode)bagSel.clear();
  renderBag();
}
function toggleVaultSelectMode(){
  vaultSelectMode=!vaultSelectMode;
  if(!vaultSelectMode)vaultSel.clear();
  renderVault();
}
function moveBagSelectedToVault(){
  if(!bagSel.size){push('No items selected!');return;}
  const idxs=[...bagSel].sort((a,b)=>b-a);
  let moved=0,skipped=0;
  for(const i of idxs){
    if(!G.bag[i])continue;
    if(G.vault.length>=80){skipped++;continue;}
    G.vault.push(G.bag.splice(i,1)[0]);moved++;
  }
  bagSel.clear();bagSelectMode=false;
  push('Moved '+moved+' items to vault'+(skipped?' ('+skipped+' skipped, vault full)':''),'info');
  renderBag();renderVault();queueSave();
}
function moveVaultSelectedToBag(){
  if(!vaultSel.size){push('No items selected!');return;}
  const idxs=[...vaultSel].sort((a,b)=>b-a);
  let moved=0,skipped=0;
  for(const i of idxs){
    if(!G.vault[i])continue;
    if(G.bag.length>=100){skipped++;continue;}
    G.bag.push(G.vault.splice(i,1)[0]);moved++;
  }
  vaultSel.clear();vaultSelectMode=false;
  push('Moved '+moved+' items to bag'+(skipped?' ('+skipped+' skipped, bag full)':''),'info');
  renderBag();renderVault();queueSave();
}

function renderBag(){
  const gr=document.getElementById('bag-grid');gr.innerHTML='';
  document.getElementById('bag-ct').textContent=G.bag.length;
  const aeBtn=document.getElementById('auto-equip-btn');
  if(aeBtn){aeBtn.textContent='🔄 Auto-Equip: '+(G.autoEquip?'ON':'OFF');aeBtn.style.borderColor=G.autoEquip?'var(--green2)':'var(--bord2)';aeBtn.style.color=G.autoEquip?'var(--green3)':'';}
  const asBtn=document.getElementById('auto-sell-btn');if(asBtn){asBtn.textContent='🗑 Auto-Sell: '+(G.autoSell?'ON':'OFF');asBtn.style.borderColor=G.autoSell?'var(--red2)':'var(--bord2)';asBtn.style.color=G.autoSell?'var(--red3)':'';};
  const smBtn=document.getElementById('bag-selmode-btn');
  if(smBtn){smBtn.textContent=bagSelectMode?'✅ Select ('+bagSel.size+')':'🔲 Select';smBtn.style.borderColor=bagSelectMode?'var(--green2)':'var(--bord2)';smBtn.style.color=bagSelectMode?'var(--green3)':'';}

  for(let i=0;i<100;i++){
    const item=G.bag[i];const s=document.createElement('div');
    s.className='inv-slot'+(item?' filled rc-'+item.rarity:'');
    if(item){
      s.innerHTML=ISVG[item.type]||'';
      if(item.enchantLevel)s.innerHTML+=`<span class="qty-badge">+${item.enchantLevel}</span>`;
      if(item.specialty)s.innerHTML+=`<span class="qty-badge" style="color:var(--amber3);font-size:9px">${item.specialty.icon}</span>`;
      if(bagSelectMode){
        if(bagSel.has(i))s.style.outline='2px solid var(--green2)';
        s.onclick=(()=>{const idx=i;return()=>{if(bagSel.has(idx))bagSel.delete(idx);else bagSel.add(idx);renderBag();};})();
      } else {
        s.onclick=()=>showItemDetail('bag',i);
        s.title=item.name+' ['+item.rarity+']'+(item.specialty?' ✦ '+item.specialty.label:'');
      }
    }
    gr.appendChild(s);
  }
}
function renderVault(){
  const gr=document.getElementById('vault-grid');gr.innerHTML='';
  document.getElementById('vault-ct').textContent=G.vault.length;
  const smBtn=document.getElementById('vault-selmode-btn');
  if(smBtn){smBtn.textContent=vaultSelectMode?'✅ Select ('+vaultSel.size+')':'🔲 Select';smBtn.style.borderColor=vaultSelectMode?'var(--green2)':'var(--bord2)';smBtn.style.color=vaultSelectMode?'var(--green3)':'';}
  for(let i=0;i<80;i++){
    const item=G.vault[i];const s=document.createElement('div');
    s.className='inv-slot'+(item?' filled rc-'+item.rarity:'');
    if(item){
      s.innerHTML=ISVG[item.type]||'';
      if(item.enchantLevel)s.innerHTML+=`<span class="qty-badge">+${item.enchantLevel}</span>`;
      if(item.isBossDrop)s.innerHTML+=`<span class="qty-badge" style="color:var(--gold3)">★</span>`;
      if(vaultSelectMode){
        if(vaultSel.has(i))s.style.outline='2px solid var(--green2)';
        s.onclick=(()=>{const idx=i;return()=>{if(vaultSel.has(idx))vaultSel.delete(idx);else vaultSel.add(idx);renderVault();};})();
      } else {
        s.onclick=()=>showItemDetail('vault',i);
        s.title=item.name+' ['+item.rarity+']';
      }
    }
    gr.appendChild(s);
  }
}

function showItemDetail(src,idx){
  const item=src==='bag'?G.bag[idx]:G.vault[idx];if(!item)return;
  const panelId=src==='bag'?'bag-detail':'vault-detail';
  const equipped=G.equip[item.slot];
  const cmpHtml=equipped?`<div style="margin-top:8px;padding:7px;background:var(--bg3);border-radius:6px;border:1px solid var(--bord)">
    <div style="font-size:9px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.5px;margin-bottom:4px">VS EQUIPPED: ${equipped.name}</div>
    <div style="font-size:10px;font-family:var(--font-m)">
      ${['dmg','ac','crit','hp'].map(stat=>{const diff=item.stats[stat]-(equipped.stats[stat]||0);const col=diff>0?'var(--green3)':diff<0?'var(--red3)':'var(--txt3)';return`<span style="color:${col};margin-right:8px">${stat}:${diff>0?'+':''}${diff}</span>`}).join('')}
    </div></div>`:
    '<div style="font-size:10px;color:var(--txt3);font-style:italic;margin-top:6px">No item currently equipped in this slot.</div>';
  const btns=src==='bag'
    ?[`<button class="btn btn-primary" style="font-size:10.5px;padding:4px 9px" onclick="equipFromBag(${idx})">⚔ Equip</button>`,
      `<button class="btn" style="font-size:10.5px;padding:4px 9px" onclick="bagToVault(${idx})">📦 Vault</button>`,
      `<button class="btn btn-gold" style="font-size:10.5px;padding:4px 9px" onclick="sellBag(${idx})">💰 Sell (${item.value}gp)</button>`]
    :[`<button class="btn btn-primary" style="font-size:10.5px;padding:4px 9px" onclick="vaultToBag(${idx})">🎒 To Bag</button>`,
      `<button class="btn btn-gold" style="font-size:10.5px;padding:4px 9px" onclick="sellVault(${idx})">💰 Sell (${item.value}gp)</button>`];
  document.getElementById(panelId).innerHTML=itemHTML(item,btns,cmpHtml);
}

function itemHTML(item,buttons,extra=''){
  const m=v=>v>0?`<span style="color:var(--green3)">+${v}</span>`:v===0?`<span style="color:var(--txt3)">0</span>`:`<span style="color:var(--red3)">${v}</span>`;
  const bossTag=item.isBossDrop?`<span style="font-size:9px;color:var(--gold3);font-family:var(--font-d);margin-left:5px">★ Boss Drop</span>`:'';
  const spTag=item.specialty?`<div style="margin-top:7px;padding:5px 9px;background:rgba(80,50,0,.35);border:1px solid var(--amber2);border-radius:6px;font-size:10.5px;font-family:var(--font-m)"><span style="color:var(--amber3)">${item.specialty.icon} ${item.specialty.label}</span> <span style="color:var(--txt3)">—</span> <span style="color:var(--txt2)">${item.specialty.desc}</span></div>`:'';
  const bonusTag2=item.bonus?`<span style="font-size:8.5px;color:var(--amber3);font-family:var(--font-m);margin-left:6px">+${item.bonus.val}${item.bonus.label}</span>`:'';
  return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">
    <div style="width:40px;height:40px;flex-shrink:0">${ISVG[item.type]||''}</div>
    <div><div style="font-weight:700;color:${RARITY_C[item.rarity]};font-family:var(--font-d)">${item.name}${item.enchantLevel?' <span style="color:var(--purple3)">+'+item.enchantLevel+'</span>':''}${bossTag}${bonusTag2}</div>
    <div style="font-size:9.5px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.3px">${item.rarity.toUpperCase()} · ${item.slot} · ${item.value}gp</div></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:9px;font-size:11px;font-family:var(--font-m)">
    <div class="card-inner">⚔ DMG ${m(item.stats.dmg)}</div>
    <div class="card-inner">🛡 AC ${m(item.stats.ac)}</div>
    <div class="card-inner">🎯 CRIT ${m(item.stats.crit)}%</div>
    <div class="card-inner">❤ HP ${m(item.stats.hp)}</div>
  </div>${spTag}${extra}
  <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:9px">${buttons.join('')}</div>`;
}

function equipFromBag(idx){
  const item=G.bag[idx];if(!item)return;
  // Weapon restriction check
  const weaponTypes=['Sword','Dagger','Staff','Bow'];
  if(item.slot==='weapon'&&weaponTypes.includes(item.type)){
    const allowed=CLS[G.cls].allowedWeapons||[];
    if(!allowed.includes(item.type)){push('⚔ '+CLS[G.cls].n+'s cannot wield a '+item.type+'! (Allowed: '+allowed.join(', ')+')');return;}
  }
  const old=G.equip[item.slot];
  G.equip[item.slot]=item;G.bag.splice(idx,1);if(old)G.bag.push(old);
  push('Equipped: '+item.name);renderBag();renderSheet();document.getElementById('bag-detail').innerHTML='<div style="font-size:11px;color:var(--txt3);font-style:italic">Equipped.</div>';
}
function bagToVault(idx){if(G.vault.length>=80){push('Vault full!');return;}G.vault.push(G.bag.splice(idx,1)[0]);bagSel.delete(idx);renderBag();document.getElementById('bag-detail').innerHTML='<div style="font-size:11px;color:var(--txt3);font-style:italic">Moved to vault.</div>';}
function sellBag(idx){const i=G.bag[idx];if(!i)return;G.gold+=i.value;G.totalGold+=i.value;G.bag.splice(idx,1);bagSel.delete(idx);push('Sold for '+i.value+'gp');renderBag();renderAll();document.getElementById('bag-detail').innerHTML='<div style="font-size:11px;color:var(--txt3);font-style:italic">Sold.</div>';queueSave();}
function bagToVaultAll(){let n=0;while(G.bag.length&&G.vault.length<80){G.vault.push(G.bag.shift());n++;}bagSel.clear();push('Moved '+n+' items to vault');renderBag();}
function vaultToBag(idx){if(G.bag.length>=100){push('Bag full!');return;}G.bag.push(G.vault.splice(idx,1)[0]);renderVault();document.getElementById('vault-detail').innerHTML='<div style="font-size:11px;color:var(--txt3);font-style:italic">Moved to bag.</div>';}
function sellVault(idx){const i=G.vault[idx];if(!i)return;G.gold+=i.value;G.totalGold+=i.value;G.vault.splice(idx,1);push('Sold for '+i.value+'gp');renderVault();renderAll();document.getElementById('vault-detail').innerHTML='<div style="font-size:11px;color:var(--txt3);font-style:italic">Sold.</div>';queueSave();}
function sortVault(){const o={legendary:0,epic:1,rare:2,uncommon:3,common:4};G.vault.sort((a,b)=>o[a.rarity]-o[b.rarity]);renderVault();}

function bulkSell(src,filter){
  const rarO=['common','uncommon','rare','epic','legendary'];
  const maxI=filter==='all'?5:filter==='uncommon-'?2:1;
  const check=item=>filter==='all'?true:rarO.indexOf(item.rarity)<maxI;
  let sold=0,total=0;
  const arrs=src==='bag'?[G.bag]:src==='vault'?[G.vault]:[G.bag,G.vault];
  arrs.forEach(arr=>{for(let i=arr.length-1;i>=0;i--){if(check(arr[i])){total+=arr[i].value;sold++;arr.splice(i,1);}}});
  G.gold+=total;G.totalGold+=total;
  push('Sold '+sold+' items for '+total+'gp');
  renderBag();renderVault();renderAll();queueSave();
  document.getElementById('bag-detail').innerHTML='<div style="font-size:11px;color:var(--txt3);font-style:italic">Sold.</div>';
  document.getElementById('vault-detail').innerHTML='<div style="font-size:11px;color:var(--txt3);font-style:italic">Sold.</div>';
}

// ═══════════════════════════════════════
// SHOP
// ═══════════════════════════════════════
function refreshShop(paid=true){
  if(paid){
    const cost=shopCost();if(G.gold<cost){push('Need '+cost+'gp to refresh!');return;}
    G.gold-=cost;G.shopRefreshes=(G.shopRefreshes||0)+1;renderAll();
  }
  G.shopItems=[];const cnt=Math.min(12,7+Math.floor(G.level/4));
  for(let i=0;i<cnt;i++){const item=genItem(G.activeDungeon,G.level+Math.floor(Math.random()*4));item.price=Math.floor(item.value*2.2+55);G.shopItems.push(item);}
  renderShop();queueSave();
}
function shopCost(){return Math.min(600,50+((G.shopRefreshes||0)*30));}
function renderShop(){
  document.getElementById('shop-gold').textContent=G.gold.toLocaleString();
  document.getElementById('shop-cost').textContent=shopCost();
  renderShopPotions();
  const gr=document.getElementById('shop-grid');gr.innerHTML='';
  G.shopItems.forEach((item,i)=>{
    const ok=G.gold>=item.price;const d=document.createElement('div');d.className='shop-card rc-'+item.rarity;
    const equipped=item.slot?G.equip[item.slot]:null;
    const bonusTag=item.bonus?`<span style="font-size:8.5px;color:var(--amber3);font-family:var(--font-m)">+${item.bonus.val}${item.bonus.label}</span>`:'';
    let compHTML='';
    if(equipped){
      const dDmg=item.stats.dmg-equipped.stats.dmg,dAc=item.stats.ac-equipped.stats.ac,dCrit=item.stats.crit-equipped.stats.crit,dHp=item.stats.hp-equipped.stats.hp;
      const c=v=>v>0?`<span style="color:var(--green3)">+${v}</span>`:`<span style="color:var(--red3)">${v}</span>`;
      compHTML=`<div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-m);border-top:1px dashed var(--bord);margin-top:4px;padding-top:3px">vs equipped: ${c(dDmg)}⚔ ${c(dAc)}🛡 ${c(dCrit)}%🎯 ${c(dHp)}❤</div>`;
    }
    d.innerHTML=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div style="width:34px;height:34px;flex-shrink:0">${ISVG[item.type]||''}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:11.5px;font-weight:700;color:${RARITY_C[item.rarity]};font-family:var(--font-d);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
        <div style="font-size:8.5px;color:var(--txt3);font-family:var(--font-d);letter-spacing:.3px">${item.rarity.toUpperCase()} · ${item.slot} ${bonusTag}</div>
      </div></div>
      <div style="font-size:9.5px;color:var(--txt2);margin-bottom:4px;font-family:var(--font-m)">+${item.stats.dmg}⚔ +${item.stats.ac}🛡 +${item.stats.crit}%🎯 +${item.stats.hp}❤</div>
      ${compHTML}
      <button class="btn ${ok?'btn-gold':'btn-red'}" style="width:100%;font-size:10.5px;padding:5px;margin-top:5px" onclick="buyItem(${i})" ${!ok?'disabled':''}>
        💰 ${item.price.toLocaleString()}gp${!ok?' (-'+(item.price-G.gold)+')':''}</button>`;
    gr.appendChild(d);
  });
}
function buyItem(idx){
  const item=G.shopItems[idx];
  if(G.gold<item.price){push('Not enough gold!');return;}
  if(G.bag.length>=100&&G.vault.length>=80){push('No space in bag or vault!');return;}
  G.gold-=item.price;G.shopItems.splice(idx,1);G.shopBuys=(G.shopBuys||0)+1;
  item.fromShop=true;
  lootItem(item);push('Purchased: '+item.name);SFX.buy();renderShop();renderAll();queueSave();
}

// ═══════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════
function checkAch(){
  if(!G)return;G.achievements=G.achievements||[];
  ACHIEVEMENTS.forEach(a=>{
    if(!G.achievements.includes(a.id)&&a.chk(G)){
      G.achievements.push(a.id);push('🏆 Feat Unlocked: '+a.n+'!','ach');SFX.loot();
    }
  });
}
function renderAch(){
  const list=document.getElementById('ach-list');if(!list||!G)return;list.innerHTML='';
  G.achievements=G.achievements||[];
  document.getElementById('ach-count').textContent=G.achievements.length;
  document.getElementById('ach-total').textContent=ACHIEVEMENTS.length;
  ACHIEVEMENTS.forEach(a=>{
    const unlocked=G.achievements.includes(a.id);
    const d=document.createElement('div');d.className='ach-row'+(unlocked?' done':'');
    d.innerHTML=`<div style="font-size:22px;opacity:${unlocked?1:.25}">${a.icon}</div>
      <div style="flex:1"><div style="font-size:11.5px;font-weight:700;font-family:var(--font-d);color:${unlocked?'var(--gold2)':'var(--txt3)'}">${a.n}</div>
      <div style="font-size:10.5px;color:var(--txt3);font-style:italic">${a.desc}</div></div>
      <span style="font-size:${unlocked?14:11}px;color:${unlocked?'var(--gold2)':'var(--txt3)'}">${unlocked?'✓':'—'}</span>`;
    list.appendChild(d);
  });
}

// ═══════════════════════════════════════
// COMBAT HELPERS
// ═══════════════════════════════════════
function updateEnemyBars(){
  if(!G.enemy)return;
  const hp=Math.max(0,Math.floor(G.enemy.hp));
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  set('b-en-hp-txt',hp+'/'+Math.floor(G.enemy.maxHp));
  set('arena-en-hp',hp+'/'+Math.floor(G.enemy.maxHp));
  const p=pct(G.enemy.hp,G.enemy.maxHp);
  ['b-en-bar','arena-en-bar'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.width=p+'%';});
}
function pct(v,max){return Math.max(0,Math.min(100,v/max*100)).toFixed(1);}

function popDmg(dmg,isCrit,isHero){
  const c=document.getElementById('dmg-layer');if(!c)return;
  const d=document.createElement('div');d.className='dmg-popup';
  d.style.color=isCrit?'#ffd468':isHero?'#ee5555':'#ffaaaa';
  d.style.fontSize=isCrit?'21px':'14px';
  d.style.left=(isHero?Math.random()*70+340:Math.random()*70+60)+'px';
  d.style.top=(Math.random()*28+46)+'px';
  d.style.textShadow=isCrit?'0 0 14px #e4b440':'0 0 6px rgba(0,0,0,.9)';
  d.textContent=(isCrit?'💥':'')+'-'+dmg;
  c.appendChild(d);setTimeout(()=>d.remove(),1200);
}
function popGold(g){
  const c=document.getElementById('dmg-layer');if(!c)return;
  const d=document.createElement('div');d.className='dmg-popup';
  d.style.color='#e4b440';d.style.fontSize='12px';d.style.fontFamily='var(--font-m)';
  d.style.left=(Math.random()*90+230)+'px';d.style.top='84px';
  d.textContent='+'+g+'gp';c.appendChild(d);setTimeout(()=>d.remove(),1200);
}
function flashFx(id,cls){const el=document.getElementById(id);if(el){el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),380);}}
function setAction(txt){const e=document.getElementById('arena-action');if(e)e.textContent=txt;}
function logMsg(msg,type=''){
  const log=document.getElementById('combat-log');if(!log)return;
  const p=document.createElement('div');p.className='log-e'+(type?' '+type:'');p.textContent=msg;
  log.appendChild(p);log.scrollTop=log.scrollHeight;
  if(log.children.length>120)log.removeChild(log.firstChild);
}

// ═══════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════
function push(msg,type=''){
  const stack=document.getElementById('notif-stack');if(!stack)return;
  const d=document.createElement('div');
  d.className='notif-item'+(type?' '+type:'');d.textContent=msg;
  stack.appendChild(d);
  setTimeout(()=>{d.style.transition='opacity .3s';d.style.opacity='0';setTimeout(()=>d.remove(),350);},3200);
  while(stack.children.length>4)stack.removeChild(stack.firstChild);
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el=document.getElementById(id);if(el)el.classList.add('active');
}
function showTab(id,btnId){
  document.querySelectorAll('.tab-c').forEach(t=>t.classList.remove('on'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  const el=document.getElementById(id);if(el)el.classList.add('on');
  const btn=document.getElementById(btnId);if(btn)btn.classList.add('active');
  if(id==='t-sheet')renderSheet();
  else if(id==='t-bag')renderBag();
  else if(id==='t-storage')renderVault();
  else if(id==='t-shop')renderShop();
  else if(id==='t-achieve')renderAch();
}

// ═══════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════
document.addEventListener('keydown',e=>{
  if(!G||e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  const k=e.key.toLowerCase();
  if(k==='1')showTab('t-battle','tb-b');
  else if(k==='2')showTab('t-dungeon','tb-d');
  else if(k==='3')showTab('t-sheet','tb-s');
  else if(k==='4')showTab('t-bag','tb-bg');
  else if(k==='5')showTab('t-storage','tb-st');
  else if(k==='6')showTab('t-shop','tb-sh');
  else if(k==='7')showTab('t-achieve','tb-a');
  else if(k===' '&&G.inCombat){e.preventDefault();togglePause();}
  else if(k==='q')useAbility(0);else if(k==='w')useAbility(1);else if(k==='e')useAbility(2);
  else if(k==='s'&&!G.inCombat&&document.getElementById('t-battle').classList.contains('on'))enterDungeon();
});




