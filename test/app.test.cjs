const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function app(){
 const nodes=new Map(),storage=new Map();
 const element=()=>({innerHTML:'',textContent:'',value:'',disabled:false,isConnected:true,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},focus(){},setAttribute(){},removeAttribute(){},querySelector(){return null;},querySelectorAll(){return[];}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
 const document={getElementById:get,querySelectorAll(){return[];},querySelector(){return get('header');},addEventListener(){},body:{style:{}},documentElement:{dataset:{}},activeElement:null,hidden:false};
 const c=vm.createContext({document,window:{addEventListener(){},scrollTo(){}},navigator:{},location:{protocol:'http:'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},console,encodeURIComponent,decodeURIComponent,confirm:()=>true});
 for(const name of ['data.js','core.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),c,{filename:name});
 return {run:code=>vm.runInContext(code,c),get};
}
test('conjugation awards XP once',()=>{const a=app();a.run('VIEW="practice";rnd=a=>a[0];Math.random=()=>0;newConj()');a.get('cIn').value='sunt';a.get('cChk').onclick();a.get('cChk').onclick();assert.equal(a.run('S.xp'),6);assert.equal(a.run('S.stats.conj'),1);});
test('empty answer does not consume attempt',()=>{const a=app();a.run('VIEW="practice";newConj()');a.get('cChk').onclick();assert.equal(a.run('S.stats.conj'),0);assert.equal(a.get('cIn').disabled,false);});
test('sentence cannot award XP twice',()=>{const a=app();a.run('VIEW="practice";sentState={correct:"Eu sunt",ans:[{w:"Eu"},{w:"sunt"}],pool:[],checked:false};checkSent();checkSent()');assert.equal(a.run('S.xp'),8);assert.equal(a.run('S.stats.sent'),1);});
test('translation is idempotent',()=>{const a=app();a.run('VIEW="practice";rnd=a=>a[0];newTrans()');a.get('tIn').value=a.run('WORDS[0].ro');a.get('tChk').onclick();a.get('tChk').onclick();assert.equal(a.run('S.xp'),5);assert.equal(a.run('S.stats.trans'),1);});
test('timer catches up and completes once',()=>{const a=app();a.run('VIEW="practice";Date.now=()=>100000;timer={running:true,left:60,end:130000,id:1};tick()');assert.equal(a.run('timer.left'),30);a.run('Date.now=()=>140000;tick();tick()');assert.equal(a.run('timer.running'),false);assert.equal(a.run('S.xp'),80);});
test('custom words render as text',()=>{const a=app();a.run('deckAdd("casă", "<img src=x onerror=alert(1)>");renderDeck()');assert.ok(a.get('app').innerHTML.includes('&lt;img'));assert.ok(!a.get('app').innerHTML.includes('<img src=x'));});
