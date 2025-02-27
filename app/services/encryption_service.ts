import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import env from '#start/env'

export default class EncryptionService {
  private readonly algorithm: string = 'aes-256-cbc'
  private readonly key: Buffer

  constructor() {
    // Get encryption key from environment or generate one
    const keyString = env.get('ENCRYPTION_KEY', '')
    this.key = Buffer.from(keyString, 'hex')
  }

  encrypt(text: string): { iv: string; content: string } {
    const iv = randomBytes(16)
    const cipher = createCipheriv(this.algorithm, this.key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return {
      iv: iv.toString('hex'),
      content: encrypted,
    }
  }

  decrypt(iv: string, content: string): string {
    const decipher = createDecipheriv(this.algorithm, this.key, Buffer.from(iv, 'hex'))

    let decrypted = decipher.update(content, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
}
