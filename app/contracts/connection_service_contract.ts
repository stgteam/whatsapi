import type { ConnectionState } from 'baileys'
import { WASocket } from 'baileys'

export interface ConnectionServiceContract {
  getAllConnections(): Map<string, WASocket>

  getConnection(deviceId: string): WASocket | undefined

  setConnection(deviceId: string, socket: WASocket): void

  removeConnection(deviceId: string): void

  getConnectionState(deviceId: string): ConnectionState | undefined

  setConnectionState(deviceId: string, state: Partial<ConnectionState>): void

  terminateConnection(deviceId: string): Promise<void>
}
