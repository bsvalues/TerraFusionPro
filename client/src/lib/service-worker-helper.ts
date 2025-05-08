/**
 * Service Worker Helper
 * Handles registration and communication with the service worker
 */

// Check if service workers are supported
const isServiceWorkerSupported = 'serviceWorker' in navigator;

// Register the service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported) {
    console.log('[ServiceWorkerHelper] Service workers not supported in this browser');
    return null;
  }
  
  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });
    
    console.log('[ServiceWorkerHelper] Service worker registered successfully:', registration.scope);
    
    // Return the registration
    return registration;
  } catch (error) {
    console.error('[ServiceWorkerHelper] Service worker registration failed:', error);
    return null;
  }
}

// Check WebSocket connection via service worker
export async function checkWebSocketViaServiceWorker(url: string, protocols: string[] = []): Promise<any> {
  if (!isServiceWorkerSupported || !navigator.serviceWorker.controller) {
    console.log('[ServiceWorkerHelper] Service worker not active, cannot check WebSocket');
    return { status: 'error', error: 'Service worker not active' };
  }
  
  return new Promise((resolve) => {
    // Create a message channel
    const messageChannel = new MessageChannel();
    
    // Set up the message handler
    messageChannel.port1.onmessage = (event) => {
      if (event.data && event.data.type === 'WEBSOCKET_STATUS') {
        resolve(event.data);
      }
    };
    
    // Send the message to the service worker
    navigator.serviceWorker.controller.postMessage(
      {
        type: 'RECONNECT_WEBSOCKET',
        url,
        protocols
      },
      [messageChannel.port2]
    );
    
    // Set a timeout
    setTimeout(() => {
      resolve({ status: 'timeout', error: 'Request timed out' });
    }, 5000);
  });
}

// Ping the service worker to make sure it's still alive
export async function pingServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported || !navigator.serviceWorker.controller) {
    return false;
  }
  
  return new Promise((resolve) => {
    // Create a message channel
    const messageChannel = new MessageChannel();
    
    // Set up the message handler
    messageChannel.port1.onmessage = (event) => {
      if (event.data && event.data.type === 'PONG') {
        resolve(true);
      }
    };
    
    // Send the message to the service worker
    navigator.serviceWorker.controller.postMessage(
      { type: 'PING' },
      [messageChannel.port2]
    );
    
    // Set a timeout
    setTimeout(() => {
      resolve(false);
    }, 1000);
  });
}

// Register a background sync for WebSocket reconnection
export async function registerWebSocketReconnectSync(): Promise<boolean> {
  if (!isServiceWorkerSupported) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if ('sync' in registration) {
      await registration.sync.register('websocket-reconnect');
      console.log('[ServiceWorkerHelper] Background sync registered for WebSocket reconnection');
      return true;
    } else {
      console.log('[ServiceWorkerHelper] Background sync not supported');
      return false;
    }
  } catch (error) {
    console.error('[ServiceWorkerHelper] Error registering background sync:', error);
    return false;
  }
}

// Initialize the service worker helper
export function initServiceWorkerHelper(): void {
  if (!isServiceWorkerSupported) {
    console.log('[ServiceWorkerHelper] Service workers not supported in this browser');
    return;
  }
  
  // Register the service worker when the page loads
  window.addEventListener('load', async () => {
    try {
      await registerServiceWorker();
      
      // Set up a listener for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[ServiceWorkerHelper] Service worker controller changed');
      });
      
      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[ServiceWorkerHelper] Received message from service worker:', event.data);
      });
    } catch (error) {
      console.error('[ServiceWorkerHelper] Error initializing service worker:', error);
    }
  });
}

// Initialize the service worker helper when this module is imported
initServiceWorkerHelper();