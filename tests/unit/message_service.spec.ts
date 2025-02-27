import { test } from '@japa/runner'
import MessageService from '#services/message_service'
import DeviceService from '#services/device_service'
import WebhookService from '#services/webhook_service'
import Message from '#models/message'
import Device from '#models/device'
import { DateTime } from 'luxon'

test.group('MessageService', (group) => {
  let messageService: MessageService
  let deviceService: DeviceService
  let webhookService: WebhookService

  group.each.setup(async () => {
    // Create mock message
    const message = new Message()
    message.id = '1'
    message.device_id = '1'
    message.to = '628123456789'
    message.body = { text: 'Test message' }
    message.type = 'text'
    message.status = 'pending'
    message.created_at = DateTime.now()
    message.updated_at = DateTime.now()

    // Mock the save method
    message.save = async () => message

    // Properly mock the static findOrFail method
    const originalFindOrFail = Message.findOrFail
    Message.findOrFail = async () => message as any // Using 'any' to bypass the type check

    // Create mock device
    const device = new Device()
    device.id = '1'
    device.uid = 'test-uid'
    device.phone = '628123456789'
    device.status = 'connected'
    device.last_checked_at = DateTime.now()

    // Properly mock the static findOrFail method for Device
    Device.findOrFail = async () => device as any // Using 'any' to bypass the type check

    // Create mock services
    webhookService = new WebhookService()
    webhookService.messageStatusUpdated = async () => true

    deviceService = new DeviceService(device, webhookService)

    // Manual mock for getActiveConnection
    deviceService.getActiveConnection = () => undefined // No active connection

    messageService = new MessageService(webhookService)

    // Cleanup function to restore original methods
    return () => {
      Message.findOrFail = originalFindOrFail
    }
  })

  test('send message throws error when no connection', async ({ assert }) => {
    try {
      await messageService.send('1')
      assert.fail('Expected an error but none was thrown')
    } catch (error) {
      assert.equal(error.message, 'No active WhatsApp connection')
    }
  })
})
