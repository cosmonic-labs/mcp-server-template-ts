// Polyfill for node:crypto in WASI environments
export function randomUUID() {
  // Simple UUID v4 implementation for WASI environments
  const hex = "0123456789abcdef";
  let uuid = "";

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += "-";
    } else if (i === 14) {
      uuid += "4"; // Version 4
    } else if (i === 19) {
      uuid += hex[(Math.random() * 4) | 8]; // Variant
    } else {
      uuid += hex[(Math.random() * 16) | 0];
    }
  }

  return uuid;
}

// Polyfill for AbortController in WASI environments
export class AbortControllerPolyfill {
  signal: AbortSignalPolyfill;

  constructor() {
    this.signal = new AbortSignalPolyfill();
  }

  abort() {
    this.signal._abort();
  }
}

export class AbortSignalPolyfill extends EventTarget {
  aborted: boolean = false;
  reason?: any;

  constructor() {
    super();
  }

  _abort(reason?: any) {
    if (this.aborted) return;
    
    this.aborted = true;
    this.reason = reason;
    
    const event = new Event('abort');
    this.dispatchEvent(event);
  }

  static abort(reason?: any): AbortSignalPolyfill {
    const signal = new AbortSignalPolyfill();
    signal._abort(reason);
    return signal;
  }

  static timeout(delay: number): AbortSignalPolyfill {
    const signal = new AbortSignalPolyfill();
    setTimeout(() => {
      signal._abort(new Error('AbortError'));
    }, delay);
    return signal;
  }
}

// Polyfill for Response.json in WASI environments
export function polyfillResponse() {
  try {
    // Try to add Response.prototype.json if it doesn't exist
    if (typeof globalThis.Response !== 'undefined' && !globalThis.Response.prototype.json) {
      Object.defineProperty(globalThis.Response.prototype, 'json', {
        value: async function() {
          const text = await this.text();
          return JSON.parse(text);
        },
        writable: true,
        configurable: true
      });
    }
    
    // Try to add Response.json static method if it doesn't exist
    if (typeof globalThis.Response !== 'undefined' && !globalThis.Response.json) {
      Object.defineProperty(globalThis.Response, 'json', {
        value: function(data: any, init?: ResponseInit) {
          return new Response(JSON.stringify(data), {
            ...init,
            headers: {
              'Content-Type': 'application/json',
              ...(init?.headers || {})
            }
          });
        },
        writable: true,
        configurable: true
      });
    }
  } catch (error) {
    // Silently fail if we can't polyfill Response methods
    console.warn('Could not polyfill Response methods:', error);
  }
}

// Set up global polyfills if not available
export function setupPolyfills() {
  if (typeof globalThis.AbortController === 'undefined') {
    (globalThis as any).AbortController = AbortControllerPolyfill;
  }
  
  if (typeof globalThis.AbortSignal === 'undefined') {
    (globalThis as any).AbortSignal = AbortSignalPolyfill;
  }
  
  // Add Response polyfills
  polyfillResponse();
}
