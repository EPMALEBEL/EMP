/* tiny QR code encoder (byte mode, error correction M, versions 1-10) – no libraries */
const neoQR=(function(){
const ECC=[10,16,26,18,24,16,18,22,22,26],BLK=[1,1,2,2,4,4,4,5,5,5];
const mul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11D);z^=((y>>>i)&1)*x}return z&255};
const rsDiv=d=>{const r=new Array(d).fill(0);r[d-1]=1;let root=1;for(let i=0;i<d;i++){for(let j=0;j<d;j++){r[j]=mul(r[j],root);if(j+1<d)r[j]^=r[j+1]}root=mul(root,2)}return r};
const rsRem=(data,div)=>{const r=new Array(div.length).fill(0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>{r[i]^=mul(c,f)})}return r};
const raw=v=>{let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36}return r};
function encode(text){const bytes=[...new TextEncoder().encode(String(text))];let ver=0;
 for(let v=1;v<=10;v++){const cap=Math.floor(raw(v)/8)-ECC[v-1]*BLK[v-1],need=Math.ceil((4+(v<10?8:16)+bytes.length*8)/8);if(need<=cap){ver=v;break}}
 if(!ver)throw new Error('Text is too long for the QR code');
 const cap=Math.floor(raw(ver)/8)-ECC[ver-1]*BLK[ver-1],bits=[];const put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1)};
 put(4,4);put(bytes.length,ver<10?8:16);bytes.forEach(b=>put(b,8));put(0,Math.min(4,cap*8-bits.length));while(bits.length%8)bits.push(0);
 const cw=[];for(let i=0;i<bits.length;i+=8){let b=0;for(let j=0;j<8;j++)b=(b<<1)|bits[i+j];cw.push(b)}for(let p=0xEC;cw.length<cap;p^=0xEC^0x11)cw.push(p);
 const nb=BLK[ver-1],eb=ECC[ver-1],rc=Math.floor(raw(ver)/8),ns=nb-rc%nb,sl=Math.floor(rc/nb),div=rsDiv(eb),blocks=[];
 for(let i=0,k=0;i<nb;i++){const dl=sl-eb+(i<ns?0:1),d=cw.slice(k,k+dl);k+=dl;const e=rsRem(d,div);if(i<ns)d.push(0);blocks.push(d.concat(e))}
 const all=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==sl-eb||j>=ns)all.push(b[i])});
 const size=ver*4+17,M=[],F=[];for(let i=0;i<size;i++){M.push(new Array(size).fill(false));F.push(new Array(size).fill(false))}
 const set=(x,y,d)=>{M[y][x]=d;F[y][x]=true};
 for(let i=0;i<size;i++){set(6,i,i%2==0);set(i,6,i%2==0)}
 const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const d=Math.max(Math.abs(dx),Math.abs(dy)),x=cx+dx,y=cy+dy;if(x>=0&&x<size&&y>=0&&y<size)set(x,y,d!=2&&d!=4)}};
 finder(3,3);finder(size-4,3);finder(3,size-4);
 const na=ver>1?Math.floor(ver/7)+2:0,step=ver==32?26:na?Math.ceil((ver*4+4)/(na*2-2))*2:0,pos=[6];for(let p=size-7;pos.length<na;p-=step)pos.splice(1,0,p);
 for(let a=0;a<na;a++)for(let b=0;b<na;b++){if((a==0&&b==0)||(a==0&&b==na-1)||(a==na-1&&b==0))continue;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(pos[a]+dx,pos[b]+dy,Math.max(Math.abs(dx),Math.abs(dy))!=1)}
 const fmt=mask=>{let d=(0<<3)|mask,r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=((d<<10)|r)^0x5412,g=i=>((b>>>i)&1)!=0;
  for(let i=0;i<=5;i++)set(8,i,g(i));set(8,7,g(6));set(8,8,g(7));set(7,8,g(8));for(let i=9;i<15;i++)set(14-i,8,g(i));
  for(let i=0;i<8;i++)set(size-1-i,8,g(i));for(let i=8;i<15;i++)set(8,size-15+i,g(i));set(8,size-8,true)};
 fmt(0);
 if(ver>=7){let r=ver;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);const b=(ver<<12)|r;for(let i=0;i<18;i++){const bit=((b>>>i)&1)!=0,a=size-11+i%3,c=Math.floor(i/3);set(a,c,bit);set(c,a,bit)}}
 let i=0;for(let right=size-1;right>=1;right-=2){if(right==6)right=5;for(let v=0;v<size;v++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)==0,y=up?size-1-v:v;if(!F[y][x]&&i<all.length*8){M[y][x]=((all[i>>>3]>>>(7-(i&7)))&1)!=0;i++}}}
 const masks=[(x,y)=>(x+y)%2==0,(x,y)=>y%2==0,(x,y)=>x%3==0,(x,y)=>(x+y)%3==0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2==0,(x,y)=>x*y%2+x*y%3==0,(x,y)=>(x*y%2+x*y%3)%2==0,(x,y)=>((x+y)%2+x*y%3)%2==0];
 const apply=m=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!F[y][x]&&masks[m](x,y))M[y][x]=!M[y][x]};
 const pen=()=>{let r=0;const run=a=>{let n=0,p=0,l=a[0];for(let k=0;k<a.length;k++){if(a[k]==l){n++}else{if(n>=5)r+=3+n-5;l=a[k];n=1}}if(n>=5)r+=3+n-5;return};
  for(let y=0;y<size;y++){run(M[y]);run(M.map(row=>row[y]))}
  for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){const c=M[y][x];if(c==M[y][x+1]&&c==M[y+1][x]&&c==M[y+1][x+1])r+=3}
  let dark=0;M.forEach(row=>row.forEach(c=>{if(c)dark++}));r+=Math.floor(Math.abs(dark*20-size*size*10)/(size*size))*10;return r};
 let best=0,bp=1e9;for(let m=0;m<8;m++){apply(m);fmt(m);const p=pen();if(p<bp){bp=p;best=m}apply(m)}
 apply(best);fmt(best);return M}
function svg(text,px,fg,bg){const M=encode(text),n=M.length,q=4,s=n+q*2;let d='';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(M[y][x])d+='M'+(x+q)+','+(y+q)+'h1v1h-1z';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${px||160}" height="${px||160}" shape-rendering="crispEdges"><rect width="${s}" height="${s}" fill="${bg||'#fff'}"/><path d="${d}" fill="${fg||'#000'}"/></svg>`}
return{encode,svg}})();
/* ===== NEO LAYER: command-center design, duotone icons, new dashboard, server address settings ===== */
(function(){
if(typeof S==='undefined'||typeof V==='undefined')return;
const $e=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* ---------- CSS ---------- */
const css=`
:root[data-theme=command]{--bg:#04070d;--fg:#e6f1ff;--card:#0a111c;--mut:#7f93ad;--bd:rgba(80,160,220,.16);--ac:#22d3ee;--ac2:#67e8f9;--hd:linear-gradient(90deg,#050a14,#0a1626 70%,#0b2a3a);--sb:#060b14;--sbt:#8ea4bf;--sbh:rgba(34,211,238,.08);--sbon:rgba(34,211,238,.14);--sh:0 0 0 1px rgba(34,211,238,.04),0 8px 28px rgba(0,0,0,.45);color-scheme:dark}
:root[data-theme=command] input,:root[data-theme=command] select,:root[data-theme=command] textarea{color-scheme:dark}
:root[data-theme=command] body{background:radial-gradient(1200px 520px at 85% -10%,rgba(34,211,238,.10),transparent 60%),radial-gradient(900px 500px at -10% 110%,rgba(124,58,237,.12),transparent 60%),linear-gradient(rgba(34,211,238,.035) 1px,transparent 1px) 0 0/44px 44px,linear-gradient(90deg,rgba(34,211,238,.035) 1px,transparent 1px) 0 0/44px 44px,#04070d;background-attachment:fixed}
:root[data-theme=command] .c,:root[data-theme=command] .k{background:linear-gradient(180deg,rgba(14,24,38,.92),rgba(8,14,24,.92));border:1px solid var(--bd);border-radius:14px;backdrop-filter:blur(6px);position:relative}
:root[data-theme=command] .c::before{content:"";position:absolute;left:14px;right:14px;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(34,211,238,.55),transparent);pointer-events:none}
:root[data-theme=command] .c h3{text-transform:uppercase;letter-spacing:1.4px;font-size:11.5px;color:#9fb6d2}
:root[data-theme=command] header{border-bottom:1px solid rgba(34,211,238,.25);box-shadow:0 1px 24px rgba(34,211,238,.10)}
:root[data-theme=command] #sb{border-right:1px solid var(--bd)}
:root[data-theme=command] #sb a{border-radius:10px;position:relative;font-weight:600;letter-spacing:.2px}
:root[data-theme=command] #sb a.on{color:#fff;background:linear-gradient(90deg,rgba(34,211,238,.20),rgba(34,211,238,.03))}
:root[data-theme=command] #sb a.on::before{content:"";position:absolute;left:-10px;top:8px;bottom:8px;width:3px;border-radius:3px;background:#22d3ee;box-shadow:0 0 12px #22d3ee}
:root[data-theme=command] button.b,:root[data-theme=command] .b{background:linear-gradient(135deg,#0891b2,#22d3ee);color:#021018;border:0;font-weight:700;box-shadow:0 0 18px rgba(34,211,238,.25)}
:root[data-theme=command] input,:root[data-theme=command] select,:root[data-theme=command] textarea{background:#070d17;border:1px solid rgba(80,160,220,.25);color:var(--fg);border-radius:10px}
:root[data-theme=command] input:focus,:root[data-theme=command] select:focus,:root[data-theme=command] textarea:focus{outline:0;border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.16)}
:root[data-theme=command] th{color:#7fa3c7;text-transform:uppercase;font-size:10.5px;letter-spacing:1px}
:root[data-theme=command] tr:hover td{background:rgba(34,211,238,.05)}
:root[data-theme=command] a{color:#67e8f9}
:root[data-theme=command] ::-webkit-scrollbar{width:9px;height:9px}:root[data-theme=command] ::-webkit-scrollbar-thumb{background:#16314a;border-radius:9px}
svg.i{stroke-width:1.75;fill:color-mix(in srgb,currentColor 15%,transparent)}
.ib svg.i,.kb svg.i,.ch svg.i{fill:color-mix(in srgb,currentColor 22%,transparent)}
/* dashboard */
.nd{display:grid;gap:14px}
.nd-top{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:14px}
.nd-hero{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.nd-hero img{height:84px;border-radius:12px;background:#fff;padding:4px}
.nd-live{display:inline-flex;align-items:center;gap:6px;font:700 10.5px/1 ui-monospace,Consolas,monospace;letter-spacing:1.5px;color:#34d399}
.nd-live i{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 0 0 rgba(52,211,153,.7);animation:ndp 1.8s infinite}
@keyframes ndp{70%{box-shadow:0 0 0 9px rgba(52,211,153,0)}100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}}
.nd-name{font-size:24px;font-weight:800;letter-spacing:.3px;margin:4px 0}
.nd-meta{color:var(--mut);font-size:12.5px;line-height:1.7}.nd-meta b{color:var(--fg)}
.nd-rings{display:flex;gap:10px;justify-content:space-around;align-items:center;flex-wrap:wrap}
.nd-ring{text-align:center;font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:1px}.nd-ring b{display:block;font-size:12px;color:var(--fg);margin-top:2px}
.nd-kp{display:grid;grid-template-columns:repeat(auto-fit,minmax(138px,1fr));gap:10px}
.nd-k{padding:12px 14px;border-radius:14px;border:1px solid var(--bd);background:rgba(127,150,180,.06);position:relative;overflow:hidden}
.nd-k::after{content:"";position:absolute;left:0;bottom:0;height:3px;width:var(--w,0%);background:var(--kc);box-shadow:0 0 10px var(--kc)}
.nd-k span{font-size:10.5px;text-transform:uppercase;letter-spacing:1px;color:var(--mut);display:flex;align-items:center;gap:6px}.nd-k span svg.i{margin:0;width:15px;height:15px;color:var(--kc)}
.nd-k b{display:block;font-size:30px;line-height:1.15;font-weight:800;margin-top:4px;font-variant-numeric:tabular-nums}.nd-k small{color:var(--mut);font-size:11px}
.nd-pipe{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
.nd-st{padding:14px 10px 14px 22px;position:relative;background:rgba(34,211,238,.07);clip-path:polygon(0 0,calc(100% - 16px) 0,100% 50%,calc(100% - 16px) 100%,0 100%,14px 50%);margin-left:-8px}
.nd-st:first-child{margin-left:0;clip-path:polygon(0 0,calc(100% - 16px) 0,100% 50%,calc(100% - 16px) 100%,0 100%);padding-left:14px;border-radius:12px 0 0 12px}
.nd-st b{font-size:24px;display:block;font-variant-numeric:tabular-nums}.nd-st span{font-size:10.5px;text-transform:uppercase;letter-spacing:1px;color:var(--mut)}
.nd-st i{position:absolute;left:0;bottom:0;height:3px;background:var(--ac);width:var(--w)}
.nd-bar{display:flex;height:16px;border-radius:9px;overflow:hidden;background:rgba(127,150,180,.12)}.nd-bar i{display:block;height:100%}
.nd-leg{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:12px;color:var(--mut)}.nd-leg i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:6px}.nd-leg b{color:var(--fg)}
.nd-cr{display:grid;grid-template-columns:130px 1fr 48px;gap:10px;align-items:center;padding:6px 0;font-size:13px}
.nd-tr{height:9px;border-radius:6px;background:rgba(127,150,180,.14);overflow:hidden}.nd-tr i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#0891b2,#22d3ee)}
.nd-cr em{font-style:normal;font:700 12px ui-monospace,Consolas,monospace;text-align:right}
.nd-ms{display:flex;gap:0;overflow-x:auto;padding:6px 2px 4px}
.nd-m{flex:1;min-width:120px;text-align:center;position:relative;padding-top:26px;font-size:12px}
.nd-m::before{content:"";position:absolute;top:10px;left:0;right:0;height:2px;background:var(--bd)}
.nd-m:first-child::before{left:50%}.nd-m:last-child::before{right:50%}
.nd-m u{position:absolute;top:3px;left:50%;margin-left:-8px;width:16px;height:16px;border-radius:50%;background:var(--card);border:2px solid var(--mut);text-decoration:none}
.nd-m.d u{background:#34d399;border-color:#34d399;box-shadow:0 0 12px #34d399}.nd-m.p u{border-color:#22d3ee;box-shadow:0 0 12px rgba(34,211,238,.6)}.nd-m.x u{border-color:#f87171;box-shadow:0 0 12px rgba(248,113,113,.6)}
.nd-m b{display:block;font-size:12px}.nd-m small{color:var(--mut)}
.nd-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.nd-row{padding:7px 0;border-bottom:1px dashed var(--bd);font-size:13px}.nd-row:last-child{border:0}
@media(max-width:900px){.nd-top{grid-template-columns:1fr}.nd-pipe{grid-template-columns:repeat(2,1fr)}.nd-cr{grid-template-columns:96px 1fr 44px}.nd-name{font-size:20px}}
/* server address card */
.ns-u{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 10px;border:1px solid var(--bd);border-radius:10px;margin:6px 0;background:rgba(127,150,180,.06)}
.ns-u code{flex:1;min-width:180px;font:600 13px ui-monospace,Consolas,monospace;word-break:break-all}
.ns-u button{padding:5px 10px;font-size:12px;margin:0}
.ns-q{background:#fff;border-radius:12px;padding:6px;display:inline-block}
.ns-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:10px 0}.ns-f label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--mut);display:grid;gap:4px}
.ns-ov{position:fixed;inset:0;z-index:9999;background:rgba(2,6,12,.92);display:flex;align-items:center;justify-content:center;color:#e6f1ff;text-align:center;padding:20px}
.ns-ov>div{max-width:440px}.ns-ov h2{margin:0 0 8px}.ns-ov a{color:#67e8f9}
.ns-cmd{font:12px ui-monospace,Consolas,monospace;background:#070d17;color:#9fe8f5;padding:8px 10px;border-radius:8px;word-break:break-all;display:block;margin:6px 0}
/* command palette */
#np-ov{position:fixed;inset:0;z-index:9998;background:rgba(2,6,12,.7);display:none;align-items:flex-start;justify-content:center;padding-top:12vh}
#np-ov.on{display:flex}#np-ov>div{width:min(560px,92vw);background:#0a111c;border:1px solid rgba(34,211,238,.35);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden;color:#e6f1ff}
#np-ov input{width:100%;border:0;border-bottom:1px solid rgba(80,160,220,.2);border-radius:0;padding:15px 18px;font-size:16px;background:transparent;color:#e6f1ff;box-sizing:border-box}
#np-ov a{display:flex;align-items:center;gap:8px;padding:11px 18px;cursor:pointer;color:#cfe3fa}#np-ov a.on,#np-ov a:hover{background:rgba(34,211,238,.12);color:#fff;text-decoration:none}
#np-l{max-height:46vh;overflow:auto}
`;
const st=document.createElement('style');st.id='neo-css';st.textContent=css;document.head.appendChild(st);

/* ---------- theme registration & one-time default ---------- */
try{if(Array.isArray(THEMES)&&!THEMES.some(t=>t[0]==='command'))THEMES.unshift(['command','Command Center','linear-gradient(135deg,#04070d,#22d3ee)']);
 if(!localStorage.rjneo1){localStorage.rjneo1='1';localStorage.rjth2='command';S.theme='command'}else if(localStorage.rjth2)S.theme=localStorage.rjth2;
 applyTheme()}catch(e){}

/* ---------- new duotone icon accents (redraw a few key icons) ---------- */
try{Object.assign(IP,{
 dash:'<rect x="3" y="3" width="8" height="10" rx="2"/><rect x="13" y="3" width="8" height="6" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/><rect x="3" y="15" width="8" height="6" rx="2"/>',
 pulse:'<path d="M3 12h4l2.5-7 4 14 2.5-7H21"/>'
})}catch(e){}

/* ---------- helpers ---------- */
const ring=(p,col,sz)=>{sz=sz||92;const R=40,C=2*Math.PI*R,v=Math.max(0,Math.min(100,p||0));return`<svg viewBox="0 0 100 100" width="${sz}" height="${sz}"><defs><filter id="ngl"><feGaussianBlur stdDeviation="2.2"/></filter></defs><circle cx="50" cy="50" r="${R}" fill="none" stroke="rgba(127,150,180,.18)" stroke-width="9"/><circle cx="50" cy="50" r="${R}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C*v/100} ${C}" transform="rotate(-90 50 50)" opacity=".55" filter="url(#ngl)"/><circle cx="50" cy="50" r="${R}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C*v/100} ${C}" transform="rotate(-90 50 50)"/><text x="50" y="56" text-anchor="middle" font-size="22" font-weight="800" fill="currentColor">${v}%</text></svg>`};

/* ---------- NEW DASHBOARD ---------- */
const _costMini=(typeof costMini==='function')?costMini:null;
V.dash=function(){
 const s=stats(),l=L(),P=CP();
 const fl=l.filter(c=>{const f=flags(c);return f.includes('Delayed')||f.includes('Rework')||f.includes('Failed')});
 const up=l.filter(c=>!done(c)&&c.tgt).sort((a,b)=>a.tgt<b.tgt?-1:1).slice(0,6);
 const tm={};l.forEach(c=>{const o=c.own||'Unassigned';(tm[o]=tm[o]||[]).push(c.id)});
 const tasks=l.flatMap(c=>c.tasks);
 const pc=v=>s.n?Math.round(v/s.n*100):0;
 let rec=0,asm=0,tp=0;CATS.forEach(k=>{const x=cat(k);if(x.n){rec+=x.rec||0;asm+=x.asm||0;tp+=x.tp||0}});
 const K=[['layers','Total items',s.n,'#22d3ee',100],['checkc','Completed',s.done,'#34d399',pc(s.done)],['spin','In progress',s.prog,'#60a5fa',pc(s.prog)],['hourglass','Pending',s.pend,'#94a3b8',pc(s.pend)],['alarm','Delayed',s.del,'#f87171',pc(s.del)],['rw','Rework',s.rw,'#fb923c',pc(s.rw)],['shieldok','Testing passed',s.tp,'#34d399',pc(s.tp)],['shieldx','Testing failed',s.tf,'#f87171',pc(s.tf)],['clip2','Open actions',s.oa,'#fbbf24',s.oa?100:0],['calx','Overdue actions',s.od+s.over,'#f87171',(s.od+s.over)?100:0]];
 const seg=[['Completed',s.done,'#34d399'],['In progress',s.prog,'#60a5fa'],['Pending',s.pend,'#64748b'],['Delayed',s.del,'#f87171'],['Rework',s.rw,'#fb923c']];
 const tot=seg.reduce((a,x)=>a+x[1],0)||1;
 const pipe=[['Items',s.n],['Received',rec],['Assembled',asm],['Tested OK',tp]];
 return`<div class="nd">
<div class="nd-top"><div class="c"><div class="nd-hero">${LOGOS[S.pid]?`<img src="${LOGOS[S.pid]}" alt="">`:''}<div style="flex:1;min-width:200px"><span class="nd-live"><i></i>LIVE · COMMAND CENTER</span><div class="nd-name">${$e(P.name)}${P.ver?' – '+$e(P.ver):''}</div><div class="nd-meta">Manager: <b>${$e(P.manager)||'Not assigned'}</b>${P.manager&&(P.mstart||P.mend)?' ('+(P.mstart||'?')+' → '+(P.mend||'?')+')':''}<br>Stage: <b>${$e(PRJ.stage)||'—'}</b> · Critical issue: <b>${$e(PRJ.crit)||'None recorded'}</b><br>Updated: ${S.h[0]?new Date(S.h[0].ts).toLocaleString():'—'}</div></div></div></div>
<div class="c"><div class="nd-rings"><div class="nd-ring">${ring(s.pct,'#22d3ee',104)}<b>Overall progress</b></div><div class="nd-ring">${ring(pc(s.done),'#34d399',78)}<b>Completed</b></div><div class="nd-ring">${ring(pc(s.del+s.rw),'#f87171',78)}<b>At risk</b></div></div></div></div>
<div class="nd-kp">${K.map(k=>`<div class="nd-k" style="--kc:${k[3]};--w:${k[4]}%"><span>${ic(k[0])}${k[1]}</span><b>${k[2]}</b><small>${k[4]&&k[1]!='Total items'&&!/actions/.test(k[1])?k[4]+'% of items':k[1]=='Total items'?'in this project':'need follow-up'}</small></div>`).join('')}</div>
<div class="c"><h3>${sh('run','','#22d3ee')}Pipeline</h3><div class="nd-pipe">${pipe.map((p,i)=>`<div class="nd-st" style="--w:${i?(s.n?Math.round(p[1]/s.n*100):0):100}%"><span>${p[0]}</span><b>${p[1]}</b><i></i></div>`).join('')}</div></div>
<div class="c"><h3>${sh('pulse','','#7a5af8')}Status distribution</h3><div class="nd-bar">${seg.map(x=>`<i title="${x[0]}: ${x[1]}" style="width:${x[1]/tot*100}%;background:${x[2]}"></i>`).join('')}</div><div class="nd-leg">${seg.map(x=>`<span><i style="background:${x[2]}"></i>${x[0]} <b>${x[1]}</b></span>`).join('')}</div><div class="nd-leg" style="margin-top:12px"><span>Tasks:</span>${TS.map(t=>tag(t)+' <b>'+tasks.filter(x=>x.status==t).length+'</b>').join(' &nbsp; ')}</div></div>
<div class="c"><h3>${sh('flag','','#0b7285')}Milestones</h3><div class="nd-ms">${MSD.map((m,i)=>{const p=msPct(i),cl=p>=100?'d':(/delay|late|risk/i.test(m.st||'')?'x':(p>0?'p':''));return`<div class="nd-m ${cl}"><u></u><b>${$e(m.n)}</b><small>${$e(m.plan||'—')}${m.act?' → '+$e(m.act):''}</small><br><small>${p}% · ${$e(m.st||'')}</small></div>`}).join('')}</div></div>
<div class="c"><h3>${sh('layers','','#22d3ee')}Category progress</h3>${CATS.filter(k=>cat(k).n).map(k=>{const x=cat(k);return`<div class="nd-cr"><span>${$e(k)} <small style="color:var(--mut)">${x.n}${x.del?' · <span style=color:#f87171>'+x.del+' delayed</span>':''}</small></span><div class="nd-tr"><i style="width:${x.pc}%"></i></div><em>${x.pc}%</em></div>`}).join('')||'No categories yet'}</div>
<div class="nd-g">
<div class="c"><h3>${sh('alarm','','#d92d20')}Delayed / Rework / Failed</h3>${fl.map(c=>`<div class="nd-row"><a onclick="go('item','${ej(c.id)}')">${c.id}</a> ${$e(c.name)} ${flags(c).map(tag).join('')}</div>`).join('')||'None'}</div>
<div class="c"><h3>${sh('cal','','#dc6803')}Upcoming deadlines</h3>${up.map(c=>`<div class="nd-row">${$e(c.tgt)} – <a onclick="go('item','${ej(c.id)}')">${c.id}</a> ${$e(c.name)}</div>`).join('')||'No target dates set'}</div>
<div class="c"><h3>${sh('users','','#12a150')}Team responsibility</h3>${dteam(tm,l)}</div>
<div class="c"><h3>${sh('pulse','','#7a5af8')}Recent activity</h3>${dact(8)}</div>
<div class="c"><h3>${sh('bell','','#d92d20')}Notifications</h3>${notes().map(n=>`<div class="nd-row">${n}</div>`).join('')||'None'}</div></div>
${_costMini?_costMini():''}</div>`};

/* ---------- SERVER ADDRESS CARD (admin) ---------- */
const adm=()=>(S.isAdmin&&!S.viewAs)||S.role==='Admin';
let NET=null,NETERR='',QRU='';
const nj=async(m,u,b)=>{const r=await fetch(u,{method:m,credentials:'same-origin',headers:b!==undefined?{'content-type':'application/json'}:{},body:b!==undefined?JSON.stringify(b):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('Error '+r.status));return j};
function netCard(){
 if(!adm())return'';
 if(!NET)return`<div class="c" id="netc"><h3>${sh('globe','','#22d3ee')}Server address &amp; port</h3><p class="mut">${NETERR?'Could not load: '+$e(NETERR):'Loading…'}</p></div>`;
 const n=NET,all=[...(n.urls.http||[]),...(n.urls.https||[])];
 if(!QRU||!all.includes(QRU))QRU=(n.urls.http||[])[0]||all[0]||'';
 let qr='';try{if(QRU)qr=neoQR.svg(QRU,168,'#04121c','#fff')}catch(e){}
 return`<div class="c" id="netc"><h3>${sh('globe','','#22d3ee')}Server address &amp; port</h3>
<p class="mut" style="font-size:12.5px">Choose which address and ports colleagues use. Phones: scan the QR code (same Wi-Fi/LAN). Changes are saved and survive restarts.</p>
<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start"><div style="flex:1;min-width:260px"><b style="font-size:12px">Links to share</b>${all.map(u=>`<div class="ns-u"><code>${$e(u)}</code><button class="b" onclick="neoCopy(this,'${ej(u)}')">Copy</button><button class="b" onclick="neoQ('${ej(u)}')">QR</button></div>`).join('')||'<p class="mut">No network address found.</p>'}</div>
<div style="text-align:center"><div class="ns-q">${qr}</div><div class="mut" style="font-size:11px;max-width:180px;word-break:break-all">${$e(QRU)}</div></div></div>
<div class="ns-f"><label>Listen on<select id="ns-h"><option value="0.0.0.0" ${n.host==='0.0.0.0'?'selected':''}>All networks (recommended)</option>${n.ifaces.map(i=>`<option value="${$e(i.address)}" ${n.host===i.address?'selected':''}>${$e(i.name)} – ${$e(i.address)}</option>`).join('')}</select></label>
<label>Web port (http)<input id="ns-p" type="number" min="1024" max="65535" value="${n.port}"></label>
<label>Secure port (https)<input id="ns-s" type="number" min="1024" max="65535" value="${n.sport}"></label></div>
<button class="b" onclick="neoSave()">${ic('ok')}Save &amp; restart server</button>
<p class="mut" style="font-size:12px;margin-top:10px">${n.loop?'The server restarts itself automatically.':'Start the server with <b>start.bat</b> so it can restart itself; otherwise it relaunches in the background.'} Everyone must then use the new link. If other PCs/phones cannot connect, allow the ports in Windows Firewall (run Command Prompt as administrator):</p>
<code class="ns-cmd">netsh advfirewall firewall add rule name="EPM" dir=in action=allow protocol=TCP localport=${n.port},${n.sport}</code>
<p class="mut" style="font-size:12px">Tip: give this PC a fixed (static) IP in Windows or on the router, so the link never changes.</p></div>`}
window.neoCopy=(b,u)=>{const d=()=>{const o=b.textContent;b.textContent='Copied';setTimeout(()=>b.textContent=o,1200)};try{navigator.clipboard.writeText(u).then(d,()=>{prompt('Copy:',u)})}catch(e){prompt('Copy:',u)}};
window.neoQ=u=>{QRU=u;const c=document.getElementById('netc');if(c)c.outerHTML=netCard()};
window.neoSave=async()=>{
 const host=document.getElementById('ns-h').value,port=+document.getElementById('ns-p').value,sport=+document.getElementById('ns-s').value;
 try{const r=await nj('POST','/api/net',{host,port,sport});
  if(!confirm('Save and restart the server now?\n\nNew links:\n'+[...(r.urls.http||[]),...(r.urls.https||[])].join('\n')+'\n\nEveryone will be disconnected for a few seconds.'))return;
  await nj('POST','/api/net/restart',{});
  const https=location.protocol==='https:',hn=host==='0.0.0.0'?location.hostname:host,np=https?sport:port,origin=location.protocol+'//'+hn+(np?':'+np:'');
  const ov=document.createElement('div');ov.className='ns-ov';ov.innerHTML=`<div><h2>Restarting server…</h2><p id="ns-t">Waiting for the new address</p><p><a href="${$e(origin)}">${$e(origin)}</a></p></div>`;document.body.appendChild(ov);
  let tries=0;const iv=setInterval(async()=>{tries++;document.getElementById('ns-t').textContent='Waiting… '+tries*2+' s';
   try{await fetch(origin+'/?_='+Date.now(),{mode:'no-cors',cache:'no-store'});clearInterval(iv);location.href=origin}catch(e){}
   if(tries>45){clearInterval(iv);document.getElementById('ns-t').textContent='Taking long. If the page does not open, start start.bat on the server PC and use the link below.'}},2000);
 }catch(e){alert(e.message)}};
async function netLoad(){try{NET=await nj('GET','/api/net');NETERR=''}catch(e){NET=null;NETERR=e.message}const c=document.getElementById('netc');if(c)c.outerHTML=netCard()}
{const _s=V.settings;V.settings=function(){return netCard()+_s.apply(this,arguments)}}
{const _r=render;render=function(){_r.apply(this,arguments);try{if(S.view==='settings'&&adm()&&!NET&&!NETERR)netLoad()}catch(e){}}}

/* ---------- COMMAND PALETTE (Ctrl+K) ---------- */
try{
 const ov=document.createElement('div');ov.id='np-ov';ov.innerHTML='<div><input id="np-i" placeholder="Jump to… (type a page name)" autocomplete="off"><div id="np-l"></div></div>';document.body.appendChild(ov);
 let idx=0,items=[];
 const pages=()=>[...document.querySelectorAll('#sb a[onclick]')].map(a=>({t:a.textContent.replace(/\d+$/,'').trim(),f:()=>a.click()})).filter(x=>x.t);
 const draw=()=>{const q=document.getElementById('np-i').value.toLowerCase();items=pages().filter(x=>x.t.toLowerCase().includes(q)).slice(0,12);idx=Math.min(idx,Math.max(0,items.length-1));document.getElementById('np-l').innerHTML=items.map((x,i)=>`<a class="${i==idx?'on':''}" data-i="${i}">${$e(x.t)}</a>`).join('')||'<a>No match</a>'};
 const open=()=>{ov.classList.add('on');const i=document.getElementById('np-i');i.value='';idx=0;draw();i.focus()},close=()=>ov.classList.remove('on');
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();ov.classList.contains('on')?close():open()}else if(ov.classList.contains('on')){if(e.key==='Escape')close();else if(e.key==='ArrowDown'){idx=Math.min(idx+1,items.length-1);draw();e.preventDefault()}else if(e.key==='ArrowUp'){idx=Math.max(idx-1,0);draw();e.preventDefault()}else if(e.key==='Enter'&&items[idx]){close();items[idx].f()}}});
 document.getElementById('np-i').addEventListener('input',()=>{idx=0;draw()});
 ov.addEventListener('click',e=>{const a=e.target.closest('a[data-i]');if(a){close();items[+a.dataset.i].f()}else if(e.target===ov)close()});
}catch(e){}
try{render()}catch(e){}
})();
/* ===== iPhone-style (SF Symbols look) icon set: rounded outlines + soft tinted fill, glyphs sit on iOS squircle tiles ===== */
(function(){
if(typeof IP==='undefined')return;
const A=s=>'<g class="n2">'+s+'</g>',R='<rect x="3.5" y="3.5" width="17" height="17" rx="5"/>';
const file='M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z';
const shield='M12 3l7.5 3v5.5c0 4.4-3.1 7.9-7.5 9.5-4.4-1.6-7.5-5.1-7.5-9.5V6z';
const cal='<rect x="3.5" y="5" width="17" height="15.5" rx="4"/><path d="M3.5 10h17M8 3v4M16 3v4"/>';
const user='<circle cx="12" cy="8" r="3.8"/><path d="M4.8 20c.4-3.7 3.4-6 7.2-6s6.8 2.3 7.2 6"/>';
const N={
plus:A('<circle cx="12" cy="12" r="9"/>')+'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
dash:A('<rect x="3.5" y="3.5" width="7.5" height="9.5" rx="2.2"/><rect x="13" y="15" width="7.5" height="5.5" rx="2.2"/>')+'<rect x="3.5" y="3.5" width="7.5" height="9.5" rx="2.2"/><rect x="13" y="3.5" width="7.5" height="5.5" rx="2.2"/><rect x="13" y="11" width="7.5" height="9.5" rx="2.2"/><rect x="3.5" y="15" width="7.5" height="5.5" rx="2.2"/>',
list:A('<rect x="3.5" y="4" width="17" height="16" rx="4.5"/>')+'<rect x="3.5" y="4" width="17" height="16" rx="4.5"/><path d="M8 9h8M8 12h8M8 15h5"/>',
issues:A('<path d="M12 4 20.5 19h-17z"/>')+'<path d="M10.7 4.9a1.5 1.5 0 0 1 2.6 0l7 12.5A1.5 1.5 0 0 1 19 19.5H5a1.5 1.5 0 0 1-1.3-2.1z"/><path d="M12 10v4M12 16.6h.01"/>',
time:A('<circle cx="12" cy="12" r="9"/>')+'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
close:A('<circle cx="12" cy="12" r="9"/>')+'<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
print:A('<rect x="4" y="9" width="16" height="8" rx="2.5"/>')+'<path d="M7 9V4h10v5M7 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9h13a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17"/><rect x="7" y="14" width="10" height="6" rx="1.5"/>',
xl:A('<path d="'+file+'"/>')+'<path d="'+file+'"/><path d="M14 3v5h5M9 12.5l4 5M13 12.5l-4 5"/>',
box:A('<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/>')+'<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
ok:A('<rect x="3.5" y="3.5" width="17" height="17" rx="5.5"/>')+'<rect x="3.5" y="3.5" width="17" height="17" rx="5.5"/><path d="M8 12.4l2.8 2.8L16 9.5"/>',
run:A('<circle cx="12" cy="12" r="9"/>')+'<circle cx="12" cy="12" r="9"/><path d="M10 8.7v6.6l5.4-3.3z"/>',
wait:A('<circle cx="12" cy="12" r="9"/>')+'<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
rw:'<path d="M20 11.5A8 8 0 0 0 6 7M4 4v4h4M4 12.5A8 8 0 0 0 18 17M20 20v-4h-4"/>',
flask:A('<path d="M9.5 9.5 5 18a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-4.5-8.5z"/>')+'<path d="M9.5 3h5M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-8.5V3"/>',
bell:A('<path d="M6 17V11a6 6 0 0 1 12 0v6z"/>')+'<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 1.5h-15zM10 21a2 2 0 0 0 4 0"/>',
users:A('<circle cx="9" cy="8.5" r="3.5"/>')+'<circle cx="9" cy="8.5" r="3.5"/><path d="M2.8 19.5c.4-3.3 3-5 6.2-5s5.8 1.7 6.2 5M16 5.4a3.5 3.5 0 0 1 0 6.2M18.5 14.7c1.6.7 2.5 2.1 2.8 4.3"/>',
cal:A('<rect x="3.5" y="5" width="17" height="15.5" rx="4"/>')+cal,
bad:A('<circle cx="12" cy="12" r="9"/>')+'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.4h.01"/>',
pulse:'<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
img:A('<rect x="3.5" y="4.5" width="17" height="15" rx="4"/>')+'<rect x="3.5" y="4.5" width="17" height="15" rx="4"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 15.5 16 11l-8.5 8.5"/>',
rec:A('<path d="'+file+'"/>')+'<path d="'+file+'"/><path d="M14 3v5h5M8.5 13h7M8.5 16.5h5"/>',
home:A('<path d="M5.5 10V20h13V10L12 4.5z"/>')+'<path d="M3 11.5 11 4.8a1.5 1.5 0 0 1 2 0l8 6.7M5.5 10V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-9M10 20.5v-5h4v5"/>',
folder:A('<path d="M3.5 8h17v9.5a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5z"/>')+'<path d="M3.5 17.5V6.5A2.5 2.5 0 0 1 6 4h3.3a2 2 0 0 1 1.5.7L12 6h6a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5z"/>',
inbox:A('<path d="M3.5 13l2.2-7.2a1.5 1.5 0 0 1 1.4-1.1h9.8a1.5 1.5 0 0 1 1.4 1.1L20.5 13z"/>')+'<path d="M3.5 13l2.2-7.2a1.5 1.5 0 0 1 1.4-1.1h9.8a1.5 1.5 0 0 1 1.4 1.1L20.5 13v4.5A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5zM3.5 13h5l1 2.5h5l1-2.5h5"/>',
timeline:A('<rect x="4" y="4.5" width="9" height="4" rx="2"/><rect x="9" y="15.5" width="11" height="4" rx="2"/>')+'<rect x="4" y="4.5" width="9" height="4" rx="2"/><rect x="8" y="10" width="12" height="4" rx="2"/><rect x="9" y="15.5" width="11" height="4" rx="2"/>',
chart:A('<rect x="4" y="12" width="4" height="8" rx="1.5"/><rect x="16" y="4" width="4" height="16" rx="1.5"/>')+'<rect x="4" y="12" width="4" height="8" rx="1.5"/><rect x="10" y="8" width="4" height="12" rx="1.5"/><rect x="16" y="4" width="4" height="16" rx="1.5"/>',
gear:A('<circle cx="12" cy="12" r="3"/>')+'<circle cx="12" cy="12" r="3"/><path d="M10.3 3.5h3.4l.5 2.3 1.6.9 2.2-.8 1.7 2.9-1.7 1.6v1.8l1.7 1.6-1.7 2.9-2.2-.8-1.6.9-.5 2.3h-3.4l-.5-2.3-1.6-.9-2.2.8-1.7-2.9 1.7-1.6v-1.8L4.3 8.8l1.7-2.9 2.2.8 1.6-.9z"/>',
board:A('<rect x="3.5" y="4" width="5" height="9" rx="1.8"/><rect x="15.5" y="4" width="5" height="6" rx="1.8"/>')+'<rect x="3.5" y="4" width="5" height="9" rx="1.8"/><rect x="9.5" y="4" width="5" height="16" rx="1.8"/><rect x="15.5" y="4" width="5" height="6" rx="1.8"/>',
pdf:A('<path d="'+file+'"/>')+'<path d="'+file+'"/><path d="M14 3v5h5M8.5 13.5h7M8.5 17h4"/>',
layers:A('<path d="M12 3.5 20.5 8 12 12.5 3.5 8z"/>')+'<path d="M12 3.5 20.5 8 12 12.5 3.5 8zM3.5 12 12 16.5 20.5 12M3.5 16 12 20.5 20.5 16"/>',
checkc:A('<circle cx="12" cy="12" r="9"/>')+'<circle cx="12" cy="12" r="9"/><path d="M7.8 12.3l3 3 5.4-6"/>',
spin:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
hourglass:A('<path d="M8 20.5c0-3 4-4 4-8.5 0 4.5 4 5.5 4 8.5z"/>')+'<path d="M6.5 3.5h11M6.5 20.5h11M7.5 3.5c0 4.5 4.5 5.5 4.5 8.5S7.5 16 7.5 20.5M16.5 3.5c0 4.5-4.5 5.5-4.5 8.5s4.5 4 4.5 8.5"/>',
alarm:A('<circle cx="12" cy="13" r="7.5"/>')+'<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4.2l2.6 1.6M4.5 4.5 2.5 6.5M19.5 4.5l2 2"/>',
shieldok:A('<path d="'+shield+'"/>')+'<path d="'+shield+'"/><path d="M8.7 12l2.3 2.3 4.4-4.6"/>',
shieldx:A('<path d="'+shield+'"/>')+'<path d="'+shield+'"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>',
clip2:A('<rect x="5" y="5" width="14" height="16" rx="3.5"/>')+'<rect x="5" y="5" width="14" height="16" rx="3.5"/><rect x="9" y="3" width="6" height="4" rx="1.6"/><path d="M8.7 12h6.6M8.7 16h4.3"/>',
calx:A('<rect x="3.5" y="5" width="17" height="15.5" rx="4"/>')+cal+'<path d="M10 13.5l4 4M14 13.5l-4 4"/>',
flag:A('<path d="M5.5 4.5h11l-2.2 3.8 2.2 3.7h-11z"/>')+'<path d="M5.5 21V4.5h11l-2.2 3.8 2.2 3.7h-11"/>',
assign:A('<circle cx="9" cy="8" r="3.6"/>')+'<circle cx="9" cy="8" r="3.6"/><path d="M2.6 19.5c.4-3.4 3-5.4 6.4-5.4 1.6 0 3 .4 4.1 1.2M16 17.5l2 2 3.7-4"/>',
robot:A('<rect x="4" y="8.5" width="16" height="11" rx="4"/>')+'<rect x="4" y="8.5" width="16" height="11" rx="4"/><path d="M12 8.5V5M12 4.2h.01M9 13.2h.01M15 13.2h.01M9.5 16.5h5M2 13v3M22 13v3"/>',
cart:A('<path d="M6.5 7h13.7l-1.8 7.5H8.2z"/>')+'<path d="M2.5 4h2.4l2.3 11h10.9l1.9-8H6.4"/><circle cx="9.5" cy="19.3" r="1.3"/><circle cx="17" cy="19.3" r="1.3"/>',
wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
info:A('<circle cx="12" cy="12" r="9"/>')+'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.2M12 7.8h.01"/>',
user:A('<circle cx="12" cy="8" r="3.8"/>')+user,
chat:A('<path d="M20 12.5a2.5 2.5 0 0 1-2.5 2.5H10l-5 4.5V15H6.5A2.5 2.5 0 0 1 4 12.5v-6A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5z"/>')+'<path d="M20 12.5a2.5 2.5 0 0 1-2.5 2.5H10l-5 4.5V15H6.5A2.5 2.5 0 0 1 4 12.5v-6A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5z"/><path d="M9 9.5h.01M12 9.5h.01M15 9.5h.01"/>',
left:'<path d="M15 5l-7 7 7 7"/>',right:'<path d="M9 5l7 7-7 7"/>',
clip:'<path d="M20.5 11.5l-8.2 8.2a5 5 0 0 1-7-7l8.8-8.8a3.3 3.3 0 0 1 4.7 4.7L10 17.3a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/>',
key:A('<circle cx="8" cy="15" r="4.5"/>')+'<circle cx="8" cy="15" r="4.5"/><path d="M11.4 11.6 20 3M16 7l3 3M18.2 4.8l2 2"/>',
checksq:A('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/>')+'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M8 12.2l3 3 5-5.7"/>',
target:A('<circle cx="12" cy="12" r="5"/>')+'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
fit:A('<rect x="8" y="8" width="8" height="8" rx="2"/>')+'<path d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3"/>',
chev:'<path d="M6 9l6 6 6-6"/>',
dia:A('<path d="M12 3.5 20.5 12 12 20.5 3.5 12z"/>')+'<path d="M12 3.5 20.5 12 12 20.5 3.5 12z"/>',
money:A('<rect x="2.5" y="6" width="19" height="12" rx="3.5"/>')+'<rect x="2.5" y="6" width="19" height="12" rx="3.5"/><circle cx="12" cy="12" r="2.8"/><path d="M6 12h.01M18 12h.01"/>',
stamp:'<path d="M5 21h14M6 17.5h12a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-1a2.5 2.5 0 0 1-1.5-4.4A2.5 2.5 0 1 0 8.5 9 2.5 2.5 0 0 1 8 12.5H8a3 3 0 0 0-3 3v1a1 1 0 0 0 1 1z"/>',
upload:'<path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5M4.5 15v3a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-3"/>',
dl:'<path d="M12 4v11.5M7.5 11 12 15.5 16.5 11M4.5 15v3a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-3"/>',
link:'<path d="M9.5 14.5l5-5M8.2 11 6.5 12.7a3.5 3.5 0 0 0 4.8 5L13 16M15.8 13l1.7-1.7a3.5 3.5 0 0 0-4.8-5L11 8"/>',
trash:A('<path d="M6.5 7h11l-.8 12a2 2 0 0 1-2 1.9H9.3a2 2 0 0 1-2-1.9z"/>')+'<path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12M10 11v6M14 11v6"/>',
file:A('<path d="'+file+'"/>')+'<path d="'+file+'"/><path d="M14 3v5h5"/>',
x:'<path d="M6 6l12 12M18 6 6 18"/>',
daily:A('<rect x="3.5" y="5" width="17" height="15.5" rx="4"/>')+cal+'<path d="M8.8 14.8l2.2 2.2 4.2-4.3"/>',
cam:A('<path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5L16 6.5h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>')+'<path d="M4 8.5a2 2 0 0 1 2-2h2l1.5-2h5L16 6.5h2a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.8" r="3.3"/>',
inv:A('<path d="M3.5 9.5 12 4l8.5 5.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/>')+'<path d="M3.5 9.5 12 4l8.5 5.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19zM8 20.5v-6h8v6M8 17.5h8"/>',
upl:'<path d="M7 18.5a4.5 4.5 0 0 1-.7-8.9A6 6 0 0 1 17.9 9 4.3 4.3 0 0 1 17 18.5M12 20.5v-8M8.8 15.5 12 12.3l3.2 3.2"/>',
dnl:'<path d="M7 18.5a4.5 4.5 0 0 1-.7-8.9A6 6 0 0 1 17.9 9 4.3 4.3 0 0 1 17 18.5M12 12.5v8M8.8 17.3 12 20.5l3.2-3.2"/>',
chip:A('<rect x="7" y="7" width="10" height="10" rx="2.5"/>')+'<rect x="7" y="7" width="10" height="10" rx="2.5"/><path d="M9.5 3.5v3.5M14.5 3.5v3.5M9.5 17v3.5M14.5 17v3.5M3.5 9.5H7M3.5 14.5H7M17 9.5h3.5M17 14.5h3.5"/>',
ptag:A('<path d="M3.5 4.5v7.2a1.5 1.5 0 0 0 .44 1.06l7.8 7.8a1.5 1.5 0 0 0 2.12 0l6.9-6.9a1.5 1.5 0 0 0 0-2.12l-7.8-7.8A1.5 1.5 0 0 0 11.7 3H5a1.5 1.5 0 0 0-1.5 1.5z"/>')+'<path d="M3.5 4.5v7.2a1.5 1.5 0 0 0 .44 1.06l7.8 7.8a1.5 1.5 0 0 0 2.12 0l6.9-6.9a1.5 1.5 0 0 0 0-2.12l-7.8-7.8A1.5 1.5 0 0 0 11.7 3H5a1.5 1.5 0 0 0-1.5 1.5z"/><circle cx="8" cy="8" r="1.3"/>',
srch:A('<circle cx="10.5" cy="10.5" r="6.5"/>')+'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20.5 20.5"/>',
lic:A('<circle cx="12" cy="9" r="6"/>')+'<circle cx="12" cy="9" r="6"/><path d="M8.6 14 7 21l5-3 5 3-1.6-7"/>',
lock:A('<rect x="4.5" y="10.5" width="15" height="10" rx="3"/>')+'<rect x="4.5" y="10.5" width="15" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2"/>',
ai:A('<path d="M11 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z"/>')+'<path d="M11 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
attend:A('<rect x="4" y="3.5" width="16" height="17" rx="3.5"/>')+'<rect x="4" y="3.5" width="16" height="17" rx="3.5"/><circle cx="12" cy="10" r="2.5"/><path d="M8 17c.5-2 2.2-3 4-3s3.5 1 4 3"/>',
globe:A('<circle cx="12" cy="12" r="9"/>')+'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
a_pages:A('<rect x="3" y="4.5" width="18" height="15" rx="3.5"/>')+'<rect x="3" y="4.5" width="18" height="15" rx="3.5"/><path d="M3 9.5h18M6.5 7h.01M9 7h.01"/>',
a_sect:A('<rect x="3.5" y="4" width="5.5" height="16" rx="2"/>')+'<rect x="3.5" y="4" width="17" height="16" rx="3.5"/><path d="M9 4v16M9 12h11.5"/>',
a_file:A('<path d="'+file+'"/>')+'<path d="'+file+'"/><path d="M14 3v5h5"/>',
a_appr:A('<circle cx="12" cy="9.5" r="6.5"/>')+'<circle cx="12" cy="9.5" r="6.5"/><path d="M9.2 9.7l2 2 3.6-3.8M8.5 15 7 21l5-2.6 5 2.6-1.5-6"/>',
a_find:A('<circle cx="10.5" cy="10.5" r="6.5"/>')+'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20.5 20.5M8 10.5h5M10.5 8v5"/>'
};
Object.assign(IP,N);
const st=document.createElement('style');st.id='neo-ios';st.textContent=`
svg.i{fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
svg.i .n2{fill:currentColor;fill-opacity:.24;stroke:none}
/* iOS squircle tiles */
.ib{border-radius:9px;background:linear-gradient(180deg,color-mix(in srgb,var(--c,#94a3b8) 72%,#fff),var(--c,#94a3b8))!important;color:#fff!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 1px 3px rgba(0,0,0,.35)}
.ib svg.i,.kb svg.i{stroke-width:1.7}
.ib svg.i .n2{fill:#fff;fill-opacity:.3}
.kb{border-radius:14px!important}
.tabs a svg.i,.tabs a.on svg.i,:root[data-theme] .tabs a svg.i{color:#fff!important;border:0!important;backdrop-filter:none!important;border-radius:11px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--c2,var(--c)) 85%,#fff),var(--c))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 2px 5px rgba(0,0,0,.35)!important}
.tabs a svg.i .n2{fill:#fff;fill-opacity:.3}
.tabs a.on svg.i{box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 0 0 3px color-mix(in srgb,var(--c) 30%,transparent),0 4px 12px color-mix(in srgb,var(--c) 55%,transparent)!important}

/* ===== NEW TAB DESIGN: iOS tab-bar / app-dock capsules (icon tile above label) ===== */
.tg{gap:14px!important;padding:14px 22px 16px!important}
.tg .tgp{border-radius:26px!important;padding:10px 12px 12px!important;border:1px solid rgba(255,255,255,.12)!important;background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.03))!important;backdrop-filter:blur(14px) saturate(150%);-webkit-backdrop-filter:blur(14px) saturate(150%);box-shadow:0 10px 30px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.16);flex:1 1 300px!important}
.tg .tgl{justify-content:center;font-size:10px!important;letter-spacing:.16em!important;padding:0 0 8px!important;opacity:.8}
.tg .tgs{display:flex;flex-wrap:wrap;justify-content:space-around;gap:6px 2px!important}
.tg a,.tabs a{flex-direction:column!important;align-items:center!important;justify-content:flex-start;text-align:center;gap:5px!important;padding:6px 4px 5px!important;min-width:72px;max-width:96px;border:0!important;border-radius:16px!important;font-size:11.5px!important;font-weight:600;line-height:1.15;background:transparent!important;white-space:normal!important;transition:transform .18s,background .18s}
.tg a svg.i,.tabs a svg.i{width:22px!important;height:22px!important;padding:9px!important;border-radius:14px!important;margin:0!important}
.tg a:hover,.tabs a:hover{transform:translateY(-3px);background:rgba(255,255,255,.06)!important}
.tg a:active,.tabs a:active{transform:scale(.94)}
.tg a.on,.tabs a.on{background:rgba(255,255,255,.10)!important;color:var(--fg)!important;font-weight:800}
.tg a.on::after,.tabs a.on::after{content:"";display:block;width:5px;height:5px;border-radius:50%;background:var(--c,var(--ac));box-shadow:0 0 8px var(--c,var(--ac));position:static!important;margin-top:1px;left:auto;top:auto;bottom:auto;right:auto;opacity:1}
.tabs a:not(.on):not(:last-child)::after{display:none}
@media(max-width:700px){.tg a,.tabs a{min-width:64px}.tg .tgp{flex-basis:100%!important}}
`;document.head.appendChild(st);
const o=document.getElementById('neo-css');if(o)o.textContent=o.textContent.replace('svg.i{stroke-width:1.75;fill:color-mix(in srgb,currentColor 15%,transparent)}','').replace('.ib svg.i,.kb svg.i,.ch svg.i{fill:color-mix(in srgb,currentColor 22%,transparent)}','');
})();
/* ===== SHARED FILES page: Common + department folders + admin-created folders (e.g. Energy), subfolders, upload/download ===== */
(function(){
if(typeof V==='undefined'||typeof NAV==='undefined')return;
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
try{if(!NAV.find(n=>n[0]=='share')){const i=NAV.findIndex(n=>n[0]=='purch');NAV.splice(i<0?NAV.length-1:i+1,0,['share','Shared Files','folder'])}if(!GV.includes('share'))GV.push('share');NC.share='#38bdf8';
 if(!RPK.includes('share')){const i=RPG.findIndex(x=>x[0]=='purch');RPG.splice(i<0?RPG.length:i+1,0,['share','Shared Files']);RPK.length=0;RPG.forEach(x=>RPK.push(x[0]))}}catch(e){console.error('share reg',e)}

try{if(typeof SECR!=='undefined'&&!SECR.find(x=>x[0]=='share')){const k=SECR.findIndex(x=>x[0]=='purch');SECR.splice(k<0?SECR.length:k+1,0,['share','Shared Files',[['view','Open & download shared files','open shared files'],['upload','Upload files','upload shared files'],['folder','Create sub-folders & rename / delete own folders','create shared folders'],['delete','Rename / delete own files','delete own shared files'],['delall','Rename / delete anyone\'s files & folders','delete any shared files']]])}}catch(e){console.error('share SECR',e)}
const SH=window.SHR={d:null,cur:'common',q:'',err:'',up:null,t:0};
const api=async(m,u,b)=>{const r=await fetch(u,{method:m,credentials:'same-origin',headers:b!==undefined?{'content-type':'application/json'}:{},body:b!==undefined?JSON.stringify(b):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('Error '+r.status));return j};
const sz=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':n<1073741824?(n/1048576).toFixed(1)+' MB':(n/1073741824).toFixed(2)+' GB';
const fi=n=>{const x=(String(n).split('.').pop()||'').toLowerCase();return /^(png|jpe?g|gif|webp|bmp|svg)$/.test(x)?['img','#a78bfa']:x=='pdf'?['pdf','#f87171']:/^(xlsx?|csv)$/.test(x)?['xl','#34d399']:/^(docx?|txt|rtf)$/.test(x)?['file','#60a5fa']:/^(zip|rar|7z)$/.test(x)?['box','#fbbf24']:/^(mp4|mov|webm|avi|mkv)$/.test(x)?['cam','#f472b6']:['file','#94a3b8']};
const F=id=>(SH.d&&SH.d.folders.find(f=>f.id===id))||null;
const kids=id=>SH.d.folders.filter(f=>f.parent===id).sort((a,b)=>a.name.localeCompare(b.name));
const tops=()=>SH.d.folders.filter(f=>!f.parent);
const rootOf=f=>{let n=0;while(f&&f.parent&&n++<20)f=F(f.parent);return f};
const crumbs=id=>{const a=[];let f=F(id),n=0;while(f&&n++<20){a.unshift(f);f=f.parent?F(f.parent):null}return a};
const cnt=id=>{let n=SH.d.files.filter(x=>x.folder===id).length;kids(id).forEach(k=>n+=cnt(k.id));return n};
async function load(){try{SH.d=await api('GET','/api/share');SH.err='';if(!F(SH.cur))SH.cur='common'}catch(e){SH.err=e.message}if(S.view==='share'&&!document.getElementById('shm'))render()}
const lock=()=>`<div class="c" style="text-align:center;padding:44px 20px;max-width:640px;margin:30px auto"><h3 style="margin:8px 0">Not available for your account type</h3><p class="mut">Ask an administrator for access to Shared Files.</p></div>`;
V.share=function(){
 if(typeof rOK=='function'&&!rOK('share'))return lock();
 if(!SH.d)return`<div class="c"><h3>${sh('folder','','#38bdf8')}Shared Files</h3><p class="mut">${SH.err?E(SH.err):'Loading…'}</p></div>`;
 const cp=SH.d.caps||{},cur=F(SH.cur)||F('common'),root=rootOf(cur),adm=SH.d.admin,w=cur.canWrite&&cp.upload,wf=cur.canWrite&&cp.folder,q=SH.q.toLowerCase();
 const kind=f=>f.kind==='common'?'Everyone':f.kind==='dept'?'Department':f.kind==='custom'?(f.access&&f.access.all?'Everyone':'Selected people'):'';
 const tree=f=>`<a class="shf ${f.id===cur.id?'on':''}" onclick="shGo('${f.id}')">${ic(f.kind==='common'?'globe':f.kind==='dept'?'users':'folder')}<span>${E(f.name)}</span><em>${cnt(f.id)}</em></a>`;
 const sub=kids(cur.id),files=SH.d.files.filter(x=>x.folder===cur.id&&(!q||x.name.toLowerCase().includes(q))).sort((a,b)=>b.ts.localeCompare(a.ts));
 const subs=q?sub.filter(k=>k.name.toLowerCase().includes(q)):sub;
 return`<div class="c" id="shpage"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h3 style="margin:0;flex:1 1 200px">${sh('folder','','#38bdf8')}Shared Files</h3><input placeholder="Search in this folder…" value="${E(SH.q)}" oninput="SHR.q=this.value;shRe()" style="min-width:200px">${adm?`<button class="b" style="margin:0" onclick="shNewTop()">${ic('plus')}New main folder</button>`:''}<button class="b" style="margin:0;background:#334155" onclick="shLoad()">${ic('rw')}Refresh</button></div>${adm?`<label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:13px"><input type="checkbox" ${SH.d.deptOpen?'checked':''} onchange="shDeptOpen(this.checked)"> <b>Department folders are open to everyone</b> (all companies &amp; departments, like chat). Untick to keep each department folder private to its own people.</label>`:''}
<p class="mut" style="font-size:12.5px;margin:8px 0 0">Files are stored on the company server. <b>Common</b> is open to everyone, each <b>department</b> folder is for its own people${adm?', and you can create extra folders (for example <b>Energy</b>) and choose who may use them':''}.</p></div>
<div class="shw"><div class="c shl"><div class="shg">COMMON</div>${tree(F('common'))}<div class="shg">DEPARTMENTS</div>${tops().filter(f=>f.kind==='dept').map(tree).join('')||'<span class="mut" style="font-size:12px;padding:4px 8px">None</span>'}<div class="shg">OTHER FOLDERS</div>${tops().filter(f=>f.kind==='custom').map(tree).join('')||'<span class="mut" style="font-size:12px;padding:4px 8px">None yet</span>'}</div>
<div class="c shr" id="shdrop"><div class="shc">${crumbs(cur.id).map((f,i,a)=>`<a onclick="shGo('${f.id}')">${E(f.name)}</a>${i<a.length-1?'<i>›</i>':''}`).join('')}<span class="shk">${kind(root)}${root.perm==='ro'?' · read only':''}</span></div>
<div class="tb" style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">${w?`<button class="b" style="margin:0" onclick="this.nextElementSibling.click()">${ic('upload')}Upload files</button><input type="file" multiple style="display:none" onchange="shUp(this.files);this.value=''">`:''}${wf?`<button class="b" style="margin:0;background:#334155" onclick="shNewSub()">${ic('folder')}New folder here</button>`:''}${!w&&!wf?'<span class="mut" style="font-size:12.5px">You can open and download here (read only).</span>':''}
${adm&&cur.kind==='custom'?`<button class="b" style="margin:0;background:#7c3aed" onclick="shEdit('${cur.id}')">${ic('gear')}Who can use this folder</button>`:''}${(cur.kind==='sub'||cur.kind==='custom')&&(adm||SH.d.uid===undefined)?'':''}${(cur.kind==='sub'&&(adm||cp.folder||cp.delall))||(cur.kind==='custom'&&adm)?`<button class="b" style="margin:0;background:#334155" onclick="shRenF('${cur.id}')">Rename</button><button class="b" style="margin:0;background:#b42318" onclick="shDelF('${cur.id}')">${ic('trash')}Delete folder</button>`:''}</div>
${SH.up?`<div class="shu">${E(SH.up)}</div>`:''}
${w?'<div class="shz">Drop files here to upload</div>':''}
${subs.length?`<div class="shgrid">${subs.map(k=>`<a class="shfd" onclick="shGo('${k.id}')">${ic('folder')}<b>${E(k.name)}</b><small>${cnt(k.id)} file(s)</small></a>`).join('')}</div>`:''}
${files.length?`<div class="sc"><table><tr><th>Name</th><th>Size</th><th>Uploaded by</th><th>Date</th><th style="width:150px"></th></tr>${files.map(x=>{const[i,c]=fi(x.name);return`<tr><td><span style="color:${c}">${ic(i)}</span><a href="/api/share/file/${x.id}" target="_blank" rel="noopener">${E(x.name)}</a></td><td>${sz(x.size)}</td><td>${E(x.by)}</td><td>${new Date(x.ts).toLocaleString()}</td><td style="white-space:nowrap"><a href="/api/share/file/${x.id}?dl=1" title="Download">${ic('dl')}</a>${(adm||cp.delall||(x.own&&cp.del))&&cur.canWrite?` <a onclick="shRenFile('${x.id}')" title="Rename">${ic('gear')}</a> <a onclick="shDelFile('${x.id}')" title="Delete" style="color:#f87171">${ic('trash')}</a>`:''}</td></tr>`}).join('')}</table></div>`:(subs.length?'':`<div class="nop">${ic('folder')}<b>${q?'Nothing found':'This folder is empty'}</b><span>${w&&!q?'Upload files or create a folder.':''}</span></div>`)}</div></div>`};
const css=document.createElement('style');css.textContent=`
.shw{display:grid;grid-template-columns:250px minmax(0,1fr);gap:14px;align-items:start}.shw>*{min-width:0}@media(max-width:800px){.shw{grid-template-columns:minmax(0,1fr)}}
.shl{padding:10px!important}.shg{font-size:10px;letter-spacing:1.4px;color:var(--mut);font-weight:800;padding:10px 8px 4px}
.shf{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;cursor:pointer;color:var(--fg)}.shf:hover{background:rgba(127,150,180,.12);text-decoration:none}.shf.on{background:rgba(56,189,248,.16);color:#7dd3fc;font-weight:700}.shf svg.i{margin:0;color:#38bdf8}.shf span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.shf em{font-style:normal;font-size:11px;color:var(--mut)}
.shc{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-weight:700}.shc i{color:var(--mut);font-style:normal}.shk{margin-left:auto;font-size:11px;color:var(--mut);border:1px solid var(--bd);border-radius:99px;padding:2px 10px;font-weight:600}
.shz{border:2px dashed var(--bd);border-radius:14px;padding:16px;text-align:center;color:var(--mut);margin-bottom:12px;font-size:13px}.shdr .shz{border-color:#38bdf8;color:#7dd3fc;background:rgba(56,189,248,.08)}
.shu{background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.4);border-radius:10px;padding:8px 12px;margin-bottom:10px;font-size:13px}
.shgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-bottom:14px}.shfd{display:grid;gap:2px;padding:12px;border:1px solid var(--bd);border-radius:14px;cursor:pointer;color:var(--fg);background:rgba(127,150,180,.06)}.shfd:hover{border-color:#38bdf8;text-decoration:none}.shfd svg.i{width:26px;height:26px;margin:0 0 4px;color:#38bdf8}.shfd small{color:var(--mut)}
.shm{position:fixed;inset:0;z-index:9990;background:rgba(2,6,12,.7);display:flex;align-items:center;justify-content:center;padding:14px}.shm>div{background:var(--card);color:var(--fg);border:1px solid var(--bd);border-radius:16px;padding:18px;width:min(560px,100%);max-height:90vh;overflow:auto}
.shm label.ck2{display:inline-flex;gap:6px;align-items:center;margin:3px 10px 3px 0;font-size:13px}.shm h4{margin:12px 0 4px;font-size:12px;letter-spacing:1px;color:var(--mut);text-transform:uppercase}`;document.head.appendChild(css);
window.shLoad=load;window.shRe=()=>{const el=document.getElementById('shpage');if(S.view==='share'&&!document.getElementById('shm')){const a=document.activeElement,id=a&&a.getAttribute&&a.getAttribute('oninput'),pos=a&&a.selectionStart;render();if(id){const n=[...document.querySelectorAll('input')].find(x=>x.getAttribute('oninput')===id);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}}}};
window.shGo=id=>{SH.cur=id;SH.q='';render()};
const say2=m=>{try{say(m)}catch(e){alert(m)}};
const modal=(html)=>{const d=document.createElement('div');d.className='shm';d.id='shm';d.innerHTML='<div>'+html+'</div>';d.addEventListener('mousedown',e=>{if(e.target===d)d.remove()});document.body.appendChild(d);return d};
const ask1=(title,val,ok)=>{const d=modal(`<h3 style="margin:0 0 10px">${E(title)}</h3><input id="shn" style="width:100%;box-sizing:border-box" value="${E(val||'')}" maxlength="100"><div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button class="b" style="margin:0;background:#334155" id="shx">Cancel</button><button class="b" style="margin:0" id="sho">OK</button></div>`);const i=d.querySelector('#shn');i.focus();i.select();const go=async()=>{const v=i.value.trim();if(!v)return;try{await ok(v);d.remove()}catch(e){say2(e.message)}};d.querySelector('#sho').onclick=go;d.querySelector('#shx').onclick=()=>d.remove();i.onkeydown=e=>{if(e.key==='Enter')go();if(e.key==='Escape')d.remove()}};
window.shDeptOpen=v=>api('POST','/api/share/settings',{deptOpen:v}).then(load).catch(e=>say2(e.message));
window.shNewSub=()=>ask1('New folder in "'+F(SH.cur).name+'"','',async n=>{const r=await api('POST','/api/share/folder',{name:n,parent:SH.cur});await load();SH.cur=r.folder.id;render()});
window.shRenF=id=>ask1('Rename folder',F(id).name,async n=>{await api('POST','/api/share/folder/update',{id,name:n});await load()});
window.shDelF=id=>{const f=F(id),n=cnt(id);if(confirm('Delete folder "'+f.name+'" and everything inside it ('+n+' file(s))?\nDeleted files are kept in the server\'s data\\share\\.trash folder.'))api('POST','/api/share/folder/delete',{id}).then(()=>{SH.cur=f.parent||'common';return load()}).catch(e=>say2(e.message))};
window.shRenFile=id=>{const x=SH.d.files.find(f=>f.id===id);ask1('Rename file',x.name,async n=>{await api('POST','/api/share/file/rename',{id,name:n});await load()})};
window.shDelFile=id=>{const x=SH.d.files.find(f=>f.id===id);if(confirm('Delete "'+x.name+'"?'))api('POST','/api/share/file/delete',{id}).then(load).catch(e=>say2(e.message))};
function accForm(f){const a=(f&&f.access)||{all:false,depts:[],roles:[],users:[]},cb=(n,v,l,on)=>`<label class="ck2"><input type="checkbox" data-g="${n}" value="${E(v)}" ${on?'checked':''}> ${E(l)}</label>`;
 return`<h4>Name</h4><input id="shn" style="width:100%;box-sizing:border-box" value="${E(f?f.name:'')}" maxlength="100" placeholder="e.g. Energy">
<h4>Who can use it</h4><label class="ck2"><input type="checkbox" id="sha" ${a.all?'checked':''}> <b>Everyone</b> (all signed-in users)</label>
<h4>Departments</h4>${SH.d.depts.map(d=>cb('d',d.id,d.name,(a.depts||[]).includes(d.id))).join('')}
<h4>Roles</h4>${SH.d.roles.filter(r=>r!=='Admin').map(r=>cb('r',r,r,(a.roles||[]).includes(r))).join('')}
<h4>Individual people</h4><div style="max-height:160px;overflow:auto;border:1px solid var(--bd);border-radius:10px;padding:6px 8px">${SH.d.users.map(x=>cb('u',x.id,(x.name||x.email)+' – '+x.email,(a.users||[]).includes(x.id))).join('')}</div>
<h4>Permission</h4><label class="ck2"><input type="radio" name="shp" value="rw" ${f&&f.perm==='ro'?'':'checked'}> Can upload &amp; download</label><label class="ck2"><input type="radio" name="shp" value="ro" ${f&&f.perm==='ro'?'checked':''}> Download only (read only)</label>`}
function readAcc(d){const g=n=>[...d.querySelectorAll('[data-g="'+n+'"]:checked')].map(x=>x.value);return{access:{all:d.querySelector('#sha').checked,depts:g('d'),roles:g('r'),users:g('u')},perm:d.querySelector('[name=shp]:checked').value,name:d.querySelector('#shn').value.trim()}}
function folderModal(title,f,ok){const d=modal(`<h3 style="margin:0">${E(title)}</h3>${accForm(f)}<div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end"><button class="b" style="margin:0;background:#334155" id="shx">Cancel</button><button class="b" style="margin:0" id="sho">Save</button></div>`);d.querySelector('#shx').onclick=()=>d.remove();d.querySelector('#sho').onclick=async()=>{const v=readAcc(d);if(!v.name)return say2('Enter a folder name.');if(!v.access.all&&!v.access.depts.length&&!v.access.roles.length&&!v.access.users.length&&!confirm('No one is selected, so only administrators will see this folder. Continue?'))return;try{await ok(v);d.remove()}catch(e){say2(e.message)}}}
window.shNewTop=()=>folderModal('New main folder',null,async v=>{const r=await api('POST','/api/share/folder',v);await load();SH.cur=r.folder.id;render()});
window.shEdit=id=>folderModal('Who can use "'+F(id).name+'"',F(id),async v=>{await api('POST','/api/share/folder/update',Object.assign({id},v));await load()});
window.shUp=async files=>{files=[...files];const fid=SH.cur;for(let i=0;i<files.length;i++){const f=files[i];SH.up='Uploading '+(i+1)+' of '+files.length+': '+f.name+' … 0%';render();
 try{await new Promise((rs,rj)=>{const x=new XMLHttpRequest();x.open('POST','/api/share/upload?folder='+encodeURIComponent(fid));x.setRequestHeader('x-filename',encodeURIComponent(f.name));x.upload.onprogress=e=>{if(e.lengthComputable){const el=document.querySelector('.shu');if(el)el.textContent='Uploading '+(i+1)+' of '+files.length+': '+f.name+' … '+Math.round(e.loaded/e.total*100)+'%'}};x.onload=()=>x.status<300?rs():rj(new Error((JSON.parse(x.responseText||'{}').error)||('Upload failed ('+x.status+')')));x.onerror=()=>rj(new Error('Network error'));x.send(f)})}catch(e){say2(f.name+': '+e.message)}}
 SH.up=null;await load();render()};
document.addEventListener('dragover',e=>{const z=document.getElementById('shdrop');if(z&&z.contains(e.target)){e.preventDefault();z.classList.add('shdr')}});
document.addEventListener('dragleave',e=>{const z=document.getElementById('shdrop');if(z&&!z.contains(e.relatedTarget))z.classList.remove('shdr')});
document.addEventListener('drop',e=>{const z=document.getElementById('shdrop');if(z&&z.contains(e.target)){e.preventDefault();z.classList.remove('shdr');const f=F(SH.cur);if(f&&f.canWrite&&e.dataTransfer.files.length)shUp(e.dataTransfer.files)}});
{const _r=render;render=function(){_r.apply(this,arguments);try{if(S.view==='share'&&!SH.d&&!SH.err)load();else if(S.view==='share'&&SH.err&&!SH.d&&Date.now()-SH.t>5000){SH.t=Date.now();SH.err='';load()}}catch(e){}}}
setInterval(()=>{if(S.view==='share'&&!document.getElementById('shm')&&!SH.up&&!document.hidden)load()},20000);
})();
/* ===== CHAT ACROSS ALL COMPANIES: everyone appears in New direct message / New group; "All companies" channel ===== */
(function(){
if(typeof cxRoster!=='function')return;
window.NEOPPL=window.NEOPPL||{};let ts=0,busy=false;
async function ld(){if(busy||Date.now()-ts<60000)return;busy=true;try{const r=await fetch('/api/people',{credentials:'same-origin'});if(r.ok){const j=await r.json(),m={};(j.people||[]).forEach(p=>{m['e:'+p.email]=p});window.NEOPPL=m;ts=Date.now()}}catch(e){}busy=false}
const _r=cxRoster;
cxRoster=function(){const rows=_r.apply(this,arguments);try{const K=cxKeys(),have=new Set(rows.map(r=>r.k)),names=new Set(rows.map(r=>String(r.name).trim().toLowerCase()));
 Object.keys(NEOPPL).forEach(k=>{const p=NEOPPL[k];if(K.includes(k)||K.includes(p.id)||have.has(k)||have.has(p.id))return;if(names.has(String(p.name).trim().toLowerCase()))return;rows.push({k,name:p.name,pos:[p.role,(p.depts||[]).join(', ')].filter(Boolean).join(' · '),on:true})});
 rows.forEach(r=>{const p=NEOPPL[r.k];if(p&&!r.pos)r.pos=[p.role,(p.depts||[]).join(', ')].filter(Boolean).join(' · ')});
 rows.sort((a,b)=>String(a.name).localeCompare(String(b.name)))}catch(e){}return rows};
{const _rd=render;render=function(){_rd.apply(this,arguments);try{if(S.view==='chat')ld()}catch(e){}}}
ld();
})();
;try{render()}catch(e){}
