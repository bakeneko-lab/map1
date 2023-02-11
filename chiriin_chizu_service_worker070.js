self.addEventListener('install', function(ev)
{
	console.log(new Date() + '[ServiceWorker] do Install');
	return install(ev);
});

self.addEventListener('activate', function(ev)
{
	console.log(new Date() + '[ServiceWorker] do Activate');
});

self.addEventListener('message', function(ev)
{
	console.log(new Date() + '[ServiceWorker] do Message');
	return install(ev);
});

const install = (event) =>
{
	return event.waitUntil(
		caches.open(CACHE_NAME).then(function(cache)
		{
			urlsToCache.map(url =>
			{
				return fetch(new Request(url)).then(response =>
				{
					return cache.put(url, response);
				});
			})
		})
		.catch(function(err)
		{
			console.log(new Date() + '[ServiceWorker] install:' + err);
		})
	);
}

// サービスワーカー有効化に必須
self.addEventListener('fetch', function(event) {});
