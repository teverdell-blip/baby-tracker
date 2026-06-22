// Baby Tracker Service Worker — handles background feed reminders
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'SCHEDULE_CHECK') {
    scheduleCheck(e.data.lastFeedTime, e.data.reminderMins);
  }
  if (e.data.type === 'CANCEL_CHECK') {
    if (self._checkTimer) { clearTimeout(self._checkTimer); self._checkTimer = null; }
  }
});

function scheduleCheck(lastFeedTime, reminderMins) {
  if (self._checkTimer) clearTimeout(self._checkTimer);
  const elapsed  = Date.now() - lastFeedTime;
  const threshold = reminderMins * 60 * 1000;
  const delay    = Math.max(threshold - elapsed, 5000);

  self._checkTimer = setTimeout(() => {
    const minsSince = Math.floor((Date.now() - lastFeedTime) / 60000);
    const h = Math.floor(minsSince / 60), m = minsSince % 60;
    const ago = h > 0 ? h + 'h ' + m + 'm' : m + 'm';
    self.registration.showNotification('🍼 Feed reminder', {
      body: 'Last feed was ' + ago + ' ago — time for another?',
      tag: 'feed-reminder',
      renotify: true,
      requireInteraction: false,
    });
    // Reschedule for next interval from now
    scheduleCheck(Date.now(), reminderMins);
  }, delay);
}

// Clicking the notification opens / focuses the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('./baby-tracker.html');
    })
  );
});
