import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import type { DeviceServiceContract } from '#contracts/device_service_contract'
import DeviceRepository from '#repositories/device_repository'
import vine from '@vinejs/vine'

@inject()
export default class CreateSessionsController {
  constructor(
    protected deviceService: DeviceServiceContract,
    protected deviceRepository: DeviceRepository
  ) {}

  async handle({ request, response }: HttpContext) {
    try {
      // Validate request
      const schema = vine.object({
        deviceId: vine.string().trim(),
      })

      const { deviceId } = await vine.validate({
        schema,
        data: request.all(),
      })

      const device = await this.deviceRepository.findByIdOrFail(deviceId)

      const pairingCode = await this.deviceService.createSessionForDevice(device)

      return response.status(201).send({
        message: 'Session created successfully',
        data: {
          pairingCode,
        },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).send({ error: 'Device not found' })
      }

      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).send({
          error: 'Validation failed',
          messages: error.messages,
        })
      }

      return response.status(400).send({ error: error.message })
    }
  }
}
