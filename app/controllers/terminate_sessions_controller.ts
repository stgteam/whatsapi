import type { HttpContext } from '@adonisjs/core/http'
import DeviceService from '#services/device_service'
import { inject } from '@adonisjs/core'
import Device from '#models/device'
import WebhookService from '#services/webhook_service'

@inject()
export default class TerminateSessionsController {
  constructor(protected webhookService: WebhookService) {}

  async handle({ request, response }: HttpContext) {
    try {
      const deviceId = request.input('deviceId')
      const device: Device = await Device.findOrFail(deviceId)
      const deviceService = new DeviceService(device, this.webhookService)

      await deviceService.terminateSession()

      return response.send({ message: 'Session terminated successfully' })
    } catch (error) {
      return response.status(400).send({ error: error.message })
    }
  }
}
