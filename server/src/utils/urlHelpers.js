import { customAlphabet } from 'nanoid';
import config from '../config/index.js';

// Base62 alphabet: a-z, A-Z, 0-9
const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const generateShortCode = customAlphabet(alphabet, config.shortCodeLength);

/**
 * Validate a URL string
 */
export function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate a custom alias
 */
export function isValidAlias(alias) {
  if (!alias) return { valid: false, reason: 'Alias is required' };

  if (alias.length < config.minAliasLength) {
    return { valid: false, reason: `Alias must be at least ${config.minAliasLength} characters` };
  }

  if (alias.length > config.maxAliasLength) {
    return { valid: false, reason: `Alias must be at most ${config.maxAliasLength} characters` };
  }

  if (!/^[a-zA-Z0-9-]+$/.test(alias)) {
    return { valid: false, reason: 'Alias can only contain letters, numbers, and hyphens' };
  }

  if (config.reservedWords.includes(alias.toLowerCase())) {
    return { valid: false, reason: 'This alias is reserved' };
  }

  return { valid: true };
}
