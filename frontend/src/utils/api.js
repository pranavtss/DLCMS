/**
 * API Utility Functions for authenticated requests
 */

const API_BASE_URL = "https://dlcms-g6hp.onrender.com"

export const getImageUrl = (path) => {
  if (!path) return null

  if (path.startsWith("blob:") || path.startsWith("data:")) {
    return path
  }

  if (!path.startsWith("http")) {
    return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  }

  try {
    const parsedUrl = new URL(path)
    if (parsedUrl.pathname.startsWith("/uploads/")) {
      return `${API_BASE_URL}${parsedUrl.pathname}`
    }
  } catch {
    return path
  }

  return path
}

/**
 * Get authorization headers with JWT token
 */
export const getAuthHeaders = (skipContentType = false) => {
  const token = localStorage.getItem("authToken")
  return {
    ...(skipContentType ? {} : { "Content-Type": "application/json" }),
    ...(token && { "Authorization": `Bearer ${token}` }),
  }
}

/**
 * Make an authenticated API request
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const { _skipHeaders, _noAutoLogout, ...fetchOptions } = options
  
  // For multipart/form-data, let browser set the Content-Type header
  const headers = {
    ...getAuthHeaders(_skipHeaders),
    ...fetchOptions.headers,
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    // Handle unauthorized (token expired/invalid) - but only for protected endpoints
    if ((response.status === 401 || response.status === 403) && !_noAutoLogout) {
      console.warn("Authentication failed. Please login again.")
      localStorage.removeItem("authToken")
      localStorage.removeItem("userId")
      localStorage.removeItem("userName")
      localStorage.removeItem("userRole")
      // Redirect to login if needed
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }

    return response
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error)
    throw error
  }
}

/**
 * Logout user and clear auth data
 */
export const logout = () => {
  localStorage.removeItem("authToken")
  localStorage.removeItem("userId")
  localStorage.removeItem("userName")
  localStorage.removeItem("userRole")
  window.location.href = "/login"
}
