/**
 * Platform detection — extension vs web app.
 *
 * WXT extension builds run inside a Chrome extension context where `chrome.runtime.id` exists.
 * The web build (vite.web.config.ts) runs on a normal web page where it doesn't.
 */

export const isExtension: boolean =
  typeof chrome !== 'undefined' &&
  typeof chrome.runtime !== 'undefined' &&
  !!chrome.runtime.id;
