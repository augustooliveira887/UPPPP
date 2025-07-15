// UTM parameter utilities for tracking
export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  click_id?: string;
  fbclid?: string;
  gclid?: string;
}

// Get UTM parameters from URL
export const getUTMParams = (): UTMParams => {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    click_id: urlParams.get('click_id') || undefined,
    fbclid: urlParams.get('fbclid') || undefined,
    gclid: urlParams.get('gclid') || undefined,
  };
};

// Extract UTM parameters from current URL
export const extractUTMFromURL = (): UTMParams => {
  const utmParams = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'click_id', 'fbclid', 'gclid'];
  const params: UTMParams = {};

  utmKeys.forEach(key => {
    const value = utmParams.get(key);
    if (value) {
      params[key as keyof UTMParams] = value;
    }
  });

  return params;
};

// Build UTM query string
export const buildUTMString = (params: UTMParams): string => {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`);
  
  return filteredParams.length > 0 ? `&${filteredParams.join('&')}` : '';
};

// Store UTM parameters in localStorage for persistence
export const storeUTMParams = (params: UTMParams): void => {
  localStorage.setItem('utm_params', JSON.stringify(params));
};

// Get stored UTM parameters
export const getStoredUTMParams = (): UTMParams => {
  try {
    const stored = localStorage.getItem('utm_params');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Function to append UTM parameters to checkout URLs
export const getCheckoutUrl = (baseUrl: string): string => {
  const utmParams = getStoredUTMParams();
  if (Object.keys(utmParams).length === 0) {
    return baseUrl;
  }
  
  const separator = baseUrl.includes('?') ? '&' : '?';
  const utmString = buildUTMString(utmParams);
  return `${baseUrl}${separator}${utmString.substring(1)}`; // Remove the leading &
};

// Set UTM parameters from URL params
export const setUTMParams = (params: URLSearchParams): void => {
  const utmData: UTMParams = {};
  
  // Extract all UTM and tracking parameters
  const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'click_id', 'fbclid', 'gclid'];
  
  trackingKeys.forEach(key => {
    const value = params.get(key);
    if (value) {
      utmData[key as keyof UTMParams] = value;
    }
  });
  
  // Store if we have any UTM data
  if (Object.keys(utmData).length > 0) {
    storeUTMParams(utmData);
  }
};

// Track events with UTM parameters
export const trackEvent = (eventName: string, additionalData?: Record<string, any>): void => {
  const utmParams = getStoredUTMParams();
  const eventData = {
    event: eventName,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    ...utmParams,
    ...additionalData
  };
  
  // Log to console for development
  console.log('Event tracked:', eventData);
  
  // Send to external tracking service (Xtracky)
  if (window.xtracky && typeof window.xtracky.track === 'function') {
    window.xtracky.track(eventName, eventData);
  }
  
  // Store in localStorage for debugging
  const events = JSON.parse(localStorage.getItem('tracked_events') || '[]');
  events.push(eventData);
  localStorage.setItem('tracked_events', JSON.stringify(events.slice(-50))); // Keep last 50 events
};

// Initialize UTM tracking on page load
export const initializeUTMTracking = (): void => {
  // Extract UTM parameters from current URL
  const currentUTMParams = extractUTMFromURL();
  
  if (Object.keys(currentUTMParams).length > 0) {
    storeUTMParams(currentUTMParams);
  }
  
  // Track page view with UTM parameters
  trackEvent('page_view', {
    page: window.location.pathname,
    referrer: document.referrer
  });
};

// Declare global xtracky interface
declare global {
  interface Window {
    xtracky?: {
      track: (eventName: string, data: any) => void;
    };
  }
}