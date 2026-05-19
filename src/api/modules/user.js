import request from '../request'

export const userApi = {
  login(data) {
    return request.post('/auth/login', data, { showErrorMessage: false })
  },

  logout() {
    return request.post('/auth/logout')
  },

  getProfile() {
    return request.get('/user/profile')
  },

  updateProfile(data) {
    return request.put('/user/profile', data)
  },
}
