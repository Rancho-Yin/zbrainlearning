const API = 'https://www.zbrain.cn/api';
const TOKEN_KEY = 'auth_token';

async function readResult(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function login(username, password) {
  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const result = await readResult(response);

  if (!response.ok || !result.success || !result.token) {
    throw new Error(result.message || '登录失败，请检查账号和密码。');
  }

  localStorage.setItem(TOKEN_KEY, result.token);
  return result.user;
}

export async function register(username, password) {
  const response = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const result = await readResult(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || '注册失败，请稍后重试。');
  }

  if (result.token) {
    localStorage.setItem(TOKEN_KEY, result.token);
    return result.user;
  }

  return login(username, password);
}

export async function getCurrentUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const response = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  const result = await readResult(response);
  if (!response.ok || !result.success) {
    throw new Error(result.message || '暂时无法验证登录状态。');
  }

  return result.user;
}

export async function logout() {
  const token = localStorage.getItem(TOKEN_KEY);

  try {
    if (token) {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // Local logout must still succeed if the remote service is unavailable.
  } finally {
    localStorage.removeItem(TOKEN_KEY);
  }
}
