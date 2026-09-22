const API_URL = import.meta.env.VITE_BACKEND_TARGET;

// Callbacks registered by AuthContext so apiFetch can trigger logout on 401.
let _onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { _onUnauthorized = fn; };

export const apiFetch = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: 'include',
    });

    // Skip 401 handling for auth endpoints to avoid infinite loops.
    const isAuthEndpoint = path.startsWith('/api/auth/');
    if (response.status === 401 && !isAuthEndpoint && _onUnauthorized) {
        _onUnauthorized();
    }

    return response;
};