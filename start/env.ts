/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  // Redis and rate limiter configuration
  LIMITER_STORE: Env.schema.enum(['redis', 'database', 'memory'] as const),
  REDIS_HOST: Env.schema.string(),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),

  // Whatsapp specific config
  MAX_WHATSAPP_CONNECTIONS: Env.schema.number.optional(),
  WHATSAPP_CONNECTION_TIMEOUT: Env.schema.number.optional(),
  WHATSAPP_RECONNECT_INTERVAL: Env.schema.number.optional(),
  WHATSAPP_AUTO_RECONNECT: Env.schema.boolean.optional(),

  // API security
  API_KEY: Env.schema.string(),
  API_RATE_LIMIT: Env.schema.number.optional(),
  API_RATE_LIMIT_WINDOW: Env.schema.string.optional(),

  // Webhook config
  WEBHOOK_URL: Env.schema.string.optional(),
  WEBHOOK_SECRET_KEY: Env.schema.string.optional(),
  WEBHOOK_RETRY_COUNT: Env.schema.number.optional(),
  WEBHOOK_RETRY_DELAY: Env.schema.number.optional(),

  // Encryption key for encrypting sensitive data
  ENCRYPTION_KEY: Env.schema.string(),
})
