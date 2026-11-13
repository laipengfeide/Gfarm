// 场景图加载探测：失败时给出可见占位并在控制台明确输出缺失路径
const cache = new Map<string, boolean>();

export function reportMissing(src: string) {
  // eslint-disable-next-line no-console
  console.warn(`[晚风小院] 场景图加载失败，缺失文件：${src}（请确认 public/${src} 是否存在、文件名大小写是否一致）`);
}

/** 探测一张图能否加载；结果缓存，避免重复请求 */
export function probeImage(src: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(true);
  const hit = cache.get(src);
  if (hit !== undefined) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { cache.set(src, true); resolve(true); };
    img.onerror = () => { cache.set(src, false); reportMissing(src); resolve(false); };
    img.src = src;
  });
}

export function markImageOk(src: string) {
  cache.set(src, true);
}
