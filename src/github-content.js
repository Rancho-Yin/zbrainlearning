const REPOSITORY = 'Rancho-Yin/zbrainlearning';
const BRANCH = 'main';
const CONTENT_PATH = 'public/shared-content.json';
const CONTENT_API = `https://api.github.com/repos/${REPOSITORY}/contents/${CONTENT_PATH}`;
const PUBLISH_TOKEN_KEY = 'zbrainlearning-github-publish-token';

function readJson(response) {
  return response.json().catch(() => ({}));
}

function encodeUtf8Base64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function normalizeContent(value) {
  return {
    version: 1,
    updatedAt: value?.updatedAt || null,
    updatedBy: value?.updatedBy || null,
    presentations: Array.isArray(value?.presentations) ? value.presentations : [],
    recordings: Array.isArray(value?.recordings) ? value.recordings : [],
    ecosystemVideos: Array.isArray(value?.ecosystemVideos) ? value.ecosystemVideos : [],
    ordering: value?.ordering && typeof value.ordering === 'object' ? value.ordering : {},
  };
}

function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function githubError(response, fallback) {
  const result = await readJson(response);
  if (response.status === 401) return 'GitHub 发布令牌无效或已经过期。';
  if (response.status === 403) return 'GitHub 令牌没有此仓库的内容写入权限。';
  if (response.status === 409) return '共享内容刚刚被更新，请刷新页面后重试。';
  return result.message || fallback;
}

export function isSuperAdmin(user) {
  return String(user?.username || '').trim().toLowerCase() === 'yinze1';
}

export function getPublishingToken() {
  return sessionStorage.getItem(PUBLISH_TOKEN_KEY) || '';
}

export function savePublishingToken(token) {
  sessionStorage.setItem(PUBLISH_TOKEN_KEY, token);
}

export function clearPublishingToken() {
  sessionStorage.removeItem(PUBLISH_TOKEN_KEY);
}

export async function loadSharedContent() {
  const response = await fetch(`${import.meta.env.BASE_URL}shared-content.json?updated=${Date.now()}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('暂时无法读取全账号共享内容。');
  return normalizeContent(await readJson(response));
}

export async function validatePublishingToken(token) {
  const response = await fetch(`${CONTENT_API}?ref=${BRANCH}`, {
    headers: githubHeaders(token),
  });
  if (!response.ok) throw new Error(await githubError(response, '无法验证 GitHub 发布令牌。'));
  return true;
}

export async function publishSharedContent(content, token) {
  const currentResponse = await fetch(`${CONTENT_API}?ref=${BRANCH}&updated=${Date.now()}`, {
    headers: githubHeaders(token),
    cache: 'no-store',
  });
  if (!currentResponse.ok) throw new Error(await githubError(currentResponse, '无法读取当前共享内容版本。'));
  const current = await readJson(currentResponse);
  const body = normalizeContent(content);
  const response = await fetch(CONTENT_API, {
    method: 'PUT',
    headers: {
      ...githubHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Publish shared learning content (${body.presentations.length} solutions, ${body.recordings.length} recordings)`,
      content: encodeUtf8Base64(`${JSON.stringify(body, null, 2)}\n`),
      sha: current.sha,
      branch: BRANCH,
    }),
  });
  if (!response.ok) throw new Error(await githubError(response, '共享内容发布失败。'));
  return readJson(response);
}
