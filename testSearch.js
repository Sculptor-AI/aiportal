import axios from 'axios';

// Simple test script to test the search functionality
async function testSearch() {
  try {
    console.log('Testing search endpoint...');
    try {
      const searchResponse = await axios.post('https://73.118.140.130:3000/api/search', {
        query: 'Who is the president of the United States',
        max_results: 3
      });
      
      console.log('Search successful!');
      console.log(`Found ${searchResponse.data.results.length} results`);
      searchResponse.data.results.forEach((result, i) => {
        console.log(`Result ${i+1}: ${result.title} - ${result.url}`);
      });
    } catch (error) {
      console.error('Search failed:', error.response?.data || error.message);
    }
    
    console.log('\nTesting scrape endpoint...');
    try {
      const scrapeResponse = await axios.post('https://73.118.140.130:3000/api/scrape', {
        url: 'https://www.whitehouse.gov/'
      });
      
      console.log('Scrape successful!');
      console.log(`Title: ${scrapeResponse.data.title}`);
      console.log(`Content length: ${scrapeResponse.data.length} characters`);
      console.log(`Content preview: ${scrapeResponse.data.content.substring(0, 200)}...`);
    } catch (error) {
      console.error('Scrape failed:', error.response?.data || error.message);
    }
    
    console.log('\nTesting search and process endpoint (end-to-end)...');
    try {
      const searchProcessResponse = await axios.post('https://73.118.140.130:3000/api/search-process', {
        query: 'Who is the president of the United States',
        max_results: 3,
        model_prompt: 'Please provide a factual answer about who is the current president of the United States.'
      });
      
      console.log('Search and process successful!');
      console.log('Sources:', searchProcessResponse.data.sources.map(s => s.title).join(', '));
      
      if (searchProcessResponse.data.result?.choices?.[0]?.message?.content) {
        console.log('Model response:', searchProcessResponse.data.result.choices[0].message.content);
      } else {
        console.log('Model response structure:', JSON.stringify(searchProcessResponse.data.result, null, 2));
      }
    } catch (error) {
      console.error('Search and process failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testSearch(); 