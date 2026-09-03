const COVER_ASSETS = [
  'assets/covers/ai-showroom.png',
  'assets/covers/digital-media-education.png',
  'assets/covers/partner-training.png',
];

function isWebUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function isDirectMediaUrl(value) {
  if (!isWebUrl(value)) return false;
  try {
    return /\.(mp4|m4v|webm|ogg|ogv|m3u8)(?:$|[?#])/i.test(new URL(value).pathname + new URL(value).search);
  } catch {
    return false;
  }
}

export function normalizeSyncedVideos(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item?.title && isWebUrl(item?.url)).map((item) => ({
    id: item.id ? String(item.id).slice(0, 160) : `shared-video-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: String(item.title).slice(0, 160),
    url: String(item.url),
    category: String(item.category || '产品介绍').slice(0, 100),
    summary: String(item.summary || '产品视频介绍。').slice(0, 500),
    cover: COVER_ASSETS.includes(item.cover) ? item.cover : COVER_ASSETS[2],
    createdAt: /^\d{4}-\d{2}-\d{2}$/.test(item.createdAt || '') ? item.createdAt : '',
    isCustom: true,
  }));
}

export function applyOrdering(items, ordering = []) {
  if (!Array.isArray(items) || !Array.isArray(ordering) || !ordering.length) return items;
  const positions = new Map(ordering.map((id, index) => [String(id), index]));
  return items
    .map((item, index) => ({ item, index, position: positions.has(String(item.id)) ? positions.get(String(item.id)) : ordering.length + index }))
    .sort((left, right) => left.position - right.position || left.index - right.index)
    .map(({ item }) => item);
}
