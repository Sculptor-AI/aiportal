export async function scrapeHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  
  let title = '';
  let content = [];
  let ogImage = '';
  
  const rewriter = new HTMLRewriter()
    .on('title', {
      text(text) {
        title += text.text;
      }
    })
    .on('meta[property="og:image"]', {
      element(element) {
        ogImage = element.getAttribute('content') || '';
      }
    })
    .on('p', {
      text(text) {
        if (text.text.trim()) {
          content.push(text.text.trim());
        }
      }
    })
    .on('article', {
      text(text) {
        if (text.text.trim()) {
          content.push(text.text.trim());
        }
      }
    })
    .on('main', {
      text(text) {
        if (text.text.trim() && content.length < 50) {
          content.push(text.text.trim());
        }
      }
    });
  
  await rewriter.transform(response).text();
  
  return {
    title: title.trim(),
    content: content.join('\n\n').substring(0, 65000),
    image: ogImage,
    url: response.url
  };
}
