import { inject } from '@adonisjs/core'
import Message from '#models/message'
import Device from '#models/device'
import { WASocket } from 'baileys'
import WebhookService from '#services/webhook_service'
import logger from '@adonisjs/core/services/logger'

@inject()
export default class MessageService {
  private activeConnections: Map<string, WASocket> = new Map()

  constructor(private webhookService: WebhookService) {}

  async send(messageId: string) {
    try {
      const message = await Message.findOrFail(messageId)

      if (message) {
        const device = await Device.findOrFail(message.device_id)
        const sock = this.activeConnections.get(device.id)

        if (!sock) {
          await this.webhookService.messageStatusUpdated(messageId, 'failed')
        } else {
          await sock.sendMessage(message.to, message.body)

          await this.webhookService.messageStatusUpdated(message.id, 'sent')
        }
      }
    } catch (error) {
      logger.error('Failed to send WhatsApp message:', error)
      await this.webhookService.messageStatusUpdated(messageId, 'failed')
      throw new Error(`Failed to send WhatsApp message: ${error.message}`)
    }
  }
}
