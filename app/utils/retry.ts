export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries: number
    delay: number
    backoff?: number
    onRetry?: (attempt: number, error: Error) => void
  }
): Promise<T> {
  const { retries, delay, backoff = 2, onRetry } = options

  let lastError: Error = new Error('Unknown error')

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (onRetry) {
        onRetry(attempt, error)
      }

      if (attempt < retries) {
        const nextDelay = delay * Math.pow(backoff, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, nextDelay))
      }
    }
  }

  throw lastError
}
