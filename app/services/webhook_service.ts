import { inject } from '@adonisjs/core'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { createHmac } from 'node:crypto'
import { DateTime } from 'luxon'
import { WebhookServiceContract } from '#contracts/webhook_service_contract'
import { retry } from '#utils/retry'

@inject()
export default class WebhookService implements WebhookServiceContract {
  private readonly url: string
  private readonly secretKey: string
  private readonly retryCount: number
  private readonly retryDelay: number

  constructor() {
    this.url = env.get('WEBHOOK_URL', '')
    this.secretKey = env.get('WEBHOOK_SECRET_KEY', '')
    this.retryCount = env.get('WEBHOOK_RETRY_COUNT', 3)
    this.retryDelay = env.get('WEBHOOK_RETRY_DELAY', 2000)
  }

  async deviceStatusUpdated(deviceId: string, status: string, message?: string): Promise<boolean> {
    const payload = {
      event: 'device_status_updated',
      device_id: deviceId,
      status: status,
      message: message,
      timestamp: DateTime.now().toISO(),
    }

    return this.sendWebhook(payload)
  }

  async messageStatusUpdated(messageId: string, status: string, reason?: string): Promise<boolean> {
    const payload = {
      event: 'message_status_updated',
      message_id: messageId,
      status: status,
      reason: reason,
      timestamp: DateTime.now().toISO(),
    }

    return this.sendWebhook(payload)
  }

  private async sendWebhook(payload: any): Promise<boolean> {
    if (!this.url) {
      logger.warn('Webhook URL not configured, skipping notification')
      return false
    }

    try {
      return await retry(
        async () => {
          const timestamp = Math.floor(Date.now() / 1000).toString()
          const signature = this.generateSignature(timestamp, JSON.stringify(payload))

          const response = await fetch(this.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signature,
              'X-Webhook-Timestamp': timestamp,
            },
            body: JSON.stringify(payload),
          })

          if (!response.ok) {
            throw new Error(`Webhook request failed with status: ${response.status}`)
          }

          logger.debug('Webhook sent successfully', { event: payload.event })
          return true
        },
        {
          retries: this.retryCount,
          delay: this.retryDelay,
          backoff: 1.5,
          onRetry: (attempt, error) => {
            logger.warn(`Webhook retry attempt ${attempt} failed:`, error)
          },
        }
      )
    } catch (error) {
      logger.error('Failed to send webhook after multiple attempts:', error)
      return false
    }
  }

  private generateSignature(timestamp: string, payload: string): string {
    const hmac = createHmac('sha256', this.secretKey)
    hmac.update(timestamp + payload)
    return hmac.digest('hex')
  }
}
