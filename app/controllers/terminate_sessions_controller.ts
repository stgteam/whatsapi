import type { HttpContext } from '@adonisjs/core/http'
import SessionService from '#services/session_service'
import { inject } from '@adonisjs/core'

@inject()
export default class TerminateSessionsController {
  constructor(protected sessionService: SessionService) {}

  async handle({ request, response }: HttpContext) {
    try {
      const { deviceId } = request.all()
      await this.sessionService.terminateSession(deviceId)
      return response.send({ message: 'Session terminated successfully' })
    } catch (error) {
      return response.status(400).send({ error: error.message })
    }
  }
}
