
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
    rogue:'data:image/png;base64,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',
    mage:'data:image/png;base64,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',
    paladin:'data:image/png;base64,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',
    archer:'data:image/png;base64,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'
  };
  const src=HERO_IMGS[cls]||HERO_IMGS.rogue;
  return `<img src="${src}" width="${w}" height="${h}" style="object-fit:contain;image-rendering:auto;filter:drop-shadow(0 2px 8px rgba(0,0,0,.8))" />`;
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
  const s=heroSVG(G.cls,60,80);
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


