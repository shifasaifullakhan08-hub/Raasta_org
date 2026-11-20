// services/ssrfProtection.js
// Validates URLs against internal private networks to prevent Server-Side Request Forgery (SSRF)

const ip = require('ip');
const { URL } = require('url');
const dns = require('dns').promises;

/**
 * Validate that a URL is safe to fetch (HTTP/HTTPS only, non-private IP)
 */
async function validateSafeUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Only HTTP and HTTPS protocols are permitted.' };
    }

    const hostname = parsed.hostname;
    // Reject localhost, local domains
    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname === '127.0.0.1' || hostname === '::1') {
      return { safe: false, reason: 'Requests to local host are prohibited.' };
    }

    // Resolve IP address
    const lookup = await dns.lookup(hostname);
    const resolvedIp = lookup.address;

    // Check if private, loopback, or link-local IP
    if (ip.isPrivate(resolvedIp) || ip.isLoopback(resolvedIp) || resolvedIp.startsWith('169.254.') || resolvedIp.startsWith('fc00:')) {
      return { safe: false, reason: 'Destination IP resolves to a private or restricted network.' };
    }

    return { safe: true, resolvedIp, parsedUrl: parsed.toString() };
  } catch (err) {
    return { safe: false, reason: `URL resolution error: ${err.message}` };
  }
}

module.exports = { validateSafeUrl };
