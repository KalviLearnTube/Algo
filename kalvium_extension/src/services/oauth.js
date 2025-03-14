export const getGoogleAuthToken = () => {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        console.log(token)
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(token);
      });
    });
  };
  
const getGoogleColorId = (hexColor) => {
  const colorMap = {
    '#4285F4': '1',  
    '#EA4335': '11', // Red
    '#FBBC05': '5',  // Yellow
    '#34A853': '2',  // Green
    '#8E24AA': '3',  // Purple
    '#FF6D00': '6',  // Orange
    '#00BCD4': '7',  // Cyan/Turquoise
    '#607D8B': '8',  // Blue Grey
    '#FF4081': '4',  // Pink
    '#1DE9B6': '2',  // Teal (using Green)
  };

  // Find closest color or default to blue (1)
  return colorMap[hexColor] || '1';
};
  
  export const createCalendarEvent = async (token, eventData) => {
    if (!eventData.date || !eventData.startTime || !eventData.endTime) {
      throw new Error('Missing required date/time information');
    }
  
    const formatDateTime = (date, time) => {
      
      const cleanDate = date.split('T')[0];
      const cleanTime = time.includes(':') ? 
        (time.split(':').length === 2 ? `${time}:00` : time) : 
        `${time}:00:00`;
      
      return `${cleanDate}T${cleanTime}`;
    };
  
    const event = {
      summary: eventData.eventName || 'Untitled Event',
      description: eventData.description || '',
      start: {
        dateTime: formatDateTime(eventData.date, eventData.startTime),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: formatDateTime(eventData.date, eventData.endTime),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      location: eventData.location || '',
      conferenceData: eventData.virtualLink ? {
        createRequest: {
          requestId: Date.now().toString(),
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      } : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { 
            method: 'popup', 
            minutes: parseInt(eventData.notification) || 30 
          }
        ]
      },
      colorId: getGoogleColorId(eventData.color)
    };
  
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create event: ${errorData.error?.message || response.statusText}`);
      }
  
      return response.json();
    } catch (error) {
      console.error('Calendar API Error:', error);
      throw error;
    }
  };


  export const fetchYouTubeHistory = (token) => {
    return new Promise(async (resolve, reject) => {
      try {
        const url = 'https://www.googleapis.com/youtube/v3/playlistItems';
        const params = new URLSearchParams({
          part: 'snippet',
          maxResults: '10',
          playlistId: 'HL'
        });
  
        const response = await fetch(`${url}?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        });
  
        if (!response.ok) {
          reject(new Error(`Failed to fetch: ${response.statusText}`));
          return;
        }
  
        const data = await response.json();
        console.log("Full history data:", data); // Log the full response to check if data is coming
  
        resolve(data); // Resolve with full data
      } catch (error) {
        console.error('Error fetching YouTube history:', error.message);
        reject(error);
      }
    });
  };
  