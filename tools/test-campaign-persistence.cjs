// Offline regression tests: no requests or real leads are sent.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const dir = path.join(__dirname,'..');
const outback = fs.existsSync(path.join(dir,'static/js/main.js'));
const source = fs.readFileSync(path.join(dir,'static/js',outback?'main.js':'app.js'),'utf8');
const start=source.indexOf('  var ATTR_KEY');
const end=source.indexOf('  })();',start)+8;
assert(start>=0 && end>start);
const code=source.slice(start,end);
const key=source.match(/var ATTR_KEY = "([^"]+)"/)[1];
const fn=outback?'utmParams':'utm';
const map=new Map();
const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
let now=10000000;
function page(search='',sessionStorage=storage){
 const c={URLSearchParams,location:{search},sessionStorage,Date:{now:()=>now}};
 vm.createContext(c); vm.runInContext(code,c);
 return ()=>JSON.parse(JSON.stringify(c[fn]()));
}
const fb={utm_source:'facebook',utm_medium:'paid_social',utm_campaign:'brand-trial',utm_content:'creative-5'};
const landing=page('?'+new URLSearchParams(fb));
assert.deepEqual(landing(),fb);
now+=5*60*1000;
assert.deepEqual(page()(),fb,'untagged product page retains Facebook');
now+=5*60*1000;
const quote=page(); assert.deepEqual(quote(),fb,'quote page retains all campaign fields');
const captured=JSON.parse(map.get(key)).at;
quote(); assert.equal(JSON.parse(map.get(key)).at,captured,'submit does not extend expiry');
now=captured+30*60*1000;
assert.deepEqual(quote(),{},'already-open form also expires');
assert.deepEqual(landing(),{},'tagged landing form cannot refresh expired visit');
assert.equal(map.has(key),false);
for(const click of ['gclid','gbraid','wbraid']){
 page('?'+new URLSearchParams(fb));
 assert.deepEqual(page('?'+click+'=google-click')(),{[click]:'google-click'});
 assert.deepEqual(page()(),{[click]:'google-click'},'no old Facebook fields');
 assert.deepEqual(page('?'+new URLSearchParams(fb))(),fb,'Facebook replaces Google IDs');
}
page('?gclid=old-google');
assert.deepEqual(page('?fbclid=organic-share')(),{fbclid:'organic-share'},'unlabelled Facebook click is not called paid');
assert.deepEqual(page('?utm_source=facebook')(),{utm_source:'facebook'},'partial new tags cannot inherit paid medium');
map.set(key,'{bad');assert.deepEqual(page()(),{});
for(const bad of [{at:now+1,values:fb},{at:'123',values:fb},{at:now,values:[]},{at:now,values:{utm_source:123,unknown:'x'}}]){
 map.set(key,JSON.stringify(bad));assert.deepEqual(page()(),{});
}
const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
assert.deepEqual(page('?'+new URLSearchParams(fb),blocked)(),fb,'blocked storage preserves current page');
assert.deepEqual(page('',blocked)(),{},'blocked storage does not invent prior attribution');
map.set(key,JSON.stringify({at:now,values:{gclid:'old'}}));
const quota={...storage,setItem(){throw Error('quota')}};
assert.deepEqual(page('?'+new URLSearchParams(fb),quota)(),fb,'quota cannot resurrect old Google source');
assert.equal(map.has(key),false,'clear stale source after failed write');
assert.equal(page('?utm_campaign='+'x'.repeat(1000))().utm_campaign.length,500);
map.clear();map.set('another_brand_campaign_attribution_v1',JSON.stringify({at:now,values:fb}));
assert.deepEqual(page()(),{},'brand storage namespace isolated');
const blank={getItem:()=>null,setItem(){},removeItem(){}};
assert.deepEqual(page('',blank)(),{},'new tab without storage is organic');
console.log('PASS: multi-page retention, fixed expiry, Google/Meta replacement, organic click, corrupt/future storage, blocked/quota storage, field bounds and brand isolation.');
