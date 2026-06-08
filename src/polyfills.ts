// Polyfill for DOMException - needed for Hermes/React Native
// This is required because some packages (like plist) use DOMException
// which is not available in React Native's Hermes engine

if (typeof DOMException === 'undefined') {
  // @ts-ignore
  globalThis.DOMException = class DOMException extends Error {
    readonly code: number;
    readonly name: string;

    constructor(message?: string, name?: string) {
      super(message);
      this.name = name || 'DOMException';
      this.code = 0;
    }
  };
}