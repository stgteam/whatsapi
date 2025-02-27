import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import DeviceService from '#services/device_service'
import database from '@adonisjs/lucid/services/db'

@inject()
export default class HealthController {
  constructor(protected deviceService: DeviceService) {}

  async check({ response }: HttpContext) {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
      },
    }

    try {
      await database.from('devices').first()
    } catch (error) {
      health.services.database = 'unhealthy'
      health.status = 'degraded'
    }

    const statusCode = health.status === 'healthy' ? 200 : 503
    return response.status(statusCode).send(health)
  }
}
