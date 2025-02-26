import { test } from '@japa/runner'
import SessionService from '#services/session_service'
import WebhookService from '#services/webhook_service'

test.group('SessionService', (group) => {
  let sessionService: SessionService
  let webhookService: WebhookService
  const testDeviceId = '1'
  const webhookCalls: any[] = []

  group.each.setup(async () => {
    webhookCalls.length = 0

    webhookService = new WebhookService()
    // Mock webhookService methods
    webhookService.deviceStatusUpdated = async (deviceId, status) => {
      webhookCalls.push({ deviceId, status })
    }

    sessionService = new SessionService(webhookService)
  })

  test('getSessionStatus returns correct status', async ({ assert }) => {
    const status = await sessionService.getSessionStatus(testDeviceId)
    assert.equal(status, 'disconnected')
  })

  test('createSession triggers webhook', async ({ assert }) => {
    await sessionService.createSession(testDeviceId)

    assert.lengthOf(webhookCalls, 1)
    assert.equal(webhookCalls[0].deviceId, testDeviceId)
    assert.equal(webhookCalls[0].status, 'pairing-code-generated')
  })
})
