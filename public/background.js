// background.js - Handles API calls and recommendation generation

// Cache for API responses
const cache = {
    embeddings: {},
    recommendations: {}
  };
  
  // Hardcoded API keys
  const API_KEYS = {
    youtubeApiKey: 'AIzaSyATC4q6RDehb_rKg1W9Shht7imrazsbg28',
    geminiApiKey: 'AIzaSyCPrH4D9ZCaECa1djVPhUzqIqP8lr9QIxI'
  };
  
  // Function to get video embeddings from Gemini
  async function getVideoEmbedding(text) {
    try {
      // Check cache first
      const cacheKey = text.substring(0, 100); 
      if (cache.embeddings[cacheKey]) {
        return cache.embeddings[cacheKey];
      }
      
      const geminiApiKey = API_KEYS.geminiApiKey;
      if (!geminiApiKey) {
        console.error('Gemini API key not found');
        return null;
      }
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: { parts: [{ text }] },
            taskType: "RETRIEVAL_DOCUMENT"
          })
        }
      );
      
      const data = await response.json();
      const embedding = data.embedding?.values || null;
      
      // Cache the result
      if (embedding) {
        cache.embeddings[cacheKey] = embedding;
      }
      
      return embedding;
    } catch (error) {
      console.error("Error fetching embedding:", error);
      return null;
    }
  }
  
  // Function to fetch YouTube recommended videos
  async function fetchRecommendedVideos(searchQuery) {
    try {
      const youtubeApiKey = API_KEYS.youtubeApiKey;
      if (!youtubeApiKey) {
        console.error('YouTube API key not found');
        return [];
      }
      
      // Cache key for this search
      const cacheKey = `search_${searchQuery}`;
      if (cache.recommendations[cacheKey]) {
        return cache.recommendations[cacheKey];
      }
      
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=20&key=${youtubeApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.items) {
        console.error('No items found in YouTube response:', data);
        return [];
      }
      
      const videos = data.items.map(video => ({
        id: video.id.videoId,
        title: video.snippet.title,
        description: video.snippet.description || "",
        fullText: `${video.snippet.title} ${video.snippet.description || ""}`
      }));
      
      // Cache the results
      cache.recommendations[cacheKey] = videos;
      
      return videos;
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      return [];
    }
  }
  
  // Function to process liked videos
  async function processLikedVideos(likedVideos) {
    const processed = [];
    
    for (const video of likedVideos) {
      try {
        const text = `${video.title} ${video.description || ""}`;
        const embedding = await getVideoEmbedding(text);
        if (embedding) {
          processed.push({ ...video, embedding });
        }
      } catch (error) {
        console.error(`Error processing liked video: ${video.title}`, error);
      }
    }
    
    return processed;
  }
  
  // Function to process recommended videos
  async function processRecommendedVideos(searchQuery) {
    const videos = await fetchRecommendedVideos(searchQuery);
    const processed = [];
    
    for (const video of videos) {
      try {
        const embedding = await getVideoEmbedding(video.fullText);
        if (embedding) {
          processed.push({ ...video, embedding });
        }
      } catch (error) {
        console.error(`Error processing recommended video: ${video.title}`, error);
      }
    }
    
    return processed;
  }
  
  // Function to calculate cosine similarity between two vectors
  function cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error("Vectors must have the same length");
    }
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }
    
    return dotProduct / (mag1 * mag2);
  }
  
  // Function to find the best matches with a similarity threshold
  function findBestMatches(likedVideos, recommendedVideos, maxRecommendations = 5, minSimilarity = 0.5) {
 
    if (likedVideos.length === 0 || recommendedVideos.length === 0) {
      console.log("Not enough data for recommendations.");
      return [];
    }
    
    // For each recommended video, find its similarity to the liked videos
    const results = recommendedVideos.map(recVideo => {
      // Find the highest similarity with any of the liked videos
      let maxSimilarity = -1;
      let bestMatch = null;
      
      for (const likedVideo of likedVideos) {
        const similarity = cosineSimilarity(recVideo.embedding, likedVideo.embedding);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatch = likedVideo;
        }
      }
      
      return {
        id: recVideo.id,
        title: recVideo.title,
        description: recVideo.description,
        similarity: maxSimilarity,
        matchedWith: bestMatch ? bestMatch.title : null
      };
    });
    
    // Sort by similarity (higher is better for cosine similarity)
    const sortedResults = results.sort((a, b) => b.similarity - a.similarity);
    
    // Filter by minimum similarity threshold and limit to maxRecommendations
    return sortedResults
      .filter(item => item.similarity >= minSimilarity)
      .slice(0, maxRecommendations);
  }
  
  // Main function to generate recommendations
  async function generateRecommendations(searchQuery, likedVideos) {
    try {
      console.log(`Generating recommendations for "${searchQuery}" with ${likedVideos.length} liked videos`);
      
      // Process the liked videos to get embeddings
      const processedLikedVideos = await processLikedVideos(likedVideos);
      if (processedLikedVideos.length === 0) {
        console.error('No processed liked videos available');
        return [];
      }
      
      // Process the recommended videos from search query
      const processedRecommendedVideos = await processRecommendedVideos(searchQuery);
      if (processedRecommendedVideos.length === 0) {
        console.error('No processed recommended videos available');
        return [];
      }
      
      // Find the best matches
      const personalizedRecommendations = findBestMatches(
        processedLikedVideos,
        processedRecommendedVideos,
        5, // Max recommendations
        0.5 // Minimum similarity threshold
      );
      
      console.log('Generated recommendations:', personalizedRecommendations);
      return personalizedRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPersonalizedRecommendations') {
      const { searchQuery, likedVideos } = request;
      
      if (!searchQuery) {
        sendResponse({ error: 'No search query provided' });
        return true;
      }
      
      if (!likedVideos || likedVideos.length === 0) {
        sendResponse({ error: 'No liked videos provided' });
        return true;
      }
      
      // Generate recommendations asynchronously
      generateRecommendations(searchQuery, likedVideos)
        .then(recommendations => {
          sendResponse({ recommendations });
        })
        .catch(error => {
          console.error('Error in recommendation generation:', error);
          sendResponse({ error: error.message });
        });
      
      // Return true to indicate we will send a response asynchronously
      return true;
    }
  });
  
  // Add side panel functionality
  chrome.runtime.onInstalled.addListener((details) => {
    // Enable the side panel
    if (chrome.sidePanel) {
      chrome.sidePanel.setOptions({
        enabled: true
      });
    }
    
    if (details.reason === 'install') {
      // Set default settings on install
      chrome.storage.local.set({
        maxRecommendations: 5,
        minSimilarity: 0.5
      });
    }
  });
  
  // Open the side panel when extension icon is clicked
  if (chrome.action) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }