import { AuthenticationCreds } from 'baileys'

/**
 * Status of WhatsApp connection
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'banned'

/**
 * Type mapping for connection events
 */
export type ConnectionEventType = {
  'connection.open': { status: 'connected' }
  'connection.close': { status: 'disconnected' }
  'connection.connecting': { status: 'connecting' }
}

/**
 * Mapping of session data
 */
export interface SessionData {
  creds?: AuthenticationCreds
  keys?: {
    [key: string]: any
  }
}

/**
 * Mapping of key data
 */
export interface KeyData {
  [key: string]: any
}

/**
 * Status of a WhatsApp message
 */
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'received'

/**
 * Type mapping for message events
 */
export type MessageEventType = {
  'message.received': { status: 'received' }
  'message.sent': { status: 'sent' }
  'message.delivered': { status: 'delivered' }
  'message.read': { status: 'read' }
  'message.failed': { status: 'failed' }
}
