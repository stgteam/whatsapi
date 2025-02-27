import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import type { DeviceServiceContract } from '#contracts/device_service_contract'

@inject()
export default class TerminateSessionsController {
  constructor(protected deviceService: DeviceServiceContract) {}

  async handle({ request, response }: HttpContext) {
    try {
      const deviceId = request.input('deviceId')

      // Call terminate session directly with the deviceId
      await this.deviceService.terminateSession(deviceId)

      return response.send({ message: 'Session terminated successfully' })
    } catch (error) {
      return response.status(400).send({ error: error.message })
    }
  }
}
