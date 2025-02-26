import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { AnyMessageContent } from 'baileys'
import type { MessageStatus } from '#types/status'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare device_id: string

  @column()
  declare project_id: string

  @column()
  declare to: string

  @column()
  declare body: AnyMessageContent

  @column()
  declare type: string

  @column()
  declare status: MessageStatus

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}
