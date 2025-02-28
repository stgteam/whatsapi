import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import MessageService from '#services/message_service'

@inject()
export default class SendMessagesController {
  constructor(protected messageService: MessageService) {}

  async handle({ request, response }: HttpContext) {
    try {
      const schema = vine.object({
        messageId: vine.string().trim(),
      })

      const { messageId } = await vine.validate({
        schema,
        data: request.all(),
      })

      await this.messageService.send(messageId)
      return response.status(200).send({ message: 'Message sent successfully' })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).send({
          error: 'Validation failed',
          messages: error.messages,
        })
      }
      throw error
    }
  }
}
