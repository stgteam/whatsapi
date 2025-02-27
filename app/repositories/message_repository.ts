import { inject } from '@adonisjs/core'
import Message from '#models/message'
import type { MessageStatus } from '#types/status'
import type { AnyMessageContent } from 'baileys'

@inject()
export default class MessageRepository {
  async findById(id: string): Promise<Message | null> {
    return await Message.find(id)
  }

  async findByIdOrFail(id: string): Promise<Message> {
    return await Message.findOrFail(id)
  }

  async updateStatus(id: string, status: MessageStatus): Promise<Message> {
    const message = await this.findByIdOrFail(id)
    message.status = status
    await message.save()
    return message
  }

  async create(data: {
    deviceId: string
    projectId: string
    to: string
    body: AnyMessageContent
    type: string
  }): Promise<Message> {
    const message = new Message()
    message.device_id = data.deviceId
    message.project_id = data.projectId
    message.to = data.to
    message.body = data.body
    message.type = data.type
    message.status = 'pending'
    await message.save()
    return message
  }

  async findPendingByDeviceId(deviceId: string, limit: number = 10): Promise<Message[]> {
    return Message.query()
      .where('device_id', deviceId)
      .where('status', 'pending')
      .orderBy('created_at', 'asc')
      .limit(limit)
  }
}
