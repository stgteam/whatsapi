export interface MessageServiceContract {
  send(messageId: string): Promise<any>
}
