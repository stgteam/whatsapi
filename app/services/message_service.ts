// app/services/message_service.ts
import { inject } from '@adonisjs/core'
import type { MessageServiceContract } from '#contracts/message_service_contract'
import logger from '@adonisjs/core/services/logger'
import DeviceRepository from '#repositories/device_repository'
import MessageRepository from '#repositories/message_repository'
import { retry } from '#utils/retry'
import env from '#start/env'
import DeviceService from '#services/device_service'
import WebhookService from '#services/webhook_service'

@inject()
export default class MessageService implements MessageServiceContract {
  constructor(
    private deviceService: DeviceService,
    private webhookService: WebhookService,
    private deviceRepository: DeviceRepository,
    private messageRepository: MessageRepository
  ) {}

  async send(messageId: string) {
    try {
      const message = await this.messageRepository.findByIdOrFail(messageId)
      const device = await this.deviceRepository.findByIdOrFail(message.device_id)

      const sock = this.deviceService.getActiveConnection(device.uid)

      if (!sock) {
        logger.warn(`No active connection for device ${device.id}`)
        await this.webhookService.messageStatusUpdated(messageId, 'failed', 'No active connection')
        throw new Error('No active WhatsApp connection')
      }

      try {
        // Use retry for sending messages
        const result = await retry(
          async () => {
            return await sock.sendMessage(message.to, message.body)
          },
          {
            retries: env.get('MESSAGE_RETRY_COUNT', 3),
            delay: env.get('MESSAGE_RETRY_DELAY', 1000),
            backoff: 1.5,
            onRetry: (attempt, error) => {
              logger.warn(`Retry ${attempt} to send message ${messageId}:`, error)
            },
          }
        )

        if (result) {
          logger.info(`Message ${messageId} sent successfully`)
          await this.webhookService.messageStatusUpdated(message.id, 'sent')

          // Update message status in database
          await this.messageRepository.updateStatus(message.id, 'sent')

          return result
        } else {
          logger.error(`Failed to send message ${messageId}: empty result`)
          await this.webhookService.messageStatusUpdated(
            message.id,
            'failed',
            'Send returned empty result'
          )
          throw new Error('Failed to send message: empty result')
        }
      } catch (error) {
        logger.error(`Failed to send message ${messageId} after multiple retries:`, error)
        await this.webhookService.messageStatusUpdated(message.id, 'failed', error.message)
        await this.messageRepository.updateStatus(message.id, 'failed')
        throw error
      }
    } catch (error) {
      logger.error('Failed to send WhatsApp message:', error)
      await this.webhookService.messageStatusUpdated(messageId, 'failed', error.message)
      throw new Error(`Failed to send WhatsApp message: ${error.message}`)
    }
  }
}
