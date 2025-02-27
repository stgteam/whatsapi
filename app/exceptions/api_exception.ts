import { Exception } from '@adonisjs/core/exceptions'

export default class ApiException extends Exception {
  constructor(
    public message: string,
    public status: number = 400,
    public code: string = 'API_ERROR'
  ) {
    super(message)
    this.name = this.constructor.name
  }
}
