import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

export default class ApiAuthMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const apiKey = request.header('X-API-Key')

    if (!apiKey || apiKey !== env.get('API_KEY')) {
      return response.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or missing API key',
      })
    }

    return next()
  }
}
