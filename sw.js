self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',()=>{});

self.addEventListener('notificationclick',e=>{e.notification.close();const d=Object.assign({type:'epm-open'},e.notification.data||{});e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){c.postMessage(d);if('focus' in c)return c.focus()}return self.clients.openWindow('./')}))});
