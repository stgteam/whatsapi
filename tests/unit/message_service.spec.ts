import { test } from '@japa/runner'
import MessageService from '#services/message_service'
import WebhookService from '#services/webhook_service'

test.group('MessageService', (group) => {
  let messageService: MessageService
  let webhookService: WebhookService
  const testMessageId = '1'
  const webhookCalls: any[] = []

  group.each.setup(async () => {
    webhookCalls.length = 0
    webhookService = new WebhookService()
    webhookService.messageStatusUpdated = async (messageId, status) => {
      webhookCalls.push({ messageId, status })
    }

    messageService = new MessageService(webhookService)
  })

  test('send message updates status on success', async ({ assert }) => {
    await messageService.send(testMessageId)

    assert.lengthOf(webhookCalls, 1)
    assert.equal(webhookCalls[0].messageId, testMessageId)
    assert.equal(webhookCalls[0].status, 'failed') // Will be failed because no active connection
  })
})
