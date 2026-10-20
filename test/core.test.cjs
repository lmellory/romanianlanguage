const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../core.js');
test('legacy progress retains learned words, scores and settings',()=>{
  const old={xp:420,level:'A2',streak:3,lastDay:'2026-10-20',days:{'2026-10-20':35},deck:{'casă':{ro:'casă',ru:'дом',ef:2.5,interval:6,reps:2,due:1700000000000}},timerMin:50,stats:{rev:8}};
  const next=core.validate(old);assert.equal(next.xp,420);assert.equal(next.deck['casă'].ru,'дом');assert.equal(next.timerMin,50);assert.equal(next.stats.rev,8);
});
test('malformed imports fail before replacement',()=>{
  for(const bad of [null,[],{xp:-1,deck:{}},{xp:Infinity,deck:{}},{xp:2,deck:[]},{xp:2,deck:{a:{ro:'a',ru:'а',ef:2.5,interval:1,reps:1,due:'tomorrow'}}},{xp:1,deck:{},lastDay:'2026-02-31'},{xp:1,deck:{},stats:{rev:-1}}])assert.throws(()=>core.validate(bad));
});
test('prototype keys and imported reward descriptions are rejected or discarded',()=>{
  assert.throws(()=>core.validate(JSON.parse('{"xp":0,"deck":{"__proto__":{"ro":"__proto__","ru":"x","ef":2.5,"interval":0,"reps":0,"due":0}}}')));
  const s=core.validate({xp:0,deck:{},quests:{items:[{t:'<img onerror=alert(1)>',xp:9999}]},unknown:'discard'});
  assert.equal(s.quests,null);assert.equal(s.unknown,undefined);
});
test('forgotten cards return after one minute, successful reviews grow intervals',()=>{
  const c={ef:2.5,interval:6,reps:2,lapses:0};core.review(c,0,1000);assert.equal(c.due,61000);assert.equal(c.reps,0);assert.equal(c.lapses,1);
  core.review(c,4,1000);assert.equal(c.interval,1);core.review(c,4,1000);assert.equal(c.interval,6);core.review(c,4,1000);assert.ok(c.interval>6);
});
test('day boundaries use local dates',()=>{
  assert.equal(core.day(new Date(2026,9,20,0,15)),'2026-10-20');assert.equal(core.validDay('2024-02-29'),true);assert.equal(core.validDay('2025-02-29'),false);
});
