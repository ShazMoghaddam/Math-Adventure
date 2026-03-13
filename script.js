/* ════════════════════════════════════════════════════
   MATH ADVENTURE v8 — script.js
   Visual: SVG Benny, SVG world hills, splash screen,
           screen-slide transitions, staggered sign
           bounce-in, score digit roll, parallax depth,
           LC cinematic (Benny runs to house), dark-HUD
           tinting per world.
   Math:   Adaptive difficulty, subitising dice (W1),
           number line (W2-3), missing-number blanks,
           word problems in emoji, estimation (W4+),
           multiplication array viz (W5), division with
           remainders (W6 Q4-5), fact families (W3-4),
           speed round boss Q5, progressive hint system,
           review mode after level.
════════════════════════════════════════════════════ */

/* ── PWA ─────────────────────────────────────────── */
if ('serviceWorker' in navigator)
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));

/* ── Viewport ────────────────────────────────────── */
const setVh = () => document.documentElement.style.setProperty('--real-vh', `${window.innerHeight*.01}px`);
setVh();
window.addEventListener('resize', setVh, {passive:true});
window.addEventListener('orientationchange', ()=>setTimeout(setVh,120), {passive:true});

/* ── Reduced motion ──────────────────────────────── */
const mq = window.matchMedia('(prefers-reduced-motion:reduce)');
let prefersReducedMotion = mq.matches;
mq.addEventListener('change', e => { prefersReducedMotion = e.matches; });

/* ══════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════ */
const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = arr   => arr[Math.floor(Math.random()*arr.length)];
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }

/* ══════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════ */
const CONFIG = {
  questionsPerLevel: 5,
  livesStart: 3,
  livesFromWorld: 3,
  timerByWorld: [20, 16, 14, 12, 10, 10],
  hintAfterWrongs: 2,
};

/* ══════════════════════════════════════════════════
   WORD PROBLEM TEMPLATES
══════════════════════════════════════════════════ */
const WP = {
  add:[
    (a,b)=>({q:`Benny has ${a} 🥕. He finds ${b} more. How many?`, hint:'Add them up!'}),
    (a,b)=>({q:`${a} 🐝 in a hive. ${b} more fly in. How many bees?`, hint:'Count together!'}),
    (a,b)=>({q:`${a} 🌸 on one bush, ${b} on another. Total flowers?`, hint:'Add together!'}),
    (a,b)=>({q:`${a} 🐟 swim left, ${b} swim right. How many fish?`, hint:'Add them!'}),
    (a,b)=>({q:`${a} 🍓 in a bowl, ${b} more added. How many berries?`, hint:'Count all!'}),
    (a,b)=>({q:`${a} 🌟 in the sky, ${b} more appear. Total stars?`, hint:'Add together!'}),
  ],
  sub:[
    (a,b)=>({q:`Benny had ${a} 🥕. He ate ${b}. How many left?`, hint:'Take away!'}),
    (a,b)=>({q:`${a} 🐦 on a branch. ${b} fly away. How many stay?`, hint:'Subtract!'}),
    (a,b)=>({q:`${a} 🍎 in a basket. ${b} get eaten. How many remain?`, hint:'Take away!'}),
    (a,b)=>({q:`${a} ⭐ in the sky. ${b} hide behind clouds. How many visible?`, hint:'Subtract!'}),
    (a,b)=>({q:`${a} 🐛 on a leaf. ${b} crawl away. How many stay?`, hint:'Take away!'}),
  ],
  mul:[
    (a,b)=>({q:`${a} baskets, each with ${b} 🥕. Total carrots?`, hint:'Multiply!'}),
    (a,b)=>({q:`${a} 🐰 each get ${b} 🌸. How many flowers?`, hint:'Times tables!'}),
    (a,b)=>({q:`${a} rows of ${b} ⭐ stars. How many total?`, hint:'Rows × each!'}),
    (a,b)=>({q:`${a} bags with ${b} 🍬 each. Total sweets?`, hint:'Multiply!'}),
  ],
  div:[
    (a,b)=>({q:`${a*b} 🥕 shared between ${b} friends. Each gets?`, hint:'Share equally!'}),
    (a,b)=>({q:`${a*b} 🐟 in ${b} equal ponds. Fish per pond?`, hint:'Divide!'}),
    (a,b)=>({q:`${a*b} 🍪 in ${b} equal jars. Cookies per jar?`, hint:'Share equally!'}),
  ],
};

function wordProblem(op, a, b){
  const templates = WP[op]||WP.add;
  const {q,hint} = pick(templates)(a,b);
  let answer;
  if(op==='add')answer=a+b;
  else if(op==='sub')answer=a-b;
  else if(op==='mul')answer=a*b;
  else answer=a; // div: a is quotient
  return {text:`__word__${q}`, answer, hint, type:'word'};
}

function missingNumber(op, maxN){
  if(op==='add'){
    const answer=rand(1,maxN), b=rand(1,Math.max(1,maxN-answer));
    const total=answer+b;
    return Math.random()<.5
      ? {text:`? + ${b} = ${total}`, answer, hint:'Find the missing!', type:'missing'}
      : {text:`${b} + ? = ${total}`, answer, hint:'Find the missing!', type:'missing'};
  }else if(op==='sub'){
    const a=rand(4,maxN), answer=rand(1,a-1), result=a-answer;
    return Math.random()<.5
      ? {text:`${a} − ? = ${result}`, answer, hint:'Find the missing!', type:'missing'}
      : {text:`? − ${answer} = ${result}`, answer:a, hint:'Find the missing!', type:'missing'};
  }else{
    const a=rand(2,10),b=rand(2,10);
    return Math.random()<.5
      ? {text:`? × ${b} = ${a*b}`, answer:a, hint:'Missing factor!', type:'missing'}
      : {text:`${a} × ? = ${a*b}`, answer:b, hint:'Missing factor!', type:'missing'};
  }
}

function factFamily(maxN){
  const a=rand(3,maxN),b=rand(1,a-1),c=a-b;
  const v=pick([
    {text:`${a} − ${b} = ?`, answer:c},
    {text:`${a} − ${c} = ?`, answer:b},
    {text:`${b} + ${c} = ?`, answer:a},
    {text:`${c} + ${b} = ?`, answer:a},
  ]);
  return {...v, hint:'Fact family!', type:'fact'};
}

function estimationQ(difficulty){
  const a=rand(20,70),b=rand(10,35);
  const exact=a+b;
  const rounded=Math.round(exact/10)*10;
  const opts=[rounded-10,rounded,rounded+10];
  return {text:`≈ ${a} + ${b}`, answer:rounded, hint:'Round to 10s and add:', type:'estimate', customOpts:shuffle(opts)};
}

function dicePattern(n){return `__dice__${n}`;}
function numberLine(max,val){return `__numline__${max}__${val}`;}

/* ══════════════════════════════════════════════════
   WORLD DEFINITIONS
══════════════════════════════════════════════════ */
const WORLDS = [
  {
    id:1, name:'Clover Meadow', emoji:'🌿',
    colors:{sky:'#87CEEB',skyEnd:'#d4f0ff',ground:'#6FCF97',groundEnd:'#4caf76',accent:'#F2C94C',dark:false},
    hills:[
      {d:'M0,80 Q150,20 300,60 Q450,100 600,40 Q750,0 900,50 L900,120 L0,120 Z',fill:'#4caf76',opacity:0.7},
      {d:'M0,100 Q200,50 400,80 Q600,110 900,60 L900,120 L0,120 Z',fill:'#5DBB63',opacity:0.9},
    ],
    burstColors:['#5dbb4a','#a0e060','#ffe000','#fff','#ff9fff'],
    badge:{icon:'🌿',name:'Meadow Explorer'},
    ambient:'petals',
    trees:['🌲','🌳','🌿','🌲','🌳'],
    deco:[{e:'🌸',l:'8%'},{e:'🌼',l:'22%'},{e:'🍄',l:'38%'},{e:'🌸',l:'55%'},{e:'🌼',l:'70%'}],
    tutorial:{title:'Counting! 🌸',body:'Count the objects and tap the right number!\nBenny hops forward for every correct answer!',visual:()=>'🐔🐔🐔 = 3'},
    generateQuestion(diff,session){
      const max=[5,7,9,10,12][diff];
      const a=rand(1,max);
      if(diff<=1&&a<=6){
        return {text:dicePattern(a),answer:a,hint:'How many dots?',type:'count'};
      }
      const emoji=pick(['🐔','🦋','🐸','🐝','🌸','⭐','🍄','🦆']);
      // Group into rows of 5 for numbers > 6 so they're easier to count
      let display;
      if(a>6){
        const parts=[];
        for(let r=0;r*5<a;r++){const n=Math.min(5,a-r*5);parts.push(emoji.repeat(n));}
        display=parts.join('\n');
      }else{
        display=emoji.repeat(a);
      }
      return {text:display,answer:a,hint:`Count in groups of 5!`,type:'count'};
    },
  },
  {
    id:2, name:'Sunflower Fields', emoji:'🌻',
    colors:{sky:'#FFE082',skyEnd:'#FFF9C4',ground:'#8BC34A',groundEnd:'#689F38',accent:'#FF9800',dark:false},
    hills:[
      {d:'M0,70 Q200,20 400,60 Q600,100 900,30 L900,120 L0,120 Z',fill:'#689F38',opacity:0.6},
      {d:'M0,95 Q250,55 500,85 Q700,110 900,70 L900,120 L0,120 Z',fill:'#8BC34A',opacity:0.9},
    ],
    burstColors:['#ffd93d','#ff9a00','#fff060','#fff','#ffa0ff'],
    badge:{icon:'🌻',name:'Sunny Adder'},
    ambient:'sparkles',
    trees:['🌻','🌼','🌻','🌻','🌼'],
    deco:[{e:'🌻',l:'6%'},{e:'🌼',l:'20%'},{e:'🌻',l:'40%'},{e:'🌼',l:'60%'},{e:'🌻',l:'76%'}],
    tutorial:{title:'Addition! ➕',body:'When we put things together we ADD them!\n3 🥕 + 2 🥕 = 5 🥕',visual:()=>'🥕🥕🥕 ➕ 🥕🥕 = 🥕🥕🥕🥕🥕'},
    generateQuestion(diff,session){
      const maxA=[5,8,10,12,15][diff];
      // Q diff 2: number line showing addition (start + jump = ?)
      if(diff===2){
        const a=rand(1,6),b=rand(1,4);
        return {text:`${a} + ${b} = ?`,answer:a+b,hint:'Use the number line!',type:'add',numLineAdd:{start:a,jump:b,max:Math.max(12,a+b+2)}};
      }
      const a=rand(1,maxA),b=rand(1,Math.min(12,20-a));
      if(session.qCount%3===0)return wordProblem('add',a,b);
      return {text:`${a} + ${b} = ?`,answer:a+b,hint:'What is...',type:'add'};
    },
  },
  {
    id:3, name:'Autumn Forest', emoji:'🍁',
    colors:{sky:'#FF8A65',skyEnd:'#FFCC02',ground:'#795548',groundEnd:'#5D4037',accent:'#FF5722',dark:false},
    hills:[
      {d:'M0,60 Q180,10 360,55 Q540,100 900,35 L900,120 L0,120 Z',fill:'#5D4037',opacity:0.6},
      {d:'M0,90 Q300,45 600,80 Q750,100 900,65 L900,120 L0,120 Z',fill:'#795548',opacity:0.9},
    ],
    burstColors:['#ff7020','#ffa030','#ffe060','#fff','#ff4080'],
    badge:{icon:'🍁',name:'Forest Thinker'},
    ambient:'leaves',
    trees:['🍁','🌲','🍂','🌲','🍁'],
    deco:[{e:'🍁',l:'5%'},{e:'🍂',l:'18%'},{e:'🍄',l:'36%'},{e:'🍁',l:'52%'},{e:'🍂',l:'68%'}],
    tutorial:{title:'Subtraction! ➖',body:'When we take things away we SUBTRACT!\n5 🍎 − 2 🍎 = 3 🍎',visual:()=>'🍎🍎🍎🍎🍎 ➖ 🍎🍎 = 🍎🍎🍎'},
    generateQuestion(diff,session){
      const maxA=[6,8,10,12,14][diff];
      if(diff===3)return factFamily(maxA);
      if(diff>=2&&Math.random()<.45)return missingNumber('sub',maxA);
      const a=rand(2,maxA),b=rand(1,a);
      if(session.qCount%3===0)return wordProblem('sub',a,b);
      return {text:`${a} − ${b} = ?`,answer:a-b,hint:'What is...',type:'sub'};
    },
  },
  {
    id:4, name:'Crystal Peak', emoji:'💎',
    colors:{sky:'#1A237E',skyEnd:'#7B1FA2',ground:'#4A148C',groundEnd:'#311B92',accent:'#80D8FF',dark:true},
    hills:[
      {d:'M0,50 Q200,5 400,45 Q600,85 900,20 L900,120 L0,120 Z',fill:'#311B92',opacity:0.7},
      {d:'M0,85 Q300,50 600,75 Q750,95 900,60 L900,120 L0,120 Z',fill:'#4A148C',opacity:0.9},
    ],
    burstColors:['#80d8ff','#b388ff','#fff','#e0f0ff','#ff80ff'],
    badge:{icon:'💎',name:'Crystal Master'},
    ambient:'sparkles',
    trees:['⛰️','✨','💎','✨','⛰️'],
    deco:[{e:'💎',l:'8%'},{e:'✨',l:'24%'},{e:'❄️',l:'42%'},{e:'💎',l:'60%'},{e:'✨',l:'76%'}],
    tutorial:{title:'Mixed Maths! 🔀',body:'This world mixes adding, subtracting AND place value!\n30 + 7 means 3 tens and 7 ones = 37 💎',visual:()=>'💎💎💎 tens + 💎💎💎💎💎💎💎 ones = 37'},
    generateQuestion(diff,session){
      // Place value questions at higher difficulties
      if(diff>=2&&Math.random()<.25){
        const tens=rand(1,9),ones=rand(0,9);
        const answer=tens*10+ones;
        const q=Math.random()<.5
          ? {text:`${tens} tens + ${ones} ones = ?`,answer,hint:'Tens and ones!',type:'place'}
          : {text:`What is ${tens*10} + ${ones}?`,answer,hint:'Tens + ones!',type:'place'};
        return q;
      }
      if(diff>=3&&Math.random()<.3)return estimationQ(diff);
      if(diff>=2&&Math.random()<.4)return missingNumber(Math.random()<.5?'add':'sub',[6,8,10,12,14][diff]);
      const maxA=[6,8,10,12,14][diff];
      if(Math.random()<.5){
        const a=rand(1,maxA),b=rand(1,Math.min(12,20-a));
        if(session.qCount%3===0)return wordProblem('add',a,b);
        return {text:`${a} + ${b} = ?`,answer:a+b,hint:'Mixed:',type:'add'};
      }else{
        const a=rand(2,maxA),b=rand(1,a);
        if(session.qCount%3===0)return wordProblem('sub',a,b);
        return {text:`${a} − ${b} = ?`,answer:a-b,hint:'Mixed:',type:'sub'};
      }
    },
  },
  {
    id:5, name:'Number Mountain', emoji:'🏔️',
    colors:{sky:'#4A148C',skyEnd:'#1A237E',ground:'#37474F',groundEnd:'#263238',accent:'#FBBF24',dark:true},
    hills:[
      {d:'M0,40 Q150,0 300,35 Q450,70 600,25 Q750,0 900,40 L900,120 L0,120 Z',fill:'#263238',opacity:0.7},
      {d:'M0,80 Q300,45 600,70 Q750,90 900,55 L900,120 L0,120 Z',fill:'#37474F',opacity:0.9},
    ],
    burstColors:['#c8a0ff','#ff80d8','#fff','#a0c0ff','#ffe566'],
    badge:{icon:'🏔️',name:'Times Table Hero'},
    ambient:'stars',
    trees:['🏔️','⛰️','🏔️','✨','⛰️'],
    deco:[{e:'⭐',l:'8%'},{e:'✨',l:'24%'},{e:'⭐',l:'42%'},{e:'💫',l:'60%'},{e:'✨',l:'76%'}],
    tutorial:{title:'Times Tables! ✖️',body:'Multiplication is REPEATED addition!\n3 × 4 means: 4 + 4 + 4 = 12',visual:()=>'🐰🐰🐰 × 🥕🥕🥕🥕 = 12 🥕'},
    generateQuestion(diff,session){
      const maxT=[4,5,6,8,10][diff];
      if(diff<=1){
        const a=rand(2,maxT),b=rand(2,maxT);
        return {text:`${a} × ${b} = ?`,answer:a*b,hint:'Times table:',type:'mul',showArray:{rows:a,cols:b}};
      }
      if(diff===2&&Math.random()<.4)return missingNumber('mul',0);
      if(session.qCount%3===0){
        const a=rand(2,maxT),b=rand(2,maxT);
        return wordProblem('mul',a,b);
      }
      const a=rand(1,maxT),b=rand(1,maxT);
      return {text:`${a} × ${b} = ?`,answer:a*b,hint:'Times table:',type:'mul'};
    },
  },
  {
    id:6, name:'River Divide', emoji:'🌊',
    colors:{sky:'#006064',skyEnd:'#00838F',ground:'#00695C',groundEnd:'#004D40',accent:'#80DEEA',dark:true},
    hills:[
      {d:'M0,65 Q200,25 400,55 Q600,85 900,30 L900,120 L0,120 Z',fill:'#004D40',opacity:0.7},
      {d:'M0,90 Q300,55 600,80 Q800,100 900,70 L900,120 L0,120 Z',fill:'#00695C',opacity:0.9},
    ],
    burstColors:['#40d8ff','#00a8d8','#80f0ff','#fff','#a0ffd8'],
    badge:{icon:'🌊',name:'Division Champion'},
    ambient:'bubbles',
    trees:['🌊','🪨','🌿','🪨','🌊'],
    deco:[{e:'🐟',l:'8%'},{e:'🪨',l:'24%'},{e:'🐸',l:'42%'},{e:'🪨',l:'60%'},{e:'🐟',l:'76%'}],
    tutorial:{title:'Division! ÷',body:'Division is SHARING equally!\n12 fish shared between 3 friends = 4 each 🐟',visual:()=>'🐟🐟🐟🐟🐟🐟 ÷ 3 = 🐟🐟'},
    generateQuestion(diff,session){
      const maxDiv=[3,4,5,8,12][diff];
      // Q4-5: division with remainders
      if(diff>=3){
        const b=rand(2,maxDiv),result=rand(2,10);
        const rem=diff===4?rand(1,b-1):0;
        const a=b*result+rem;
        if(rem>0){
          const r1=`${result} r${rem}`;
          const decoys=[
            `${result} r${rem===1?2:rem-1}`,
            `${result+1} r0`,
          ];
          return {text:`${a} ÷ ${b} = ?`,answer:r1,hint:'With remainder!',type:'div_rem',customOpts:shuffle([r1,...decoys])};
        }
        if(session.qCount%3===0)return wordProblem('div',result,b);
        return {text:`${a} ÷ ${b} = ?`,answer:result,hint:'Share equally:',type:'div'};
      }
      const b=rand(2,maxDiv),result=rand(2,8),a=b*result;
      return {text:`${a} ÷ ${b} = ?`,answer:result,hint:'Share equally:',type:'div'};
    },
  },
];

const BENNY_X = ['3%','16%','30%','44%','58%','72%'];
const CORRECT_MSGS = ['🌟 Amazing!','⭐ Correct!','🎉 Great job!','🌈 Awesome!','💛 Perfect!','🐰 Yes!','🏆 Brilliant!','✨ Super!'];
const WRONG_MSGS   = ['😅 Try again!','💙 Almost!','🌼 You can do it!','💪 Keep going!','🤗 So close!'];

/* ══════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════ */
let SESSION = {
  points:0, earnedBadges:[], carrots:0,
  worldStars:{}, unlockedWorlds:[1],
  qCount:0, correctCount:0, accuracy:0.75,
  missedQuestions:[],
};
let LEVEL = {
  level:1, q:0, lvlPoints:0, lives:3, wrongsInARow:0,
  answer:null, opts:[], locked:false, streak:0, multiplier:1,
  bennyState:'idle', timeTrial:false, multRound:0,
  wrongsOnCurrentQ:0, currentQType:'add', currentHint:'',
};
let TIMER = {isRunning:false,left:0,max:12,raf:null,lastTs:0};
let G = {soundOn:true,timeTrial:false};

/* ── Persistence ─────────────────────────────────── */
function loadPersistent(){
  try{
    const s=JSON.parse(localStorage.getItem('mathAdventure_v8')||'{}');
    SESSION.carrots=s.carrots||0;
    SESSION.worldStars=s.worldStars||{};
    SESSION.unlockedWorlds=s.unlockedWorlds||[1];
  }catch(e){}
}
function savePersistent(){
  try{localStorage.setItem('mathAdventure_v8',JSON.stringify({carrots:SESSION.carrots,worldStars:SESSION.worldStars,unlockedWorlds:SESSION.unlockedWorlds}));}catch(e){}
}
loadPersistent();

/* ── DOM helpers ─────────────────────────────────── */
const $ = id => document.getElementById(id);
const SCR = {
  splash:$('screen-splash'), title:$('screen-title'), tutorial:$('screen-tutorial'),
  game:$('screen-game'), lc:$('screen-lc'), win:$('screen-win'),
  trophy:$('screen-trophy'), review:$('screen-review'),
};
function srAnnounce(msg){const e=$('sr-announce');if(!e)return;e.textContent='';setTimeout(()=>{e.textContent=msg;},50);}

/* ══════════════════════════════════════════════════
   SFX
══════════════════════════════════════════════════ */
let audioCtx=null;
function getACtx(){if(!audioCtx){const C=window.AudioContext||window.webkitAudioContext;if(C)audioCtx=new C();}return audioCtx;}
function tone(freq,type,dur,gain,delay=0){
  if(!G.soundOn)return;
  try{const ctx=getACtx();if(!ctx)return;if(ctx.state==='suspended')ctx.resume();
    const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);
    o.type=type;o.frequency.setValueAtTime(freq,ctx.currentTime+delay);
    g.gain.setValueAtTime(gain,ctx.currentTime+delay);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+delay+dur);
    o.start(ctx.currentTime+delay);o.stop(ctx.currentTime+delay+dur+.05);
  }catch(e){}
}
const SFX={
  correct(){tone(523,'sine',.12,.28);tone(659,'sine',.12,.28,.1);tone(784,'sine',.2,.28,.2);},
  streak(){[523,659,784,1047,1319].forEach((f,i)=>tone(f,'sine',.15,.25,i*.09));},
  superMode(){[784,1047,1319,1568,2093].forEach((f,i)=>tone(f,'sine',.18,.28,i*.08));},
  wrong(){tone(300,'sawtooth',.08,.18);tone(250,'sawtooth',.12,.18,.1);},
  levelUp(){[523,659,784,1047].forEach((f,i)=>tone(f,'sine',.18,.22,i*.12));},
  click(){tone(440,'sine',.06,.12);},
  timerWarn(){tone(880,'square',.05,.12);},
  carrot(){tone(660,'sine',.08,.15);tone(880,'sine',.08,.15,.08);},
  hint(){tone(550,'sine',.06,.1);tone(660,'sine',.06,.1,.1);},
};
function toggleSound(){
  G.soundOn=!G.soundOn;const b=$('sound-toggle');
  b.textContent=G.soundOn?'🔊':'🔇';b.classList.toggle('muted',!G.soundOn);
  if(G.soundOn)SFX.click();
}

/* ══════════════════════════════════════════════════
   INJECT KEYFRAMES
══════════════════════════════════════════════════ */
(()=>{const s=document.createElement('style');s.textContent=`
@keyframes screen-shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-8px) rotate(-.5deg)}35%{transform:translateX(8px) rotate(.5deg)}55%{transform:translateX(-5px)}75%{transform:translateX(4px)}}
@keyframes screen-wobble{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
@keyframes burst-fly{from{opacity:1;transform:translate(0,0) scale(1)}to{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.1) rotate(720deg)}}
@keyframes benny-backflip{0%{transform:scaleX(.85) scaleY(1.15)}20%{transform:translateY(-22px) rotate(-90deg)}50%{transform:translateY(-38px) rotate(-190deg)}75%{transform:translateY(-10px) rotate(-340deg)}100%{transform:translateY(0) scaleX(1) scaleY(1) rotate(-360deg)}}
@keyframes benny-super-spin{0%{transform:scaleY(1.2) scaleX(.8)}25%{transform:translateY(-40px) rotate(-90deg) scale(1.1)}50%{transform:translateY(-55px) rotate(-180deg) scale(1.2)}75%{transform:translateY(-25px) rotate(-270deg) scale(1.05)}100%{transform:translateY(0) rotate(-360deg) scale(1)}}
@keyframes benny-victory-center{0%{transform:scale(1)}30%{transform:scale(1.6) translateY(-20px) rotate(10deg)}60%{transform:scale(1.5) translateY(-25px) rotate(-10deg)}100%{transform:scale(1)}}
@keyframes benny-bonk{0%{transform:translateY(0) rotate(0)}25%{transform:translateY(-8px) rotate(-15deg)}50%{transform:translateY(4px) rotate(10deg)}75%{transform:translateY(-4px) rotate(-5deg)}100%{transform:translateY(0)}}
@keyframes benny-breathe{0%,100%{transform:scaleY(1) scaleX(1)}50%{transform:scaleY(1.04) scaleX(.97)}}
@keyframes benny-think{0%,100%{transform:rotate(0) translateY(0)}50%{transform:rotate(-8deg) translateY(-4px)}}
@keyframes benny-glow-excited{0%,100%{filter:drop-shadow(0 0 8px #ffd700) drop-shadow(0 4px 0 rgba(0,0,0,.2))}50%{filter:drop-shadow(0 0 20px #ffd700) drop-shadow(0 0 35px #ffaa00) drop-shadow(0 4px 0 rgba(0,0,0,.2))}}
@keyframes benny-glow-super{0%,100%{filter:drop-shadow(0 0 14px #c060ff) drop-shadow(0 0 28px #8020ff) drop-shadow(0 4px 0 rgba(0,0,0,.2))}50%{filter:drop-shadow(0 0 28px #ff60ff) drop-shadow(0 0 55px #c020ff) drop-shadow(0 4px 0 rgba(0,0,0,.2))}}
@keyframes walk-fast{0%,100%{transform:scaleX(1) translateY(0) rotate(0)}25%{transform:scaleX(1.06) translateY(-5px) rotate(-3deg)}75%{transform:scaleX(.95) translateY(-2px) rotate(3deg)}}
@keyframes float-score{0%{opacity:1;transform:translate(-50%,0) scale(.5) rotate(var(--rot))}15%{opacity:1;transform:translate(-50%,-10px) scale(1.2) rotate(var(--rot))}70%{opacity:1;transform:translate(-50%,-55px) scale(1) rotate(var(--rot))}100%{opacity:0;transform:translate(-50%,-80px) scale(.9) rotate(var(--rot))}}
@keyframes streak-badge-pop{0%{transform:translateX(-50%) scale(0) rotate(-20deg)}60%{transform:translateX(-50%) scale(1.3) rotate(5deg)}100%{transform:translateX(-50%) scale(1) rotate(0)}}
@keyframes timer-warn-flash{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes world-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18) saturate(1.3)}}
@keyframes q-pop-in{0%{opacity:0;transform:scale(.7)}60%{opacity:1;transform:scale(1.05)}100%{opacity:1;transform:scale(1)}}
@keyframes sign-bounce-in{0%{opacity:0;transform:scale(0) translateY(20px)}70%{transform:scale(1.08) translateY(-4px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes sign-correct-ripple{0%{box-shadow:0 0 0 0 rgba(76,175,80,.7)}70%{box-shadow:0 0 0 20px rgba(76,175,80,0)}100%{box-shadow:0 0 0 0 rgba(76,175,80,0)}}
@keyframes correct-reveal{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}
@keyframes celebration-text{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}80%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(.9)}}
@keyframes carrot-pop{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.3) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes hud-ribbon-in{from{transform:translateX(-50%) translateY(-40px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
@keyframes sign-press{0%{transform:scale(1)}50%{transform:scale(.92)}100%{transform:scale(1)}}
@keyframes carrot-bump{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes wbtn-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes title-benny-bounce{0%,100%{transform:translateY(0) scaleX(1)}40%{transform:translateY(-18px) scaleX(1.05)}60%{transform:translateY(-12px) scaleX(.97)}}
@keyframes ear-twitch{0%,85%,100%{transform:rotate(0)}90%{transform:rotate(-15deg)}95%{transform:rotate(6deg)}}
@keyframes eye-blink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}}
@keyframes home-bounce{0%,100%{transform:scale(1)}40%{transform:scale(1.25)}70%{transform:scale(.95)}}
@keyframes smoke-puff{from{opacity:.8;transform:translateY(0) scale(.3)}to{opacity:0;transform:translateY(-35px) scale(1.8)}}
@keyframes digit-roll{from{opacity:0;transform:translateY(-60%)}to{opacity:1;transform:translateY(0)}}
@keyframes hint-pop{0%{opacity:0;transform:translateX(-50%) scale(0)}60%{transform:translateX(-50%) scale(1.1)}100%{opacity:1;transform:translateX(-50%) scale(1)}}
@keyframes numline-marker{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes conf-fall{from{transform:translateY(-20px) rotate(0)}to{transform:translateY(110%) rotate(720deg)}}
@keyframes leg-hop-l{0%,100%{transform:rotate(0) translateY(0)}40%{transform:rotate(-20deg) translateY(-4px)}60%{transform:rotate(10deg) translateY(2px)}}
@keyframes leg-hop-r{0%,100%{transform:rotate(0) translateY(0)}40%{transform:rotate(20deg) translateY(-4px)}60%{transform:rotate(-10deg) translateY(2px)}}
@keyframes tail-wiggle{0%,100%{transform:rotate(0)}30%{transform:rotate(-20deg)}70%{transform:rotate(15deg)}}
`;document.head.appendChild(s);})();

/* ══════════════════════════════════════════════════
   SCREEN TRANSITIONS
══════════════════════════════════════════════════ */
function showScreen(name){
  const outEl=Object.values(SCR).find(e=>e&&e.classList.contains('active'));
  const inEl=SCR[name]; if(!inEl)return;
  if(outEl&&outEl!==inEl){
    outEl.classList.add('screen-exit');
    setTimeout(()=>{outEl.classList.remove('active','screen-exit');outEl.setAttribute('aria-hidden','true');},260);
  }
  setTimeout(()=>{
    inEl.classList.add('active','screen-enter');
    inEl.setAttribute('aria-hidden','false');
    setTimeout(()=>inEl.classList.remove('screen-enter'),350);
  },outEl&&outEl!==inEl?80:0);
  Object.entries(SCR).forEach(([k,e])=>{if(e&&k!==name)e.setAttribute('aria-hidden','true');});
}
function flashScreen(color='white'){if(prefersReducedMotion)return;const e=$('screen-flash');e.style.background=color;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),80);}
function shakeScreen(gentle=false){if(prefersReducedMotion)return;const e=SCR.game;e.style.animation='none';void e.offsetWidth;e.style.animation=gentle?'screen-wobble .3s ease both':'screen-shake .38s ease both';setTimeout(()=>e.style.animation='',450);}

/* ══════════════════════════════════════════════════
   FX CANVAS
══════════════════════════════════════════════════ */
const fxCanvas=$('fx-canvas'),fxCtx=fxCanvas.getContext('2d');
let particles=[],worldBurstColors=WORLDS[0].burstColors,sparkleTrail=[];
function resizeFX(){const d=Math.min(devicePixelRatio||1,2);fxCanvas.width=innerWidth*d;fxCanvas.height=innerHeight*d;fxCanvas.style.width=innerWidth+'px';fxCanvas.style.height=innerHeight+'px';fxCtx.scale(d,d);}
window.addEventListener('resize',resizeFX,{passive:true});resizeFX();
function spawnP(x,y,colors,count=1,speed=1){if(prefersReducedMotion)return;const c=colors||worldBurstColors;for(let i=0;i<count;i++)particles.push({x:x??Math.random()*innerWidth,y:y??innerHeight+8,r:3+Math.random()*5,vx:(Math.random()-.5)*.6*speed,vy:-(0.3+Math.random()*.7)*speed,a:.5+Math.random()*.5,life:1,decay:.002+Math.random()*.003,col:c[Math.floor(Math.random()*c.length)],rot:Math.random()*Math.PI*2,rotV:(Math.random()-.5)*.08,shape:['circle','rect','diamond'][Math.floor(Math.random()*3)]});}
function spawnAmbient(){if(prefersReducedMotion||!SCR.game||!SCR.game.classList.contains('active'))return;const w=WORLDS[LEVEL.level-1];const chance={petals:.04,leaves:.05,bubbles:.03,sparkles:.03,stars:.02}[w.ambient]||.03;if(Math.random()>chance)return;const col=w.burstColors[Math.floor(Math.random()*w.burstColors.length)];if(w.ambient==='bubbles')particles.push({x:Math.random()*innerWidth,y:innerHeight-10,r:3+Math.random()*4,vx:(Math.random()-.5)*.4,vy:-(0.4+Math.random()*.6),a:.3+Math.random()*.3,life:1,decay:.003+Math.random()*.003,col:'#80DEEA',rot:0,rotV:0,shape:'circle'});else if(w.ambient==='leaves')particles.push({x:Math.random()*innerWidth,y:-10,r:4+Math.random()*4,vx:.3+Math.random()*.5,vy:.4+Math.random()*.5,a:.5+Math.random()*.4,life:1,decay:.002+Math.random()*.003,col,rot:0,rotV:.05+Math.random()*.08,shape:'diamond'});else spawnP(Math.random()*innerWidth,innerHeight-20,[col],1,.4);}
function spawnBennyTrail(){if(prefersReducedMotion||LEVEL.streak<3)return;const bw=$('benny-wrap');if(!bw)return;const rect=bw.getBoundingClientRect();const sc=LEVEL.streak>=5?['#fff','#ffe566','#ff9fff','#a0ffff']:['#fff','#ffe566','#a8ff80'];for(let i=0;i<2;i++)sparkleTrail.push({x:rect.left+rect.width*.3+(Math.random()-.5)*20,y:rect.top+rect.height*.5+(Math.random()-.5)*20,r:2+Math.random()*3,vx:-.5-Math.random()*1.5,vy:(Math.random()-.5)*.8,life:1,decay:.04+Math.random()*.04,col:sc[Math.floor(Math.random()*sc.length)]});}
function tickFX(){requestAnimationFrame(tickFX);fxCtx.clearRect(0,0,innerWidth,innerHeight);spawnAmbient();if(SCR.game?.classList.contains('active')&&LEVEL.streak>=3)spawnBennyTrail();if(SCR.game?.classList.contains('active')&&LEVEL.streak>=5&&!prefersReducedMotion){const t=Date.now()*.002,p=(Math.sin(t)+1)*.5;fxCtx.fillStyle=`rgba(180,100,255,${.03+p*.05})`;fxCtx.fillRect(0,0,innerWidth,innerHeight);}sparkleTrail=sparkleTrail.filter(p=>p.life>0);for(const p of sparkleTrail){p.x+=p.vx;p.y+=p.vy;p.life-=p.decay;fxCtx.save();fxCtx.globalAlpha=Math.max(0,p.life);fxCtx.fillStyle=p.col;fxCtx.beginPath();fxCtx.arc(p.x,p.y,p.r,0,Math.PI*2);fxCtx.fill();fxCtx.restore();}particles=particles.filter(p=>p.life>0);for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.life-=p.decay;p.rot+=p.rotV;fxCtx.save();fxCtx.globalAlpha=Math.max(0,p.life*p.a);fxCtx.fillStyle=p.col;fxCtx.translate(p.x,p.y);fxCtx.rotate(p.rot);if(p.shape==='circle'){fxCtx.beginPath();fxCtx.arc(0,0,p.r,0,Math.PI*2);fxCtx.fill();}else if(p.shape==='rect'){fxCtx.fillRect(-p.r,-p.r/2,p.r*2,p.r);}else{fxCtx.beginPath();fxCtx.moveTo(0,-p.r);fxCtx.lineTo(p.r,0);fxCtx.lineTo(0,p.r);fxCtx.lineTo(-p.r,0);fxCtx.closePath();fxCtx.fill();}fxCtx.restore();}}
tickFX();

/* ── Parallax tied to Benny position ─────────────── */
let bennyXPct=3;
(function tickParallax(){requestAnimationFrame(tickParallax);if(prefersReducedMotion||!SCR.game?.classList.contains('active'))return;const drift=(bennyXPct/100)*24;const mt=document.querySelector('.w-mid-trees'),fh=document.querySelector('.w-far-hills');if(mt)mt.style.transform=`translateX(${-drift*.6}px)`;if(fh)fh.style.transform=`translateX(${-drift*.25}px)`;})();

/* ══════════════════════════════════════════════════
   SVG BENNY
══════════════════════════════════════════════════ */
function buildSVGBenny(){
  return `<svg id="benny-svg" viewBox="0 0 90 110" xmlns="http://www.w3.org/2000/svg" style="width:76px;height:95px;overflow:visible;display:block">
    <!-- Shadow -->
    <ellipse cx="45" cy="108" rx="26" ry="6" fill="rgba(0,0,0,0.18)"/>
    <!-- Ears -->
    <g id="benny-ear-left" style="transform-origin:30px 36px">
      <ellipse cx="28" cy="20" rx="10" ry="22" fill="#fce4ec"/>
      <ellipse cx="28" cy="20" rx="6" ry="15" fill="#f48fb1"/>
      <!-- ear stripe -->
      <ellipse cx="28" cy="16" rx="3" ry="7" fill="#f06292" opacity="0.5"/>
    </g>
    <g id="benny-ear-right" style="transform-origin:60px 36px">
      <ellipse cx="62" cy="20" rx="10" ry="22" fill="#fce4ec"/>
      <ellipse cx="62" cy="20" rx="6" ry="15" fill="#f48fb1"/>
      <ellipse cx="62" cy="16" rx="3" ry="7" fill="#f06292" opacity="0.5"/>
    </g>
    <!-- Body -->
    <ellipse cx="45" cy="82" rx="25" ry="22" fill="#ede7f6"/>
    <!-- Belly white -->
    <ellipse cx="45" cy="84" rx="15" ry="14" fill="rgba(255,255,255,0.55)"/>
    <!-- Head -->
    <circle cx="45" cy="49" r="26" fill="#f3e5ff"/>
    <!-- head highlight -->
    <ellipse cx="39" cy="38" rx="10" ry="8" fill="rgba(255,255,255,0.3)"/>
    <!-- Eyes -->
    <g id="benny-eye-left" style="transform-origin:35px 46px">
      <circle cx="35" cy="46" r="6.5" fill="white"/>
      <circle cx="35" cy="46" r="4" fill="#1a0a3e"/>
      <circle cx="36.5" cy="44.5" r="1.5" fill="white"/><!-- shine -->
    </g>
    <g id="benny-eye-right" style="transform-origin:55px 46px">
      <circle cx="55" cy="46" r="6.5" fill="white"/>
      <circle cx="55" cy="46" r="4" fill="#1a0a3e"/>
      <circle cx="56.5" cy="44.5" r="1.5" fill="white"/>
    </g>
    <!-- Nose -->
    <ellipse cx="45" cy="55" rx="4" ry="3" fill="#ff8fb0"/>
    <!-- Nostrils -->
    <circle cx="43.5" cy="56" r="1" fill="#d4426a" opacity="0.6"/>
    <circle cx="46.5" cy="56" r="1" fill="#d4426a" opacity="0.6"/>
    <!-- Mouth -->
    <path id="benny-mouth" d="M38,60 Q45,67 52,60" stroke="#c06080" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <!-- Cheeks -->
    <circle cx="28" cy="56" r="7" fill="rgba(255,150,150,0.28)" id="benny-cheek-l"/>
    <circle cx="62" cy="56" r="7" fill="rgba(255,150,150,0.28)" id="benny-cheek-r"/>
    <!-- Whiskers -->
    <line x1="15" y1="54" x2="32" y2="56" stroke="rgba(150,100,160,0.4)" stroke-width="1.2"/>
    <line x1="15" y1="58" x2="32" y2="58" stroke="rgba(150,100,160,0.4)" stroke-width="1.2"/>
    <line x1="58" y1="56" x2="75" y2="54" stroke="rgba(150,100,160,0.4)" stroke-width="1.2"/>
    <line x1="58" y1="58" x2="75" y2="58" stroke="rgba(150,100,160,0.4)" stroke-width="1.2"/>
    <!-- Arms -->
    <g id="benny-arm-left" style="transform-origin:20px 72px">
      <ellipse cx="20" cy="76" rx="8" ry="12" fill="#ede7f6"/>
      <ellipse cx="20" cy="86" rx="6" ry="5" fill="#f3e5ff"/><!-- paw -->
    </g>
    <g id="benny-arm-right" style="transform-origin:70px 72px">
      <ellipse cx="70" cy="76" rx="8" ry="12" fill="#ede7f6"/>
      <ellipse cx="70" cy="86" rx="6" ry="5" fill="#f3e5ff"/><!-- paw -->
    </g>
    <!-- Legs -->
    <g id="benny-leg-left" style="transform-origin:34px 98px">
      <ellipse cx="34" cy="100" rx="9" ry="7" fill="#ede7f6"/><!-- foot -->
      <rect x="30" y="92" width="8" height="12" rx="4" fill="#ede7f6"/>
    </g>
    <g id="benny-leg-right" style="transform-origin:56px 98px">
      <ellipse cx="56" cy="100" rx="9" ry="7" fill="#ede7f6"/>
      <rect x="52" y="92" width="8" height="12" rx="4" fill="#ede7f6"/>
    </g>
    <!-- Tail -->
    <circle cx="69" cy="88" r="7" fill="white" opacity="0.9"/>
    <circle cx="69" cy="88" r="5" fill="#fce4ec"/>
  </svg>`;
}

let bennyBlinkT=null,bennyEarT=null;
function initBennySVG(){
  const bc=$('benny-char');if(!bc)return;
  bc.innerHTML=buildSVGBenny();
  clearInterval(bennyBlinkT);clearInterval(bennyEarT);
  bennyBlinkT=setInterval(()=>{
    if(LEVEL.bennyState!=='idle'&&LEVEL.bennyState!=='thinking')return;
    ['benny-eye-left','benny-eye-right'].forEach(id=>{
      const e=$(id);if(!e)return;
      e.style.animation='eye-blink .2s ease both';
      setTimeout(()=>{if(e)e.style.animation='';},250);
    });
  },rand(3000,5500));
  bennyEarT=setInterval(()=>{
    if(LEVEL.bennyState!=='idle')return;
    const e=$('benny-ear-left');if(!e)return;
    e.style.animation='ear-twitch .4s ease both';
    setTimeout(()=>{if(e)e.style.animation='';},500);
  },rand(4000,8000));
}

function setSVGExpression(state){
  const mouth=$('benny-mouth'),cl=$('benny-cheek-l'),cr=$('benny-cheek-r');
  const al=$('benny-arm-left'),ar=$('benny-arm-right');
  const ll=$('benny-leg-left'),lr=$('benny-leg-right');
  if(!mouth)return;
  if(al)al.style.transform='';if(ar)ar.style.transform='';
  if(ll)ll.style.transform='';if(lr)lr.style.transform='';
  if(cl)cl.setAttribute('r','7');if(cr)cr.setAttribute('r','7');
  switch(state){
    case 'correct':case 'excited':case 'victory':
      mouth.setAttribute('d',state==='victory'?'M34,62 Q45,74 56,62':'M36,61 Q45,70 54,61');
      if(cl)cl.setAttribute('r','10');if(cr)cr.setAttribute('r','10');
      if(al)al.style.transform='rotate(-45deg)';if(ar)ar.style.transform='rotate(45deg)';
      if(ll)ll.style.transform='rotate(-15deg)';if(lr)lr.style.transform='rotate(15deg)';
      break;
    case 'wrong':case 'tired':
      mouth.setAttribute('d','M38,65 Q45,60 52,65');
      if(cl)cl.setAttribute('r','5');if(cr)cr.setAttribute('r','5');
      break;
    case 'thinking':
      mouth.setAttribute('d','M39,62 Q45,62 51,62');
      if(al)al.style.transform='rotate(-20deg)';
      break;
    default:
      mouth.setAttribute('d','M38,60 Q45,67 52,60');
      if(cl)cl.setAttribute('r','7');if(cr)cr.setAttribute('r','7');
  }
}

function setBennyState(state){
  LEVEL.bennyState=state;
  const bc=$('benny-char');if(!bc)return;
  bc.style.animation='';bc.style.filter='';
  bc.classList.remove('hop','wrong','excited','super-mode','victory','thinking','tired');
  setSVGExpression(state);updateStreakBadge();
  switch(state){
    case 'idle':{
      bc.style.animation='benny-breathe 2s ease-in-out infinite';
      bc.style.filter='drop-shadow(0 4px 0 rgba(0,0,0,.2))';
      const tail=$('benny-svg')?.querySelector('circle:last-child');
      if(tail&&!prefersReducedMotion)tail.style.animation='tail-wiggle 2.5s ease-in-out infinite';
      break;
    }
    case 'thinking':bc.classList.add('thinking');bc.style.animation='benny-think 1.2s ease-in-out infinite';bc.style.filter='drop-shadow(0 4px 0 rgba(0,0,0,.2))';break;
    case 'excited':bc.classList.add('excited');bc.style.animation='walk-fast .35s ease-in-out infinite,benny-glow-excited 1s ease-in-out infinite';break;
    case 'super':bc.classList.add('super-mode');bc.style.animation='walk-fast .28s ease-in-out infinite,benny-glow-super .7s ease-in-out infinite';if(!prefersReducedMotion){const w=document.querySelector('.world');if(w)w.style.animation='world-pulse .9s ease-in-out infinite';}break;
    case 'correct':{
      const ll=$('benny-leg-left'),lr=$('benny-leg-right');
      if(ll&&!prefersReducedMotion)ll.style.animation='leg-hop-l .5s ease both';
      if(lr&&!prefersReducedMotion)lr.style.animation='leg-hop-r .5s ease both .1s';
      bc.style.animation=LEVEL.streak>=5?'benny-super-spin .7s cubic-bezier(.22,.61,.36,1) both,benny-glow-super .7s ease-in-out infinite':'benny-backflip .65s cubic-bezier(.22,.61,.36,1) both';
      setTimeout(()=>{if(ll)ll.style.animation='';if(lr)lr.style.animation='';setBennyState(LEVEL.streak>=5?'super':LEVEL.streak>=2?'excited':'idle');},700);
      break;
    }
    case 'wrong':bc.classList.add('wrong');bc.style.animation='benny-bonk .45s ease both';setTimeout(()=>setBennyState(LEVEL.streak>=5?'super':LEVEL.streak>=2?'excited':'idle'),500);break;
    case 'tired':bc.classList.add('tired');bc.style.filter='drop-shadow(0 4px 0 rgba(0,0,0,.2)) brightness(.8)';break;
    case 'victory':bc.style.animation='benny-victory-center 1.2s ease-in-out';bc.style.filter='drop-shadow(0 0 30px #ffd700) drop-shadow(0 0 60px #ff8c00)';setTimeout(()=>{const r=bc.getBoundingClientRect();spawnP(r.left+r.width/2,r.top+r.height/2,['#ffd700','#ff8c00','#fff','#ffe066'],30,2.5);},200);break;
  }
}

function updateStreakBadge(){
  const b=$('streak-badge');if(!b)return;
  if(LEVEL.streak>=1){
    const fire=LEVEL.streak>=5?'🔥🔥🔥':LEVEL.streak>=3?'🔥🔥':LEVEL.streak>=2?'🔥':'';
    const mult=LEVEL.multiplier>1?` ×${LEVEL.multiplier}`:'';
    b.textContent=`${LEVEL.streak}${mult} ${fire}`.trim();b.style.display='flex';
    b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');
  }else b.style.display='none';
}

/* ── Score digit roll ────────────────────────────── */
let scoreDisplayed=0;
function animateScore(newVal){
  const el=$('hud-score');if(!el)return;
  if(scoreDisplayed===newVal)return;
  const old=scoreDisplayed;scoreDisplayed=newVal;
  const diff=newVal-old;
  const steps=Math.min(8,Math.max(4,Math.floor(diff/10)));
  let step=0;
  const iv=setInterval(()=>{
    step++;
    if(step>=steps){el.textContent=newVal;clearInterval(iv);return;}
    const progress=step/steps;
    const eased=1-(1-progress)*(1-progress);
    const v=Math.round(old+diff*eased);
    el.textContent=v;
    el.style.animation='digit-roll .07s ease both';
    setTimeout(()=>{if(el)el.style.animation='';},80);
  },55);
}

/* ── Floating score ─────────────────────────────── */
function spawnFloatingScore(pts,mult){
  if(prefersReducedMotion)return;
  const bw=$('benny-wrap');if(!bw)return;
  const r=bw.getBoundingClientRect(),rot=(Math.random()-.5)*20;
  const el=document.createElement('div');
  el.style.cssText=`position:fixed;pointer-events:none;z-index:9300;left:${r.left+r.width/2}px;top:${r.top}px;font-family:var(--f1);font-size:${mult?'2rem':'1.5rem'};color:${mult?'#ffd700':'#fff'};-webkit-text-stroke:${mult?'2px':'1.5px'} #1c0f00;paint-order:stroke fill;text-shadow:0 3px 8px rgba(0,0,0,.5);--rot:${rot}deg;animation:float-score 1.1s ease-out forwards;white-space:nowrap;`;
  el.textContent=`+${pts}${mult?` ×${LEVEL.multiplier}!`:''}`;
  document.body.appendChild(el);el.addEventListener('animationend',()=>el.remove(),{once:true});
}

/* ── Bubble ─────────────────────────────────────── */
function showBubble(msg,color){const b=$('benny-bubble');if(!b)return;b.textContent=msg;b.style.color=color;b.classList.add('show');clearTimeout(showBubble._t);showBubble._t=setTimeout(hideBubble,2000);}
function hideBubble(){const b=$('benny-bubble');if(b)b.classList.remove('show');}

/* ── Star burst ─────────────────────────────────── */
function doStarBurst(n=10){if(prefersReducedMotion)return;const emojis=LEVEL.streak>=5?['💥','🌟','✨','💜','🎆','⚡','💫']:['⭐','🌟','✨','💛','🎉'];const frag=document.createDocumentFragment();for(let i=0;i<n;i++){const el=document.createElement('span');el.style.cssText=`position:fixed;pointer-events:none;z-index:9150;font-size:${1.2+Math.random()*1.6}rem;left:${25+Math.random()*50}%;top:${35+Math.random()*35}%;animation:burst-fly ${.6+Math.random()*.4}s ease-out forwards;animation-delay:${i*40}ms;`;el.textContent=pick(emojis);const ang=Math.random()*Math.PI*2,d=90+Math.random()*150;el.style.setProperty('--dx',Math.cos(ang)*d+'px');el.style.setProperty('--dy',Math.sin(ang)*d+'px');frag.appendChild(el);el.addEventListener('animationend',()=>el.remove(),{once:true});}document.body.appendChild(frag);}

/* ── Streak celebration ─────────────────────────── */
function celebrateStreak(n){if(prefersReducedMotion)return;const labels={2:'🔥 Hot!',3:'🔥🔥 On Fire!',5:'🔥🔥🔥 UNSTOPPABLE!'};const label=labels[n];if(!label)return;const el=document.createElement('div');el.style.cssText=`position:fixed;top:50%;left:50%;z-index:9500;pointer-events:none;font-family:var(--f1);font-size:clamp(2rem,8vw,4rem);color:#ffd700;-webkit-text-stroke:3px #8B4513;paint-order:stroke fill;text-shadow:0 4px 20px rgba(255,140,0,.8);animation:celebration-text 1s ease-out forwards;`;el.textContent=label;document.body.appendChild(el);el.addEventListener('animationend',()=>el.remove(),{once:true});}

/* ── Carrots ─────────────────────────────────────── */
function awardCarrots(n){SESSION.carrots+=n;savePersistent();updateCarrotDisplay();SFX.carrot();const el=document.createElement('div');el.style.cssText=`position:fixed;bottom:120px;right:24px;z-index:9400;pointer-events:none;font-size:2rem;animation:carrot-pop .6s ease-out forwards;`;el.textContent=`+${n}🥕`;document.body.appendChild(el);setTimeout(()=>el.remove(),800);}
function updateCarrotDisplay(){[$('carrot-count'),$('title-carrot-count'),$('trophy-carrot-count')].forEach(el=>{if(el)el.textContent=SESSION.carrots;});const cc=$('carrot-count');if(cc?.parentElement){cc.parentElement.style.animation='carrot-bump .4s ease';setTimeout(()=>{if(cc.parentElement)cc.parentElement.style.animation='';},400);}}

/* ══════════════════════════════════════════════════
   TIMER
══════════════════════════════════════════════════ */
function startTimer(){stopTimer();TIMER.left=TIMER.max;TIMER.lastTs=performance.now();TIMER.isRunning=true;const b=$('timer-bar-fill');if(b){b.style.transition='none';b.style.width='100%';b.style.background='#4cff6a';}TIMER.raf=requestAnimationFrame(stepTimer);}
function stopTimer(){TIMER.isRunning=false;if(TIMER.raf){cancelAnimationFrame(TIMER.raf);TIMER.raf=null;}}
function stepTimer(ts){const dt=(ts-TIMER.lastTs)/1000;TIMER.lastTs=ts;TIMER.left=Math.max(0,TIMER.left-dt);const pct=TIMER.left/TIMER.max;const b=$('timer-bar-fill');if(b){b.style.transition='none';b.style.width=(pct*100)+'%';if(pct>.5)b.style.background='#4cff6a';else if(pct>.25)b.style.background='#ffd93d';else{b.style.background='#ff4444';b.style.animation='timer-warn-flash .35s ease-in-out infinite';}}if(TIMER.left<=3&&TIMER.left>2.9)SFX.timerWarn();if(TIMER.left<=0){onTimeUp();return;}TIMER.raf=requestAnimationFrame(stepTimer);}
function addTimerBonus(s){TIMER.left=Math.min(TIMER.max,TIMER.left+s);}
function onTimeUp(){stopTimer();if(LEVEL.locked)return;LEVEL.locked=true;['sign-a','sign-b','sign-c'].forEach(id=>{$(id).classList.add('disabled');$(id).setAttribute('aria-disabled','true');});shakeScreen(LEVEL.level<=2);SFX.wrong();LEVEL.streak=Math.max(0,LEVEL.streak-1);LEVEL.multiplier=1;LEVEL.wrongsInARow++;if(LEVEL.level>=CONFIG.livesFromWorld){LEVEL.lives=Math.max(0,LEVEL.lives-1);const d=$('h'+(LEVEL.lives+1));if(d)d.classList.add('dead');if(LEVEL.lives===0)setBennyState('tired');}setBennyState('wrong');showBubble("⏰ Time's up!",'#e74c3c');setTimeout(()=>{['sign-a','sign-b','sign-c'].forEach(id=>{const s=$(id);s.classList.remove('disabled','wrong');s.removeAttribute('aria-disabled');});LEVEL.locked=false;if(LEVEL.timeTrial)startTimer();loadQuestion();},1100);}

/* ══════════════════════════════════════════════════
   TUTORIAL
══════════════════════════════════════════════════ */
function showTutorial(level,onDismiss){const w=WORLDS[level-1];if(!w.tutorial){onDismiss();return;}$('tut-title').textContent=w.tutorial.title;$('tut-body').textContent=w.tutorial.body;$('tut-visual').textContent=w.tutorial.visual();G._tutDismiss=onDismiss;showScreen('tutorial');}
function dismissTutorial(){SFX.click();if(G._tutDismiss)G._tutDismiss();G._tutDismiss=null;}

/* ══════════════════════════════════════════════════
   WORLD SCENERY + SVG HILLS
══════════════════════════════════════════════════ */
function applyWorld(level){
  const w=WORLDS[level-1];
  const world=document.querySelector('.world');
  world.className='world';world.style.animation='';
  if(level>1)world.classList.add('w'+level);
  const r=document.documentElement.style;
  r.setProperty('--world-sky',w.colors.sky);r.setProperty('--world-sky-end',w.colors.skyEnd);
  r.setProperty('--world-ground',w.colors.ground);r.setProperty('--world-ground-end',w.colors.groundEnd);
  r.setProperty('--world-accent',w.colors.accent);r.setProperty('--hud-accent',w.colors.accent);
  // Dark-world HUD tinting
  const isDark=w.colors.dark;
  r.setProperty('--card-bg',isDark?'rgba(20,10,50,0.96)':'rgba(255,248,238,0.97)');
  r.setProperty('--ink',isDark?'#f0e8ff':'#1A0F00');
  r.setProperty('--ink-light',isDark?'#c8b8ef':'#3D2800');
  r.setProperty('--card-border',isDark?'#9070c0':'#1A0F00');
  // SVG hills
  buildSVGHills($('w-svg-hills'),w.hills);
  const mt=$('w-midtrees');if(mt)mt.innerHTML=w.trees.map(t=>`<span>${t}</span>`).join('');
  const gd=$('ground-deco');if(gd){gd.innerHTML='';w.deco.forEach(d=>{const el=document.createElement('span');el.className='gd-item';el.textContent=d.e;el.style.left=d.l;gd.appendChild(el);});}
  const river=$('w-river');if(river){river.style.display=level===6?'block':'none';if(level===6){const rs=$('river-stones');if(rs)rs.innerHTML=['🪨','🪨','🪨','🪨','🪨'].map(s=>`<span class="stone">${s}</span>`).join('');}}
  const peaks=$('w-peaks');if(peaks){peaks.style.display=level===5?'block':'none';if(level===5)buildPeaks();}
  worldBurstColors=w.burstColors;
  const ribbon=$('hud-ribbon');if(ribbon){ribbon.textContent=w.name;ribbon.style.animation='none';void ribbon.offsetWidth;ribbon.style.animation='hud-ribbon-in .5s ease both';}
  const lcName=$('lc-name');if(lcName)lcName.textContent=w.name;
}

function buildSVGHills(container,hills){
  if(!container)return;container.innerHTML='';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 900 120');svg.setAttribute('preserveAspectRatio','none');
  svg.style.cssText='position:absolute;bottom:0;left:0;width:100%;height:100%;';
  hills.forEach(h=>{const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',h.d);path.setAttribute('fill',h.fill);path.setAttribute('opacity',String(h.opacity||1));svg.appendChild(path);});
  container.appendChild(svg);
}

function buildPeaks(){const c=$('w-peaks');c.innerHTML='';[{left:'5%',h:80,w:100,num:'×1'},{left:'20%',h:110,w:130,num:'×2'},{left:'38%',h:140,w:150,num:'×3'},{left:'58%',h:120,w:140,num:'×5'},{left:'76%',h:100,w:120,num:'×10'}].forEach(p=>{const el=document.createElement('div');el.className='peak';el.style.left=p.left;el.innerHTML=`<div class="peak-triangle" style="border-left-width:${p.w/2}px;border-right-width:${p.w/2}px;border-bottom-width:${p.h}px"></div><span class="peak-snow">❄️</span><span class="peak-num">${p.num}</span>`;c.appendChild(el);});}

/* ══════════════════════════════════════════════════
   SPECIAL QUESTION RENDERING
══════════════════════════════════════════════════ */
function renderQuestion(qObj){
  const eq=$('q-eq'),sa=$('q-special-area');
  if(!eq)return;
  eq.style.fontSize='';
  if(sa)sa.innerHTML='';

  const {text,showArray,numLineAdd}=qObj;

  if(text.startsWith('__dice__')){
    const n=+text.replace('__dice__','');
    eq.textContent='';
    if(sa)sa.innerHTML=buildDiceSVG(n);
  } else if(text.startsWith('__numline__')){
    const parts=text.split('__');
    const max=+parts[2],val=+parts[3];
    eq.textContent='';
    if(sa)sa.innerHTML=buildNumberLineSVG(max,val);
  } else if(text.startsWith('__word__')){
    eq.style.fontSize='clamp(.9rem,3.5vw,1.3rem)';
    eq.textContent=text.replace('__word__','');
  } else {
    eq.textContent=text;
  }

  // Addition number line visualisation
  if(numLineAdd&&sa){
    sa.innerHTML=buildAdditionLineSVG(numLineAdd.start,numLineAdd.jump,numLineAdd.max);
  }

  // Multiplication array visualisation (shown briefly then hides)
  if(showArray&&sa){
    sa.innerHTML+=buildArrayViz(showArray.rows,showArray.cols);
    setTimeout(()=>{if(sa)sa.innerHTML='';},1800);
  }
}

function buildDiceSVG(n){
  // Canonical dice dot positions (like real dice)
  const dotMap={
    1:[[50,50]],
    2:[[28,28],[72,72]],
    3:[[28,28],[50,50],[72,72]],
    4:[[28,28],[72,28],[28,72],[72,72]],
    5:[[28,28],[72,28],[50,50],[28,72],[72,72]],
    6:[[28,22],[72,22],[28,50],[72,50],[28,78],[72,78]],
    7:[[28,22],[72,22],[50,36],[28,64],[72,64],[28,78],[72,78]],
    8:[[22,22],[50,22],[78,22],[22,50],[78,50],[22,78],[50,78],[78,78]],
    9:[[22,22],[50,22],[78,22],[22,50],[50,50],[78,50],[22,78],[50,78],[78,78]],
    10:[[22,18],[50,18],[78,18],[22,46],[78,46],[22,65],[78,65],[22,82],[50,82],[78,82]],
    11:[[22,18],[50,18],[78,18],[22,46],[50,46],[78,46],[22,65],[78,65],[22,82],[50,82],[78,82]],
    12:[[22,16],[50,16],[78,16],[22,38],[50,38],[78,38],[22,62],[50,62],[78,62],[22,84],[50,84],[78,84]],
  };
  const dots=dotMap[n]||dotMap[Math.min(n,12)];
  const dotColor=n<=4?'#e74c3c':n<=7?'#e67e22':'#8e44ad';
  const faceColor=n<=4?'#fff8f8':n<=7?'#fff8f0':'#f8f4ff';
  return `<svg viewBox="0 0 100 100" style="width:90px;height:90px;display:block;margin:4px auto;filter:drop-shadow(0 4px 0 rgba(0,0,0,0.15))"><rect x="4" y="4" width="92" height="92" rx="18" fill="${faceColor}" stroke="#333" stroke-width="4"/><rect x="4" y="4" width="92" height="46" rx="18" fill="rgba(255,255,255,0.4)"/>${dots.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${n>9?6:8}" fill="${dotColor}"/>`).join('')}</svg>`;
}

function buildNumberLineSVG(max,val){
  const W=280,H=64,m=22,ly=42,step=(W-m*2)/max;
  let ticks='',labels='',marker='';
  for(let i=0;i<=max;i++){
    const x=m+i*step;
    const isMajor=i%2===0||max<=10;
    const tickH=isMajor?12:7;
    ticks+=`<line x1="${x}" y1="${ly-tickH/2}" x2="${x}" y2="${ly+tickH/2}" stroke="${i===val?'#FF6B6B':'#666'}" stroke-width="${isMajor?2.5:1.5}"/>`;
    if(isMajor&&i!==val)labels+=`<text x="${x}" y="${ly+24}" text-anchor="middle" font-size="11" fill="#555" font-family="'Nunito',sans-serif" font-weight="800">${i}</text>`;
  }
  const px=m+val*step;
  // glowing track segment from 0 to val
  if(val>0)marker+=`<line x1="${m}" y1="${ly}" x2="${px}" y2="${ly}" stroke="#FF6B6B" stroke-width="5" stroke-linecap="round" opacity="0.4"/>`;
  marker+=`<g><circle cx="${px}" cy="${ly}" r="10" fill="#FF6B6B" stroke="white" stroke-width="2.5"/>
    <text x="${px}" y="${ly+4.5}" text-anchor="middle" font-size="11" fill="white" font-family="'Nunito',sans-serif" font-weight="900">?</text></g>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:${W}px;max-width:92%;height:${H}px;display:block;margin:4px auto;overflow:visible">
    <rect x="${m-4}" y="${ly-8}" width="${W-m*2+8}" height="16" rx="8" fill="#f0f0f0"/>
    <line x1="${m}" y1="${ly}" x2="${W-m}" y2="${ly}" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
    ${ticks}${labels}${marker}</svg>`;
}

function buildAdditionLineSVG(start,jump,max){
  const W=280,H=76,m=22,ly=44,step=(W-m*2)/max;
  let ticks='',labels='',arcs='';
  for(let i=0;i<=max;i++){
    const x=m+i*step;
    const isMajor=i%2===0||max<=12;
    const tickH=isMajor?12:7;
    ticks+=`<line x1="${x}" y1="${ly-tickH/2}" x2="${x}" y2="${ly+tickH/2}" stroke="${i===start||i===start+jump?'#FF6B6B':'#666'}" stroke-width="${isMajor?2.5:1.5}"/>`;
    if(isMajor)labels+=`<text x="${x}" y="${ly+24}" text-anchor="middle" font-size="11" fill="${i===start+jump?'#FF6B6B':'#555'}" font-family="'Nunito',sans-serif" font-weight="800">${i}</text>`;
  }
  // Draw jump arc from start to start+jump
  const sx=m+start*step,ex=m+(start+jump)*step,midX=(sx+ex)/2,arcY=ly-22;
  arcs+=`<path d="M${sx},${ly} Q${midX},${arcY} ${ex},${ly}" stroke="#FF6B6B" stroke-width="2.5" fill="none" stroke-dasharray="4,3" stroke-linecap="round"/>`;
  arcs+=`<polygon points="${ex},${ly-5} ${ex-4},${ly-12} ${ex+4},${ly-12}" fill="#FF6B6B"/>`;
  // Start dot
  arcs+=`<circle cx="${sx}" cy="${ly}" r="7" fill="#54A0FF" stroke="white" stroke-width="2"/>`;
  arcs+=`<text x="${sx}" y="${ly+4}" text-anchor="middle" font-size="9" fill="white" font-family="'Nunito',sans-serif" font-weight="900">${start}</text>`;
  // Jump label
  arcs+=`<text x="${midX}" y="${arcY-6}" text-anchor="middle" font-size="10" fill="#FF6B6B" font-family="'Nunito',sans-serif" font-weight="900">+${jump}</text>`;
  // Answer marker
  arcs+=`<circle cx="${ex}" cy="${ly}" r="9" fill="#FF6B6B" stroke="white" stroke-width="2.5"/>`;
  arcs+=`<text x="${ex}" y="${ly+4.5}" text-anchor="middle" font-size="11" fill="white" font-family="'Nunito',sans-serif" font-weight="900">?</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:${W}px;max-width:92%;height:${H}px;display:block;margin:4px auto;overflow:visible">
    <rect x="${m-4}" y="${ly-8}" width="${W-m*2+8}" height="16" rx="8" fill="#f0f0f0"/>
    <line x1="${m}" y1="${ly}" x2="${W-m}" y2="${ly}" stroke="#aaa" stroke-width="3" stroke-linecap="round"/>
    ${ticks}${labels}${arcs}</svg>`;
}

function buildArrayViz(rows,cols){
  const ds=12,g=5,tw=cols*(ds+g),th=rows*(ds+g);
  const rowColors=['#FF6B6B','#54A0FF','#F2C94C','#5dbb4a','#c084fc','#fb923c'];
  let dots='';
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const x=c*(ds+g)+ds/2,y=r*(ds+g)+ds/2;
    const col=rowColors[r%rowColors.length];
    dots+=`<circle cx="${x}" cy="${y}" r="${ds/2}" fill="${col}" stroke="white" stroke-width="1.5" opacity="0.9"/>`;
  }
  const maxW=Math.min(tw,220),maxH=Math.min(th,88);
  return `<div style="text-align:center;margin:4px 0">
    <svg viewBox="0 0 ${tw} ${th}" style="width:${maxW}px;height:${maxH}px;display:inline-block">${dots}</svg>
    <div style="font-size:.75rem;color:var(--ink-light);margin-top:3px;font-family:var(--f2);font-weight:800">${rows} rows × ${cols} = ${rows*cols}</div>
  </div>`;
}

/* ══════════════════════════════════════════════════
   HINT SYSTEM
══════════════════════════════════════════════════ */
function showHintBtn(){
  let btn=$('hint-btn');
  if(!btn){
    btn=document.createElement('button');btn.id='hint-btn';btn.innerHTML='💡 Hint';
    btn.style.cssText=`position:absolute;bottom:calc(14% - 50px);left:50%;transform:translateX(-50%);z-index:450;background:#FFF9C4;border:3px solid var(--card-border);border-radius:20px;padding:7px 20px;font-family:var(--f1);font-size:1.1rem;cursor:pointer;box-shadow:3px 3px 0 var(--card-border);animation:hint-pop .35s cubic-bezier(.22,.61,.36,1) both;white-space:nowrap;`;
    btn.onclick=doHint;$('screen-game').appendChild(btn);
  }else btn.style.display='block';
}
function hideHintBtn(){const b=$('hint-btn');if(b)b.style.display='none';}
function doHint(){
  SFX.hint();hideHintBtn();
  const {currentQType:type,answer,currentHint:hint}=LEVEL;
  let msg='';
  const eq=$('q-eq');const txt=eq?eq.textContent:'';
  if(type==='count'){
    msg=`Count carefully: the answer is <strong>${answer}</strong> 🔢`;
  }else if(type==='add'){
    const parts=txt.split('+');
    if(parts.length>=2){
      const a=parseInt(parts[0]),b=parseInt(parts[1]);
      if(!isNaN(a)&&!isNaN(b)){
        const dots='🔵'.repeat(Math.min(a,10))+(a>10?'…':'')+' + '+'🔴'.repeat(Math.min(b,10))+(b>10?'…':'');
        msg=`${dots}<br>= <strong>${answer}</strong>`;
      }else msg=`The answer is: <strong>${answer}</strong>`;
    }else msg=`The answer is: <strong>${answer}</strong>`;
  }else if(type==='sub'){
    const parts=txt.split('−');
    if(parts.length>=2){
      const a=parseInt(parts[0]),b=parseInt(parts[1]);
      if(!isNaN(a)&&!isNaN(b)){
        msg=`Start with ${'🟢'.repeat(Math.min(a,12))+(a>12?'…':'')}<br>Remove ${'❌'.repeat(Math.min(b,8))+(b>8?'…':'')} → <strong>${answer}</strong>`;
      }else msg=`Count back from the bigger number → <strong>${answer}</strong>`;
    }else msg=`Count back from the bigger number → <strong>${answer}</strong>`;
  }else if(type==='estimate'){
    msg=`Round each to nearest 10, then add → <strong>${answer}</strong>`;
  }else if(type==='missing'){
    msg=`The missing number is: <strong>${answer}</strong>`;
  }else if(type==='fact'){
    msg=`Remember the fact family! Answer: <strong>${answer}</strong>`;
  }else if(type==='mul'){
    const parts=txt.split('×');
    if(parts.length>=2){
      const a=parseInt(parts[0]),b=parseInt(parts[1]);
      if(!isNaN(a)&&!isNaN(b)&&a<=5&&b<=5){
        const groups=Array.from({length:a},()=>'🟡'.repeat(b)).join(' | ');
        msg=`${groups} = <strong>${answer}</strong>`;
      }else msg=`Times tables: <strong>${answer}</strong>`;
    }else msg=`Times tables: <strong>${answer}</strong>`;
  }else{
    msg=`The answer is: <strong>${answer}</strong>`;
  }
  const old=$('hint-bubble');if(old)old.remove();
  const el=document.createElement('div');el.id='hint-bubble';
  el.style.cssText=`position:absolute;bottom:calc(14% - 100px);left:50%;transform:translateX(-50%);z-index:445;background:rgba(255,249,196,.98);border:3px solid var(--card-border);border-radius:16px;padding:10px 18px;font-family:var(--f2);font-weight:800;font-size:.9rem;text-align:center;white-space:nowrap;box-shadow:4px 4px 0 var(--card-border);animation:hint-pop .3s ease both;max-width:80vw;white-space:normal;`;
  el.innerHTML=`💡 <em style="font-style:normal;color:var(--ink-light)">${hint}</em><br>${msg}`;
  $('screen-game').appendChild(el);
  setTimeout(()=>el.remove(),5000);
}

/* ══════════════════════════════════════════════════
   ADAPTIVE DIFFICULTY
══════════════════════════════════════════════════ */
function adaptiveDiff(base){
  // Smooth adaptive: accuracy over recent questions
  if(SESSION.accuracy>0.9&&base<4)return Math.min(4,base+1);
  if(SESSION.accuracy>0.8&&base<4&&LEVEL.streak>=4)return Math.min(4,base+1);
  if(SESSION.accuracy<0.55&&base>0)return Math.max(0,base-1);
  if(SESSION.accuracy<0.45&&base>0)return Math.max(0,base-2);
  return base;
}
function updateAccuracy(correct){
  SESSION.qCount++;
  if(correct)SESSION.correctCount++;
  // Exponential moving average, weighted more toward recent
  SESSION.accuracy=SESSION.accuracy*0.65+(correct?1:0)*0.35;
}

/* ══════════════════════════════════════════════════
   START / NAV
══════════════════════════════════════════════════ */
function startGame(level,timeTrial=false){
  SFX.click();
  if(level>1&&!SESSION.unlockedWorlds.includes(level)){showBubble('Complete the previous world first! 🔒','#e74c3c');return;}
  LEVEL.level=level;LEVEL.q=0;LEVEL.lvlPoints=0;LEVEL.lives=CONFIG.livesStart;
  LEVEL.locked=false;LEVEL.multRound=0;LEVEL.streak=0;LEVEL.multiplier=1;
  LEVEL.timeTrial=timeTrial;LEVEL.wrongsInARow=0;LEVEL.wrongsOnCurrentQ=0;
  TIMER.max=CONFIG.timerByWorld[level-1];TIMER.left=TIMER.max;
  SESSION.points=0;SESSION.missedQuestions=[];SESSION.qCount=0;SESSION.correctCount=0;SESSION.accuracy=0.75;
  scoreDisplayed=0;
  applyWorld(level);
  for(let i=1;i<=5;i++){const p=$('pip'+i);if(p)p.classList.remove('done','active');}
  for(let i=1;i<=3;i++){const h=$('h'+i);if(h){h.classList.remove('dead');h.setAttribute('aria-label','Life '+i);}}
  $('hud-score').textContent='0';
  const livesEl=document.querySelector('.hud-lives');if(livesEl)livesEl.style.display=level>=CONFIG.livesFromWorld?'flex':'none';
  moveBenny(0,false);setBennyState('idle');updateCarrotDisplay();hideHintBtn();
  const tw=$('timer-wrap');if(tw)tw.style.display=timeTrial?'block':'none';
  const spd=$('speed-round-badge');if(spd)spd.style.display='none';
  showTutorial(level,()=>{
    showScreen('game');
    const chip=$('q-chip');chip.classList.remove('in');
    setTimeout(()=>{chip.classList.add('in');setBennyState('thinking');setTimeout(()=>loadQuestion(),300);if(LEVEL.timeTrial)startTimer();},350);
  });
}

function goHome(){
  SFX.click();stopTimer();
  const chip=$('q-chip');if(chip)chip.classList.remove('in');
  hideBubble();hideHintBtn();sparkleTrail=[];
  const world=document.querySelector('.world');if(world)world.style.animation='';
  // Reset dark-mode vars
  const r=document.documentElement.style;
  r.setProperty('--card-bg','rgba(255,248,238,0.97)');r.setProperty('--ink','#1A0F00');
  r.setProperty('--ink-light','#3D2800');r.setProperty('--card-border','#1A0F00');
  setTimeout(()=>{showScreen('title');refreshWorldButtons();},180);
}
function replayLevel(){SFX.click();startGame(LEVEL.level,LEVEL.timeTrial);}
function nextLevel(){SFX.click();LEVEL.level>=6?showWin():startGame(LEVEL.level+1,LEVEL.timeTrial);}

/* ══════════════════════════════════════════════════
   QUESTION GENERATION + LOAD
══════════════════════════════════════════════════ */
function genOpts(answer,customOpts){
  if(customOpts)return customOpts;
  // String answers (e.g. division with remainder "3 r2")
  if(typeof answer==='string'){
    const match=answer.match(/^(\d+) r(\d+)$/);
    if(match){
      const q=+match[1],r=+match[2];
      const d1=`${q} r${r===1?2:r-1}`;
      const d2=`${q+1} r0`;
      return shuffle([answer,d1,d2]);
    }
    return shuffle([answer,String(+answer+1),String(Math.max(0,+answer-1))]);
  }
  const s=new Set([answer]);let t=0;
  while(s.size<3&&t++<80){const off=rand(1,Math.max(4,Math.floor(answer*.4)))*(Math.random()<.5?1:-1);const d=answer+off;if(d>=0&&d<=144)s.add(d);}
  let f=1;while(s.size<3){if(!s.has(f))s.add(f);f++;}
  return shuffle([...s]);
}

function loadQuestion(){
  const world=WORLDS[LEVEL.level-1];
  const diff=adaptiveDiff(LEVEL.q);
  const qObj=world.generateQuestion(diff,SESSION);
  LEVEL.answer=qObj.answer;LEVEL.currentQType=qObj.type||'add';LEVEL.currentHint=qObj.hint||'';
  LEVEL.wrongsOnCurrentQ=0;hideHintBtn();

  const opts=genOpts(qObj.answer,qObj.customOpts);
  LEVEL.opts=opts;

  $('q-hint').textContent=qObj.hint;

  // Render question (special types handled)
  const eq=$('q-eq');eq.style.animation='none';void eq.offsetWidth;
  renderQuestion(qObj);
  eq.style.animation='q-pop-in .35s cubic-bezier(.22,.61,.36,1) both';

  // Staggered sign bounce-in
  ['sign-a','sign-b','sign-c'].forEach((id,i)=>{
    const s=$(id);s.classList.remove('correct','wrong','disabled','revealing');
    s.setAttribute('aria-label',`Answer ${['A','B','C'][i]}: ${opts[i]}`);s.removeAttribute('aria-disabled');
    s.style.animation='none';void s.offsetWidth;
    s.style.animation=`sign-bounce-in .35s cubic-bezier(.22,.61,.36,1) ${i*80}ms both`;
    $('sign-val-'+['a','b','c'][i]).textContent=opts[i];
  });

  // Progress pips
  const pb=$('hud-pips-bar');if(pb)pb.setAttribute('aria-valuenow',LEVEL.q);
  for(let i=1;i<=5;i++){const p=$('pip'+i);if(!p)continue;p.classList.remove('done','active');if(i-1<LEVEL.q)p.classList.add('done');else if(i-1===LEVEL.q)p.classList.add('active');}

  // Speed round badge on Q5
  const spd=$('speed-round-badge');if(spd)spd.style.display=LEVEL.q===4?'block':'none';

  hideBubble();LEVEL.locked=false;
  setBennyState('thinking');setTimeout(()=>setBennyState('idle'),800);
}

/* ══════════════════════════════════════════════════
   ANSWER HANDLING
══════════════════════════════════════════════════ */
function checkAnswer(idx){
  if(LEVEL.locked)return;LEVEL.locked=true;
  const sIds=['sign-a','sign-b','sign-c'];const chosen=LEVEL.opts[idx];
  sIds.forEach(id=>{$(id).classList.add('disabled');$(id).setAttribute('aria-disabled','true');});
  const pressed=$(sIds[idx]);pressed.style.animation='sign-press .15s ease';setTimeout(()=>{if(pressed)pressed.style.animation='';},200);
  const correct=String(chosen)===String(LEVEL.answer);
  if(correct)onCorrect(sIds[idx]);else onWrong(sIds[idx]);
}

function onCorrect(signId){
  stopTimer();hideHintBtn();updateAccuracy(true);
  LEVEL.streak++;LEVEL.wrongsInARow=0;LEVEL.wrongsOnCurrentQ=0;
  if(LEVEL.streak>=5)LEVEL.multiplier=3;else if(LEVEL.streak>=3)LEVEL.multiplier=2;else if(LEVEL.streak>=2)LEVEL.multiplier=1.5;else LEVEL.multiplier=1;
  const isSpeed=LEVEL.q===4;const basePts=isSpeed?200:100;const earned=Math.round(basePts*LEVEL.multiplier);
  LEVEL.lvlPoints+=earned;SESSION.points+=earned;
  animateScore(SESSION.points);
  const coin=document.querySelector('.hud-coin');if(coin){coin.classList.remove('bump');void coin.offsetWidth;coin.classList.add('bump');}
  $(signId).classList.add('correct');$(signId).style.animation='sign-correct-ripple .6s ease forwards';
  flashScreen(LEVEL.multiplier>1?'rgba(255,215,0,0.6)':'white');SFX.correct();
  if(LEVEL.streak===5){SFX.superMode();celebrateStreak(5);}else if(LEVEL.streak===3){SFX.streak();celebrateStreak(3);}else if(LEVEL.streak===2)celebrateStreak(2);
  const msg=pick(CORRECT_MSGS);srAnnounce('Correct! '+msg+` +${earned} points`);
  spawnFloatingScore(earned,LEVEL.multiplier>1);setBennyState('correct');showBubble(msg,'#27ae60');
  if(!prefersReducedMotion)doStarBurst(LEVEL.streak>=5?30:LEVEL.streak>=3?20:14);
  if(LEVEL.timeTrial)addTimerBonus(4);
  if((LEVEL.q+1)%3===0)awardCarrots(1);
  setTimeout(()=>{
    LEVEL.q++;moveBenny(LEVEL.q);
    bennyXPct=parseFloat(BENNY_X[Math.min(LEVEL.q,BENNY_X.length-1)]);
    const done=$('pip'+LEVEL.q);if(done){done.classList.remove('active');done.classList.add('done');}
    const next=$('pip'+(LEVEL.q+1));if(next)next.classList.add('active');
    if(LEVEL.q>=5){stopTimer();SFX.levelUp();setBennyState('victory');setTimeout(showLCCinematic,900);}
    else{if(LEVEL.timeTrial)startTimer();setTimeout(loadQuestion,650);}
  },950);
}

function onWrong(signId){
  stopTimer();LEVEL.wrongsInARow++;LEVEL.wrongsOnCurrentQ++;updateAccuracy(false);
  $(signId).classList.add('wrong');shakeScreen(LEVEL.level<=2);SFX.wrong();
  if(LEVEL.wrongsInARow>=2||LEVEL.level>=CONFIG.livesFromWorld)LEVEL.streak=Math.max(0,LEVEL.streak-1);
  LEVEL.multiplier=Math.max(1,LEVEL.multiplier>1?LEVEL.multiplier-.5:1);
  updateStreakBadge();
  // Track for review
  const qText=$('q-eq')?.textContent||'?';
  SESSION.missedQuestions.push({q:qText,answer:LEVEL.answer});
  const useLives=LEVEL.level>=CONFIG.livesFromWorld;
  if(useLives){LEVEL.lives=Math.max(0,LEVEL.lives-1);const d=$('h'+(LEVEL.lives+1));if(d)d.classList.add('dead');if(LEVEL.lives===0)setBennyState('tired');else setBennyState('wrong');}else setBennyState('wrong');
  const msg=pick(WRONG_MSGS);srAnnounce('Wrong. '+msg);showBubble(msg,'#e74c3c');
  // Reveal correct answer
  const cIdxN=typeof LEVEL.answer==='string'?LEVEL.opts.findIndex(o=>String(o)===String(LEVEL.answer)):LEVEL.opts.indexOf(LEVEL.answer);
  const cSignId=['sign-a','sign-b','sign-c'][Math.max(0,cIdxN)];
  setTimeout(()=>{const cs=$(cSignId);if(cs){cs.classList.add('revealing');cs.style.animation='correct-reveal .3s ease forwards';}},600);
  if(LEVEL.wrongsOnCurrentQ>=CONFIG.hintAfterWrongs)showHintBtn();
  setTimeout(()=>{['sign-a','sign-b','sign-c'].forEach(id=>{const s=$(id);s.classList.remove('disabled','wrong','revealing');s.removeAttribute('aria-disabled');s.style.animation='';});LEVEL.locked=false;if(LEVEL.timeTrial)startTimer();},1400);
}

function moveBenny(step,animate=true){
  const el=$('benny-wrap');if(!el)return;
  el.style.transition=animate?(prefersReducedMotion?'left .2s ease':'left .7s cubic-bezier(.34,1.5,.64,1)'):'none';
  el.style.left=BENNY_X[Math.min(step,BENNY_X.length-1)];
  bennyXPct=parseFloat(BENNY_X[Math.min(step,BENNY_X.length-1)]);
}

/* ══════════════════════════════════════════════════
   LEVEL COMPLETE CINEMATIC
══════════════════════════════════════════════════ */
function showLCCinematic(){
  if(prefersReducedMotion){showLC();return;}
  const bw=$('benny-wrap');
  if(bw){
    bw.style.transition='left 1.1s cubic-bezier(.2,0,.4,1)';
    bw.style.left='82%';
    // Animate legs running
    const ll=$('benny-leg-left'),lr=$('benny-leg-right');
    if(ll)ll.style.animation='leg-hop-l .3s ease-in-out infinite';
    if(lr)lr.style.animation='leg-hop-r .3s ease-in-out infinite .15s';
  }
  const home=document.querySelector('.w-home');
  setTimeout(()=>{
    if(home)home.style.animation='home-bounce .5s ease both';
    for(let i=0;i<4;i++){
      const p=document.createElement('div');
      p.style.cssText=`position:absolute;right:5%;bottom:${41+i*3}%;font-size:${1+i*0.2}rem;z-index:200;animation:smoke-puff 1s ease-out ${i*180}ms both;pointer-events:none;`;
      p.textContent='💨';SCR.game?.appendChild(p);setTimeout(()=>p.remove(),1500);
    }
    // Stars burst from home
    const homeR=home?.getBoundingClientRect();
    if(homeR)spawnP(homeR.left+homeR.width/2,homeR.top,['#ffd700','#fff','#ffaa00'],12,2);
  },1000);
  setTimeout(showLC,2200);
}

/* ══════════════════════════════════════════════════
   LEVEL COMPLETE
══════════════════════════════════════════════════ */
function computeStars(){if(LEVEL.wrongsInARow===0&&LEVEL.streak>=3)return 3;if(LEVEL.wrongsInARow<=1)return 2;return 1;}
function showLC(){
  const stars=computeStars();
  SESSION.worldStars[LEVEL.level]=Math.max(stars,SESSION.worldStars[LEVEL.level]||0);
  if(LEVEL.level<6&&!SESSION.unlockedWorlds.includes(LEVEL.level+1))SESSION.unlockedWorlds.push(LEVEL.level+1);
  savePersistent();
  $('lc-score').textContent=LEVEL.lvlPoints;$('lc-next').textContent=LEVEL.level>=6?'FINISH 🏆':'NEXT WORLD ▶';
  const w=WORLDS[LEVEL.level-1];
  if(w.badge){$('badge-icon').textContent=w.badge.icon;$('badge-name').textContent=w.badge.name;if(!SESSION.earnedBadges.find(b=>b.name===w.badge.name))SESSION.earnedBadges.push(w.badge);}
  const starRow=document.querySelector('.lc-star-row');if(starRow){const els=starRow.querySelectorAll('.lc-s');els.forEach((el,i)=>{el.style.opacity=i<stars?'1':'.25';el.style.filter=i<stars?'':'grayscale(1)';});}
  const revBtn=$('lc-review-btn');if(revBtn)revBtn.style.display=SESSION.missedQuestions.length>0?'block':'none';
  awardCarrots(stars*2);spawnConfetti();showScreen('lc');
  srAnnounce(`Level complete! ${stars} star${stars!==1?'s':''}!`);
}

/* ── Review mode ─────────────────────────────────── */
function showReview(){
  SFX.click();const grid=$('review-grid');if(!grid)return;
  const uniq=[...new Map(SESSION.missedQuestions.map(q=>[q.q,q])).values()];
  grid.innerHTML=uniq.length===0
    ?'<p style="text-align:center;font-size:1.1rem;">Perfect round! 🎉</p>'
    :uniq.map(q=>`<div class="review-item"><div class="review-q">${q.q}</div><div class="review-ans">✅ ${q.answer}</div></div>`).join('');
  showScreen('review');
}
function closeReview(){SFX.click();showScreen('lc');}

/* ══════════════════════════════════════════════════
   WIN
══════════════════════════════════════════════════ */
function showWin(){$('win-total').textContent=SESSION.points+' Points';$('win-stars').textContent='⭐'.repeat(Math.min(Math.floor(SESSION.points/100),10));$('win-badges').innerHTML=SESSION.earnedBadges.map(b=>`<span class="win-badge-icon" title="${b.name}">${b.icon}</span>`).join('');spawnConfetti();showScreen('win');awardCarrots(5);}

function spawnConfetti(){if(prefersReducedMotion)return;const c=$('lc-confetti');if(!c)return;c.innerHTML='';const colors=['#ffd93d','#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ff9ff3','#54a0ff','#a78bfa'];const frag=document.createDocumentFragment();for(let i=0;i<60;i++){const el=document.createElement('div');el.className='conf';el.style.cssText=[`left:${Math.random()*100}%`,`background:${colors[i%colors.length]}`,`animation-duration:${1.2+Math.random()*2.2}s`,`animation-delay:${Math.random()*1.5}s`,`width:${5+Math.random()*8}px`,`height:${4+Math.random()*8}px`,`border-radius:${Math.random()>.5?'50%':'2px'}`].join(';');frag.appendChild(el);}c.appendChild(frag);}

/* ══════════════════════════════════════════════════
   WORLD MAP + TROPHY
══════════════════════════════════════════════════ */
function refreshWorldButtons(){
  WORLDS.forEach(w=>{const btn=document.querySelector(`.wbtn-${w.id}`);if(!btn)return;const unlocked=SESSION.unlockedWorlds.includes(w.id);const stars=SESSION.worldStars[w.id]||0;btn.classList.toggle('locked',!unlocked);btn.disabled=!unlocked;const se=btn.querySelector('.wbtn-stars');if(se)se.textContent=stars>0?'⭐'.repeat(stars):'';let le=btn.querySelector('.wbtn-lock');if(!unlocked){if(!le){le=document.createElement('div');le.className='wbtn-lock';le.textContent='🔒';btn.appendChild(le);}}else{if(le)le.remove();}});
  updateCarrotDisplay();
}
function showTrophyRoom(){SFX.click();const el=$('trophy-grid');if(!el)return;el.innerHTML=WORLDS.map(w=>{const earned=SESSION.earnedBadges.find(b=>b.name===w.badge.name);const stars=SESSION.worldStars[w.id]||0;return `<div class="trophy-item ${earned?'earned':'locked'}"><div class="trophy-icon">${earned?w.badge.icon:'🔒'}</div><div class="trophy-name">${w.badge.name}</div><div class="trophy-world">${w.name}</div><div class="trophy-stars">${stars>0?'⭐'.repeat(stars):'—'}</div></div>`;}).join('');showScreen('trophy');}
function closeTrophy(){SFX.click();showScreen('title');}
function toggleTimeTrial(){G.timeTrial=!G.timeTrial;const sw=$('tt-switch');if(sw){sw.classList.toggle('on',G.timeTrial);sw.setAttribute('aria-checked',G.timeTrial?'true':'false');}SFX.click();}

/* ══════════════════════════════════════════════════
   SPLASH + BOOT
══════════════════════════════════════════════════ */
function boot(){
  showScreen('splash');
  setTimeout(()=>{
    showScreen('title');
    refreshWorldButtons();
    // Put SVG Benny in title screen Benny too
    const tb=$('title-benny');if(tb)tb.textContent='🐰'; // keep emoji on title
    // Init SVG Benny for game screen (will be called again on startGame)
    initBennySVG();
  },2300);
}
boot();
Object.entries(SCR).forEach(([k,e])=>{if(e)e.setAttribute('aria-hidden',k==='splash'?'false':'true');});
