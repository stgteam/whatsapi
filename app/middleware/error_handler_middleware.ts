import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'

export default class ErrorHandlerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      await next()
    } catch (error) {
      logger.error('Request error:', error)

      // Handle specific error types
      if (error.code === 'E_ROW_NOT_FOUND') {
        return ctx.response.status(404).send({
          error: 'Resource not found',
          message: error.message,
        })
      }

      // Handle validation errors
      if (error.code === 'E_VALIDATION_ERROR') {
        return ctx.response.status(422).send({
          error: 'Validation error',
          message: error.message,
          errors: error.messages || {},
        })
      }

      // Default error handling
      const status = error.status || 500
      const message = status === 500 ? 'Internal server error' : error.message

      return ctx.response.status(status).send({
        error: message,
      })
    }
  }
}
