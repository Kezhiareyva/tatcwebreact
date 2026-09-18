const API_URL = import.meta.env.VITE_BACKEND_TARGET;

export const apiFetch = (path, options = {}) => {
    return fetch(`${API_URL}${path}`, {
        ...options,
        credentials: 'include',
    });
};