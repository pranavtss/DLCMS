/**
 * API Utility Functions for authenticated requests
 */

const API_BASE_URL = "http://localhost:5000"

/**
 * Get authorization headers with JWT token
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken")
  return {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
  }
}

/**
 * Make an authenticated API request
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Handle unauthorized (token expired/invalid)
    if (response.status === 401 || response.status === 403) {
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
