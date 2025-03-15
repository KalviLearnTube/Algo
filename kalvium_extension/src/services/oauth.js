export const getGoogleAuthToken = () => {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      console.log(token);
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(token);
    });
  });
};

export const fetchYouTubeHistory = (token) => {
  return new Promise(async (resolve, reject) => {
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
        reject(new Error(`Failed to fetch: ${response.statusText}`));
        return;
      }

      const data = await response.json();
      console.log("Full history data:", data);

      resolve(data);
    } catch (error) {
      console.error("Error fetching YouTube history:", error.message);
      reject(error);
    }
  });
};
