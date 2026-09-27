const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const dir=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const outback=fs.existsSync(path.join(dir,'static/js/main.js'));
const source=fs.readFileSync(path.join(dir,'static/js',outback?'main.js':'app.js'),'utf8');
const html=fs.readFileSync(path.join(dir,'dist/index.html'),'utf8');
const cfgMatch=html.match(/<script[^>]*id="site-config"[^>]*>([\s\S]*?)<\/script>/);
const cfg=cfgMatch?JSON.parse(cfgMatch[1]):{};
const expected=outback?'OUT':cfg.brand;
assert(['KOA','FDC','OUT'].includes(expected));
let classify;
if(process.env.CRM_CLASSIFIER){
 const js=require('node:module').stripTypeScriptTypes(fs.readFileSync(process.env.CRM_CLASSIFIER,'utf8')).replace(/export /g,'');
 const c={};vm.createContext(c);vm.runInContext(js,c);classify=p=>c.leadAttribution({raw_payload:p}).channel;
}
function visit(search,storage=new Map(),hasForm=true){
 const calls=[],forms=[];
 const el=()=>({setAttribute(){},removeAttribute(){},focus(){},scrollIntoView(){},querySelector(){return null},querySelectorAll(){return[]},parentNode:{insertBefore(){}},insertBefore(){}});
 if(hasForm) for(let n=0;n<2;n++){
  const f=el();f.id='fixture-'+n;f.fields={name:'Offline Fixture',email:'fixture@example.invalid',phone:'0400000000',suburb:'Dalby',postcode:'4405',intent:'buy',interest:'buy',size:'20ft',quantity:'1'};
  f.handlers={};f.addEventListener=(name,handler)=>f.handlers[name]=handler;f.parentNode={replaceChild(){}};forms.push(f);
 }
 const document={title:'Offline fixture',documentElement:{classList:{add(){}}},getElementById:id=>id==='site-config'?{textContent:JSON.stringify(cfg)}:null,querySelector:()=>null,querySelectorAll:s=>['form[data-quote]','form[data-lead-form]'].includes(s)?forms:[],createElement:el,addEventListener(){},getElementsByTagName:()=>[{parentNode:{insertBefore(){}}}]};
 const context={document,window:{OUTBACK_CONFIG:{leadSource:'outbackcontainers.com.au'}},location:{search,pathname:'/quote/',hostname:'offline.invalid'},URLSearchParams,Date,setTimeout(){},console,
  sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
  FormData:class{constructor(f){this.f=f}forEach(cb){Object.entries(this.f.fields).forEach(([k,v])=>cb(v,k))}},
  fetch:async(url,o)=>{calls.push({url,payload:JSON.parse(o.body)});return{ok:true,json:async()=>({success:true,id:'offline-only'})}}
 };
 context.window.location=context.location;
 vm.runInNewContext(source,context);
 return{calls,async submit(index=0){forms[index].handlers.submit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.equal(calls.length,1);const p=calls[0].payload;assert.equal(p.brand,expected);assert.match(calls[0].url,/\/functions\/v1\/web-lead-intake$/);assert.equal(p.phone,'0400000000');return p;}};
}
(async()=>{
 const fb={utm_source:'facebook',utm_medium:'paid_social',utm_campaign:'offline-campaign',utm_content:'creative-5'};
 for(const index of [0,1]){
  const st=new Map();const landing=visit('?'+new URLSearchParams(fb),st,false);assert.equal(landing.calls.length,0);
  visit('',st,false);const p=await visit('',st).submit(index);
  for(const[k,v]of Object.entries(fb))assert.equal(p[k],v,k);assert.equal(p.gclid,null);if(classify)assert.equal(classify(p),'facebook');
  const google=await visit('?gclid=offline-google&adid=123',st).submit();assert.equal(google.gclid,'offline-google');assert.equal(google.utm_source,null);assert.equal(google.adid,'123');if(classify)assert.equal(classify(google),'google');
  const back=await visit('?'+new URLSearchParams(fb),st).submit();assert.equal(back.gclid,null);assert.equal(back.adid,null);assert.equal(back.utm_source,'facebook');
 }
 const organic=await visit('').submit();assert.equal(organic.utm_source,null);assert.equal(organic.utm_medium,null);if(classify)assert.equal(classify(organic),'organic');
 console.log('PASS '+expected+': actual form submission payload, two forms, three-page Facebook journey, Google replacement, return to Facebook, organic and existing intake routing. All requests mocked.');
})().catch(e=>{console.error(e.message,e.stack);process.exitCode=1});
