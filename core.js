/* Pure state helpers. Shared by the browser app and regression tests. */
const StudyCore = (() => {
  const levels = ['A1','A2','B1','B2','C1','C2'];
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const number = (v, max = 1000000000) => Number.isFinite(v) && v >= 0 && v <= max;
  const text = v => typeof v === 'string' && v.length > 0 && v.length <= 500;
  function day(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function validDay(v) {
    return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v;
  }
  function fresh() {
    return {version:2,level:null,xp:0,streak:0,lastDay:null,days:{},deck:{},quests:null,
      stats:{conj:0,sent:0,trans:0,read:0,rev:0},timerMin:25,theme:'light'};
  }
  function validate(input) {
    if (!object(input) || !number(input.xp) || !object(input.deck)) throw Error('Нужен файл прогресса Vorbește.');
    const s = fresh();
    if (input.level != null && !levels.includes(input.level)) throw Error('Неизвестный уровень.');
    s.level = input.level ?? null; s.xp = input.xp;
    for (const k of ['streak','timerMin']) if (input[k] !== undefined) {
      if (!Number.isInteger(input[k]) || !number(input[k],k === 'timerMin'?180:100000) || (k==='timerMin' && input[k]<1)) throw Error('Некорректные настройки.');
      s[k] = input[k];
    }
    if (input.lastDay != null && !validDay(input.lastDay)) throw Error('Некорректная дата.');
    s.lastDay = input.lastDay ?? null;
    if (input.theme === 'dark') s.theme='dark';
    if (input.days !== undefined) {
      if (!object(input.days) || Object.keys(input.days).length>40000) throw Error('Некорректная история.');
      for (const [k,v] of Object.entries(input.days)) { if(!validDay(k)||!number(v)) throw Error('Некорректная история.'); s.days[k]=v; }
    }
    if (input.stats !== undefined) {
      if(!object(input.stats)) throw Error('Некорректная статистика.');
      for(const k of Object.keys(s.stats)) if(input.stats[k]!==undefined) {
        if(!Number.isInteger(input.stats[k])||!number(input.stats[k])) throw Error('Некорректная статистика.');
        s.stats[k]=input.stats[k];
      }
    }
    if(Object.keys(input.deck).length>10000) throw Error('В файле больше 10 000 карточек.');
    for(const [k,c] of Object.entries(input.deck)) {
      if(['__proto__','prototype','constructor'].includes(k)||!object(c)||!text(c.ro)||!text(c.ru)||k!==c.ro.toLowerCase()) throw Error('Некорректная карточка.');
      for(const f of ['ef','interval','reps','due']) if(!number(c[f], f==='due'?8640000000000000:1000000)) throw Error('Некорректный интервал карточки.');
      if(c.ef<1.3||c.ef>10||!Number.isInteger(c.reps)||!number(c.lapses??0)) throw Error('Некорректная карточка.');
      s.deck[k]={ro:c.ro,ru:c.ru,ef:c.ef,interval:c.interval,reps:c.reps,lapses:c.lapses??0,due:c.due};
    }
    // Daily quests are regenerated, never accepted as executable/display content.
    return s;
  }
  function review(card,q,now=Date.now()) {
    if(![0,3,4,5].includes(q)) throw Error('Invalid grade');
    if(q<3){card.reps=0;card.interval=0;card.lapses=(card.lapses||0)+1;}
    else {card.interval=card.reps===0?1:card.reps===1?6:Math.max(1,Math.round(card.interval*card.ef));card.reps++;}
    card.ef=Math.max(1.3,card.ef+(0.1-(5-q)*(0.08+(5-q)*0.02)));
    card.due=now+(q<3?60000:card.interval*86400000); return card;
  }
  return {fresh,validate,day,validDay,review};
})();
if(typeof module!=='undefined') module.exports=StudyCore;
