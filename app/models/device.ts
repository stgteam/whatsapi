import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { ConnectionStatus, SessionData } from '#types/status'
import { removePlusSign } from '#helpers/phone_formatter'

export default class Device extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare uid: string

  @column()
  declare name: string

  @column({
    consume: (value: string) => removePlusSign(value),
  })
  declare phone: string

  @column()
  declare pairing_code: string | undefined

  @column({
    prepare: (value: SessionData) => JSON.stringify(value),
    consume: (value: string): SessionData => (value ? JSON.parse(value) : {}),
  })
  declare session_data: SessionData

  @column()
  declare status: ConnectionStatus

  @column.dateTime()
  declare last_checked_at: DateTime

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime
}
