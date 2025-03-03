import { ApplicationService } from '@adonisjs/core/types'
import type { ConnectionServiceContract } from '#contracts/connection_service_contract'
import DeviceStatusListener from '#listeners/device_status_listener'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {}

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {
    await this.app.container.make(DeviceStatusListener)
  }

  /**
   * Preparing to shut down the app
   */
  async shutdown() {
    try {
      // Try to get the connection service from the container
      if (this.app.container.hasBinding('ConnectionServiceContract')) {
        const connectionService: ConnectionServiceContract = await this.app.container.make(
          'ConnectionServiceContract'
        )

        // Get all active connections
        const connections = connectionService.getAllConnections()

        if (connections.size > 0) {
          console.log('Terminating active WhatsApp connections')

          // Terminate all connections
          const promises = Array.from(connections.keys()).map((deviceId) =>
            connectionService.terminateConnection(deviceId)
          )

          await Promise.allSettled(promises)
        }
      }
    } catch (error) {
      console.error('Error shutting down WhatsApp connections:', error)
    }

    try {
      // Get the listener instance from the container
      if (this.app.container.hasBinding(DeviceStatusListener)) {
        const listener = await this.app.container.make(DeviceStatusListener)

        // Call the cleanup method
        if (typeof listener.cleanup === 'function') {
          listener.cleanup()
        }
      }

      // Rest of shutdown code...
    } catch (error) {
      console.error('Error during shutdown:', error)
    }
  }
}
