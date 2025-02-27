// app/services/connection_manager.ts
import { inject } from '@adonisjs/core'
import type { ConnectionState } from 'baileys'
import { WASocket } from 'baileys'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { ConnectionServiceContract } from '#contracts/connection_service_contract'

@inject()
export default class ConnectionService implements ConnectionServiceContract {
  private static connections: Map<string, WASocket> = new Map()
  private static connectionStates: Map<string, ConnectionState> = new Map()
  private readonly maxConnections: number
  private lastActivityMap: any

  constructor() {
    this.maxConnections = Number(env.get('MAX_WHATSAPP_CONNECTIONS', 100))
  }

  getAllConnections(): Map<string, WASocket> {
    return new Map(ConnectionService.connections)
  }

  getConnection(deviceId: string): WASocket | undefined {
    return ConnectionService.connections.get(deviceId)
  }

  setConnection(deviceId: string, socket: WASocket): void {
    // If max connections reached, evict the oldest connection
    if (
      ConnectionService.connections.size >= this.maxConnections &&
      !ConnectionService.connections.has(deviceId)
    ) {
      const oldestDeviceId = this.findLeastRecentlyUsedDevice()
      if (oldestDeviceId) {
        this.terminateConnection(oldestDeviceId).catch((error) => {
          logger.error(`Failed to terminate old connection for device ${oldestDeviceId}:`, error)
        })
      }
    }

    ConnectionService.connections.set(deviceId, socket)
  }

  removeConnection(deviceId: string): void {
    ConnectionService.connections.delete(deviceId)
    ConnectionService.connectionStates.delete(deviceId)
  }

  getConnectionState(deviceId: string): ConnectionState | undefined {
    return ConnectionService.connectionStates.get(deviceId)
  }

  setConnectionState(deviceId: string, state: Partial<ConnectionState>): void {
    const currentState = ConnectionService.connectionStates.get(deviceId) || {}
    ConnectionService.connectionStates.set(deviceId, <ConnectionState>{
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
    // Implementation with tracking of last activity timestamp
    let oldestDevice: string | undefined
    let oldestTimestamp = Infinity

    // Using a separate Map to track last activity times
    for (const [deviceId, lastActivity] of this.lastActivityMap.entries()) {
      if (lastActivity < oldestTimestamp) {
        oldestTimestamp = lastActivity
        oldestDevice = deviceId
      }
    }

    return oldestDevice
  }
}
