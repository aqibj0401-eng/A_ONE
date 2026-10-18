import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';

// We'll generate a session ID and store it in sessionStorage
// This ensures it lasts for the duration of the browser tab
let currentSessionId = sessionStorage.getItem('analytics_session_id');
if (!currentSessionId) {
  currentSessionId = uuidv4();
  sessionStorage.setItem('analytics_session_id', currentSessionId);
}

// Keep track of the currently active view event to calculate duration
let currentViewEvent = null;

const flushCurrentViewEvent = async () => {
  if (!currentViewEvent || !currentViewEvent.eventId) return;

  const duration = Math.floor((Date.now() - currentViewEvent.startTime) / 1000);
  
  // Only send update if duration is greater than 0
  if (duration > 0) {
    try {
      const token = localStorage.getItem('auth-storage');
      const parsed = token ? JSON.parse(token) : null;
      const jwt = parsed?.state?.token;
      
      if (jwt) {
        // Use fetch with keepalive so it runs even if the tab is closing
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        fetch(`${baseUrl}/behavior/event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({ 
            eventId: currentViewEvent.eventId, 
            duration 
          }),
          keepalive: true
        }).catch(err => console.warn('Failed to send duration via fetch', err));
      }
    } catch (error) {
      console.warn('Failed to update event duration:', error);
    }
  }
  
  currentViewEvent = null;
};

// Listen for tab close or hide
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushCurrentViewEvent();
    }
  });
}

let lastTrackedEvent = null;

export const trackEvent = async (eventType, metadata = {}) => {
  try {
    // Exclude Admin tracking
    if (metadata?.path?.startsWith('/admin')) return;

    const token = localStorage.getItem('auth-storage');
    const parsedToken = token ? JSON.parse(token) : null;
    if (!parsedToken?.state?.token) return;
    
    if (parsedToken?.state?.user?.role === 'admin') return;

    // Prevent duplicate tracking (React Strict Mode / rapid double fires)
    const now = Date.now();
    const eventSignature = `${eventType}:${JSON.stringify(metadata)}`;
    if (lastTrackedEvent && lastTrackedEvent.signature === eventSignature && (now - lastTrackedEvent.time < 1000)) {
      return; // Ignore duplicate
    }
    lastTrackedEvent = { signature: eventSignature, time: now };

    // If a new view event is starting, flush the previous one
    if (eventType === 'page_view' || eventType === 'product_view') {
      await flushCurrentViewEvent();
    }

    const response = await api.post('/behavior/event', {
      sessionId: currentSessionId,
      eventType,
      metadata,
    });

    // If it's a view event, start tracking its duration
    if ((eventType === 'page_view' || eventType === 'product_view') && response.data?.eventId) {
      currentViewEvent = {
        eventId: response.data.eventId,
        startTime: Date.now()
      };
    }
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
};
