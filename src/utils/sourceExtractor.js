// Function to extract and parse web search sources from Claude's response
export const extractSourcesFromResponse = (content) => {
  if (!content || typeof content !== 'string') {
    return { cleanedContent: content, sources: [] };
  }
  
  // First check for new <links> format
  const linkMatch = content.match(/<links>\s*(.*?)\s*<\/links>/);
  if (linkMatch) {
    const linksString = linkMatch[1];
    const links = linksString.split(' ; ').map(url => url.trim()).filter(url => url);
    const cleanContent = content.replace(/<links>.*?<\/links>/, '').trim();
    
    // Convert URLs to source objects for consistency with existing UI
    const sources = links.map((url, index) => ({
      title: `Source ${index + 1}`,
      url: url,
      domain: extractDomain(url)
    }));
    
    return { cleanedContent: cleanContent, sources: sources };
  }

  // Check if content starts with **Sources:**
  if (!content.startsWith('**Sources:**')) {
    return { cleanedContent: content, sources: [] };
  }

  // First, extract all sources using a simpler approach
  const sourcePattern = /\d+\.\s*\[(.*?)\]\((.*?)\)/g;
  const sources = [];
  let sourceMatch;
  
  while ((sourceMatch = sourcePattern.exec(content)) !== null) {
    const title = sourceMatch[1];
    const url = sourceMatch[2];
    
    sources.push({
      title,
      url,
      domain: extractDomain(url)
    });
  }
  
  if (sources.length === 0) {
    return { cleanedContent: content, sources: [] };
  }
  
  // Now find where the main content starts
  // Look for common patterns that indicate the start of the main response
  const mainContentPatterns = [
    /Based on the search results?/,
    /According to the search results?/,
    /The search results? (show|indicate|reveal)/,
    /From the search results?/,
    /^[A-Z][a-z]+ [a-z]+ .{30,}/, // Generic substantial sentence
  ];
  
  let cleanedContent = content;
  
  // Try to find the main content start
  for (const pattern of mainContentPatterns) {
    const match = content.match(pattern);
    if (match) {
      const startIndex = content.indexOf(match[0]);
      cleanedContent = content.substring(startIndex).trim();
      break;
    }
  }
  
  // If no pattern match found, try a more general approach
  if (cleanedContent === content) {
    // Split by lines and find first substantial line that's not part of sources
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && 
          !line.startsWith('**Sources:**') &&
          !line.match(/^\d+\.\s*\[/) && // Not a source line
          !line.startsWith('   ') && // Not indented description
          !line.match(/^\s*<strong>/) && // Not HTML in source description
          line.length > 30 && // Substantial content
          line.match(/^[A-Z]/) && // Starts with capital letter
          !line.includes('Read the President\'s full biography') && // Skip source descriptions
          !line.includes('We use cookies')) { // Skip cookie notices
        cleanedContent = lines.slice(i).join('\n').trim();
        break;
      }
    }
  }
  
  return { cleanedContent, sources };
};

// Helper function to extract domain from URL
const extractDomain = (url) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch (e) {
    console.error('Error extracting domain:', e);
    return url;
  }
};

// Function to get favicon URL for a domain
export const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch (e) {
    return 'https://www.google.com/s2/favicons?domain=' + url;
  }
};

// Function to parse links from the new <links> format
export const parseLinksFromResponse = (content) => {
  if (!content || typeof content !== 'string') {
    return { content: content, sources: [] };
  }
  
  const linkMatch = content.match(/<links>\s*(.*?)\s*<\/links>/);
  if (linkMatch) {
    const linksString = linkMatch[1];
    const links = linksString.split(' ; ').map(url => url.trim()).filter(url => url);
    const cleanContent = content.replace(/<links>.*?<\/links>/, '').trim();
    
    // Convert URLs to source objects for consistency with existing UI
    const sources = links.map((url, index) => ({
      title: `Source ${index + 1}`,
      url: url,
      domain: extractDomain(url)
    }));
    
    return { content: cleanContent, sources: sources };
  }
  
  return { content: content, sources: [] };
};