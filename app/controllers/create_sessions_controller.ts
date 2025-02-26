import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Device from '#models/device'
import DeviceService from '#services/device_service'
import WebhookService from '#services/webhook_service'

@inject()
export default class CreateSessionsController {
  constructor(protected webhookService: WebhookService) {}

  async handle({ request, response }: HttpContext) {
    try {
      const deviceId = request.input('deviceId')
      const device: Device = await Device.findOrFail(deviceId)
      const deviceService = new DeviceService(device, this.webhookService)

      if (!device) return response.status(404).send({ error: 'Device not found' })

      await deviceService.createSession()
      return response.status(201).send({ message: 'Session created successfully' })
    } catch (error) {
      return response.status(400).send({ error: error.message })
    }
  }
}
