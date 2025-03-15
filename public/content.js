
const originalFetch = window.fetch;

let currentSearchQuery = '';

function getSearchQueryFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('search_query') || '';
}

async function getGoogleAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      console.log('Auth token obtained:', token ? 'Yes' : 'No');
      if (chrome.runtime.lastError) {
        console.error('Error getting auth token:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(token);
    });
  });
}

async function fetchYouTubeLikedVideos(token) {
  try {
    const url = "https://www.googleapis.com/youtube/v3/playlistItems";
    const params = new URLSearchParams({
      part: "snippet",
      maxResults: "10",
      playlistId: "LL", 
    });
    
    const response = await fetch(`${url}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch liked videos: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Liked videos data fetched:", data);
    
    // Transform the API response into our format
    const likedVideos = data.items.map(item => {
      const snippet = item.snippet;
      return {
        title: snippet.title,
        description: snippet.description || "",
        video_id: snippet.resourceId.videoId,
        video_url: `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
      };
    });
    
    return likedVideos;
  } catch (error) {
    console.error("Error fetching YouTube liked videos:", error);
    throw error;
  }
}

// Function to get liked videos (uses your implementation)
async function getLikedVideos() {
  try {
    // Get auth token
    const token = await getGoogleAuthToken();
    if (!token) {
      console.error('No auth token available');
      return [];
    }
    
    // Fetch liked videos using the token
    const likedVideos = await fetchYouTubeLikedVideos(token);
    return likedVideos;
  } catch (error) {
    console.error('Error getting liked videos:', error);
    return [];
  }
}

// Function to inject recommendations into the search results page
function injectPersonalizedRecommendations(recommendations) {
  // Check if we're on a search results page
  if (!window.location.href.includes('/results')) return;
  
  console.log('Attempting to inject personalized recommendations:', recommendations);
  
  // Remove any existing personalized recommendations
  const existingContainer = document.getElementById('personalized-recommendations');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  // Find the search results container - targeting YouTube's structure
  let searchResultsContainer = document.querySelector('ytd-section-list-renderer');
  
  // If not found, try alternate selectors
  if (!searchResultsContainer) {
    searchResultsContainer = document.querySelector('#contents.ytd-rich-grid-renderer');
  }
  
  if (!searchResultsContainer) {
    console.error('Search results container not found');
    return;
  }
  
  // Create a container for personalized recommendations
  const personalizedContainer = document.createElement('div');
  personalizedContainer.id = 'personalized-recommendations';
  personalizedContainer.style.padding = '16px';
  personalizedContainer.style.backgroundColor = '#f8f8f8';
  personalizedContainer.style.borderRadius = '8px';
  personalizedContainer.style.margin = '16px 0';
  
  // Add a heading
  const heading = document.createElement('h2');
  heading.textContent = 'Personalized Recommendations';
  heading.style.fontSize = '16px';
  heading.style.fontWeight = 'bold';
  heading.style.marginBottom = '12px';
  personalizedContainer.appendChild(heading);
  
  // Add recommendations
  recommendations.forEach(rec => {
    const recItem = document.createElement('div');
    recItem.style.display = 'flex';
    recItem.style.alignItems = 'center';
    recItem.style.marginBottom = '12px';
    recItem.style.cursor = 'pointer';
    recItem.style.padding = '8px';
    recItem.style.borderRadius = '4px';
    recItem.style.transition = 'background-color 0.2s';
    
    // Hover effect
    recItem.addEventListener('mouseover', () => {
      recItem.style.backgroundColor = '#eaeaea';
    });
    
    recItem.addEventListener('mouseout', () => {
      recItem.style.backgroundColor = 'transparent';
    });
    
    // Add video thumbnail
    const thumbnail = document.createElement('img');
    thumbnail.src = `https://i.ytimg.com/vi/${rec.id}/mqdefault.jpg`;
    thumbnail.style.width = '120px';
    thumbnail.style.height = '68px';
    thumbnail.style.borderRadius = '4px';
    thumbnail.style.marginRight = '12px';
    thumbnail.style.objectFit = 'cover';
    recItem.appendChild(thumbnail);
    
    // Add video details
    const details = document.createElement('div');
    details.style.flex = '1';
    
    const title = document.createElement('div');
    title.textContent = rec.title;
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '4px';
    title.style.fontSize = '14px';
    details.appendChild(title);
    
    const similarity = document.createElement('div');
    similarity.textContent = `Similarity: ${Math.round(rec.similarity * 100)}%`;
    similarity.style.fontSize = '12px';
    similarity.style.color = '#666';
    details.appendChild(similarity);
    
    if (rec.matchedWith) {
      const matchInfo = document.createElement('div');
      matchInfo.textContent = `Similar to: ${rec.matchedWith.substring(0, 40)}${rec.matchedWith.length > 40 ? '...' : ''}`;
      matchInfo.style.fontSize = '11px';
      matchInfo.style.color = '#888';
      matchInfo.style.marginTop = '4px';
      details.appendChild(matchInfo);
    }
    
    recItem.appendChild(details);
    
    // Add click event to go to the video
    recItem.addEventListener('click', () => {
      window.location.href = `https://www.youtube.com/watch?v=${rec.id}`;
    });
    
    personalizedContainer.appendChild(recItem);
  });
  
  // Insert the container at the top of the search results
  searchResultsContainer.insertBefore(personalizedContainer, searchResultsContainer.firstChild);
}

// Function to send message to background script
async function getPersonalizedRecommendations(searchQuery) {
  // First get the liked videos
  const likedVideos = await getLikedVideos();
  
  if (!likedVideos || likedVideos.length === 0) {
    console.warn('No liked videos found, cannot generate personalized recommendations');
    return;
  }
  
  chrome.runtime.sendMessage(
    { 
      action: 'getPersonalizedRecommendations', 
      searchQuery: searchQuery,
      likedVideos: likedVideos  // Pass the liked videos to background script
    },
    (response) => {
      if (response && response.recommendations) {
        injectPersonalizedRecommendations(response.recommendations);
      } else {
        console.error('Failed to get recommendations:', response);
      }
    }
  );
}

// Listen for page navigation
window.addEventListener('yt-navigate-finish', function() {
  // Check if we're on a search page
  if (window.location.href.includes('/results')) {
    const searchQuery = getSearchQueryFromURL();
    if (searchQuery && searchQuery !== currentSearchQuery) {
      currentSearchQuery = searchQuery;
      console.log('YouTube search query detected:', searchQuery);
      getPersonalizedRecommendations(searchQuery);
    }
  }
});

// Intercept YouTube's fetch requests to detect search API calls
window.fetch = function(url, options) {
  const promise = originalFetch(url, options);
  
  // Look for search result API calls
  if (typeof url === 'string' && url.includes('youtube.com/youtubei/v1/search')) {
    promise.then(response => {
      // Clone the response so we can read it twice
      const clonedResponse = response.clone();
      
      // Process the response to extract search data
      clonedResponse.json().then(data => {
        try {
          console.log('Intercepted YouTube search API response');
          // Try to extract the search query
          let searchQuery = '';
          
          // Try different paths to find the search query
          if (data?.responseContext?.serviceTrackingParams) {
            for (const param of data.responseContext.serviceTrackingParams) {
              for (const p of param.params || []) {
                if (p.key === 'query') {
                  searchQuery = p.value;
                  break;
                }
              }
              if (searchQuery) break;
            }
          }
          
          if (!searchQuery && data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer) {
            // If query not found but we have search results, use URL
            searchQuery = getSearchQueryFromURL();
          }
          
          if (searchQuery && searchQuery !== currentSearchQuery) {
            currentSearchQuery = searchQuery;
            console.log('Search query from API:', searchQuery);
            getPersonalizedRecommendations(searchQuery);
          }
        } catch (error) {
          console.error('Error processing search results:', error);
        }
      }).catch(error => {
        console.error('Error parsing search response JSON:', error);
      });
    }).catch(error => {
      console.error('Error processing fetch response:', error);
    });
  }
  
  return promise;
};

// Run when the page is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a search page
  if (window.location.href.includes('/results')) {
    const searchQuery = getSearchQueryFromURL();
    if (searchQuery) {
      currentSearchQuery = searchQuery;
      console.log('YouTube search query detected on page load:', searchQuery);
      getPersonalizedRecommendations(searchQuery);
    }
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentSearchQuery') {
    sendResponse({ searchQuery: currentSearchQuery });
  }
  if (request.action === 'injectRecommendations' && request.recommendations) {
    injectPersonalizedRecommendations(request.recommendations);
    sendResponse({ success: true });
  }
  return true;
});