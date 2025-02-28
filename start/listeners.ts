// In start/listeners.ts
import DeviceStatusListener from '#listeners/device_status_listener'
import { ApplicationService } from '@adonisjs/core/types'

export default async (app: ApplicationService) => {
  await app.container.make(DeviceStatusListener)
}
