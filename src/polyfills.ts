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

    const event = new Event("abort");
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
      signal._abort(new Error("AbortError"));
    }, delay);
    return signal;
  }
}

// Polyfill for Response.json in WASI environments
export function polyfillResponse() {
  try {
    // Try to add Response.prototype.json if it doesn't exist
    if (
      typeof globalThis.Response !== "undefined" &&
      !globalThis.Response.prototype.json
    ) {
      Object.defineProperty(globalThis.Response.prototype, "json", {
        value: async function () {
          const text = await this.text();
          return JSON.parse(text);
        },
        writable: true,
        configurable: true,
      });
    }

    // Try to add Response.json static method if it doesn't exist
    if (
      typeof globalThis.Response !== "undefined" &&
      !globalThis.Response.json
    ) {
      Object.defineProperty(globalThis.Response, "json", {
        value: function (data: any, init?: ResponseInit) {
          return new Response(JSON.stringify(data), {
            ...init,
            headers: {
              "Content-Type": "application/json",
              ...(init?.headers || {}),
            },
          });
        },
        writable: true,
        configurable: true,
      });
    }
  } catch (error) {
    // Silently fail if we can't polyfill Response methods
    console.warn("Could not polyfill Response methods:", error);
  }
}

// Set up global polyfills if not available
export function setupPolyfills() {
  if (typeof globalThis.AbortController === "undefined") {
    (globalThis as any).AbortController = AbortControllerPolyfill;
  }

  if (typeof globalThis.AbortSignal === "undefined") {
    (globalThis as any).AbortSignal = AbortSignalPolyfill;
  }

  // Add Response polyfills
  polyfillResponse();
}

export function getCrypto() {
  if (!globalThis.crypto) {
    throw new Error("no platform crypto available");
  }
  return globalThis.crypto;
}
