var CACHE_NAME = 'mws-p1-cache-v6';
var urlsToCache = [
  '/',
  '/css/styles.css',
  '/index.html',
  '/restaurant.html',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/js/dbhelper.js',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
];

self.addEventListener('install', function(event) {
  console.log("installing Service worker");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log("Cached Sucessfully");
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys().then(function(cache_names){
			return Promise.all(
				cache_names.filter(function(cache_name){
					return cache_name.startsWith('mws-') && cache_name!=CACHE_NAME; 
				}).map(function(cache_name){
					return cache.delete(cache_name);
				})
			)
		})
	)
});

self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.match(event.request)
			.then(function(response) {
        if(response) return response;
        return fetch(event.request);
			}
		)
	);
});
