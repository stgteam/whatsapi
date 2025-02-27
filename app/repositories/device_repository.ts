import { inject } from '@adonisjs/core'
import Device from '#models/device'
import type { ConnectionStatus, SessionData } from '#types/status'

@inject()
export default class DeviceRepository {
  async findById(id: string): Promise<Device | null> {
    return await Device.find(id)
  }

  async findByIdOrFail(id: string): Promise<Device> {
    return await Device.findOrFail(id)
  }

  async updateStatus(id: string, status: ConnectionStatus): Promise<Device> {
    const device = await this.findByIdOrFail(id)
    device.status = status
    await device.save()
    return device
  }

  async updateSessionData(id: string, sessionData: SessionData): Promise<Device> {
    const device = await this.findByIdOrFail(id)
    device.session_data = sessionData
    await device.save()
    return device
  }
}
