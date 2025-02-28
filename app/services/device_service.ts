import { inject } from '@adonisjs/core'
import { Boom } from '@hapi/boom'
import {
  ConnectionState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  initAuthCreds,
  makeWASocket,
  SignalDataSet,
  SignalDataTypeMap,
  WASocket,
} from 'baileys'
import logger from '@adonisjs/core/services/logger'
import Device from '#models/device'
import type { DeviceServiceContract } from '#contracts/device_service_contract'
import { KeyData, SessionData } from '#types/status'
import WebhookService from '#services/webhook_service'
import ConnectionService from '#services/connection_service'

@inject()
export default class DeviceService implements DeviceServiceContract {
  constructor(
    protected webhookService: WebhookService,
    protected connectionService: ConnectionService
  ) {}

  async getSessionStatus(device: Device): Promise<string> {
    try {
      if (!device.session_data) return 'disconnected'

      const state = this.connectionService.getConnectionState(device.uid)

      if (!state) return 'disconnected'
      if (state.connection === 'open') return 'connected'
      if (state.connection === 'connecting') return 'connecting'

      return 'disconnected'
    } catch (error) {
      logger.error('Error getting session status:', error)
      return 'disconnected'
    }
  }

  async createSession(device: Device): Promise<string> {
    try {
      const { version } = await fetchLatestBaileysVersion()

      // Clean up existing connection
      await this.connectionService.terminateConnection(device.uid)

      const { state, saveCreds } = await this.getState(device)

      const sock = makeWASocket({
        version: version,
        auth: state,
        printQRInTerminal: false,
        markOnlineOnConnect: false,
      })

      this.connectionService.setConnection(device.uid, sock)

      if (!sock.authState.creds.registered) {
        await this.webhookService.deviceStatusUpdated(
          device.id,
          'connecting',
          'Pairing code requested'
        )
      }

      sock.ev.on('creds.update', async () => {
        await saveCreds()
      })

      sock.ev.on(
        'connection.update',
        async (update) => await this.handleConnectionUpdate(update, device)
      )

      return await sock.requestPairingCode(device.phone)
    } catch (error) {
      logger.error('Failed to create WhatsApp connection:', error)
      throw new Error(`Failed to create WhatsApp connection: ${error.message}`)
    }
  }

  async terminateSession(device: Device): Promise<void> {
    try {
      await this.connectionService.terminateConnection(device.uid)
      await this.webhookService.deviceStatusUpdated(device.id, 'disconnected')
    } catch (error) {
      logger.error('Failed to delete WhatsApp session:', error)
      throw new Error(`Failed to delete WhatsApp session: ${error.message}`)
    }
  }

  getActiveConnection(device: Device): WASocket | undefined {
    return this.connectionService.getConnection(device.uid)
  }

  async handleConnectionUpdate(update: Partial<ConnectionState>, device: Device): Promise<void> {
    try {
      const { connection, lastDisconnect } = update

      if (update) {
        this.connectionService.setConnectionState(device.uid, update)
      }

      // Map connection state to device status
      let status = 'connecting'
      if (connection === 'open') status = 'connected'
      if (connection === 'close') status = 'disconnected'

      // Notify webhook about status change
      await this.webhookService.deviceStatusUpdated(device.id, status)

      if (connection === 'close' && lastDisconnect?.error) {
        // Ensure lastDisconnect exists and has an error
        const boomError = lastDisconnect.error as Boom
        const statusCode = boomError?.output?.statusCode

        if (statusCode) {
          // Handle banned status
          if (statusCode === DisconnectReason.loggedOut) {
            await this.webhookService.deviceStatusUpdated(device.id, 'banned')
            return
          }

          // Attempt reconnection for other cases
          if (statusCode !== DisconnectReason.restartRequired) {
            await this.createSession(device)
          }
        }
      }
    } catch (error) {
      logger.error('Failed to handle connection update:', error)
    }
  }

  private async getState(device: Device) {
    try {
      const sessionData: SessionData = device.session_data || {}
      const creds = sessionData.creds || initAuthCreds()

      return {
        state: {
          creds,
          keys: {
            get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
              try {
                const keys: KeyData = device.session_data?.keys || {}
                const data: { [key: string]: SignalDataTypeMap[T] } = {}

                for (const id of ids) {
                  const key = `${type}-${id}`
                  let value = keys[key]

                  if (type === 'app-state-sync-key' && value) {
                    value = { ...value }
                  }

                  if (value) {
                    data[id] = value as SignalDataTypeMap[T]
                  }
                }

                return data
              } catch (error) {
                logger.error('Error getting auth keys:', error)
                return {}
              }
            },
            set: async (data: Partial<SignalDataSet>) => {
              try {
                const keys: KeyData = sessionData.keys || {}
                const keyTypes = Object.keys(data) as Array<keyof SignalDataSet>

                for (const type of keyTypes) {
                  const categoryData = data[type]
                  if (categoryData) {
                    Object.entries(categoryData).forEach(([id, value]) => {
                      const key = `${type}-${id}`
                      if (value) {
                        keys[key] = value
                      } else {
                        delete keys[key]
                      }
                    })
                  }
                }

                sessionData.keys = keys
                device.session_data = sessionData
                await device.save()
              } catch (error) {
                logger.error('Error setting auth keys:', error)
              }
            },
          },
        },
        saveCreds: async () => {
          try {
            sessionData.creds = creds
            device.session_data = sessionData
            device.pairing_code = sessionData.creds?.pairingCode
            await device.save()
          } catch (error) {
            logger.error('Error saving credentials:', error)
          }
        },
      }
    } catch (error) {
      logger.error('Error initializing auth state:', error)
      throw error
    }
  }
}
