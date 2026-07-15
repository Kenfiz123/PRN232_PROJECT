export async function handleApiError(error) {
  if (error.response) {
    const { status, data } = error.response
    switch (status) {
      case 400:
        return data.message || 'Yêu cầu không hợp lệ'
      case 401:
        return 'Vui lòng đăng nhập lại'
      case 403:
        return 'Bạn không có quyền thực hiện hành động này'
      case 404:
        return 'Không tìm thấy tài nguyên'
      case 500:
        return 'Lỗi server, vui lòng thử lại sau'
      default:
        return data.message || 'Đã xảy ra lỗi'
    }
  }
  if (error.request) {
    return 'Không thể kết nối đến server'
  }
  return error.message || 'Đã xảy ra lỗi không xác định'
}

export function buildQueryString(params) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value)
    }
  })
  return searchParams.toString()
}

export function parseQueryString(queryString) {
  const params = new URLSearchParams(queryString)
  const result = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}
