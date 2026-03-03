self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); });

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'LifeSync Reminder';
    const options = {
        body: data.body || 'You have a reminder!',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [ 200, 100, 200 ],
        data: data.url || '/',
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'close', title: 'Dismiss' }
        ]
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'close') return;
    event.waitUntil(clients.openWindow(event.notification.data || '/'));
});
