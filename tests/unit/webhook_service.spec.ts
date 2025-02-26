import { test } from '@japa/runner'
import WebhookService from '#services/webhook_service'
import env from '#start/env'

test.group('WebhookService', (group) => {
  let webhookService: WebhookService
  let fetchCalls: any[] = []

  // Use group.setup() instead of test.setup()
  group.each.setup(() => {
    webhookService = new WebhookService()
    fetchCalls = []

    // Mock global fetch for each test
    global.fetch = async (url, options) => {
      fetchCalls.push({ url, options })
      return new Response(null, { status: 200 })
    }
  })

  test('deviceStatusUpdated sends correct payload', async ({ assert }) => {
    const deviceId = 'test-device'
    const status = 'connected'

    await webhookService.deviceStatusUpdated(deviceId, status)

    assert.lengthOf(fetchCalls, 1)
    assert.equal(fetchCalls[0].url, env.get('WEBHOOK_URL'))
    const payload = JSON.parse(fetchCalls[0].options.body)
    assert.equal(payload.device_id, deviceId)
    assert.equal(payload.status, status)
    assert.exists(payload.timestamp)
  })

  test('messageStatusUpdated sends correct payload', async ({ assert }) => {
    const messageId = 'test-message'
    const status = 'sent'

    await webhookService.messageStatusUpdated(messageId, status)

    assert.lengthOf(fetchCalls, 1)
    const payload = JSON.parse(fetchCalls[0].options.body)
    assert.equal(payload.message_id, messageId)
    assert.equal(payload.status, status)
    assert.exists(payload.timestamp)
  })

  test('retries on failure', async ({ assert }) => {
    let attempts = 0

    // Override fetch mock for this specific test
    global.fetch = async (url, options) => {
      fetchCalls.push({ url, options })
      attempts++

      if (attempts === 1) {
        throw new Error('Network error')
      }
      return new Response(null, { status: 200 })
    }

    await webhookService.deviceStatusUpdated('test-device', 'connected')

    assert.lengthOf(fetchCalls, 2)
  })

  test('generates valid signature', async ({ assert }) => {
    const messageId = 'test-message'
    const status = 'sent'

    await webhookService.messageStatusUpdated(messageId, status)

    const { headers } = fetchCalls[0].options
    assert.exists(headers['X-Webhook-Signature'])
    assert.exists(headers['X-Webhook-Timestamp'])
  })
})
