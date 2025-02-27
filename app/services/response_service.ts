import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ResponseService {
  success<T>(ctx: HttpContext, data: T, message: string = 'Success', statusCode: number = 200) {
    return ctx.response.status(statusCode).send({
      success: true,
      message,
      data,
    })
  }

  error(ctx: HttpContext, message: string, statusCode: number = 400, error?: any) {
    const response = {
      success: false,
      message,
      errors: {},
    }

    if (error) {
      response['errors'] = error
    }

    return ctx.response.status(statusCode).send(response)
  }
}
