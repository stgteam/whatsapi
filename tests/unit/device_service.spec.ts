import { test } from '@japa/runner'
import DeviceService from '#services/device_service'
import Device from '#models/device'

test.group('DeviceService', () => {
  const deviceId = '1'
  const deviceService = new DeviceService(deviceId)

  test('getAuthState', async ({ assert }) => {
    const authState = await deviceService.getAuthState()
    assert.exists(authState.creds)
    assert.exists(authState.keys)
  })

  test('saveCredentials', async ({ assert }) => {
    const credentials = {
      noiseKey: { private: 'test', public: 'test' },
      pairingEphemeralKeyPair: { private: 'test', public: 'test' },
      advSecretKey: 'test',
      nextPreKeyId: 1,
      firstUnuploadedPreKeyId: 1,
      accountSyncCounter: 0,
      accountSettings: { unarchiveChats: false },
      processedHistoryMessages: [],
      registered: true,
      pairingCode: '123456',
    }

    await deviceService.saveCredentials(credentials)

    const device = await Device.findOrFail(deviceId)

    assert.exists(device.session_data)
    assert.exists(device.last_checked_at)
  })
})
