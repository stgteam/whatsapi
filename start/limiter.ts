import limiter from '@adonisjs/limiter/services/main'

/**
 * Throttle middleware for API endpoints
 */
export const apiThrottle = limiter.define('api', (ctx) => {
  const clientIp = ctx.request.ip()
  const apiKey = ctx.request.header('X-API-Key')

  // Use both IP and API key for rate limiting
  const key = apiKey ? `api:${apiKey}` : `api:ip:${clientIp}`

  // Different limits based on API key presence
  if (apiKey) {
    return limiter
      .allowRequests(120) // Higher limit for authenticated requests
      .every('1 minute')
      .blockFor('5 minute')
      .usingKey(key)
  }

  return limiter
    .allowRequests(60) // Lower limit for unauthenticated requests
    .every('1 minute')
    .blockFor('5 minute')
    .usingKey(key)
})
