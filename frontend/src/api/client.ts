import axios, { AxiosError } from 'axios'
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import axiosRetry from 'axios-retry'
import { logger } from '../utils/logger'
import type { ApiError } from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const REQUEST_TIMEOUT = 10000 // 10 seconds
const MAX_RETRIES = 3

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Configure retry logic
  axiosRetry(client, {
    retries: MAX_RETRIES,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error: AxiosError) => {
      // Retry on network errors or 5xx server errors
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (error.response?.status !== undefined && error.response.status >= 500)
      )
    },
    onRetry: (retryCount, _error, requestConfig) => {
      const requestId =
        (requestConfig as InternalAxiosRequestConfig & { requestId?: string })
          .requestId || 'unknown'
      logger.warn(`Retrying request (attempt ${retryCount}/${MAX_RETRIES})`, {
        requestId,
        url: requestConfig.url,
        method: requestConfig.method,
      })
    },
  })

  // Request interceptor - add request ID and logging
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const requestId = generateRequestId()
      const configWithId = config as InternalAxiosRequestConfig & {
        requestId: string
        requestStartTime: number
      }

      configWithId.requestId = requestId
      configWithId.requestStartTime = Date.now()

      // Add request ID to headers
      configWithId.headers.set('X-Request-ID', requestId)

      logger.logRequest(
        requestId,
        configWithId.method || 'GET',
        configWithId.url || ''
      )

      return configWithId
    },
    (error: AxiosError) => {
      logger.error('Request interceptor error', { error: error.message })
      return Promise.reject(error)
    }
  )

  // Response interceptor - log responses and handle errors
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const config = response.config as InternalAxiosRequestConfig & {
        requestId?: string
        requestStartTime?: number
      }
      const requestId = config.requestId || 'unknown'
      const duration = config.requestStartTime
        ? Date.now() - config.requestStartTime
        : 0

      logger.logResponse(
        requestId,
        config.method || 'GET',
        config.url || '',
        response.status,
        duration
      )

      return response
    },
    (error: AxiosError) => {
      const config = error.config as
        | (InternalAxiosRequestConfig & {
            requestId?: string
            requestStartTime?: number
          })
        | undefined
      const requestId = config?.requestId || 'unknown'

      logger.logError(
        requestId,
        config?.method || 'GET',
        config?.url || '',
        error
      )

      // Transform axios error to our custom ApiError
      const apiError: ApiError = {
        message: error.message || 'An unknown error occurred',
        status: error.response?.status,
        code: error.code,
      }

      if (error.response?.data) {
        const data = error.response.data as { message?: string }
        apiError.message = data.message || apiError.message
      }

      return Promise.reject(apiError)
    }
  )

  return client
}

export const apiClient = createApiClient()
