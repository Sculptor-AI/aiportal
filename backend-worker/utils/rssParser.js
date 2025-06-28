export async function parseRSSFeed(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AIPortal/1.0)'
    }
  });
  
  const text = await response.text();
  
  // Parse RSS XML
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(text)) !== null) {
    const itemXml = match[1];
    
    const item = {
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
      contentEncoded: extractTag(itemXml, 'content:encoded'),
      mediaContent: extractMediaContent(itemXml)
    };
    
    items.push(item);
  }
  
  return { items };
}

function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tagName}>|<${tagName}>([\\s\\S]*?)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function extractMediaContent(xml) {
  // Look for media:content
  const mediaMatch = xml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch) return mediaMatch[1];
  
  // Look for enclosure
  const enclosureMatch = xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i);
  if (enclosureMatch) return enclosureMatch[1];
  
  // Look for media:thumbnail
  const thumbnailMatch = xml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (thumbnailMatch) return thumbnailMatch[1];
  
  return null;
}
