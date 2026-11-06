// Offline passcode reset. Run with the server STOPPED:  node reset-passcode.js <user-id-email> <new-passcode>
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const F=path.join(__dirname,'data','db.json'),[,,em,pw]=process.argv;
if(!em||!pw||pw.length<8){console.log('Usage: reset-passcode.js <user id / email> <new passcode (min 8 characters)>');process.exit(1)}
const d=JSON.parse(fs.readFileSync(F,'utf8')),u=Object.values(d.users).find(x=>x.email===em.trim().toLowerCase());
if(!u){console.log('No such user: '+em+'\nExisting users:\n  '+Object.values(d.users).map(x=>x.email).join('\n  '));process.exit(2)}
fs.copyFileSync(F,F+'.bak-'+Date.now());
u.salt=crypto.randomBytes(16).toString('hex');u.hash=crypto.scryptSync(pw,u.salt,32).toString('hex');u.revoked=false;
fs.writeFileSync(F,JSON.stringify(d));console.log('Done. '+u.email+' can now sign in with the new passcode. (A backup of db.json was saved in the data folder.)');
