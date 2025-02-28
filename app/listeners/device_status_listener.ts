import { inject } from '@adonisjs/core'
import emitter from '@adonisjs/core/services/emitter'
import WebhookService from '#services/webhook_service'
import logger from '@adonisjs/core/services/logger'
import { DeviceEventsList } from '#events/device_event'

@inject()
export default class DeviceStatusListener {
  private boundHandler: (data: DeviceEventsList['device:status:updated']) => Promise<void>

  constructor(protected webhookService: WebhookService) {
    // Create and store the bound function reference
    this.boundHandler = this.onDeviceStatusUpdated.bind(this)

    // Register the event listener with the stored reference
    emitter.on('device:status:updated', this.boundHandler)

    // Log that the listener has been registered (helpful for debugging)
    logger.debug('DeviceStatusListener: Registered device:status:updated event handler')
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

  cleanup() {
    // Remove the event listener using the stored reference
    emitter.off('device:status:updated', this.boundHandler)
    logger.debug('DeviceStatusListener: Unregistered device:status:updated event handler')
  }
}
