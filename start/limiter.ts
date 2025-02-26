import limiter from '@adonisjs/limiter/services/main'

/**
 * Throttle middleware for API endpoints
 */
export const apiThrottle = limiter.define('api', () => {
  return limiter.allowRequests(60).every('1 minute').blockFor('5 minute')
})
