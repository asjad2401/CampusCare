// Server-safe HTML sanitization (no DOM dependency)
// Strips all tags except a safe whitelist

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'u']
const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href'],
}

export function sanitizeHtml(dirty: string): string {
  // Remove script tags and event handlers completely
  let clean = dirty
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')

  // Strip disallowed tags
  clean = clean.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    const lowerTag = tag.toLowerCase()
    if (ALLOWED_TAGS.includes(lowerTag)) {
      // For allowed tags, strip disallowed attributes
      const allowedAttrs = ALLOWED_ATTRS[lowerTag] || []
      if (allowedAttrs.length === 0) return `<${lowerTag}>`
      // Keep only allowed attributes
      let cleaned = `<${lowerTag}`
      for (const attr of allowedAttrs) {
        const attrMatch = match.match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i'))
        if (attrMatch) {
          // Validate href (no javascript:)
          if (attr === 'href' && attrMatch[1].toLowerCase().startsWith('javascript')) continue
          cleaned += ` ${attr}="${attrMatch[1]}"`
        }
      }
      cleaned += '>'
      return cleaned
    }
    return '' // Strip disallowed tags
  })

  return clean.trim()
}

export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}
