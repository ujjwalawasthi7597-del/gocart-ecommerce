/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const DEFAULT_FALLBACK_IMAGE = '/images/hero_gocart_lifestyle_1791788713972.jpg';

/**
 * Normalizes an image path so that both legacy `/src/assets/images/...` paths
 * and production `/images/...` paths resolve correctly in dev and production deployments.
 */
export function getCleanImageUrl(url?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return DEFAULT_FALLBACK_IMAGE;
  }

  const trimmed = url.trim();

  // Handle legacy /src/assets/images/... paths
  if (trimmed.startsWith('/src/assets/images/')) {
    return trimmed.replace('/src/assets/images/', '/images/');
  }

  if (trimmed.startsWith('src/assets/images/')) {
    return '/' + trimmed.replace('src/assets/images/', 'images/');
  }

  // Already an absolute URL, data uri, or root path
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed}`;
}

/**
 * Fallback event handler for <img> elements to gracefully handle any 404 or network error
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = DEFAULT_FALLBACK_IMAGE
) {
  const target = e.currentTarget;
  if (target.dataset.fallbackApplied === 'true') {
    // Already fell back once; avoid infinite error loop
    return;
  }
  target.dataset.fallbackApplied = 'true';
  target.src = fallbackSrc;
}
