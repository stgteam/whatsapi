import { inject } from '@adonisjs/core'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { createHmac } from 'node:crypto'
import { DateTime } from 'luxon'

@inject()
export default class WebhookService {
  private readonly url: string
  private readonly secretKey: string

  constructor() {
    this.url = env.get('WEBHOOK_URL', '')
    this.secretKey = env.get('WEBHOOK_SECRET_KEY', '')
  }

  async deviceStatusUpdated(deviceId: string, status: string, message?: string) {
    const payload = {
      event: 'device_status_updated',
      device_id: deviceId,
      status: status,
      message: message,
      timestamp: DateTime.now().toISO(),
    }

    await this.sendWebhook(payload)
  }

  async messageStatusUpdated(messageId: string, status: string) {
    const payload = {
      event: 'message_status_updated',
      message_id: messageId,
      status: status,
      timestamp: DateTime.now().toISO(),
    }

    await this.sendWebhook(payload)
  }

  private async sendWebhook(payload: any) {
    const maxRetries = 3
    const retryDelay = 2000 // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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

        if (response.ok) return
      } catch (error) {
        logger.error(`Attempt ${attempt} failed to send webhook:`, error)
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        } else {
          logger.error('Max retries reached. Failed to send webhook.')
        }
      }
    }
  }

  private generateSignature(timestamp: string, payload: string): string {
    const hmac = createHmac('sha256', this.secretKey)
    hmac.update(timestamp + payload)
    return hmac.digest('hex')
  }
}
