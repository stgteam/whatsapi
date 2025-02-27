import { inject } from '@adonisjs/core'
import emitter from '@adonisjs/core/services/emitter'
import WebhookService from '#services/webhook_service'
import logger from '@adonisjs/core/services/logger'
import { DeviceEventsList } from '#events/device_event'

@inject()
export default class DeviceStatusListener {
  constructor(protected webhookService: WebhookService) {
    emitter.on('device:status:updated', this.onDeviceStatusUpdated.bind(this))
  }

  async onDeviceStatusUpdated({
    deviceId,
    status,
    message,
  }: DeviceEventsList['device:status:updated']) {
    try {
      await this.webhookService.deviceStatusUpdated(deviceId, status, message)
    } catch (error) {
      logger.error('Failed to send webhook for device status update:', error)
    }
  }
}
