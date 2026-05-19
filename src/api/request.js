import axios from 'axios'
import { ElMessage } from 'element-plus'
import { API_BASE_URL, API_TIMEOUT, SUCCESS_CODES } from './config'
import { getToken, removeToken } from './token'

const service = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
})

service.interceptors.request.use(
  (config) => {
    const token = getToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

service.interceptors.response.use(
  (response) => {
    const data = response.data

    if (!data || data.code === undefined || SUCCESS_CODES.includes(data.code)) {
      return data
    }

    const message = data.message || data.msg || '请求失败'
    showError(message, response.config)

    return Promise.reject(createRequestError(message, response))
  },
  (error) => {
    const status = error.response?.status
    const message = getErrorMessage(error)

    if (status === 401) {
      removeToken()
    }

    showError(message, error.config)

    return Promise.reject(error)
  },
)

function showError(message, config = {}) {
  if (config.showErrorMessage === false) return

  ElMessage.error(message)
}

function createRequestError(message, response) {
  const error = new Error(message)
  error.response = response
  error.data = response.data

  return error
}

function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.data?.msg) return error.response.data.msg

  const status = error.response?.status
  const statusMap = {
    400: '请求参数错误',
    401: '登录状态已过期',
    403: '没有访问权限',
    404: '请求地址不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂不可用',
    504: '网关超时',
  }

  if (statusMap[status]) return statusMap[status]
  if (error.code === 'ECONNABORTED') return '请求超时'

  return error.message || '网络异常'
}

export default service
