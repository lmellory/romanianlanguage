
const KEY="vorbeste_ro_state_v1";
let mem=null, canStore=true;
try{localStorage.setItem("_t","1");localStorage.removeItem("_t");}catch(e){canStore=false;}
let recoveryWarning = '';
function fresh(){return StudyCore.fresh();}
function load(){
  if(mem)return mem;
  try{const raw=localStorage.getItem(KEY);mem=raw?StudyCore.validate(JSON.parse(raw)):fresh();
    // Preserve valid daily progress from previous versions after validating it below.
    if(raw){const old=JSON.parse(raw);if(validQuests(old.quests))mem.quests=old.quests;}
  }catch(e){mem=fresh();recoveryWarning='Не удалось прочитать сохранение. Исходная копия сохранена для восстановления.';
    try{const raw=localStorage.getItem(KEY);if(raw)localStorage.setItem(KEY+'_recovery',raw);}catch(_){} }
  return mem;
}
function validQuests(q){return q&&q.date===todayStr()&&Array.isArray(q.items)&&q.items.length===5&&q.items.every(x=>
  ['rev','conj','sent','read','timer'].includes(x.id)&&Number.isInteger(x.prog)&&x.prog>=0&&x.prog<=100&&typeof x.done==='boolean')&&new Set(q.items.map(x=>x.id)).size===5;}
let S=load();
function save(){if(!canStore)return false;try{localStorage.setItem(KEY,JSON.stringify(S));return true;}
  catch(e){canStore=false;toast('Не удалось сохранить прогресс. Сделайте экспорт в настройках.');return false;}}
function todayStr(){return StudyCore.day();}
document.documentElement.dataset.theme=S.theme;
const RANKS=["Boboc","Ucenic","Călător","Vorbitor","Cărturar","Maestru","Erudit","Legendă"];
function levelInfo(xp){let lvl=1,need=200,acc=0;while(xp>=acc+need){acc+=need;lvl++;need=Math.round(need*1.22);}
  return{lvl,into:xp-acc,need,title:RANKS[Math.min(RANKS.length-1,Math.floor((lvl-1)/2))]};}
function addXP(n){S.xp+=n;const t=todayStr();S.days[t]=(S.days[t]||0)+n;
  if(S.lastDay!==t){if(S.lastDay){const d=(new Date(t)-new Date(S.lastDay))/864e5;S.streak=d===1?S.streak+1:1;}else S.streak=1;S.lastDay=t;}
  save();paintHeader();}
/* ====== SM-2 ====== */
function sm2(card,q){return StudyCore.review(card,q);}
function deckAdd(ro,ru){if(typeof ro!=="string"||typeof ru!=="string"||!ro.trim()||!ru.trim()||ro.length>500||ru.length>500)return false;const k=ro.toLowerCase();if(["__proto__","constructor","prototype"].includes(k))return false;if(Object.hasOwn(S.deck,k)){toast("Уже в словаре");return false;}
  S.deck[k]={ro,ru,ef:2.5,interval:0,reps:0,lapses:0,due:Date.now()};save();return true;}
function dueCards(){const now=Date.now();return Object.values(S.deck).filter(c=>(c.due||0)<=now);}
/* ====== АУДИО (Web Speech) ====== */
let VOICES=[],SPEAK_OK=("speechSynthesis"in window),READ_BUF="";
function loadVoices(){if(SPEAK_OK)VOICES=speechSynthesis.getVoices();}
if(SPEAK_OK){loadVoices();speechSynthesis.onvoiceschanged=loadVoices;}
function speak(text){if(!SPEAK_OK){toast("Озвучка недоступна в этом браузере.");return;}if(!text)return;const u=new SpeechSynthesisUtterance(text);u.lang="ro-RO";u.rate=.92;
  const v=VOICES.find(x=>x.lang&&x.lang.toLowerCase().startsWith("ro"));if(v)u.voice=v;
  u.onerror=function(e){if(!["canceled","interrupted"].includes(e.error))toast("Не удалось озвучить. Проверьте голос румынского языка на устройстве.");};try{speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){toast("Озвучка недоступна.");}}
function speakBuf(){speak(READ_BUF);}
function beep(){try{const a=new(window.AudioContext||window.webkitAudioContext)();const o=a.createOscillator(),g=a.createGain();
  o.connect(g);g.connect(a.destination);o.type="sine";o.frequency.value=660;g.gain.setValueAtTime(.0001,a.currentTime);
  g.gain.exponentialRampToValueAtTime(.2,a.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.5);
  o.start();o.stop(a.currentTime+.5);}catch(e){}}
/* ====== ПРОВЕРКА ВВОДА ====== */
function norm(s){return s.trim().normalize("NFC").toLowerCase().replace(/[ş]/g,"ș").replace(/[ţ]/g,"ț").replace(/\s+/g," ");}
function stripD(s){return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[șş]/g,"s").replace(/[țţ]/g,"t").replace(/[ăâ]/g,"a").replace(/î/g,"i");}
function accepts(ans){let arr=Array.isArray(ans)?ans:String(ans).split("/");let out=[];
  arr.forEach(a=>{a=a.trim();out.push(a);if(/^a\s/i.test(a))out.push(a.replace(/^a\s/i,""));});return out;}
function checkText(inp,ans){const L=accepts(ans).map(norm),i=norm(inp);
  if(L.includes(i))return"ok";if(L.map(stripD).includes(stripD(i)))return"almost";return"no";}
/* ====== UTILS ====== */
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
function rnd(a){return a[Math.random()*a.length|0];}
const LV=["A1","A2","B1","B2","C1","C2"];const lvI=l=>LV.indexOf(l);
function userMaxI(){return S.level?lvI(S.level):0;}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
/* ====== ГЕНЕРАТОР ФОРМ ====== */
const PRON=["eu","tu","el/ea","noi","voi","ei/ele"];
const AUX_PC=["am","ai","a","am","ați","au"];
const AUX_V=["voi","vei","va","vom","veți","vor"];
const TENSES=["Prezent","Perfect compus","Conjunctiv","Viitor"];
function conjugate(v,tense,p){
  if(tense==="Prezent")return v.pr[p];
  if(tense==="Perfect compus")return AUX_PC[p]+" "+v.part;
  if(tense==="Viitor")return AUX_V[p]+" "+v.inf.replace(/^a /,"");
  if(tense==="Conjunctiv"){let f=v.cf?v.cf[p]:((p===2||p===5)?v.c3:v.pr[p]);return "să "+f;}
}
/* ====== HEADER / NAV / ROUTER ====== */
function paintHeader(){const li=levelInfo(S.xp);
  document.getElementById("hStreak").textContent=S.streak;
  document.getElementById("hXp").textContent=S.xp;
  document.getElementById("xpFill").style.width=Math.round(li.into/li.need*100)+"%";
  document.getElementById("lvlPill").textContent=S.level||"—";}
let VIEW="home";
const app=document.getElementById("app");
document.getElementById("nav").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  VIEW=b.dataset.v;[...document.querySelectorAll("#nav button")].forEach(x=>x.classList.toggle("on",x===b));render();window.scrollTo(0,0);});
function render(){paintHeader();document.querySelectorAll("#nav button").forEach(b=>{if(b.dataset.v===VIEW)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});({home:renderHome,practice:renderPractice,deck:renderDeck,read:renderRead,oath:renderOath}[VIEW]||renderHome)();}
function go(v){VIEW=v;[...document.querySelectorAll("#nav button")].forEach(x=>x.classList.toggle("on",x.dataset.v===v));render();window.scrollTo(0,0);}
/* ====== МОДАЛКА / ТОСТ ====== */
let modalReturn=null,testTimeout=null;
function openModal(html){const modal=document.getElementById('modal');if(!modal.classList.contains('on'))modalReturn=document.activeElement;
  document.getElementById('modalBox').innerHTML='<button class="modal-close" aria-label="Закрыть окно" onclick="closeModal()">×</button>'+html;
  modal.hidden=false;modal.classList.add('on');document.body.style.overflow='hidden';
  document.getElementById('app').inert=true;document.getElementById('nav').inert=true;document.querySelector('header').inert=true;
  const target=document.getElementById('modalBox').querySelector('input,select,button');(target||modal).focus();}
function closeModal(){clearTimeout(testTimeout);testTimeout=null;const modal=document.getElementById('modal');modal.classList.remove('on');modal.hidden=true;
  document.getElementById('sheet').classList.remove('on');document.getElementById('sheet').inert=true;document.body.style.overflow='';
  document.getElementById('app').inert=false;document.getElementById('nav').inert=false;document.querySelector('header').inert=false;
  if(SPEAK_OK)speechSynthesis.cancel();if(modalReturn&&modalReturn.isConnected)modalReturn.focus();}
document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
document.addEventListener('keydown',e=>{
  const modal=document.getElementById('modal');if(!modal.classList.contains('on'))return;
  if(e.key==='Escape'){e.preventDefault();closeModal();return;}
  if(e.key==='Tab'){const nodes=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select,a[href],[tabindex="0"]')].filter(x=>x.offsetParent!==null);
    const sheet=document.getElementById('sheet');if(sheet.classList.contains('on'))nodes.push(...sheet.querySelectorAll('button:not(:disabled)'));
    const first=nodes[0],last=nodes.at(-1);if(!first){e.preventDefault();modal.focus();}
    else if(e.shiftKey&&(document.activeElement===first||!nodes.includes(document.activeElement))){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&(document.activeElement===last||!nodes.includes(document.activeElement))){e.preventDefault();first.focus();}}
});
let toastT;function toast(m){const el=document.getElementById("toast");el.textContent=m;el.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove("on"),2200);}
/* ====== КВЕСТЫ ====== */
function genQuests(){return{date:todayStr(),items:[
  {id:"rev",t:"Повторить 12 слов",icon:"🔁",goal:12,prog:0,xp:35,done:false},
  {id:"conj",t:"Спрягай 8 глаголов",icon:"🔀",goal:8,prog:0,xp:30,done:false},
  {id:"sent",t:"Собери 4 предложения",icon:"🧩",goal:4,prog:0,xp:25,done:false},
  {id:"read",t:"Прочитай 1 текст вслух",icon:"📖",goal:1,prog:0,xp:20,done:false},
  {id:"timer",t:"Заверши сессию фокуса",icon:"⏱️",goal:1,prog:0,xp:40,done:false}
]};}
function ensureQuests(){
  const canonical=genQuests(),old=validQuests(S.quests)?S.quests:null;
  if(old)canonical.items.forEach(q=>{const prev=old.items.find(x=>x.id===q.id);q.prog=Math.min(q.goal,prev.prog);q.done=prev.done&&q.prog===q.goal;});
  S.quests=canonical;save();}
function quest(id,n){n=n||1;ensureQuests();const q=S.quests.items.find(x=>x.id===id);if(!q||q.done)return;
  q.prog=Math.min(q.goal,q.prog+n);if(q.prog>=q.goal){q.done=true;addXP(q.xp);toast("✅ Квест: +"+q.xp+" XP");}
  save();if(VIEW==="home")renderHome();}
/* ====== input helpers ====== */
function diaBtns(id){return ["ă","â","î","ș","ț"].map(c=>'<button onclick="insChar(\''+id+'\',\''+c+'\')">'+c+'</button>').join("");}
function insChar(id,c){const el=document.getElementById(id);if(!el||el.disabled)return;const p=el.selectionStart==null?el.value.length:el.selectionStart;
  el.value=el.value.slice(0,p)+c+el.value.slice(el.selectionEnd==null?p:el.selectionEnd);el.focus();el.selectionStart=el.selectionEnd=p+1;}
function spk(t){const encoded=encodeURIComponent(t).replace(/'/g,'%27');return '<button class="spk" onclick="speak(decodeURIComponent(\''+encoded+'\'))" aria-label="Произнести по-румынски">🔊</button>';}
/* ====== VIEW: HOME ====== */
let timer={left:0,id:null,running:false,end:0};
function fmt(s){s=Math.max(0,s|0);const m=(s/60|0),x=s%60;return (m<10?"0":"")+m+":"+(x<10?"0":"")+x;}
function renderHome(){
  ensureQuests();
  const li=levelInfo(S.xp),due=dueCards().length,todayXP=S.days[todayStr()]||0;
  let h='<section class="study-intro"><div class="eyebrow">ROMÂNĂ · ПРАКТИКА КАЖДЫЙ ДЕНЬ</div><h1>Понемногу. Каждый день.</h1><p>Слова, глаголы и маленькие открытия.<br>Продолжим знакомство с румынским?</p><div class="date">'+new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'long'})+'</div></section>';
  if(!canStore||recoveryWarning)h+='<div class="storage-warning">'+esc(recoveryWarning||'Автосохранение недоступно. Сделайте экспорт прогресса перед закрытием вкладки.')+'</div>';
  if(!S.level){
    h+='<div class="card glow"><div class="corner"></div><div class="eyebrow">Старт</div>'+
    '<h2 style="font-size:24px;margin:6px 0">С чего начнём?</h2>'+
    '<p class="sub">20 вопросов помогут выбрать стартовую сложность. Это ориентир для занятий, а не оценка CEFR или сертификат.</p>'+
    '<button class="btn mg block" style="margin-top:14px" onclick="startTest()">Подобрать сложность →</button>'+
    '<button class="btn ghost block sm" style="margin-top:8px" onclick="S.level=\'A1\';save();render()">Начать с основ · A1</button></div>';
  }
  h+='<div class="card"><div class="row between"><div><div class="eyebrow">Профиль · '+esc(li.title)+'</div>'+
   '<h2 style="font-size:26px;margin-top:4px">Уровень '+li.lvl+' <span class="neon-mg" style="font-size:16px">'+(S.level||"")+'</span></h2></div>'+
   '<div style="text-align:right"><div class="mono" style="font-size:13px;color:var(--tx3)">'+li.into+' / '+li.need+' XP</div></div></div>'+
   '<div class="xpbar" style="margin-top:12px;border-radius:9px"><i style="width:'+Math.round(li.into/li.need*100)+'%"></i></div></div>';
  h+='<div class="grid g3"><div class="stat"><div class="n neon">🔥'+S.streak+'</div><div class="l">дней подряд</div></div>'+
   '<div class="stat"><div class="n" style="color:var(--gd)">'+todayXP+'</div><div class="l">XP сегодня</div></div>'+
   '<div class="stat"><div class="n neon-mg">'+due+'</div><div class="l">к повтору</div></div></div>';
  const tdisp=(timer.running||timer.left)?fmt(timer.left):fmt(S.timerMin*60);
  h+='<div class="home-layout"><div class="card glow"><div class="eyebrow">Сессия фокуса</div>'+
   '<div class="timer-d '+(timer.running?"run":"")+'" id="timerD" style="margin:10px 0">'+tdisp+'</div>'+
   '<div class="row" style="justify-content:center"><button class="btn '+(timer.running?"gd":"")+' sm" onclick="toggleTimer()">'+(timer.running?"⏸ Пауза":"▶ Старт")+'</button>'+
   '<button class="btn ghost sm" onclick="resetTimer()">↺ Сброс</button>'+
   '<button class="btn ghost sm" onclick="setTimerMin()">⏲ '+S.timerMin+' мин</button></div>'+
   '<p class="sub" style="text-align:center;margin-top:10px">Закончишь сессию — +40 XP и квест.</p></div>';
  h+='<div class="card"><div class="row between"><div class="eyebrow">Ежедневные квесты</div><span class="tag">обновятся завтра</span></div><div style="margin-top:8px">';
  S.quests.items.forEach(q=>{h+='<div class="quest '+(q.done?"done":"")+'"><div class="qi">'+q.icon+'</div><div class="qm"><div class="qt">'+q.t+'</div>'+
   '<div class="qbar"><i style="width:'+Math.round(q.prog/q.goal*100)+'%"></i></div></div><div class="qx">'+(q.done?"✓":"+"+q.xp)+'</div></div>';});
  h+='</div></div></div>';
  h+='<div class="grid g2"><button class="btn block" onclick="go(\'practice\')">🎯 Практика</button>'+
   '<button class="btn mg block" onclick="go(\'deck\')">🧠 Повторить ('+due+')</button>'+
   '<button class="btn pp block" onclick="go(\'read\')">📖 Чтение</button>'+
   '<button class="btn gd block" onclick="go(\'oath\')">🛡️ Культура</button></div>';
  app.innerHTML=h;
}
function tick(){if(!timer.running)return;timer.left=Math.max(0,Math.ceil((timer.end-Date.now())/1000));const d=document.getElementById('timerD');if(d)d.textContent=fmt(timer.left);
  if(timer.left===0){clearInterval(timer.id);timer.running=false;timer.id=null;beep();addXP(40);quest('timer',1);toast('Сессия завершена! +40 XP');if(VIEW==='home')renderHome();}}
function toggleTimer(){if(timer.running){tick();clearInterval(timer.id);timer.running=false;}
  else {if(timer.left<=0)timer.left=S.timerMin*60;timer.end=Date.now()+timer.left*1000;timer.running=true;timer.id=setInterval(tick,250);}renderHome();}
function resetTimer(){clearInterval(timer.id);timer.running=false;timer.left=0;timer.id=null;renderHome();}
function setTimerMin(){openModal('<h3>Длительность сессии</h3><p class="sub">От 1 до 180 минут. Изменение сбросит текущий таймер.</p><label for="timerMinutes">Минуты</label><input class="tin" id="timerMinutes" type="number" min="1" max="180" value="'+S.timerMin+'"><button class="btn block" style="margin-top:14px" onclick="applyTimerMinutes()">Сохранить</button>');}
function applyTimerMinutes(){const n=Number(document.getElementById('timerMinutes').value);if(!Number.isInteger(n)||n<1||n>180){toast('Введите целое число от 1 до 180.');return;}S.timerMin=n;save();closeModal();resetTimer();}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
/* ====== VIEW: PRACTICE ====== */
let pTab="conj";
function renderPractice(){
  app.innerHTML='<h2 style="margin-bottom:4px">Практика</h2><p class="sub" style="margin-bottom:12px">Практикуй формы глаголов, порядок слов и перевод. Сложность зависит от выбранного уровня.</p>'+
   '<div class="seg"><button class="'+(pTab==="conj"?"on":"")+'" onclick="pSet(\'conj\')">Спряжение</button>'+
   '<button class="'+(pTab==="sent"?"on":"")+'" onclick="pSet(\'sent\')">Предложения</button>'+
   '<button class="'+(pTab==="trans"?"on":"")+'" onclick="pSet(\'trans\')">Перевод</button></div><div id="pBody"></div>';
  if(pTab==="conj")newConj();else if(pTab==="sent")newSent();else newTrans();
}
function pSet(t){pTab=t;renderPractice();}
/* спряжение */
function newConj(){
  const v=rnd(VERBS),tense=rnd(userMaxI()===0?TENSES.slice(0,1):userMaxI()===1?TENSES.filter(t=>t!=="Conjunctiv"):TENSES),p=Math.random()*6|0,answer=conjugate(v,tense,p);
  document.getElementById("pBody").innerHTML='<div class="card glow"><div class="corner"></div>'+
   '<div class="q-tag">'+tense+' · '+PRON[p]+'</div><div class="q-prompt"><span class="accent">'+esc(v.inf)+'</span></div>'+
   '<div class="sub" style="text-align:center;margin-top:-4px">'+esc(v.tr)+'</div>'+
   '<div class="row" style="justify-content:center;margin:10px 0 4px">'+spk(v.inf)+'</div>'+
   '<div style="font-weight:700;text-align:center;font-size:18px;margin:6px 0">'+PRON[p]+' …</div>'+
   '<input class="tin ro" aria-label="Форма глагола" lang="ro" id="cIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="введи форму">'+
   '<div class="dia">'+diaBtns("cIn")+'</div><button class="btn block" style="margin-top:12px" id="cChk">Проверить</button><div id="cFb"></div></div>';
  const inp=document.getElementById("cIn");inp.focus();
  const submit=function(){if(inp.disabled)return;if(!inp.value.trim()){toast("Введите ответ.");return;}const r=checkText(inp.value,answer);inp.classList.add(r==="no"?"no":"ok");inp.disabled=true;
    document.getElementById("cChk").classList.add("hidden");const ok=r!=="no";if(r==="ok")addXP(6);else if(r==="almost")addXP(3);
    S.stats.conj++;if(r!=="no")quest("conj",1);save();speak(answer);
    document.getElementById("cFb").innerHTML='<div class="fb '+(ok?"ok":"no")+'">'+(ok?(r==="almost"?"Почти! Проверь диакритику.":"Верно! 🎉"):"Ответ:")+' <span class="ans">'+esc(answer)+'</span><small>'+esc(v.inf)+' · '+tense+' · '+PRON[p]+'</small></div>'+
     '<button class="btn mg block" style="margin-top:10px" onclick="newConj()">Следующий →</button>';};
  document.getElementById("cChk").onclick=submit;
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!inp.disabled)submit();});
}
/* конструктор предложений */
let sentState=null;
function newSent(){
  const opts=SENTENCES.filter(s=>lvI(s.lvl)<=userMaxI());const pool=opts.length?opts:SENTENCES;
  const s=rnd(pool),words=s.ro.replace(/\.$/,"").split(" ");
  sentState={correct:s.ro.replace(/\.$/,""),tr:s.ru,pool:shuffle(words.map(w=>({w:w}))),ans:[],checked:false};
  drawSent();
}
function drawSent(){
  const st=sentState;
  document.getElementById("pBody").innerHTML='<div class="card glow"><div class="q-tag">Собери предложение</div>'+
   '<div class="q-prompt" style="font-size:20px;color:var(--tx)">'+esc(st.tr)+'</div>'+
   '<div class="ans-area" id="ansArea"></div><div class="chips" id="poolArea"></div>'+
   '<button class="btn block" style="margin-top:14px" id="sChk">Проверить</button><div id="sFb"></div></div>';
  const ansA=document.getElementById("ansArea"),poolA=document.getElementById("poolArea");
  st.ans.forEach(t=>{const b=document.createElement("button");b.className="chip";b.textContent=t.w;
    b.onclick=()=>{if(st.checked)return;st.ans=st.ans.filter(x=>x!==t);st.pool.push(t);drawSent();};ansA.appendChild(b);});
  st.pool.forEach(t=>{const b=document.createElement("button");b.className="chip";b.textContent=t.w;
    b.onclick=()=>{if(st.checked)return;st.pool=st.pool.filter(x=>x!==t);st.ans.push(t);drawSent();};poolA.appendChild(b);});
  document.getElementById("sChk").onclick=checkSent;
}
function checkSent(){
  const st=sentState;if(st.checked)return;if(st.pool.length){toast("Используйте все слова.");return;}st.checked=true;document.querySelectorAll("#pBody .chip,#sChk").forEach(b=>b.disabled=true);const made=st.ans.map(t=>t.w).join(" ");
  const ok=norm(made)===norm(st.correct)||stripD(norm(made))===stripD(norm(st.correct));
  if(ok){addXP(8);S.stats.sent++;quest("sent",1);save();speak(st.correct);}
  document.getElementById("sFb").innerHTML='<div class="fb '+(ok?"ok":"no")+'">'+(ok?"Верно! 🎉":"Правильный порядок:")+' <span class="ans">'+esc(st.correct)+'.</span></div>'+
   '<div class="row" style="margin-top:10px">'+spk(st.correct)+'<button class="btn mg block" onclick="newSent()">Следующее →</button></div>';
}
/* перевод */
function newTrans(){
  const pool=WORDS.filter(w=>lvI(w.lvl)<=userMaxI()).map(w=>({ro:w.ro,ru:w.ru})).concat(VERBS.map(v=>({ro:v.inf,ru:v.tr})));
  const item=rnd(pool);
  document.getElementById("pBody").innerHTML='<div class="card glow"><div class="q-tag">Перевод на румынский</div>'+
   '<div class="q-prompt" style="color:var(--tx)">'+esc(item.ru)+'</div>'+
   '<input class="tin ro" aria-label="Перевод на румынский" lang="ro" id="tIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="по-румынски…">'+
   '<div class="dia">'+diaBtns("tIn")+'</div><button class="btn block" style="margin-top:12px" id="tChk">Проверить</button>'+
   '<button class="btn ghost block sm" style="margin-top:8px" id="tShow">Не знаю — показать</button><div id="tFb"></div></div>';
  const inp=document.getElementById("tIn");inp.focus();
  let revealed=false;const reveal=function(r){if(revealed)return;revealed=true;const ok=r!=="no";if(r==="ok")addXP(5);else if(r==="almost")addXP(2);S.stats.trans++;save();speak(item.ro);
    document.getElementById("tChk").classList.add("hidden");document.getElementById("tShow").classList.add("hidden");
    document.getElementById("tFb").innerHTML='<div class="fb '+(ok?"ok":"no")+'">'+(ok?(r==="almost"?"Почти! Диакритика.":"Верно! 🎉"):"Ответ:")+' <span class="ans">'+esc(item.ro)+'</span></div>'+
     '<div class="row" style="margin-top:10px"><button class="btn gd sm" onclick="deckAdd(\''+esc(item.ro).replace(/'/g,"\\'")+'\',\''+esc(item.ru).replace(/'/g,"\\'")+'\')&&toast(\'Добавлено ➕\')">➕ В словарь</button>'+
     '<button class="btn mg block" onclick="newTrans()">Следующее →</button></div>';};
  const submit=function(){if(revealed)return;if(!inp.value.trim()){toast("Введите ответ или нажмите «Не знаю».");return;}const r=checkText(inp.value,item.ro);inp.classList.add(r==="no"?"no":"ok");inp.disabled=true;reveal(r);};
  document.getElementById("tChk").onclick=submit;
  document.getElementById("tShow").onclick=function(){inp.value=item.ro;inp.disabled=true;reveal("no");};
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!inp.disabled)submit();});
}
/* ====== VIEW: DECK (Anki) ====== */
let revQueue=null,revCard=null,revShown=false;
function renderDeck(){
  const all=Object.values(S.deck),due=dueCards();
  let h='<h2 style="margin-bottom:4px">Мой словарь</h2><p class="sub" style="margin-bottom:12px">Интервальное повторение: оценивай, насколько легко вспомнился перевод.</p>'+
   '<div class="grid g3" style="margin-bottom:14px"><div class="stat"><div class="n neon">'+all.length+'</div><div class="l">всего карт</div></div>'+
   '<div class="stat"><div class="n neon-mg">'+due.length+'</div><div class="l">к повтору</div></div>'+
   '<div class="stat"><div class="n" style="color:var(--gd)">'+(S.stats.rev||0)+'</div><div class="l">повторов</div></div></div>';
  h+='<button class="btn ghost block sm" style="margin-bottom:14px" onclick="addWordDialog()">+ Добавить своё слово</button>';
  if(due.length)h+='<button class="btn mg block" onclick="startReview()" style="margin-bottom:14px">🔁 Повторить '+due.length+' слов</button>';
  else if(all.length)h+='<div class="card"><b>Сейчас повторять нечего ✅</b><p class="sub">Возвращайся позже или добавляй слова из «Чтения» и «Перевода».</p></div>';
  else h+='<div class="card"><b>Словарь пуст</b><p class="sub">Добавляй слова кнопкой «➕ В словарь» в «Переводе» и «Чтении».</p></div>';
  if(all.length){h+='<label class="sub" for="deckSearch">Найти слово или перевод</label><input id="deckSearch" class="tin" style="font-size:16px;text-align:left;margin:8px 0 18px" type="search" placeholder="Например: casă или дом" oninput="filterDeck(this.value)">';h+='<div class="eyebrow" style="margin:6px 0 8px">Все слова ('+all.length+')</div>';
    all.sort((a,b)=>(a.due||0)-(b.due||0)).forEach(c=>{const d=Math.ceil(((c.due||0)-Date.now())/864e5);
      h+='<div class="list-item deck-row">'+spk(c.ro)+'<div style="flex:1;min-width:0"><div class="ro" style="font-size:17px">'+esc(c.ro)+'</div><div class="sub">'+esc(c.ru)+'</div></div><span class="tag">'+(d<=0?"сейчас":"через "+d+"д")+'</span><button class="word-delete" aria-label="Удалить слово" onclick="removeWord(decodeURIComponent(\''+encodeURIComponent(c.ro.toLowerCase()).replace(/'/g,'%27')+'\'))">×</button></div>';});}
  app.innerHTML=h;
}

function filterDeck(query){const q=norm(query);document.querySelectorAll('.deck-row').forEach(row=>row.hidden=!norm(row.textContent).includes(q));}
function addWordDialog(){openModal('<h3>Новое слово</h3><form id="newWordForm"><label for="wordRo">По-румынски</label><input class="tin" style="margin:8px 0 16px" id="wordRo" lang="ro" maxlength="100" required autocomplete="off"><label for="wordRu">Перевод</label><input class="tin" style="margin:8px 0 16px" id="wordRu" maxlength="300" required autocomplete="off"><button class="btn block" type="submit">Добавить в словарь</button></form>');
document.getElementById('newWordForm').onsubmit=e=>{e.preventDefault();const ro=document.getElementById('wordRo').value.trim(),ru=document.getElementById('wordRu').value.trim();if(deckAdd(ro,ru)){closeModal();renderDeck();toast('Слово добавлено');}};}
function removeWord(key){if(!Object.hasOwn(S.deck,key))return;if(!confirm('Удалить слово «'+S.deck[key].ro+'» из словаря?'))return;delete S.deck[key];save();renderDeck();}
function startReview(){revQueue=shuffle(dueCards());nextReview();}
function nextReview(){
  if(!revQueue||!revQueue.length){openModal('<h3 style="margin-bottom:8px">Повторение завершено ✅</h3><p class="sub">Слова пересчитаны по SM-2.</p><button class="btn block" style="margin-top:14px" onclick="closeModal();render()">Закрыть</button>');renderDeck();return;}
  revCard=revQueue.shift();revShown=false;drawReview();
}
function drawReview(){
  const c=revCard;
  openModal('<div class="q-tag" style="text-align:center">Карточка · осталось '+(revQueue.length+1)+'</div>'+
   '<div style="text-align:center;margin:18px 0 8px"><div class="ro" style="font-size:34px;color:var(--mg);text-shadow:var(--glow-mg)">'+esc(c.ro)+'</div><div style="margin-top:12px">'+spk(c.ro)+'</div></div>'+
   '<div id="revBack">'+(revShown?"":'<button class="btn block" onclick="showBack()">Показать перевод</button>')+'</div>');
  if(revShown)showBack();
}
function showBack(){revShown=true;if(SPEAK_OK)speak(revCard.ro);
  document.getElementById("revBack").innerHTML='<div style="text-align:center;font-size:22px;margin:6px 0 4px">'+esc(revCard.ru)+'</div>'+
   '<div class="grade"><button class="g0" onclick="grade(0)">Забыл<small>через 1 мин</small></button>'+
   '<button class="g3" onclick="grade(3)">Трудно<small>SM-2</small></button>'+
   '<button class="g4" onclick="grade(4)">Хорошо<small>SM-2</small></button>'+
   '<button class="g5" onclick="grade(5)">Легко<small>SM-2</small></button></div>';}
function grade(q){if(!revShown||!revCard)return;revShown=false;sm2(revCard,q);S.stats.rev=(S.stats.rev||0)+1;addXP(q>=4?4:q>=3?2:1);quest("rev",1);save();nextReview();}
/* ====== VIEW: READ (медиа-хаб) ====== */
function tokenizeLine(line){
  return line.split(" ").map(function(tok){
    var m=tok.match(/^([^A-Za-zĂÂÎȘȚăâîșț]*)([A-Za-zĂÂÎȘȚăâîșț-]+)([^A-Za-zĂÂÎȘȚăâîșț]*)$/);
    if(!m)return esc(tok);
    return esc(m[1])+'<button class="w" lang="ro" onclick="tapWord(this,decodeURIComponent(\''+encodeURIComponent(m[2]).replace(/'/g,'%27')+'\'))">'+esc(m[2])+'</button>'+esc(m[3]);
  }).join(" ");
}
function renderRead(){
  let h='<h2 style="margin-bottom:4px">Чтение и аудио</h2><p class="sub" style="margin-bottom:12px">Тапни любое слово — перевод и кнопка в словарь. Слушай через синтез речи.</p>';
  TEXTS.forEach(function(t,i){var locked=lvI(t.lvl)>userMaxI()+1;
    h+='<div class="list-item" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click()}" onclick="openText('+i+')"><span class="tag" style="color:var(--cy);border-color:var(--cy-d)">'+t.lvl+'</span>'+
     '<div style="flex:1"><div style="font-weight:700;font-size:16px">'+esc(t.title)+'</div><div class="sub">'+t.body.length+' строк'+(locked?" · выше выбранной сложности":"")+'</div></div><span style="color:var(--tx3)">›</span></div>';});
  app.innerHTML=h;
}
function openText(i){
  var t=TEXTS[i];READ_BUF=t.body.join(" ");
  var body=t.body.map(function(line){return "<p>"+tokenizeLine(line)+"</p>";}).join("");
  openModal('<div class="row between" style="margin-bottom:6px"><span class="tag" style="color:var(--cy);border-color:var(--cy-d)">'+t.lvl+'</span><button class="btn ghost sm" onclick="closeModal()">✕</button></div>'+
   '<h3 style="margin-bottom:6px">'+esc(t.title)+'</h3>'+
   '<div class="card"><label for="studyLevel">Сложность упражнений</label><select class="tin" style="font-size:16px;margin-top:8px" id="studyLevel" onchange="S.level=this.value;save();paintHeader()">'+LV.map(l=>'<option '+(S.level===l?'selected':'')+'>'+l+'</option>').join('')+'</select><button class="btn ghost block sm" style="margin-top:12px" onclick="startTest()">Пройти подбор сложности</button><button class="btn ghost block sm" style="margin-top:8px" onclick="toggleTheme()">Сменить светлую / тёмную тему</button></div>' + '<div class="row" style="margin-bottom:10px"><button class="btn sm" onclick="speakBuf()">🔊 Озвучить весь текст</button>'+
   '<button class="btn ghost sm" onclick="markRead('+i+')">✓ Прочитал</button></div>'+
   '<div class="reader">'+body+'</div>'+
   '<p class="sub" style="margin-top:10px">Тапни слово → перевод снизу. Незнакомые формы могут не находиться — это нормально.</p>');
}
function markRead(i){const key=todayStr()+':'+i;if(!S.readToday)S.readToday={};if(S.readToday[key]){toast('Этот текст уже отмечен сегодня.');return;}S.readToday={[key]:true};S.stats.read++;quest('read',1);save();toast('Текст прочитан. Отличная работа!');}
function tapWord(el,w){
  var act=document.querySelectorAll(".reader .w.act");for(var i=0;i<act.length;i++)act[i].classList.remove("act");
  el.classList.add("act");var clean=w.replace(/-/g,"");var tr=lookup(clean)||lookup(w);
  openSheet(w,tr||"перевод не найден",!!tr);speak(w);
}
/* word sheet */
var sheet=document.getElementById("sheet"),sheetWord="",sheetTr="",sheetCan=false;
function openSheet(w,tr,can){sheetWord=w;sheetTr=tr;sheetCan=can;
  document.getElementById("shWord").textContent=w;document.getElementById("shTr").textContent=tr;
  document.getElementById("shAdd").style.opacity=can?1:.4;document.getElementById("shAdd").disabled=!can;sheet.inert=false;sheet.classList.add("on");document.getElementById("shClose").focus();}
document.getElementById("shClose").onclick=function(){sheet.classList.remove("on");sheet.inert=true;};
document.getElementById("shSpeak").onclick=function(){speak(sheetWord);};
document.getElementById("shAdd").onclick=function(){if(sheetCan&&deckAdd(sheetWord.toLowerCase(),sheetTr))toast("Добавлено в словарь ➕");sheet.classList.remove("on");sheet.inert=true;};
/* ====== VIEW: OATH ====== */
var oTab="text",civicCard=null,civicShown=false;
function renderOath(){
  app.innerHTML='<h2 style="margin-bottom:4px">Язык и культура</h2><p class="sub" style="margin-bottom:12px">Практика произношения и разговорные вопросы о Румынии.</p>'+
   '<div class="seg"><button class="'+(oTab==="text"?"on":"")+'" onclick="oSet(\'text\')">Присяга</button>'+
   '<button class="'+(oTab==="consul"?"on":"")+'" onclick="oSet(\'consul\')">Вопросы</button>'+
   '<button class="'+(oTab==="hymn"?"on":"")+'" onclick="oSet(\'hymn\')">Гимн</button>'+
   '<button class="'+(oTab==="tips"?"on":"")+'" onclick="oSet(\'tips\')">Советы</button></div><div id="oBody"></div>';
  ({text:oText,consul:oConsul,hymn:oHymn,tips:oTips}[oTab])();
}
function oSet(t){oTab=t;renderOath();}
function oText(){
  var oath=TEXTS[TEXTS.length-1].body;READ_BUF=oath.join(" ");
  var body=oath.map(function(l){return "<p>"+tokenizeLine(l)+"</p>";}).join("");
  document.getElementById("oBody").innerHTML='<div class="card glow"><div class="corner"></div><div class="eyebrow">Jurământul de credință</div>'+
   '<div class="reader" style="margin-top:8px;font-size:19px;line-height:1.9">'+body+'</div>'+
   '<div class="row" style="margin-top:12px">'+spk(oath.join(" "))+'<button class="btn block" onclick="speakBuf()">🔊 Прослушать присягу</button></div></div>'+
   '<div class="card"><div class="eyebrow">Перевод</div><p style="margin-top:6px">«Клянусь быть преданным родине и румынскому народу, защищать национальные права и интересы, соблюдать Конституцию и законы Румынии.»</p>'+
   '<p class="sub" style="margin-top:8px">Текст для языковой практики. <a href="https://legislatie.just.ro/Public/DetaliiDocument/121439" target="_blank" rel="noopener">Источник: закон № 21/1991, статья 20</a>.</p></div>';
}
function oConsul(){
  document.getElementById("oBody").innerHTML='<div class="card glow"><div class="eyebrow">Разговорная практика</div><div id="civicArea" style="margin-top:8px"></div></div>';
  newCivic();
}
function newCivic(){civicCard=rnd(CIVICS);civicShown=false;drawCivic();}
function drawCivic(){
  var c=civicCard;
  document.getElementById("civicArea").innerHTML='<div class="q-prompt" style="font-size:20px;color:var(--tx)">'+esc(c.q)+'</div>'+
   '<div class="sub" style="text-align:center;margin-top:-4px">'+esc(c.ru)+'</div>'+
   '<div class="row" style="justify-content:center;margin:10px 0">'+spk(c.q)+'</div>'+
   '<div id="civicBack">'+(civicShown?"":'<button class="btn block" onclick="showCivic()">Показать ответ</button>')+'</div>';
  if(civicShown)showCivic();
}
function showCivic(){civicShown=true;speak(civicCard.a);
  document.getElementById("civicBack").innerHTML='<div class="fb ok" style="text-align:left"><div class="ro" style="font-size:17px">'+esc(civicCard.a)+'</div><small>💡 '+esc(civicCard.h)+'</small></div>'+
   '<div class="row" style="margin-top:10px">'+spk(civicCard.a)+'<button class="btn mg block" onclick="newCivic()">Следующий вопрос →</button></div>';}
function oHymn(){
  document.getElementById("oBody").innerHTML='<div class="card glow"><div class="eyebrow">Imnul național</div>'+
   '<h3 style="margin:8px 0 4px">«Deșteaptă-te, române!»</h3>'+
   '<p class="sub">Государственный гимн Румынии. Слова — Андрей Мурешану (1848), музыка — Антон Панн. Связан с революцией 1848 года.</p>'+
   '<div class="card" style="background:var(--bg2);margin-top:12px"><div class="eyebrow">Первая строка</div>'+
   '<p class="ro" style="font-size:18px;margin-top:6px">Deșteaptă-te, române, din somnul cel de moarte…</p>'+
   '<div class="row" style="margin-top:8px">'+spk("Deșteaptă-te, române, din somnul cel de moarte")+'<button class="btn sm" onclick="speak(\'Deșteaptă-te, române, din somnul cel de moarte\')">🔊 Произнести</button></div></div>'+
   '<p class="sub" style="margin-top:12px">Официально исполняются строфы 1, 2, 4 и 11. Полный текст (в общественном достоянии) есть на официальных ресурсах — выучи указанные строфы.</p></div>'+
   '<div class="card"><div class="eyebrow">Факты</div><ul style="margin:8px 0 0;padding-left:18px;color:var(--tx2)">'+
   '<li style="margin:6px 0">Автор слов: <span class="ro" style="color:var(--tx)">Andrei Mureșanu</span></li>'+
   '<li style="margin:6px 0">Год стихотворения: <span class="ro" style="color:var(--tx)">1848</span></li>'+
   '<li style="margin:6px 0">Был также гимном Молдовы в 1991–1994 гг.</li></ul></div>';
}
function oTips(){
  document.getElementById("oBody").innerHTML='<div class="card"><div class="eyebrow">Каверзные вопросы — как держаться</div>'+
   '<ul style="margin:8px 0 0;padding-left:18px;color:var(--tx2);line-height:1.8">'+
   '<li style="margin:8px 0"><b style="color:var(--tx)">«De ce doriți cetățenia română?»</b> — отвечай искренне и коротко: корни, семья, связь с культурой, желание быть частью Европы. Не заучивай сухо.</li>'+
   '<li style="margin:8px 0"><b style="color:var(--tx)">«Spuneți ceva despre dumneavoastră»</b> — подготовь 4–5 фраз о себе: имя, откуда, чем занимаешься, зачем учишь язык.</li>'+
   '<li style="margin:8px 0"><b style="color:var(--tx)">Вопрос по истории/символам</b> — выучи вкладку «Консул»: столица, флаг, 1 декабря, Дунай, Карпаты, Эминеску.</li>'+
   '<li style="margin:8px 0"><b style="color:var(--tx)">Главное правило</b> — не молчи. Простая правильная фраза лучше сложной с ошибкой. Спокойствие важнее идеала.</li>'+
   '<li style="margin:8px 0"><b style="color:var(--tx)">Произношение</b> — тренируй присягу и ответы вслух через 🔊, повторяй за синтезом.</li></ul></div>'+
   '<div class="card glow"><div class="eyebrow">Образец рассказа о себе</div>'+
   '<div class="reader" style="margin-top:8px"><p>Bună ziua. Mă numesc … . Sunt din … și locuiesc în … . Învăț limba română în fiecare zi pentru că vreau să fac parte din această țară.</p></div>'+
   '<button class="btn block" style="margin-top:10px" onclick="speak(\'Bună ziua. Mă numesc. Sunt din și locuiesc în. Învăț limba română în fiecare zi pentru că vreau să fac parte din această țară.\')">🔊 Прослушать образец</button></div>';
}
/* ====== АДАПТИВНЫЙ ТЕСТ ====== */
var testState=null;
function startTest(){testState={q:0,total:20,di:1,used:[],perLvl:{},correct:0};LV.forEach(l=>testState.perLvl[l]={c:0,t:0});nextTestQ();}
function pickQ(di){
  var order=[di];for(var d=1;d<LV.length;d++){if(di-d>=0)order.push(di-d);if(di+d<LV.length)order.push(di+d);}
  for(var k=0;k<order.length;k++){var lv=LV[order[k]];var cand=[];for(var i=0;i<QUIZ.length;i++)if(QUIZ[i].lvl===lv&&testState.used.indexOf(i)<0)cand.push(i);if(cand.length)return rnd(cand);}
  return Math.random()*QUIZ.length|0;
}
function nextTestQ(){
  if(testState.q>=testState.total){finishTest();return;}
  var idx=pickQ(testState.di);testState.used.push(idx);var item=QUIZ[idx];
  var opts=shuffle(item.o.map(function(o,i){return{o:o,correct:i===item.a};}));
  var pct=Math.round(testState.q/testState.total*100);
  var oh="";opts.forEach(function(o){oh+='<button class="opt" data-c="'+(o.correct?1:0)+'">'+esc(o.o)+'</button>';});
  openModal('<div class="row between"><div class="eyebrow">Подбор сложности · '+(testState.q+1)+'/'+testState.total+'</div><span class="tag">'+item.lvl+'</span></div>'+
   '<div class="tprog" style="margin-top:10px"><i style="width:'+pct+'%"></i></div><div class="q-prompt" style="font-size:20px">'+esc(item.q)+'</div><div id="testOpts">'+oh+'</div>');
  var btns=document.querySelectorAll("#testOpts .opt");
  btns.forEach(function(b){b.onclick=function(){answerTest(b,item);};});
}
function answerTest(b,item){
  if(b.disabled||!testState)return;var correct=b.dataset.c==="1";
  document.querySelectorAll("#testOpts .opt").forEach(function(x){x.disabled=true;if(x.dataset.c==="1")x.classList.add("ok");});
  if(!correct)b.classList.add("no");
  testState.perLvl[item.lvl].t++;
  if(correct){testState.perLvl[item.lvl].c++;testState.correct++;testState.di=Math.min(LV.length-1,testState.di+1);}
  else testState.di=Math.max(0,testState.di-1);
  testState.q++;testTimeout=setTimeout(nextTestQ,correct?500:1050);
}
function finishTest(){
  var lvl="A1";
  for(var i=0;i<LV.length;i++){var p=testState.perLvl[LV[i]];if(p.t>=2&&p.c/p.t>=0.6)lvl=LV[i];}
  S.level=lvl;save();
  openModal('<div style="text-align:center"><div style="font-size:54px">🎯</div><div class="eyebrow">Результат</div>'+
   '<h2 style="font-size:40px;margin:6px 0" class="neon-mg">'+lvl+'</h2>'+
   '<p class="sub">Верных ответов: '+testState.correct+'/'+testState.total+'. Это ориентировочная сложность для практики, а не подтверждённый уровень CEFR. Её можно изменить в настройках.</p>'+
   '<button class="btn block" style="margin-top:16px" onclick="closeModal();go(\'home\')">Начать обучение →</button></div>');
}
/* ====== НАСТРОЙКИ / ДАННЫЕ ====== */
document.getElementById("sheet").inert=true;document.getElementById("gearBtn").onclick=openSettings;
function openSettings(){
  openModal('<div class="row between" style="margin-bottom:10px"><h3>Настройки и данные</h3><button class="btn ghost sm" onclick="closeModal()">✕</button></div>'+
   '<div class="card" style="margin:0 0 12px"><div class="eyebrow">'+(canStore?"Сохранение активно":"Внимание")+'</div>'+
   '<p class="sub" style="margin-top:6px">'+(canStore?"Прогресс сохраняется в этом браузере автоматически. Делай экспорт как бэкап.":"Автосохранение недоступно (режим предпросмотра). <b>Открой приложение в обычной вкладке браузера</b>, либо пользуйся экспортом.")+'</p></div>'+
   '<div class="card"><label for="studyLevel">Сложность упражнений</label><select class="tin" style="font-size:16px;margin-top:8px" id="studyLevel" onchange="S.level=this.value;save();paintHeader()">'+LV.map(l=>'<option '+(S.level===l?'selected':'')+'>'+l+'</option>').join('')+'</select><button class="btn ghost block sm" style="margin-top:12px" onclick="startTest()">Пройти подбор сложности</button><button class="btn ghost block sm" style="margin-top:8px" onclick="toggleTheme()">Сменить светлую / тёмную тему</button></div>' + '<div class="row" style="margin-bottom:10px"><button class="btn sm" onclick="exportData()">⬇ Экспорт</button>'+
   '<button class="btn ghost sm" onclick="document.getElementById(\'impF\').click()">⬆ Импорт</button>'+
   '<input type="file" id="impF" accept="application/json" style="display:none"></div>'+
   '<button class="btn ghost block sm" style="margin-bottom:10px" onclick="speak(\'Bună ziua! Învățăm limba română.\')">🔊 Проверить голос устройства</button>'+
   '<button class="btn ghost block sm" onclick="installPrompt()">📲 Установить как приложение</button>'+
   '<div class="card" style="margin:12px 0 0;border-color:#7f1d2b"><div class="eyebrow" style="color:#fb7185">Опасная зона</div>'+
   '<button class="btn ghost block sm" style="margin-top:8px;border-color:#7f1d2b;color:#fb7185" onclick="resetAll()">Сбросить весь прогресс</button></div>');
  var f=document.getElementById("impF");if(f)f.onchange=importData;
}
function toggleTheme(){S.theme=S.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=S.theme;save();}
function exportData(){var blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});var a=document.createElement('a');
  const url=URL.createObjectURL(blob);a.href=url;a.download='vorbeste-progres-'+todayStr()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Прогресс экспортирован');}
function importData(e){const file=e.target.files[0];e.target.value='';if(!file)return;
  if(file.size>5000000){toast('Файл слишком большой: максимум 5 МБ.');return;}
  const reader=new FileReader();reader.onerror=()=>toast('Не удалось прочитать файл.');
  reader.onload=()=>{let d;try{d=StudyCore.validate(JSON.parse(reader.result));}catch(error){toast('Импорт отменён: '+error.message);return;}
    if(!confirm('Заменить текущий прогресс? В файле: '+Object.keys(d.deck).length+' слов, '+d.xp+' XP. Перед заменой можно сделать экспорт.'))return;
    clearInterval(timer.id);timer={left:0,id:null,running:false,end:0};S=d;mem=S;document.documentElement.dataset.theme=S.theme;save();closeModal();go('home');toast('Прогресс восстановлен');};reader.readAsText(file);}
function resetAll(){if(confirm("Сбросить весь прогресс безвозвратно?")){clearInterval(timer.id);timer={left:0,id:null,running:false,end:0};S=fresh();mem=S;document.documentElement.dataset.theme=S.theme;save();toast("Сброшено");closeModal();go("home");}}
/* ====== INSTALL / OFFLINE ====== */
var deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;});
async function installPrompt(){if(deferredPrompt){await deferredPrompt.prompt();deferredPrompt=null;}
  else toast('Откройте меню браузера → «Установить» или «На экран Домой».');}
if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol))
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{toast('Офлайн-режим недоступен. Приложение продолжит работать через сеть.');}));
/* ====== INIT ====== */
ensureQuests();paintHeader();render();
