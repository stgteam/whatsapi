export interface DeviceEventsList {
  'device:status:updated': {
    deviceId: string
    status: string
    message?: string
  }
}

declare module '@adonisjs/core/types' {
  interface EventsList extends DeviceEventsList {}
}
