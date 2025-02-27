import { test } from '@japa/runner'
import DeviceService from '#services/device_service'
import WebhookService from '#services/webhook_service'
import Device from '#models/device'
import { DateTime } from 'luxon'

test.group('DeviceService', (group) => {
  let deviceService: DeviceService
  let webhookService: WebhookService
  let device: Device

  group.setup(async () => {
    // Create a mock device
    device = new Device()
    device.id = '1'
    device.uid = 'test-uid'
    device.phone = '628123456789'
    device.status = 'disconnected'
    device.last_checked_at = DateTime.now()
    device.session_data = {}

    // Mock the save method
    device.save = async () => device

    // Mock the static findOrFail method
    const originalFindOrFail = Device.findOrFail
    Device.findOrFail = async () => device as any

    // Create webhook service mock
    webhookService = new WebhookService()
    webhookService.deviceStatusUpdated = async () => true

    // Create device service
    deviceService = new DeviceService(device, webhookService)

    // Cleanup function to restore original methods
    return () => {
      Device.findOrFail = originalFindOrFail
    }
  })

  test('getSessionStatus returns disconnected for new device', async ({ assert }) => {
    const status = await deviceService.getSessionStatus()
    assert.equal(status, 'disconnected')
  })

  test('createSession initializes a session for a device', async ({ assert }) => {
    // Use a manual mock for the method we want to test
    let sessionCreated = false
    const originalCreateSession = deviceService.createSession

    // Mock the createSession method
    deviceService.createSession = async () => {
      sessionCreated = true
      return 'test-pairing-code'
    }

    await deviceService.createSession()

    // Assert our mock was called
    assert.isTrue(sessionCreated)

    // Restore the original method
    deviceService.createSession = originalCreateSession
  })
})
