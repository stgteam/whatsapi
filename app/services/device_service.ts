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
import WebhookService from '#services/webhook_service'
import { KeyData, SessionData } from '#types/status'

@inject()
export default class DeviceService {
  private activeConnections: Map<string, WASocket> = new Map()
  private connectionStates: Map<string, ConnectionState> = new Map()

  constructor(
    private device: Device,
    private webhookService: WebhookService
  ) {}

  async getSessionStatus(): Promise<string> {
    if (!this.device.session_data) return 'disconnected'

    const state = this.connectionStates.get(this.device.uid)

    if (!state) return 'disconnected'
    if (state.connection === 'open') return 'connected'
    if (state.connection === 'connecting') return 'connecting'

    return 'disconnected'
  }

  async createSession(): Promise<string> {
    try {
      const { version } = await fetchLatestBaileysVersion()
      // const existingSocket = this.activeConnections.get(this.device.uid)
      // if (existingSocket) {
      //   logger.info('Closing existing connection for device:', this.device.phone)
      //   existingSocket.end(new Error('New connection requested'))
      //   this.activeConnections.delete(this.device.uid)
      // }
      await this.terminateSession()

      const { state, saveCreds } = await this.getState()

      const sock = makeWASocket({
        version: version,
        auth: state,
        printQRInTerminal: false,
        markOnlineOnConnect: false,
      })

      this.activeConnections.set(this.device.uid, sock)

      if (!sock.authState.creds.registered) {
        await this.webhookService.deviceStatusUpdated(
          this.device.id,
          'connecting',
          'Pairing code requested'
        )
      }

      sock.ev.on('creds.update', async () => {
        await saveCreds()
      })

      sock.ev.on('connection.update', async (update) => await this.handleConnectionUpdate(update))

      return await sock.requestPairingCode(this.device.phone)
    } catch (error) {
      logger.error('Failed to create WhatsApp connection:', error)
      throw new Error(`Failed to create WhatsApp connection: ${error.message}`)
    }
  }

  async terminateSession(): Promise<void> {
    try {
      const existingSocket = this.activeConnections.get(this.device.uid)
      if (existingSocket) {
        await existingSocket.logout()
        existingSocket.end(new Error('Connection terminated'))
        this.activeConnections.delete(this.device.uid)
        this.connectionStates.delete(this.device.uid)
      }

      await this.webhookService.deviceStatusUpdated(this.device.id, 'disconnected')
    } catch (error) {
      logger.error('Failed to delete WhatsApp session:', error)
      throw new Error(`Failed to delete WhatsApp session: ${error.message}`)
    }
  }

  private async getState() {
    try {
      const sessionData: SessionData = this.device.session_data || {}
      const creds = sessionData.creds || initAuthCreds()

      return {
        state: {
          creds,
          keys: {
            get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
              try {
                const keys: KeyData = this.device.session_data?.keys || {}
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
                this.device.session_data = sessionData
                await this.device.save()
              } catch (error) {
                logger.error('Error setting auth keys:', error)
              }
            },
          },
        },
        saveCreds: async () => {
          try {
            sessionData.creds = creds
            this.device.session_data = sessionData
            this.device.pairing_code = sessionData.creds?.pairingCode
            await this.device.save()
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

  private async handleConnectionUpdate(update: Partial<ConnectionState>) {
    try {
      const { connection, lastDisconnect } = update

      if (update) {
        this.connectionStates.set(this.device.id, {
          ...(this.connectionStates.get(this.device.id) || {}), // Handle initial state
          ...(update as ConnectionState), // Type assertion since we know it's partial
        })
      }

      // Map connection state to device status
      let status = 'connecting'
      if (connection === 'open') status = 'connected'
      if (connection === 'close') status = 'disconnected'

      // Notify webhook about status change
      await this.webhookService.deviceStatusUpdated(this.device.id, status)

      if (connection === 'close' && lastDisconnect?.error) {
        // Ensure lastDisconnect exists and has an error
        const boomError = lastDisconnect.error as Boom
        const statusCode = boomError?.output?.statusCode

        if (statusCode) {
          // Handle banned status
          if (statusCode === DisconnectReason.loggedOut) {
            await this.webhookService.deviceStatusUpdated(this.device.id, 'banned')
            return
          }

          // Attempt reconnection for other cases
          if (statusCode !== DisconnectReason.restartRequired) {
            await this.createSession()
          }
        }
      }
    } catch (error) {
      logger.error('Failed to handle connection update:', error)
    }
  }
}
