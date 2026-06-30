// PlanLife Service Worker
const CACHE_NAME = 'planlife-cache-v1';
const OFFLINE_URLS = [
  '/',
];

// نصب و کش کردن صفحه اصلی
self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(OFFLINE_URLS).catch(function () {
        // اگر کش اولیه شکست خورد، نصب رو متوقف نکن
      });
    })
  );
});

// فعال‌سازی و پاک کردن کش‌های قدیمی
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// استراتژی: شبکه اول، اگر آفلاین بود از کش بخون (فقط برای درخواست‌های GET هم‌مبدا)
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          try { cache.put(event.request, copy); } catch (e) {}
        });
        return response;
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match('/');
        });
      })
  );
});

// دریافت Push Notification (برای استفاده آینده با Push API)
self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}

  var title = data.title || 'PlanLife';
  var options = {
    body: data.body || 'پیام جدید از PlanLife',
    icon: 'http://fs3.centraldnserver.com/~planlife/pics/planlife.jpeg',
    badge: 'http://fs3.centraldnserver.com/~planlife/pics/planlife.jpeg',
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// کلیک روی نوتیفیکیشن
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url === url && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
