import Device from '#models/device'
import type { ConnectionState } from 'baileys'
import { WASocket } from 'baileys'

export interface DeviceServiceContract {
  getSessionStatus(device: Device): Promise<string>

  createSession(device: Device): Promise<string>

  terminateSession(device: Device): Promise<void>

  getActiveConnection(device: Device): WASocket | undefined

  handleConnectionUpdate(update: Partial<ConnectionState>, device: Device): Promise<void>
}
