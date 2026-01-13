const zlib = require('zlib');

async function countSitemap() {
  const domain = 'https://meblepumo.pl';
  let sitemapUrl = `${domain}/sitemap.xml`;

  // Robots.txt check ...
  try {
      const robots = await fetch(`${domain}/robots.txt`).then(r => r.text());
      const match = robots.match(/Sitemap: (.*)/i);
      if (match) {
          sitemapUrl = match[1].trim();
          console.log(`🤖 Found sitemap in robots.txt: ${sitemapUrl}`);
      }
  } catch(e) { console.log('Robots.txt check failed'); }

  console.log(`📡 Fetching sitemap index: ${sitemapUrl}`);
  
  try {
    let res = await fetch(sitemapUrl);
    
    // GZIP Handling
    let text = '';
    const buffer = await res.arrayBuffer();
    
    if (sitemapUrl.endsWith('.gz') || res.headers.get('content-encoding') === 'gzip') {
        try {
            text = zlib.gunzipSync(Buffer.from(buffer)).toString('utf-8');
            console.log('📦 Decompressed sitemap successfully.');
        } catch(e) {
            console.log('⚠️ Failed to decompress. Trying as text.');
            text = Buffer.from(buffer).toString('utf-8');
        }
    } else {
        text = Buffer.from(buffer).toString('utf-8');
    }
    
    // Check if it is an index or flat sitemap
    const sitemapMatches = text.match(/<loc>(.*?sitemap.*?)<\/loc>/g);
    
    let productCount = 0;
    let categoryCount = 0;

    if (sitemapMatches && sitemapMatches.length > 0) {
      console.log(`Found ${sitemapMatches.length} sub-sitemaps.`);
      
      for (const match of sitemapMatches) {
        const url = match.replace(/<\/?loc>/g, '');
        console.log(`  ACCESSING SUB-SITEMAP: ${url}`);
        
        let subRes = await fetch(url);
        let subText = '';
        const subBuf = await subRes.arrayBuffer();
        
        if (url.endsWith('.gz')) {
             subText = zlib.gunzipSync(Buffer.from(subBuf)).toString('utf-8');
        } else {
             subText = Buffer.from(subBuf).toString('utf-8');
        }

        if (url.includes('products') || url.includes('offer')) {
             // Standard IdoSell might not have 'products' in name, check content
        }
        
        // Count items in sub-sitemap
        // Assuming <loc> tags are items
        const locs = (subText.match(/<loc>/g) || []).length;
        
        // Heuristic: If count > 50, it's likely products. Categories are fewer.
        // Also check URL pattern inside
        if (subText.includes('/product-')) {
             console.log(`     -> Products detected (${locs})`);
             productCount += locs;
        } else if (subText.includes('/category-') || subText.includes('nodes')) {
             console.log(`     -> Categories detected (${locs})`);
             categoryCount += locs;
        } else {
             console.log(`     -> Other links (${locs}) - Adding to products if high count`);
             if (locs > 100) productCount += locs; // Safe bet
        }
      }
    } else {
       // Flat sitemap
       console.log('Flat sitemap detected.');
       productCount = (text.match(/<loc>/g) || []).length;
    }
    
    console.log('------------------------------------------------');
    console.log(`✅ TOTAL PRODUCTS DETECTED: ${productCount}`);
    console.log(`✅ TOTAL CATEGORIES DETECTED: ${categoryCount}`);
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function countUrlsInSitemap(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return 0;
    const text = await res.text();
    // Count <url> tags or <loc> tags inside <url>
    // Simple regex for <loc> inside <url> context is hard with regex, 
    // but counting <loc> is good enough approx.
    // Excluding standard header/footer locs?
    return (text.match(/<loc>/g) || []).length;
  } catch(e) {
    console.error(`Failed to fetch ${url}:`, e.message);
    return 0;
  }
}

countSitemap();
