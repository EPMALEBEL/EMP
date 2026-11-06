// EPM e-mail alerts (Gmail / any SMTP). No dependencies. Sends a mail when work is not completed by its end date.
const net=require('net'),tls=require('tls');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const b64=s=>Buffer.from(String(s),'utf8').toString('base64');
const wrap=s=>b64(s).replace(/.{1,76}/g,'$&\r\n').trim();
const validMail=e=>/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e)&&!/\.local$/i.test(e)&&!/@admin\.com$/i.test(e);

function smtpSend(cfg,to,subject,text,html){return new Promise((resolve,reject)=>{
  const secure=cfg.secure!==false,host=cfg.host||'smtp.gmail.com',port=+cfg.port||(secure?465:587);
  if(!secure&&!/^(localhost|127\.0\.0\.1)$/.test(host))return reject(new Error('Plain (unencrypted) SMTP is only allowed on localhost.'));
  const sock=secure?tls.connect({host,port,servername:host}):net.connect({host,port});
  let buf='',fin=false;const waiters=[],pend=[];
  const fail=e=>{if(fin)return;fin=true;try{sock.destroy()}catch(_){}reject(e)};
  sock.setTimeout(30000,()=>fail(new Error('Could not reach the mail server (timeout). Check the internet connection of this PC.')));
  sock.on('error',e=>fail(new Error('Could not connect to the mail server: '+(e.code||e.message))));
  sock.on('close',()=>{if(!fin&&waiters.length)fail(new Error('Mail server closed the connection.'))});
  const pump=()=>{for(;;){const ls=buf.split('\r\n');if(ls.length<2)return;let ix=-1;for(let i=0;i<ls.length-1;i++)if(/^\d{3}( |$)/.test(ls[i])){ix=i;break}if(ix<0)return;const r=ls.slice(0,ix+1);buf=ls.slice(ix+1).join('\r\n');const w=waiters.shift();if(w)w(r);else pend.push(r)}};
  sock.on('data',d=>{buf+=d.toString('utf8');pump()});
  const next=()=>new Promise(r=>{if(pend.length)r(pend.shift());else waiters.push(r)});
  const exp=async code=>{const r=await next(),c=+r[r.length-1].slice(0,3),ok=Array.isArray(code)?code.includes(c):c===code;if(!ok){const e=new Error(r.join(' ').slice(0,300));e.code=c;throw e}return r};
  const cmd=async(s,code)=>{sock.write(s+'\r\n');return exp(code)};
  (async()=>{
    await exp(220);await cmd('EHLO epm.local',250);
    await cmd('AUTH LOGIN',334);await cmd(b64(cfg.user),334);await cmd(b64(cfg.pass),235);
    await cmd('MAIL FROM:<'+cfg.user+'>',250);for(const t of to)await cmd('RCPT TO:<'+t+'>',[250,251]);await cmd('DATA',354);
    const bd='=_epm_'+Date.now().toString(36)+Math.random().toString(36).slice(2),nm=String(cfg.fromName||'Engineering Project Manager').replace(/["\r\n]/g,'');
    const msg=['From: =?UTF-8?B?'+b64(nm)+'?= <'+cfg.user+'>','To: '+to.join(', '),'Subject: =?UTF-8?B?'+b64(subject)+'?=','Date: '+new Date().toUTCString(),'Message-ID: <'+Date.now().toString(36)+Math.random().toString(36).slice(2)+'@epm.local>','MIME-Version: 1.0','Content-Type: multipart/alternative; boundary="'+bd+'"','',
      '--'+bd,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',wrap(text),'--'+bd,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',wrap(html),'--'+bd+'--',''].join('\r\n');
    sock.write(msg+'\r\n.\r\n');await exp(250);
    try{sock.write('QUIT\r\n')}catch(_){}fin=true;try{sock.end()}catch(_){}resolve(true)
  })().catch(fail)})}

const nice=e=>{const m=String(e&&e.message||e);if(e&&e.code===535||/535|Username and Password not accepted|BadCredentials/i.test(m))return 'Gmail refused the sign-in. Use a Gmail App Password (Google Account > Security > 2-Step Verification > App passwords), not the normal Gmail password.';return m};

function lateItems(db,today){const out=[],days=d=>Math.max(1,Math.round((new Date(today)-new Date(d))/864e5));
  Object.values(db.c.components||{}).forEach(c=>{if(!c||!c.id)return;const pr=(db.c.projects||{})[c.proj],pn=pr?(pr.name||'')+(pr.ver?' '+pr.ver:''):'';
    const push=(kind,i,who,work,due,lw)=>out.push({key:c.id+'|'+kind+'|'+i+'|'+due,kind,id:c.id,who:who||'',work,due,days:days(due),lw:lw||null,proj:pn});
    if(c.ov!=='COMPLETE'&&c.tgt&&c.tgt<today)push('c',-1,c.own,c.id+' '+(c.name||''),c.tgt,c.lw);
    (c.tasks||[]).forEach((t,i)=>{if(t&&t.target&&t.target<today&&t.status!=='Completed')push('t',i,t.who,c.id+' – task: '+t.task,t.target,t.lw)});
    (c.issues||[]).forEach((x,i)=>{if(x&&x.target&&x.target<today&&x.status!=='Closed')push('i',i,x.who,c.id+' – action: '+x.desc,x.target,x.lw)})});
  return out.sort((a,b)=>b.days-a.days)}

function recipients(db,cfg,items,today){const act=Object.values(db.users).filter(u=>!u.revoked&&(!u.expires||u.expires>=today)&&validMail(String(u.email||'')));
  const map=new Map(),add=(e,it)=>{e=e.toLowerCase();if(!map.has(e))map.set(e,[]);const a=map.get(e);if(!a.includes(it))a.push(it)};
  const mgr=act.filter(u=>u.admin||u.role==='Admin'||u.role==='ProjectManager'),extra=(cfg.to||[]).filter(validMail);
  items.forEach(it=>{if(cfg.assignees!==false){const w=String(it.who||'').toLowerCase();if(w)act.forEach(u=>{const n=String(u.name||'').toLowerCase();if(n&&w.includes(n))add(u.email,it)})}
    if(cfg.managers!==false)mgr.forEach(u=>add(u.email,it));extra.forEach(e=>add(e,it))});
  return map}

function build(items,history,appUrl,intro){
  const when=new Date().toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
  const rows=items.map(x=>`<tr><td style="padding:8px;border:1px solid #e1e7ef">${x.who?esc(x.who):'<i>Unassigned</i>'}</td><td style="padding:8px;border:1px solid #e1e7ef">${esc(x.work)}${x.proj?'<br><small style="color:#667085">'+esc(x.proj)+'</small>':''}</td><td style="padding:8px;border:1px solid #e1e7ef;white-space:nowrap">${esc(x.due)}</td><td style="padding:8px;border:1px solid #e1e7ef;color:#d92d20;white-space:nowrap"><b>${x.days} day${x.days>1?'s':''}</b></td><td style="padding:8px;border:1px solid #e1e7ef">${x.lw?esc(x.lw.t)+'<br><small style="color:#667085">'+esc(x.lw.by||'')+' · '+esc(String(x.lw.ts||'').slice(0,10))+'</small>':'<span style="color:#d92d20">No reason given yet</span>'}</td></tr>`).join('');
  const hs=(history||[]).map(h=>`<tr><td style="padding:6px 8px;border-bottom:1px solid #eef2f7;white-space:nowrap;color:#667085">${esc(String(h.ts||'').slice(0,16).replace('T',' '))}</td><td style="padding:6px 8px;border-bottom:1px solid #eef2f7"><b>${esc(h.user)}</b> – ${esc(h.item)} – ${esc(h.field)}<br><small style="color:#667085">${esc(String(h.prev==null?'':h.prev).slice(0,80))} → ${esc(String(h.nv==null?'':h.nv).slice(0,80))}</small></td></tr>`).join('');
  const html=`<div style="font-family:Segoe UI,Arial,sans-serif;color:#182230;max-width:760px"><h2 style="margin:0 0 4px;color:#d92d20">Not completed by the end date (${items.length})</h2><div style="color:#667085;margin-bottom:12px">${esc(intro||'')} · ${esc(when)}</div>
<table style="border-collapse:collapse;width:100%;font-size:13px"><tr style="background:#f4f6fa;text-align:left"><th style="padding:8px;border:1px solid #e1e7ef">Who</th><th style="padding:8px;border:1px solid #e1e7ef">Which work</th><th style="padding:8px;border:1px solid #e1e7ef">End date</th><th style="padding:8px;border:1px solid #e1e7ef">Late</th><th style="padding:8px;border:1px solid #e1e7ef">Why</th></tr>${rows}</table>
${hs?`<h3 style="margin:22px 0 6px">Recent activity</h3><table style="border-collapse:collapse;width:100%;font-size:13px">${hs}</table>`:''}
${appUrl?`<p style="margin-top:18px"><a href="${esc(appUrl)}" style="background:#0b7285;color:#fff;padding:9px 16px;border-radius:7px;text-decoration:none">Open Engineering Project Manager</a></p>`:''}
<p style="color:#98a2b3;font-size:12px">Sent automatically by Engineering Project Manager.</p></div>`;
  const text='NOT COMPLETED BY THE END DATE ('+items.length+')\n'+(intro||'')+' - '+when+'\n\n'+items.map(x=>'- Who: '+(x.who||'Unassigned')+'\n  Work: '+x.work+(x.proj?' ['+x.proj+']':'')+'\n  End date: '+x.due+'   Late: '+x.days+' day(s)\n  Why: '+(x.lw?x.lw.t+' ('+(x.lw.by||'')+', '+String(x.lw.ts||'').slice(0,10)+')':'No reason given yet')).join('\n\n')+
    ((history||[]).length?'\n\nRECENT ACTIVITY\n'+history.map(h=>'- '+String(h.ts||'').slice(0,16).replace('T',' ')+'  '+h.user+' - '+h.item+' - '+h.field+': '+String(h.prev==null?'':h.prev).slice(0,80)+' -> '+String(h.nv==null?'':h.nv).slice(0,80)).join('\n'):'')+(appUrl?'\n\nOpen the app: '+appUrl:'');
  return{html,text}}

module.exports={smtpSend,lateItems,recipients,build,nice,validMail};
