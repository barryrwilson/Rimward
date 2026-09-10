/** Issue 56: real Chromium pointer/keyboard acceptance using an unmodified earned save.
 * ISSUE56_SAVE must name an exported game autosave; its SHA-256 is recorded.
 * No purse/cargo/stock/hull injection is used. approachDock is the ordinary public
 * pilot command; every asserted composer interaction uses CDP input, never click()
 * or synthetic DOM events. Profiles, Vite cache and logs stay under ISSUE56_OUT.
 * Run: node scripts/issue-56-bulk-trade-live-probe.mjs
 * ISSUE56_ZOOM_ONLY=1 limits the run to the native 200% zoom scenario for repair
 * checks; the default full suite stays the acceptance run.
 * In that full suite the first Buy Max activation is one real press held across a
 * periodic station render (pin buy-max-held-across-refresh). The narrow-panel and
 * native-zoom pointer round trips keep ordinary short clicks, so they still verify the
 * plain pointer path on their own.
 * The two pointer scenarios (minimum panel and native 200% zoom) also run a text
 * readability diagnostic at the ready Buy Max preview, at the ready Sell All preview and at
 * the final receipt. It measures the real text with Range.getClientRects and hit tests every
 * fragment, so a label whose right half is off screen or under the fixed agent play badge
 * fails even though its element box is contained and its centre click works. That pin is
 * recorded without stopping the run, so all three states stay inspectable; the verdict is
 * still FAIL when it fails.
 * That scan costs several simulation seconds, so in those two scenarios the readability
 * diagnostic and the trade are separate phases: the scan reads the displayed preview and
 * confirms nothing, then the same native preset is pressed once more and the confirmation
 * follows immediately with no scan in between. The extra activation is recorded per phase in
 * results.roundTrips. The default keyboard round trip keeps its four activations.
 */
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,mkdtemp,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {createServer} from 'node:net';
import {dirname,join,resolve,relative,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const viteBin=join(dirname(require.resolve('vite/package.json')),'bin/vite.js');
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.env.ISSUE56_OUT||join(repo,'out/issue-56-evidence/fiona/live'));
const savePath=resolve(process.env.ISSUE56_SAVE||join(repo,'out/issue-56-evidence/fiona/earned-save.json'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const hash=s=>createHash('sha256').update(s).digest('hex');
// Headless Chrome counts the native window frame inside --window-size: the earlier
// live run measured 1280x807 -> innerWidth 1264 / innerHeight 712, i.e. a 16x95
// native border. Asking for 1296x815 therefore gives an actual 1280x720 viewport at
// 100%, which halves exactly to 640x360 under native 200% zoom.
const NATIVE={window:{width:1296,height:815},border:{width:16,height:95}};
const CONTENT={width:NATIVE.window.width-NATIVE.border.width,height:NATIVE.window.height-NATIVE.border.height};
// Chromium chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc GetPartitionKey() builds
// the key as "x" + HexEncode(relative_path); the default StoragePartition has an empty
// relative path, so its key is plain "x". partition.default_zoom_level is therefore a
// dictionary of partition key -> zoom level, never a bare number, and the level is a
// logarithmic zoom factor (log(zoom)/log(1.2)). A malformed value is dropped silently.
// https://chromium.googlesource.com/chromium/src/+/lkgr/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc
const zoomPrefs=zoom=>({partition:{default_zoom_level:{x:Math.log(zoom)/Math.log(1.2)}}});
const METRICS=`({innerWidth,innerHeight,outerWidth,outerHeight,dpr:devicePixelRatio,visualScale:visualViewport.scale,visualWidth:visualViewport.width,visualHeight:visualViewport.height,screenWidth:screen.width,screenHeight:screen.height})`;
const results={started:new Date().toISOString(),save:{path:savePath},inputMethod:'Chromium CDP Input.dispatchKeyEvent / Input.dispatchMouseEvent / Input.insertText',resourceFixtures:false,nativeWindow:{requested:NATIVE.window,measuredBorder:NATIVE.border,expectedViewport:CONTENT},pins:{},runs:[],sourceBefore:{},sourceAfter:{},cleanup:[],readabilityFailures:[]};
const log=[];const say=(...s)=>{const v=s.join(' ');log.push(v);console.log(v);};
function pin(name,pass,detail){results.pins[name]={pass,...detail};say(pass?'PASS':'FAIL',name,JSON.stringify(detail).slice(0,600));if(!pass)throw Error('Acceptance failed: '+name);}
// Diagnostic-only pin. A readability failure has to keep its evidence and still let the
// other diagnostic states (buy-ready, sell-ready, receipt) be inspected in the same run,
// so it does not throw. It is still a real pin: the final verdict is FAIL when any pin
// fails, and no readability pin may ever be satisfied by containment alone.
function softPin(name,pass,detail){results.pins[name]={pass,...detail};say(pass?'PASS':'FAIL',name,JSON.stringify(detail).slice(0,600));if(!pass)results.readabilityFailures.push(name);}
async function until(fn,ms=15000){const end=Date.now()+ms;let last;while(Date.now()<end){last=await fn();if(last)return last;await sleep(150);}throw Error('Timed out; last value '+JSON.stringify(last));}
async function freePort(){const s=createServer();await new Promise((r,j)=>{s.once('error',j);s.listen(0,'127.0.0.1',r);});const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function census(){const files=['src/systems/station.js','src/systems/controls.js','src/systems/agent-api.js','src/ui/screens.css','package.json','scripts/issue-56-bulk-trade-live-probe.mjs'];const all=await readdir(join(repo,'src/game'));for(const f of all)if(f.includes('trade'))files.push('src/game/'+f);return Object.fromEntries(await Promise.all(files.map(async f=>[f,hash(await readFile(join(repo,f)))])));}
async function kill(child){if(!child?.pid||child.exitCode!=null)return;if(process.platform==='win32')await new Promise(r=>{const k=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});k.once('error',r);k.once('exit',r);});else child.kill('SIGKILL');}
async function removeOwned(path,prefix){const p=resolve(path);if(relative(out,p)!==basename(p)||!basename(p).startsWith(prefix))throw Error('Unsafe cleanup target');await rm(p,{recursive:true,force:true,maxRetries:8,retryDelay:250});}
class Cdp{
 constructor(url){this.ws=new WebSocket(url);this.pending=new Map();this.id=0;this.errors=[];this.saves=[];}
 async ready(){this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params);if(m.method==='Runtime.consoleAPICalled'&&['error','assert'].includes(m.params.type))this.errors.push(m.params);if(['DOMStorage.domStorageItemAdded','DOMStorage.domStorageItemUpdated'].includes(m.method)&&m.params.key==='rimward-save-v1'){const s=JSON.parse(m.params.newValue);this.saves.push({credits:s.world.credits,held:s.cargo.reduce((n,r)=>n+(r.commodity==='provisions'?r.units:0),0),stock:s.world.marketSupply?.[s.world.currentSystem]?.provisions});}const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);});await new Promise((r,j)=>{this.ws.addEventListener('open',r,{once:true});this.ws.addEventListener('error',j,{once:true});});}
 send(method,params={}){const id=++this.id;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout '+method));},30000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));});}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
 async key(code,key,extra={},release=true){const vk={Enter:13,Space:32,Tab:9,Escape:27,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40,Home:36,End:35,Backspace:8,Delete:46}[code]||(code.startsWith('Digit')?48+Number(code.slice(5)):code.startsWith('Key')?code.charCodeAt(3):0);const text=code==='Enter'?'\r':key.length===1?key:'';await this.send('Input.dispatchKeyEvent',{type:'keyDown',code,key,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,...(text&&!extra.modifiers?{text,unmodifiedText:text}:{}),...extra});if(release)await this.send('Input.dispatchKeyEvent',{type:'keyUp',code,key,windowsVirtualKeyCode:vk,nativeVirtualKeyCode:vk,modifiers:extra.modifiers||0});}
 async pointAt(selector){return this.eval(`(()=>{const n=document.querySelector(${JSON.stringify(selector)});if(!n)throw Error('Missing selector');n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);}
 async mouseAt(type,p){const s=this.pointerScale||1;await this.send('Input.dispatchMouseEvent',{type,x:p.x/s,y:p.y/s,button:type==='mouseMoved'?'none':'left',clickCount:1});}
 async click(selector){const p=await this.pointAt(selector);for(const type of ['mouseMoved','mousePressed','mouseReleased'])await this.mouseAt(type,p);return p;}
 // Read-only capture listeners; they record what the real pointer events carried and
 // never synthesise or alter one. The mouseup listener also records whether the node that
 // received the mousedown is still connected at that instant, because the observed bug
 // replaces the button between down and up. That reference lives in a probe-only global
 // and is never written back to the page. The whole installation is idempotent: a second
 // call on the same document reuses the single set of listeners, so nothing double-counts.
 async watchPointer(){await this.eval("(()=>{const p=window.__probePointer=window.__probePointer||{move:null,down:null,up:null,click:null,clicks:0,downNode:null};if(p.installed)return true;p.installed=true;const desc=n=>n?{id:n.id||null,tag:n.tagName||null,cls:typeof n.className==='string'?n.className:String(n.className||'')}:null;document.addEventListener('mousemove',e=>{p.move={x:e.clientX,y:e.clientY,trusted:e.isTrusted};},true);document.addEventListener('mousedown',e=>{p.downNode=e.target||null;p.down={...desc(e.target),x:e.clientX,y:e.clientY,trusted:e.isTrusted};},true);document.addEventListener('mouseup',e=>{p.up={...desc(e.target),x:e.clientX,y:e.clientY,trusted:e.isTrusted,sameNodeAsDown:!!p.downNode&&p.downNode===e.target,downNodeConnected:p.downNode?p.downNode.isConnected===true:null};},true);document.addEventListener('click',e=>{p.clicks++;p.click={...desc(e.target),trusted:e.isTrusted,detail:e.detail,sameNodeAsDown:!!p.downNode&&p.downNode===e.target};},true);return true;})()");}
 // Input.dispatchMouseEvent coordinates are widget-space, so under native browser zoom
 // they are not CSS pixels. Measure the factor from one real event instead of assuming.
 async calibratePointer(){this.pointerScale=1;await this.eval('window.__probePointer.move=null;true');const probe={x:120,y:120};await this.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:probe.x,y:probe.y,button:'none'});const got=await until(()=>this.eval('window.__probePointer.move||null'),5000);const scale=got.x/probe.x;if(!Number.isFinite(scale)||scale<=0)throw Error('Pointer calibration failed: '+JSON.stringify(got));this.pointerScale=scale;return{probe,got,scale};}
 async pointerTarget(){return this.eval('window.__probePointer.down||null');}
 async armPointer(){await this.eval('(()=>{const p=window.__probePointer;p.down=null;p.up=null;p.click=null;p.clicks=0;p.downNode=null;return true;})()');}
 async pointerObservations(){return this.eval('(()=>{const p=window.__probePointer;return{down:p.down,up:p.up,click:p.click,clicks:p.clicks};})()');}
 async capture(){const r=await this.send('Page.captureScreenshot',{format:'png'});return Buffer.from(r.data,'base64');}
 async shot(name){await writeFile(join(out,name),await this.capture());}
 close(){this.ws.close();}
}
const READ=`(()=>{const c=window.__ctx;const q=document.querySelector('#market-bulk-quantity');return {time:c.world.time,credits:c.world.credits,capacity:c.cargoCapacity,cargo:c.cargo.map(r=>({...r})),held:c.cargo.reduce((n,r)=>n+(r.commodity==='provisions'?r.units:0),0),stock:c.stationDesk.peekTradeAvailability('provisions'),unitBuy:c.stationDesk.peekFillUnit('provisions',true),unitSell:c.stationDesk.peekFillUnit('provisions',false),docked:c.flags.docked,system:c.world.currentSystem,quantity:q?.value,focus:document.activeElement?.id,selection:[q?.selectionStart,q?.selectionEnd],preview:document.querySelector('#market-bulk-preview')?.textContent,receipt:document.querySelector('.market-bulk-receipt')?.textContent,buyDisabled:document.querySelector('#market-bulk-buy')?.disabled,sellDisabled:document.querySelector('#market-bulk-sell')?.disabled,input:{fire:c.input.fireHeld,throttle:c.input.throttle,strafeX:c.input.strafeX,strafeY:c.input.strafeY,roll:c.input.roll,afterburner:c.input.afterburnerPressed}}})()`;
async function openMarket(cdp,save){
 await until(()=>cdp.eval('!!window.__ctx'),40000);
 await cdp.eval(`localStorage.setItem('rimward-save-v1',${JSON.stringify(save)}); location.reload(); true`);
 await until(()=>cdp.eval("!!document.querySelector('#rw-title-continue')"),40000);
 // Calibration has to precede the very first real click. openMarket itself clicks Continue
 // and the native commodity selector, and under native 200% zoom an uncalibrated widget
 // coordinate would land at half the intended CSS point and miss them. This runs after the
 // reloaded title is ready, so the listeners survive to the market screen. It stays
 // read-only: watchPointer only records real events, and calibration moves the pointer with
 // a single CDP mouseMoved over the title screen. No synthetic DOM event is dispatched, no
 // element is activated and no gameplay state is written.
 await cdp.watchPointer();const calibration=await cdp.calibratePointer();results.runs.at(-1).pointerCalibration=calibration;say('pointer calibration before Continue',JSON.stringify(calibration));
 await cdp.click('#rw-title-continue');
 await until(()=>cdp.eval('!!window.__ctx?.world?.origin && !document.querySelector("#rw-title")'),40000);
 // Continue restores the system before the station's next update rebuilds its
 // live pose. Wait for the same observable pose contract used by approachDock.
 await until(()=>cdp.eval(`(()=>{const c=window.__ctx,p=c.station?.position,a=c.systems?.[c.world.currentSystem]?.station?.position;return !!c.ship?.object&&!c.flags.paused&&!!c.stationDesk&&Array.isArray(a)&&a.length>=3&&[p?.x,p?.y,p?.z,...a.slice(0,3)].every(Number.isFinite)&&Math.hypot(p.x-a[0],p.y-a[1],p.z-a[2])<=0.01;})()`),40000);
 const before=await cdp.eval('({docked:window.__ctx.flags.docked,credits:window.__ctx.world.credits,capacity:window.__ctx.cargoCapacity,system:window.__ctx.world.currentSystem})');
 if(!before.docked){const action=await cdp.eval("window.rimward.act({v:2,name:'approachDock',args:{}})");results.runs.at(-1).approachDock=action;say('ordinary approachDock',JSON.stringify(action));if(!action.ok)throw Error('Ordinary approachDock refused: '+JSON.stringify(action));await until(()=>cdp.eval('window.__ctx.flags.docked===true'),180000);}
 await cdp.key('Digit1','1');await until(()=>cdp.eval("!!document.querySelector('#market-bulk-quantity')"));
 const index=await cdp.eval("[...document.querySelector('#market-bulk-commodity').options].findIndex(o=>o.value==='provisions')");
 await cdp.click('#market-bulk-commodity');await cdp.key('Home','Home');for(let i=0;i<index;i++)await cdp.key('ArrowDown','ArrowDown');await cdp.key('Enter','Enter');
 pin('earned-save-'+results.runs.length,before.capacity===160&&before.credits>=160*(await cdp.eval(READ)).unitBuy,{before});
}
async function field(cdp,text){await cdp.click('#market-bulk-quantity');await cdp.key('KeyA','a',{modifiers:2});await cdp.key('Backspace','Backspace');if(text)await cdp.send('Input.insertText',{text});}
async function layout(cdp,name){await cdp.eval("document.querySelector('.market-bulk').scrollIntoView({block:'center'})");const detail=await cdp.eval(`(()=>{const box=document.querySelector('.market-bulk'),panel=box.closest('.screen-panel');const b=box.getBoundingClientRect();const controls=[...box.querySelectorAll('input,select,button')].map(n=>{const r=n.getBoundingClientRect();return{id:n.id,x:r.x,right:r.right,width:r.width}});return{innerWidth,innerHeight,dpr:devicePixelRatio,visualScale:visualViewport.scale,panel:{width:panel.getBoundingClientRect().width,client:panel.clientWidth,scroll:panel.scrollWidth},box:{x:b.x,right:b.right,width:b.width},controls};})()`);await cdp.shot(name+'.png');pin(name,detail.panel.scroll<=detail.panel.client+1&&detail.box.x>=0&&detail.box.right<=detail.innerWidth&&detail.controls.every(r=>r.x>=detail.box.x&&r.right<=detail.box.right),detail);return detail;}
// Containment inside the panel box does not prove a person can read a label or a field
// value: a fixed overlay can still cover it. Each bulk-trade label wraps its control, so the
// label's own text is measured with a Range and the value box is the control rect. Both are
// hit tested at the four corners and the centre with document.elementFromPoint. Only the
// native scrollIntoView the page already offers is used; nothing is hidden, moved, restyled
// or removed. The fixed agent play badge is out of scope and stays exactly as the game draws
// it, enabled or disabled, and any residual obstruction is reported as a failure.
// block:'start' parks the label under the fixed badge that sits at the top of the panel.
// The panel is taller than the badge, so a native block:'end' (and, failing that, a native
// block:'center') can rest the same label and field below the badge. These are ordinary
// scrollIntoView positions the page already supports: no scroll offset, content, layout or
// style is written, and the badge itself is never touched.
const REACH_STRATEGIES=[{name:'parent',target:'parent',block:'start'},{name:'label',target:'label',block:'start'},{name:'label-end',target:'label',block:'end'},{name:'label-centre',target:'label',block:'center'}];
const reachProbe=(fieldId,strategy)=>"(()=>{"
 +"const field=document.getElementById("+JSON.stringify(fieldId)+");if(!field)throw Error('Missing field');"
 +"const label=field.closest('label');if(!label)throw Error('Missing label');"
 +"const target="+(strategy.target==='parent'?'label.parentElement':'label')+";if(!target)throw Error('Missing scroll target');"
 +"target.scrollIntoView({block:"+JSON.stringify(strategy.block)+"});"
 +"const textNode=[...label.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(!textNode)throw Error('Missing label text');"
 +"const range=document.createRange();range.selectNode(textNode);const lr=range.getBoundingClientRect();"
 +"const fr=field.getBoundingClientRect();"
 +"const box=r=>({x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left});"
 +"const desc=n=>n?{tag:n.tagName,id:n.id||null,cls:typeof n.className==='string'?n.className:String(n.className||'')}:null;"
 +"const pts=r=>[['topLeft',r.left+1,r.top+1],['topRight',r.right-1,r.top+1],['bottomLeft',r.left+1,r.bottom-1],['bottomRight',r.right-1,r.bottom-1],['centre',(r.left+r.right)/2,(r.top+r.bottom)/2]];"
 +"const test=(r,root)=>pts(r).map(p=>{const top=document.elementFromPoint(p[1],p[2]);return{point:p[0],x:p[1],y:p[2],hit:desc(top),ok:!!top&&root.contains(top)};});"
 +"const seen=r=>r.width>0&&r.height>0&&r.top>=0&&r.left>=0&&r.bottom<=innerHeight&&r.right<=innerWidth;"
 +"const labelHits=test(lr,label),fieldHits=test(fr,field);"
 +"const badge=document.querySelector('.rw-agent-badge');"
 +"const obstructions=[...labelHits,...fieldHits].filter(h=>!h.ok);"
 +"return{field:field.id,strategy:"+JSON.stringify(strategy)+",labelText:textNode.textContent.trim(),value:field.value===undefined?null:String(field.value),"
 +"labelRect:box(lr),fieldRect:box(fr),labelVisible:seen(lr),fieldVisible:seen(fr),labelHits,fieldHits,obstructions,"
 +"badge:badge?{present:true,rect:box(badge.getBoundingClientRect()),cls:badge.className,display:getComputedStyle(badge).display,visibility:getComputedStyle(badge).visibility,untouched:true}:{present:false},"
 +"viewport:{innerWidth,innerHeight,dpr:devicePixelRatio,visualScale:visualViewport.scale},"
 +"pass:seen(lr)&&seen(fr)&&labelHits.every(h=>h.ok)&&fieldHits.every(h=>h.ok)};})()";
async function labelReach(cdp,name,shotPrefix){
 const fields=[];
 for(const fieldId of ['market-bulk-commodity','market-bulk-quantity']){
  const attempts=[];let chosen=null;
  for(const strategy of REACH_STRATEGIES){const r=await cdp.eval(reachProbe(fieldId,strategy));attempts.push(r);if(r.pass){chosen=r;break;}}
  chosen=chosen||attempts.at(-1);
  await cdp.shot(shotPrefix+'-'+fieldId.replace('market-bulk-','')+'.png');
  fields.push({fieldId,chosen,attempts});
 }
 pin(name,fields.every(f=>f.chosen.pass),{method:'native scrollIntoView only, in order: label parent block:start, label block:start, label block:end, label block:center; the first passing position is chosen and every earlier attempt is kept; elementFromPoint at corners and centre; no DOM hidden, moved or styled',strategies:REACH_STRATEGIES,fields});
 return fields;
}
// Readability, not containment. A label whose element box sits inside the panel can still
// have half of its rendered text off the viewport or under the fixed agent play badge, and a
// successful click at the button centre says nothing about the text. Every text node inside a
// target is therefore measured with Range.getClientRects, so each wrapped line fragment is a
// rectangle of its own, and each fragment is hit tested at its four corners and its centre
// with document.elementFromPoint. Where the badge rectangle intersects a fragment, the centre
// of that intersection is hit tested too, so an overlap that misses the corners is still
// caught. A target passes only when every fragment of its text is simultaneously inside the
// viewport and unobstructed at one single scroll position: no stitching across positions and
// no inference from the button centre.
// Only the native scrollIntoView the page already offers is used, in the order start, end,
// center, nearest, and the first passing position is the chosen one. Nothing is hidden,
// moved, restyled or removed, no scroll offset is written directly, and the badge is left
// exactly as the game draws it; a residual obstruction is reported as a failure.
const READABLE_STRATEGIES=[{name:'start',block:'start'},{name:'end',block:'end'},{name:'center',block:'center'},{name:'nearest',block:'nearest'}];
const readableProbe=(target,strategy)=>"(()=>{"
 +"const sel="+JSON.stringify(target.sel)+",index="+JSON.stringify(target.index)+";"
 +"const nodes=[...document.querySelectorAll(sel)];const el=nodes[index];"
 +"if(!el)throw Error('Missing readability target '+sel+' #'+index);"
 +"el.scrollIntoView({block:"+JSON.stringify(strategy.block)+",inline:'nearest'});"
 +"const box=r=>({x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,right:r.right,bottom:r.bottom,left:r.left});"
 +"const desc=n=>n?{tag:n.tagName,id:n.id||null,cls:typeof n.className==='string'?n.className:String(n.className||'')}:null;"
 +"const badgeEl=document.querySelector('.rw-agent-badge');const badgeRect=badgeEl?badgeEl.getBoundingClientRect():null;"
 +"const cross=r=>{if(!badgeRect)return{badge:false};const l=Math.max(r.left,badgeRect.left),t=Math.max(r.top,badgeRect.top),ri=Math.min(r.right,badgeRect.right),b=Math.min(r.bottom,badgeRect.bottom);"
 +"return ri<=l||b<=t?{badge:true,overlaps:false,area:0}:{badge:true,overlaps:true,area:(ri-l)*(b-t),rect:{left:l,top:t,right:ri,bottom:b},centre:{x:(l+ri)/2,y:(t+b)/2}};};"
 +"const hitAt=(point,x,y)=>{const top=document.elementFromPoint(x,y);return{point,x,y,hit:desc(top),ok:!!top&&el.contains(top),"
 +"ancestorOfTarget:!!top&&top!==el&&top.contains(el),isBadge:!!top&&!!badgeEl&&(top===badgeEl||badgeEl.contains(top))};};"
 +"const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.textContent.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});"
 +"const fragments=[];let node,ti=-1;"
 +"while((node=walker.nextNode())){ti++;const range=document.createRange();range.selectNodeContents(node);"
 +"const rects=[...range.getClientRects()].filter(r=>r.width>0.5&&r.height>0.5);"
 +"if(!rects.length){fragments.push({textIndex:ti,fragment:0,text:node.textContent,parent:desc(node.parentElement),rect:null,seen:false,hits:[],badge:badgeRect?{badge:true,overlaps:false,area:0}:{badge:false},pass:false,note:'text node has no client rects'});continue;}"
 +"rects.forEach((r,fi)=>{const seen=r.top>=0&&r.left>=0&&r.bottom<=innerHeight&&r.right<=innerWidth;"
 +"const ix=Math.min(1,r.width/3),iy=Math.min(1,r.height/3);"
 +"const hits=[hitAt('topLeft',r.left+ix,r.top+iy),hitAt('topRight',r.right-ix,r.top+iy),hitAt('bottomLeft',r.left+ix,r.bottom-iy),hitAt('bottomRight',r.right-ix,r.bottom-iy),hitAt('centre',(r.left+r.right)/2,(r.top+r.bottom)/2)];"
 +"const bi=cross(r);if(bi.overlaps)hits.push(hitAt('badgeOverlapCentre',bi.centre.x,bi.centre.y));"
 +"fragments.push({textIndex:ti,fragment:fi,fragments:rects.length,text:node.textContent,parent:desc(node.parentElement),rect:box(r),seen,hits,badge:bi,pass:seen&&hits.every(h=>h.ok)});});}"
 +"const panel=el.closest('.screen-panel');const doc=document.scrollingElement;"
 +"return{key:"+JSON.stringify(target.key)+",selector:sel,index,matches:nodes.length,element:desc(el),text:el.textContent,"
 +"disabled:el.disabled===undefined?null:!!el.disabled,strategy:"+JSON.stringify(strategy)+",textNodes:ti+1,fragments,"
 +"panel:panel?{scrollTop:panel.scrollTop,scrollMin:0,scrollMax:Math.max(0,panel.scrollHeight-panel.clientHeight),scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,rect:box(panel.getBoundingClientRect())}:null,"
 +"document:doc?{scrollTop:doc.scrollTop,scrollMin:0,scrollMax:Math.max(0,doc.scrollHeight-doc.clientHeight)}:null,"
 +"badge:badgeEl?{present:true,rect:box(badgeRect),cls:badgeEl.className,display:getComputedStyle(badgeEl).display,visibility:getComputedStyle(badgeEl).visibility,untouched:true}:{present:false},"
 +"viewport:{innerWidth,innerHeight,dpr:devicePixelRatio,visualScale:visualViewport.scale},"
 +"obstructions:fragments.flatMap(f=>f.hits.filter(h=>!h.ok).map(h=>({textIndex:f.textIndex,fragment:f.fragment,text:f.text,rect:f.rect,...h}))),"
 +"offscreen:fragments.filter(f=>!f.seen).map(f=>({textIndex:f.textIndex,fragment:f.fragment,text:f.text,rect:f.rect})),"
 +"pass:fragments.length>0&&fragments.every(f=>f.pass)};})()";
// The target list is read from the live DOM, never assumed: whatever preview child blocks,
// confirmation buttons and receipt the page happens to show in this state are what get
// measured. A disabled Buy in the sell-ready state is measured exactly as it stands; the
// probe never presses anything here and never manufactures an intent.
async function readableTargets(cdp){
 return cdp.eval("(()=>{const desc=n=>({tag:n.tagName,id:n.id||null,cls:typeof n.className==='string'?n.className:String(n.className||'')});"
  +"const preview=document.querySelector('#market-bulk-preview');const kids=preview?[...preview.children]:[];"
  +"const out=kids.map((n,i)=>({key:'preview-'+i,sel:'#market-bulk-preview > *',index:i,element:desc(n),text:n.textContent}));"
  +"for(const [key,sel] of [['buy-label','#market-bulk-buy'],['sell-label','#market-bulk-sell'],['receipt','.market-bulk-receipt']]){"
  +"const n=document.querySelector(sel);if(n)out.push({key,sel,index:0,element:desc(n),text:n.textContent,disabled:n.disabled===undefined?null:!!n.disabled});}"
  +"return{targets:out,previewPresent:!!preview,previewText:preview?preview.textContent:null,receiptPresent:!!document.querySelector('.market-bulk-receipt')};})()");
}
async function textReadability(cdp,name,shotPrefix){
 const inventory=await readableTargets(cdp);const targets=[];
 for(const target of inventory.targets){
  const attempts=[];let chosen=null;const shots=[];
  const snap=async strategy=>{const file=`${shotPrefix}-${target.key}-${strategy.name}.png`;await writeFile(join(out,file),await cdp.capture());shots.push(file);};
  for(const strategy of READABLE_STRATEGIES){
   const r=await cdp.eval(readableProbe(target,strategy));attempts.push(r);
   // One screenshot at the chosen passing position, taken while the page still rests there.
   if(r.pass){chosen=r;await snap(strategy);break;}
  }
  if(!chosen){
   // Unreachable text: every failed alternative is captured, because that set is the
   // evidence. Re-applying a native scrollIntoView is the same read-only move as before.
   chosen=attempts.at(-1);
   for(const strategy of READABLE_STRATEGIES){await cdp.eval(readableProbe(target,strategy));await snap(strategy);}
  }
  targets.push({key:target.key,declared:target,chosen,attempts,shots});
  say('readability',name,target.key,chosen.pass?'readable at '+chosen.strategy.name:'UNREADABLE after '+attempts.length+' native scroll positions');
 }
 softPin(name,targets.length>0&&targets.every(t=>t.chosen.pass),{method:'Range.getClientRects over every text node of the target, so each wrapped line fragment is measured; document.elementFromPoint at each fragment corner, centre and any badge-overlap centre; native scrollIntoView start/end/center/nearest only, first passing position chosen; all text of one target must be unobscured at one single position; nothing hidden, moved, styled or scrolled directly',strategies:READABLE_STRATEGIES,inventory,targets});
 return targets;
}
function fills(saves,before){let prior=before;return saves.flatMap(s=>{if(s.held===prior.held)return[];const row={qty:Math.abs(s.held-prior.held),cashDelta:s.credits-prior.credits,after:s};prior=s;return[row];});}
// A preset or a confirmation that the desk turns down leaves a refusal in the receipt.
// The probe never re-presses in that case; the pin simply fails with the receipt text.
const REFUSAL=/stale|refus|expired|cancell?ed|unable|unavailable|insufficient|try again|no longer/i;
// Regression for the observed bug: the station's periodic render replaced the native Buy
// Max button between a real mousedown and the mouseup, so the browser found no shared
// ancestor and delivered no click. One real press is therefore held across at least one
// refresh and then released. Simulation time is only read: the probe never pauses, steps,
// scales or otherwise writes game time, and the runtime's own >=10fps dt cap of 0.1 makes
// 1600ms of held real time normally worth >=1.0s of simulation. If a slow machine gives
// less, the same button stays down for one bounded wait until 1.1 simulation seconds have
// passed, up to 10 real seconds. That is waiting inside a single press, not a retry: the
// button is never released early and never pressed again.
const HOLD={realMs:1600,minSim:1.0,waitSim:1.1,maxWaitMs:10000};
async function heldPreset(cdp,selector){
 const point=await cdp.pointAt(selector);await cdp.mouseAt('mouseMoved',point);await cdp.armPointer();
 const simBefore=await cdp.eval('window.__ctx.world.time');const realStart=Date.now();
 await cdp.mouseAt('mousePressed',point);
 await sleep(HOLD.realMs);
 let simHeld=await cdp.eval('window.__ctx.world.time');
 const wait={used:false,realMs:0,reachedElapsed:null};
 if(simHeld-simBefore<HOLD.minSim){
  wait.used=true;const waitStart=Date.now(),end=waitStart+HOLD.maxWaitMs;
  while(Date.now()<end&&simHeld-simBefore<HOLD.waitSim){await sleep(100);simHeld=await cdp.eval('window.__ctx.world.time');}
  wait.realMs=Date.now()-waitStart;wait.reachedElapsed=simHeld-simBefore;
 }
 const during=await cdp.eval(READ);const heldNode=await cdp.eval('(()=>{const p=window.__probePointer;return{down:p.down,downNodeConnected:p.downNode?p.downNode.isConnected===true:null};})()');
 // isConnected is captured by the capture-phase mouseup listener, before the game's own
 // post-click refresh can replace the node again.
 await cdp.mouseAt('mouseReleased',point);
 const realHeldMs=Date.now()-realStart;const observed=await cdp.pointerObservations();const simAfter=await cdp.eval('window.__ctx.world.time');
 return {selector,point,realHeldMs,simBefore,simHeld,simAfter,heldElapsed:simHeld-simBefore,wait,during,heldNode,observed,bounds:HOLD};
}
// The readability scan is long: it walks four native scroll positions for every preview
// child, both confirmation labels and the receipt, and writes a screenshot at each chosen
// position. Several simulation seconds pass, so the station's own periodic refresh can move
// the real quote underneath it. A preview captured before that scan is therefore a stale
// snapshot by the time the scan ends, and the desk is right to turn down a confirmation that
// rests on it. That refusal is correct behaviour, not a defect, so the readable scenarios
// split the two concerns instead of asserting through them:
//   diagnostic phase  - preset, then the readability scan over the displayed preview. The
//                       preview text, the hit tests and the screenshots are all kept exactly
//                       as they are today, and nothing here is confirmed.
//   transaction phase - the same native preset is pressed once more, as an ordinary
//                       user-visible intent, and the confirmation follows immediately with no
//                       scan in between. The preset itself must move no cash and no cargo;
//                       the receipt and autosave arithmetic is checked against the fresh
//                       displayed quote that that press produced.
// This adds one real activation per side in the readable scenarios only. Those extra
// activations are recorded in results.roundTrips with the phase that owns them, so the
// count is never presented as the fixed four of the deterministic station fixture. The
// default keyboard round trip keeps its four activations and is not changed at all.
// There is no retry on refusal and no loop until green: if the fresh confirmation is turned
// down, the pin fails in the ordinary way and the refusal is kept as the result.
async function freshPreset(cdp,trip,{id,suffix,stale,expectHeld,expectFocus}){
 await cdp.armPointer();await cdp.click('#'+id);
 const target=await cdp.pointerTarget();const fresh=await cdp.eval(READ);
 trip.activations.push({index:trip.activations.length+1,kind:'preset',id,phase:'transaction',note:'fresh user-visible intent after the diagnostic readability scan'});
 const drift={staleUnitBuy:stale.unitBuy,freshUnitBuy:fresh.unitBuy,staleUnitSell:stale.unitSell,freshUnitSell:fresh.unitSell,staleStock:stale.stock,freshStock:fresh.stock,staleSimTime:stale.time,freshSimTime:fresh.time,quoteMoved:stale.unitBuy!==fresh.unitBuy||stale.unitSell!==fresh.unitSell};
 pin('fresh-preset-'+id.replace('market-bulk-','')+suffix,
  fresh.quantity==='160'&&fresh.focus===expectFocus&&fresh.held===expectHeld
  &&fresh.credits===stale.credits&&fresh.held===stale.held&&JSON.stringify(fresh.cargo)===JSON.stringify(stale.cargo)
  &&!REFUSAL.test(fresh.receipt||'')&&target?.id===id&&target.trusted===true,
  {phase:'transaction',method:'one real CDP click on the same native preset after the diagnostic scan; the preset only re-quotes, so cash and cargo must be identical to the stale snapshot',stale,fresh,drift,target});
 return fresh;
}
/** mode.pointer activates Buy/Sell with real CDP mouse events instead of the keyboard.
 * mode.held presses Buy Max once and holds it across a periodic render before release.
 * mode.readable runs the readability scan as a diagnostic phase and then re-presses the
 * preset for a separate transaction phase, as described above.
 * mode.suffix keeps pin names unique; mode.shots renames the screenshots. */
async function fullRoundTrip(cdp,mode={}){
 const s=mode.suffix||'';const shots=mode.shots||['01-buy-preview','02-buy-receipt','03-sell-receipt'];
 const trip={suffix:s||'(default keyboard)',pointer:!!mode.pointer,held:!!mode.held,readable:mode.readable||null,activations:[]};
 (results.roundTrips=results.roundTrips||[]).push(trip);
 const press=async(id,code,key)=>{trip.activations.push({index:trip.activations.length+1,kind:'confirmation',id,phase:'transaction',input:mode.pointer?'CDP mouse':'CDP keyboard'});if(!mode.pointer){await cdp.key(code,key);return null;}await cdp.armPointer();await cdp.click('#'+id);return cdp.pointerTarget();};
 const hit=(target,id)=>!mode.pointer||(target?.id===id&&target.trusted===true);
 const before=await cdp.eval(READ);let held=null;
 trip.activations.push({index:1,kind:'preset',id:'market-bulk-buy-max',phase:mode.readable?'diagnostic':'transaction',note:mode.held?'single press held across a periodic station render':null});
 if(mode.held)held=await heldPreset(cdp,'#market-bulk-buy-max');
 else{await cdp.armPointer();await cdp.click('#market-bulk-buy-max');}
 const buyMaxTarget=await cdp.pointerTarget();const buyPreview=await cdp.eval(READ);
 if(held)pin('buy-max-held-across-refresh'+s,
  held.heldElapsed>=HOLD.minSim
  &&held.during.quantity===before.quantity&&held.during.credits===before.credits&&held.during.held===before.held&&JSON.stringify(held.during.cargo)===JSON.stringify(before.cargo)
  &&held.observed.down?.id==='market-bulk-buy-max'&&held.observed.down.trusted===true
  &&held.observed.up?.id==='market-bulk-buy-max'&&held.observed.up.trusted===true&&held.observed.up.downNodeConnected===true
  &&held.observed.clicks===1&&held.observed.click?.id==='market-bulk-buy-max'&&held.observed.click.trusted===true
  &&buyPreview.quantity==='160'&&buyPreview.focus==='market-bulk-buy'&&buyPreview.credits===before.credits&&buyPreview.held===before.held,
  {method:'one real CDP mousePressed held across a periodic station render, then one mouseReleased; no retry, no second press, no game time change',held});
 pin('buy-max-preset'+s,buyPreview.quantity==='160'&&buyPreview.credits===before.credits&&buyPreview.held===0&&buyPreview.focus==='market-bulk-buy'&&!REFUSAL.test(buyPreview.receipt||'')&&hit(buyMaxTarget,'market-bulk-buy-max'),{before,buyPreview,buyMaxTarget,pointer:!!mode.pointer});await cdp.shot(shots[0]+'.png');
 // Diagnostic phase: read the displayed Buy Max preview exactly as it stands. Nothing is
 // confirmed here, and the snapshot it measures is deliberately allowed to go stale.
 let buyQuote=buyPreview;
 if(mode.readable){
  await textReadability(cdp,'text-readable-buy-ready'+s,mode.readable+'-buy-ready');
  buyQuote=await freshPreset(cdp,trip,{id:'market-bulk-buy-max',suffix:s,stale:buyPreview,expectHeld:0,expectFocus:'market-bulk-buy'});
 }
 const buyIndex=cdp.saves.length;const buyTarget=await press('market-bulk-buy','Enter','Enter');const bought=await cdp.eval(READ);await sleep(150);const buyFills=fills(cdp.saves.slice(buyIndex),buyQuote);
 pin('bought-160'+s,bought.held===160&&bought.credits===buyQuote.credits-160*buyQuote.unitBuy&&buyQuote.unitSell<=buyQuote.unitBuy&&/Bought 160/.test(bought.receipt)&&/2 orders/.test(bought.receipt)&&!REFUSAL.test(bought.receipt||'')&&hit(buyTarget,'market-bulk-buy'),{before,buyPreview,buyQuote,bought,buyTarget,pointer:!!mode.pointer,method:'cash delta is checked against the displayed fill price of the snapshot the confirmation actually rests on'});pin('buy-order-autosaves'+s,JSON.stringify(buyFills.map(f=>f.qty))==='[99,61]'&&buyFills.every(f=>f.cashDelta===-f.qty*buyQuote.unitBuy),{method:'Read-only CDP DOMStorage notifications for ordinary trade autosaves',buyFills});await cdp.shot(shots[1]+'.png');
 trip.activations.push({index:trip.activations.length+1,kind:'preset',id:'market-bulk-sell-all',phase:mode.readable?'diagnostic':'transaction'});
 await cdp.armPointer();await cdp.click('#market-bulk-sell-all');const sellAllTarget=await cdp.pointerTarget();const sellPreview=await cdp.eval(READ);pin('sell-all-preset'+s,sellPreview.quantity==='160'&&sellPreview.held===160&&sellPreview.focus==='market-bulk-sell'&&!REFUSAL.test(sellPreview.receipt||'')&&hit(sellAllTarget,'market-bulk-sell-all'),{sellPreview,sellAllTarget});
 let sellQuote=sellPreview;
 if(mode.readable){
  await textReadability(cdp,'text-readable-sell-ready'+s,mode.readable+'-sell-ready');
  sellQuote=await freshPreset(cdp,trip,{id:'market-bulk-sell-all',suffix:s,stale:sellPreview,expectHeld:160,expectFocus:'market-bulk-sell'});
 }
 const sellIndex=cdp.saves.length;const sellTarget=await press('market-bulk-sell','Space',' ');const sold=await cdp.eval(READ);await sleep(150);const sellFills=fills(cdp.saves.slice(sellIndex),sellQuote);
 // A real quote can move between the buy and the sell, so "never richer than at the start"
 // is only a sound claim while the quotes stand still. What holds contemporaneously is that
 // each snapshot the trade rests on carries a sell unit no better than its own buy unit, and
 // that each leg's cash delta matches the fill price the screen displayed for it. The buy
 // unit, the sell unit, their drift and the resulting net cash are recorded either way, and
 // when neither quote moved the original no-profit assertion still applies.
 const spread={buyUnit:buyQuote.unitBuy,sellUnit:sellQuote.unitSell,buySnapshotSellUnit:buyQuote.unitSell,sellSnapshotBuyUnit:sellQuote.unitBuy,
  buyUnitDrift:sellQuote.unitBuy-buyQuote.unitBuy,sellUnitDrift:sellQuote.unitSell-buyQuote.unitSell,
  quotesUnchanged:sellQuote.unitBuy===buyQuote.unitBuy&&sellQuote.unitSell===buyQuote.unitSell,
  buyCost:160*buyQuote.unitBuy,sellProceeds:160*sellQuote.unitSell,
  netCash:sold.credits-before.credits,startCredits:before.credits,endCredits:sold.credits,
  contemporaneousSpreads:{atBuy:buyQuote.unitSell<=buyQuote.unitBuy,atSell:sellQuote.unitSell<=sellQuote.unitBuy}};
 pin('sold-160'+s,sold.held===0&&sold.credits===bought.credits+160*sellQuote.unitSell&&/Sold 160/.test(sold.receipt)&&/2 orders/.test(sold.receipt)
  &&spread.contemporaneousSpreads.atBuy&&spread.contemporaneousSpreads.atSell
  &&(!spread.quotesUnchanged||sold.credits<=before.credits)
  &&!REFUSAL.test(sold.receipt||'')&&hit(sellTarget,'market-bulk-sell'),{sold,sellQuote,sellTarget,pointer:!!mode.pointer,spread,method:'contemporaneous spread evidence: unitSell<=unitBuy inside each snapshot the trade rests on, exact cash delta against that snapshot displayed fill price, recorded quote drift and net cash; the no-profit assertion is kept whenever neither quote moved'});pin('sell-order-autosaves'+s,JSON.stringify(sellFills.map(f=>f.qty))==='[99,61]'&&sellFills.every(f=>f.cashDelta===f.qty*sellQuote.unitSell),{sellFills});await cdp.shot(shots[2]+'.png');
 if(mode.readable)await textReadability(cdp,'text-readable-receipt'+s,mode.readable+'-receipt');
 trip.activationCount=trip.activations.length;
 say('round trip',trip.suffix,'real activations',String(trip.activationCount),JSON.stringify(trip.activations.map(a=>a.phase+':'+a.kind+':'+a.id)));
}
async function keyboard(cdp){
 const before=await cdp.eval(READ);await cdp.click('#market-bulk-quantity');await cdp.key('KeyA','a',{modifiers:2});await cdp.key('Backspace','Backspace');
 for(const n of '160'){await cdp.key('Digit'+n,n);await sleep(1300);}
 let state=await cdp.eval(READ);pin('slow-typing-across-refresh',state.quantity==='160'&&state.focus==='market-bulk-quantity'&&state.selection[0]===3&&state.selection[1]===3,{state});
 await cdp.send('Browser.grantPermissions',{origin:await cdp.eval('location.origin'),permissions:['clipboardReadWrite','clipboardSanitizedWrite']});await cdp.eval("navigator.clipboard.writeText('160')");await cdp.key('KeyA','a',{modifiers:2});await cdp.key('KeyV','v',{modifiers:2});state=await cdp.eval(READ);pin('native-paste',state.quantity==='160'&&state.focus==='market-bulk-quantity'&&state.credits===before.credits,{state});
 await cdp.key('ArrowLeft','ArrowLeft');await cdp.key('ArrowLeft','ArrowLeft',{modifiers:8});const selected=await cdp.eval(READ);await sleep(1400);state=await cdp.eval(READ);pin('selection-refresh',state.focus==='market-bulk-quantity'&&JSON.stringify(state.selection)===JSON.stringify(selected.selection),{selected,state});
 for(const text of ['', '0','-1','1.5','1e2','9007199254740992','161']){await field(cdp,text);state=await cdp.eval(READ);pin('invalid-'+(text||'empty'),state.quantity===text&&state.buyDisabled&&state.credits===before.credits&&state.held===before.held,{state});}
 await field(cdp,'160');await cdp.key('Enter','Enter');for(const key of 'bqwas')await cdp.key('Key'+key.toUpperCase(),key);state=await cdp.eval(READ);pin('native-keys-no-gameplay',state.docked&&state.focus==='market-bulk-quantity'&&state.quantity==='160bqwas'&&state.credits===before.credits&&state.held===before.held&&!state.input.fire&&!state.input.afterburner&&state.input.strafeX===0&&state.input.strafeY===0&&state.input.roll===0,{state});
 await field(cdp,'160');await cdp.key('Escape','Escape');state=await cdp.eval(READ);pin('escape-cancels',state.focus==='market-bulk-heading'&&state.buyDisabled&&state.docked,{state});
 await cdp.click('#market-bulk-quantity');await cdp.key('Tab','Tab');const first=await cdp.eval('document.activeElement.id');await cdp.key('Tab','Tab',{modifiers:8});const back=await cdp.eval('document.activeElement.id');pin('tab-order',first==='market-bulk-buy-max'&&back==='market-bulk-quantity',{first,back});
 await cdp.key('Tab','Tab');await cdp.key('Enter','Enter',{},false);const armed=await cdp.eval(READ);await cdp.key('Enter','Enter',{autoRepeat:true});state=await cdp.eval(READ);pin('held-enter-not-second-activation',state.credits===armed.credits&&state.held===armed.held&&state.focus==='market-bulk-buy',{armed,state});
 await cdp.key('Escape','Escape');await cdp.key('Escape','Escape');pin('second-escape-back',await cdp.eval("!document.querySelector('.market-bulk')"),{});await cdp.key('Digit1','1');await until(()=>cdp.eval("!!document.querySelector('.market-bulk')"));
}
async function runChrome(url,save,zoom){
 const profile=await mkdtemp(join(out,'profile-'));await mkdir(join(profile,'Default'),{recursive:true});
 await writeFile(join(profile,'Default/Preferences'),JSON.stringify(zoomPrefs(zoom)));
 let child,cdp,port;const run={zoom,profile};results.runs.push(run);
 try{child=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-extensions','--use-angle=swiftshader','--enable-unsafe-swiftshader',`--window-size=${NATIVE.window.width},${NATIVE.window.height}`,'about:blank'],{stdio:'ignore',windowsHide:true});run.pid=child.pid;child.on('error',e=>{run.launchError=String(e);});await writeFile(join(out,'active-process.json'),JSON.stringify(run));
 let pages;await until(async()=>{try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);pages=await(await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(1000)})).json();return pages.some(p=>p.type==='page');}catch{return false;}},20000);run.cdpPort=port;
 cdp=new Cdp(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await cdp.ready();await cdp.send('Runtime.enable');await cdp.send('Page.enable');await cdp.send('DOMStorage.enable');run.browser=await cdp.send('Browser.getVersion');await cdp.send('Page.navigate',{url});await openMarket(cdp,save);
 if(zoom===1){
  const native=await cdp.eval(METRICS);run.nativeMetrics=native;
  pin('actual-native-viewport',native.dpr===1&&native.visualScale===1&&native.innerWidth===CONTENT.width&&native.innerHeight===CONTENT.height,{native,requestedWindow:NATIVE.window,measuredBorder:{width:native.outerWidth-native.innerWidth,height:native.outerHeight-native.innerHeight},expected:CONTENT,browser:run.browser.product});
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});await fullRoundTrip(cdp,{held:true});await keyboard(cdp);await layout(cdp,'04-desktop-1280x720');await cdp.send('Emulation.setDeviceMetricsOverride',{width:560,height:720,deviceScaleFactor:1,mobile:false});const minimum=await layout(cdp,'05-minimum-panel');pin('actual-minimum-panel',minimum.panel.width===560,{width:minimum.panel.width});
  // Containment at the minimum panel width is not reachability. The device-metrics override
  // changes the widget-to-CSS mapping, so the pointer is measured again from one real event
  // before the narrow round trip drives Buy/Sell with real mouse input only.
  run.pointerCalibrationMinimum=await cdp.calibratePointer();say('pointer calibration at 560',JSON.stringify(run.pointerCalibrationMinimum));
  await fullRoundTrip(cdp,{pointer:true,suffix:'-pointer-minimum',shots:['11-minimum-pointer-buy-preview','12-minimum-pointer-buy-receipt','13-minimum-pointer-sell-receipt'],readable:'16-minimum-readable'});
  await labelReach(cdp,'labels-reachable-minimum','14-minimum-labels');}
 else{
  const metrics=await cdp.eval(METRICS);let bounds;try{bounds=(await cdp.send('Browser.getWindowBounds',{windowId:(await cdp.send('Browser.getWindowForTarget')).windowId})).bounds;}catch(e){bounds={error:String(e)};}
  // The zoom factor is measured, not asserted from layout: a native 200% page keeps
  // visualViewport.scale at 1 (no pinch zoom) while devicePixelRatio doubles and the
  // CSS viewport halves the actual 1280x720 device-pixel viewport of this window.
  const devicePx={width:metrics.innerWidth*metrics.dpr,height:metrics.innerHeight*metrics.dpr};
  const border={width:Number.isFinite(bounds?.width)?bounds.width-devicePx.width:null,height:Number.isFinite(bounds?.height)?bounds.height-devicePx.height:null};
  run.zoomMetrics={metrics,bounds,devicePx,border,expected:CONTENT};
  pin('actual-browser-zoom',metrics.dpr===2&&metrics.visualScale===1&&devicePx.width===CONTENT.width&&devicePx.height===CONTENT.height&&metrics.innerWidth===CONTENT.width/2&&metrics.innerHeight===CONTENT.height/2,{metrics,bounds,devicePx,border,expected:CONTENT,requestedWindow:NATIVE.window,browser:run.browser.product,userAgent:run.browser.userAgent,pointerCalibration:run.pointerCalibration,method:'Chrome profile partition.default_zoom_level {x: log(2)/log(1.2)} per chrome_zoom_level_prefs.cc GetPartitionKey; no CSS zoom, pageScaleFactor or device-metric emulation in this run.'});
  const dimensions=await layout(cdp,'06-browser-zoom-200');run.zoomLayout=dimensions;
  await field(cdp,'160');await sleep(1400);const state=await cdp.eval(READ);pin('zoom-focus-refresh',state.focus==='market-bulk-quantity'&&state.quantity==='160',{state});await cdp.shot('07-zoom-focused-quantity.png');
  await field(cdp,'');await fullRoundTrip(cdp,{pointer:true,suffix:'-pointer-zoom',shots:['08-zoom-pointer-buy-preview','09-zoom-pointer-buy-receipt','10-zoom-pointer-sell-receipt'],readable:'17-zoom-readable'});
  await labelReach(cdp,'labels-reachable-zoom','15-zoom-labels');}
 run.errors=cdp.errors;pin('clean-console-'+zoom,cdp.errors.length===0,{errors:cdp.errors});
 }finally{if(cdp){run.errors=cdp.errors;try{await cdp.send('Browser.close');}catch{}cdp.close();}await kill(child);await removeOwned(profile,'profile-');let portClosed=true;if(port)try{await fetch(`http://127.0.0.1:${port}/json/version`,{signal:AbortSignal.timeout(1000)});portClosed=false;}catch{}results.cleanup.push({profile,removed:true,cdpPort:port,portClosed});}
}
let vite,cache,config;
try{await mkdir(out,{recursive:true});const save=await readFile(savePath,'utf8');JSON.parse(save);results.save.sha256=hash(save);results.sourceBefore=await census();const port=await freePort();results.vitePort=port;cache=await mkdtemp(join(out,'.vite-cache-'));config=join(out,'vite.probe.mjs');await writeFile(config,`export default {root:${JSON.stringify(repo)},cacheDir:${JSON.stringify(cache)},server:{host:'127.0.0.1',port:${port},strictPort:true}};`);vite=spawn(process.execPath,[viteBin,'--config',config],{cwd:repo,stdio:['ignore','pipe','pipe'],windowsHide:true});results.vitePid=vite.pid;results.viteBin=viteBin;let viteError;vite.on('error',e=>{viteError=e;});vite.stdout.on('data',s=>say('vite',String(s).trim()));vite.stderr.on('data',s=>say('vite',String(s).trim()));const url=`http://127.0.0.1:${port}/?agent=1`;results.url=url;await until(async()=>{if(viteError)throw viteError;if(vite.exitCode!=null)throw Error('Vite exited '+vite.exitCode);try{return(await fetch(url,{signal:AbortSignal.timeout(1000)})).ok;}catch{return false;}},20000);
 // ISSUE56_ZOOM_ONLY=1 runs only the native-zoom scenario, for bounded repair checks.
 // Unset (the default) still runs the whole suite and is the only acceptance-grade run.
 const zoomOnly=process.env.ISSUE56_ZOOM_ONLY==='1';results.scope=zoomOnly?'zoom-scenario-only (ISSUE56_ZOOM_ONLY=1; not acceptance-grade)':'full';say('scope',results.scope);
 if(!zoomOnly){await runChrome(url,save,1);}
 await runChrome(url,save,2);
}catch(error){results.error=error.stack||String(error);say('ERROR',results.error);process.exitCode=1;}finally{await kill(vite);if(cache)await removeOwned(cache,'.vite-cache-');if(config)await rm(config,{force:true});results.sourceAfter=await census();results.sourceStable=JSON.stringify(results.sourceBefore)===JSON.stringify(results.sourceAfter);results.verdict=!results.error&&results.sourceStable&&results.readabilityFailures.length===0&&Object.values(results.pins).every(p=>p.pass)&&results.cleanup.every(c=>c.portClosed)?'PASS':'FAIL';if(results.verdict!=='PASS')process.exitCode=1;await writeFile(join(out,'results.json'),JSON.stringify(results,null,2));await writeFile(join(out,'run.log'),log.join('\n'));console.log('ISSUE56 LIVE',results.verdict,results.scope||'full');}
