const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.argv[2],'utf8');
const outback=process.argv[2].includes('outback');
async function run({receipt={success:true,id:'fixture'},http=true,fail=false,marked=true,size='20ft',intent='buy',valid=true,host='example.com',robots='',double=false}={}){
 let submit,requests=0;const events=[];
 const form={id:'fixture',hasAttribute:()=>marked,reportValidity:()=>valid,addEventListener:(n,f)=>submit=f,querySelector:()=>null,parentNode:{replaceChild(){}},insertBefore(){}};
 const doc={getElementById:()=>({textContent:JSON.stringify({domain:'example.com',brand:'TEST',endpoint:'https://example.invalid',metaPixelId:'123'})}),querySelector:s=>s==='meta[name="robots"]'?{content:robots}:null,querySelectorAll:s=>['form[data-quote]','form[data-lead-form]'].includes(s)?[form]:[],createElement:()=>({}),getElementsByTagName:()=>[{parentNode:{insertBefore(){}}}]};
 const w={OUTBACK_CONFIG:{leadSource:'example.com',metaPixelId:'123',leadEndpoint:'https://example.invalid',leadSecret:'fixture-only',brand:'TEST'}};
 const fields={name:'Fixture Only',phone:'0400000000',size,intent,interest:intent,condition:'used',suburb:'Brisbane'};
 const c={window:w,document:doc,location:{hostname:host,pathname:'/buy-shipping-containers/',search:''},URLSearchParams,FormData:class{forEach(cb){Object.entries(fields).forEach(([k,v])=>cb(v,k));}},setTimeout(){},console,fetch:async()=>{requests++;if(fail)throw Error('offline');return{ok:http,json:async()=>receipt};}};w.location=c.location;
 vm.runInNewContext(source,c);if(w.fbq)w.fbq.callMethod=(...args)=>events.push(args);
 submit({preventDefault(){}});if(double)submit({preventDefault(){}});await new Promise(r=>setImmediate(r));return{events,requests};
}
(async()=>{
 for(const size of ['20ft','40ft','unsure']){const r=await run({size,double:true});assert.equal(r.requests,1);assert.equal(r.events.filter(e=>e[2]==='Lead').length,1);const es=r.events.filter(e=>e[2]==='ContainerPurchaseEnquiry');assert.equal(es.length,1);assert.deepEqual(JSON.parse(JSON.stringify(es[0])),['trackSingleCustom','123','ContainerPurchaseEnquiry',{container_size:size}]);}
 for(const input of [{receipt:{}},{receipt:{success:false}},{receipt:{success:true}},{receipt:{success:true,id:'existing',duplicate:true}},{http:false},{fail:true},{valid:false}])assert.equal((await run(input)).events.length,0,JSON.stringify(input));
 for(const input of [{marked:false},{intent:'hire'},{size:'10ft'}])assert.equal((await run(input)).events.filter(e=>e[2]==='ContainerPurchaseEnquiry').length,0);
 for(const input of [{host:'preview.example.com'},{robots:'noindex'}])assert.equal((await run(input)).events.length,0);
 console.log('PASS '+(outback?'Outback':'Fair Dinkum')+': accepted purchase 20/40/unsure; failure/rejection/duplicate/validation/preview suppressed; generic/hire/10ft not purchase; double submit once; event payload has size only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
