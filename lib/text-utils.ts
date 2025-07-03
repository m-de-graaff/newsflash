// Utility functions for text processing

/**
 * Strips HTML tags from a string and returns clean text
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  
  // Remove HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  const decoded = withoutTags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…');
  
  // Clean up extra whitespace
  return decoded.replace(/\s+/g, ' ').trim();
}

/**
 * Truncates text to a specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  
  const cleaned = stripHtml(text);
  if (cleaned.length <= maxLength) return cleaned;
  
  return cleaned.substring(0, maxLength).trim() + '...';
}
