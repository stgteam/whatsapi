import Device from '#models/device'
import type { ConnectionState } from 'baileys'
import { WASocket } from 'baileys'

export interface DeviceServiceContract {
  getSessionStatus(deviceId: string): Promise<string>

  createSessionForDevice(device: Device): Promise<string>

  createSession(device: Device): Promise<string>

  terminateSession(deviceId: string): Promise<void>

  getActiveConnection(deviceId: string): WASocket | undefined

  handleConnectionUpdate(update: Partial<ConnectionState>, device: Device): Promise<void>
}
