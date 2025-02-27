export interface WebhookServiceContract {
  deviceStatusUpdated(deviceId: string, status: string, message?: string): Promise<boolean>

  messageStatusUpdated(messageId: string, status: string, reason?: string): Promise<boolean>
}
