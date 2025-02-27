// app/services/connection_manager.ts
import { inject } from '@adonisjs/core'
import type { ConnectionState } from 'baileys'
import { WASocket } from 'baileys'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { ConnectionServiceContract } from '#contracts/connection_service_contract'

@inject()
export default class ConnectionManager implements ConnectionServiceContract {
  private static connections: Map<string, WASocket> = new Map()
  private static connectionStates: Map<string, ConnectionState> = new Map()
  private readonly maxConnections: number

  constructor() {
    this.maxConnections = Number(env.get('MAX_WHATSAPP_CONNECTIONS', 100))
  }

  getAllConnections(): Map<string, WASocket> {
    return new Map(ConnectionManager.connections)
  }

  getConnection(deviceId: string): WASocket | undefined {
    return ConnectionManager.connections.get(deviceId)
  }

  setConnection(deviceId: string, socket: WASocket): void {
    // If max connections reached, evict the oldest connection
    if (
      ConnectionManager.connections.size >= this.maxConnections &&
      !ConnectionManager.connections.has(deviceId)
    ) {
      const oldestDeviceId = this.findLeastRecentlyUsedDevice()
      if (oldestDeviceId) {
        this.terminateConnection(oldestDeviceId).catch((error) => {
          logger.error(`Failed to terminate old connection for device ${oldestDeviceId}:`, error)
        })
      }
    }

    ConnectionManager.connections.set(deviceId, socket)
  }

  removeConnection(deviceId: string): void {
    ConnectionManager.connections.delete(deviceId)
    ConnectionManager.connectionStates.delete(deviceId)
  }

  getConnectionState(deviceId: string): ConnectionState | undefined {
    return ConnectionManager.connectionStates.get(deviceId)
  }

  setConnectionState(deviceId: string, state: Partial<ConnectionState>): void {
    const currentState = ConnectionManager.connectionStates.get(deviceId) || {}
    ConnectionManager.connectionStates.set(deviceId, <ConnectionState>{
      ...currentState,
      ...state,
    })
  }

  async terminateConnection(deviceId: string): Promise<void> {
    const socket = this.getConnection(deviceId)
    if (socket) {
      try {
        await socket.logout()
        socket.end(new Error('Connection terminated'))
      } catch (error) {
        logger.error(`Error terminating connection for device ${deviceId}:`, error)
      } finally {
        this.removeConnection(deviceId)
      }
    }
  }

  private findLeastRecentlyUsedDevice(): string | undefined {
    // This implementation simply takes the first device in the connection map
    // In a real-world scenario. You would track last activity timestamps for each connection
    const [firstDevice] = ConnectionManager.connections.keys()

    return firstDevice
  }
}
