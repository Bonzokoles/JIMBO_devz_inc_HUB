# PUMO Blog Analytics Integration Guide

Use this guide to connect **My Bonzo AI Blog** (or any other frontend) to the PUMO Analytics Engine.

## 1. Universal Tracking Snippet

Add the following JavaScript code to your blog's HTML, ideally just before the closing `</body>` tag or in the `<head>` section.
This script automatically tracks:
- Page Views
- User Client ID (persistent)
- UTM Parameters (Source, Medium, Campaign)

### Copy & Paste Code:

```html
<script>
(function() {
  const HEADER_API_URL = 'https://jimbo-like-pumo-api.stolarnia-ams.workers.dev/api/track';
  
  // 1. Get or Generate Client ID
  function getClientId() {
    let cid = localStorage.getItem('pumo_cid');
    if (!cid) {
      cid = 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pumo_cid', cid);
    }
    return cid;
  }

  // 2. Send Event Helper
  async function trackEvent(name, params = {}) {
    try {
      const clientId = getClientId();
      
      // Capture UTM params automatically
      const urlParams = new URLSearchParams(window.location.search);
      const utm = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
        if (urlParams.has(key)) utm[key] = urlParams.get(key);
      });

      const payload = {
        name: name,
        client_id: clientId,
        params: {
          url: window.location.href,
          referrer: document.referrer,
          timestamp: new Date().toISOString(),
          ...utm,
          ...params
        }
      };

      // Use navigator.sendBeacon if available (better for page unload)
      if (name === 'page_view' || navigator.sendBeacon) {
        // Beacon sends POST with text/plain, handle accordingly if needed, 
        // but here we use fetch for JSON support unless unloading.
        // PUMO API expects JSON.
        
        await fetch(HEADER_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        });
      }
    } catch (e) {
      console.warn('[PUMO] Track error:', e);
    }
  }

  // 3. Track Page View
  trackEvent('page_view', {
    title: document.title
  });

  // 4. Expose to global window for manual tracking (e.g. clicks)
  window.pumo = {
    track: trackEvent
  };

  // 5. Auto-track outbound links (Optional - uncomment to enable)
  /*
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && !link.href.includes(window.location.hostname)) {
      trackEvent('outbound_click', { href: link.href, text: link.innerText });
    }
  });
  */

})();
</script>
```

## 2. Testing

1. Open your blog.
2. Open Developer Tools (F12) -> Network tab.
3. Refresh the page.
4. Look for a request to `track`.
5. Check PUMO Dashboard ("Events" or "Realtime") to see the data.

## 3. Astro Integration (Specific)

If your blog is built with Astro (as found in `cloudflare_integration/astro_blog`), add the script inside `src/layouts/Layout.astro`:

```astro
<!-- src/layouts/Layout.astro -->
<head>
  <!-- ... other head tags ... -->
  <script is:inline>
    // ... paste the JS code from above here ...
    // Note: In Astro, use is:inline to prevent bundling issues if needed.
  </script>
</head>
```
