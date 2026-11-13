/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // 纯静态导出：产出 out/ 目录，可直接交给 Tauri 作为前端资源
  output: 'export',
  trailingSlash: true,
  images: {
    // 静态导出环境没有 Next 图片服务，全部走原生 img
    unoptimized: true,
  },
  // 生产环境资源用相对前缀，避免打包后写死 localhost / 根路径
  assetPrefix: isProd ? './' : undefined,
  reactStrictMode: false,
};

export default nextConfig;
