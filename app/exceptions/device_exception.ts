import ApiException from '#exceptions/api_exception'

export default class DeviceException extends ApiException {
  constructor(message: string, status: number = 400) {
    super(message, status, 'DEVICE_ERROR')
  }

  static notFound(phone: string): DeviceException {
    return new DeviceException(`Device with phone number ${phone} not found`, 404)
  }

  static connectionFailed(message: string): DeviceException {
    return new DeviceException(`Connection failed: ${message}`, 503)
  }
}
