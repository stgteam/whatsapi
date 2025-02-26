import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import MessageService from '#services/message_service'

@inject()
export default class SendMessagesController {
  constructor(protected messageService: MessageService) {}

  async handle({ request, response }: HttpContext) {
    try {
      const { messageId } = request.all()
      await this.messageService.send(messageId)
      return response.status(200).send({ message: 'Message sent successfully' })
    } catch (error) {
      return response.status(400).send({ error: error.message })
    }
  }
}
