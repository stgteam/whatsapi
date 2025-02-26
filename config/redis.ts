import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

export default defineConfig({
  connection: 'main',

  connections: {
    /*
    |--------------------------------------------------------------------------
    | Main connection
    |--------------------------------------------------------------------------
    |
    | Main connection is used for rate limiting. You can use a different Redis
    | database if you want to separate rate limiting data from other Redis data.
    |
    */
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD'),
      db: 0, // You can change this to use a different database number
      keyPrefix: '', // Optional prefix for all keys
      retryStrategy(times) {
        return Math.min(times * 50, 2000)
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Rate limiter connection
    |--------------------------------------------------------------------------
    |
    | Dedicated connection for rate limiting if you want to separate it.
    | Uncomment and modify if you want to use a separate Redis database
    | for rate limiting.
    |
    */
    // limiter: {
    //   host: env.get('REDIS_HOST'),
    //   port: env.get('REDIS_PORT'),
    //   password: env.get('REDIS_PASSWORD'),
    //   db: 1, // Using a different database number
    //   keyPrefix: 'limiter:',
    //   retryStrategy(times) {
    //     return Math.min(times * 50, 2000)
    //   }
    // }
  },
})
