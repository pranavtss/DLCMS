/**
 * API Utility Functions for authenticated requests
 */

export const API_BASE_URL = "https://dlcms-g6hp.onrender.com"

const normalizeUrl = (value) => {
  const path = String(value || "").trim()
  if (!path) return null

  if (/^https\/\//i.test(path)) return path.replace(/^https\/\//i, "https://")
  if (/^http\/\//i.test(path)) return path.replace(/^http\/\//i, "http://")
  if (/^\/\//.test(path)) return `https:${path}`

  return path
}

export const getImageUrl = (path) => {
  const normalizedPath = normalizeUrl(path)
  if (!normalizedPath) return null

  if (normalizedPath.startsWith("blob:") || normalizedPath.startsWith("data:")) {
    return normalizedPath
  }

  if (!normalizedPath.startsWith("http")) {
    return `${API_BASE_URL}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`
  }

  try {
    const parsedUrl = new URL(normalizedPath)
    if (parsedUrl.pathname.startsWith("/uploads/")) {
      return `${API_BASE_URL}${parsedUrl.pathname}`
    }
  } catch {
    return normalizedPath
  }

  return normalizedPath
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
      localStorage.removeItem("userIsMasterAdmin")
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
  localStorage.removeItem("userIsMasterAdmin")
  window.location.replace("/login")
}
