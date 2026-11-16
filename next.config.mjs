/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // 现在有服务端 API（账号 / 存档 / 游客限制），不再是纯静态导出。
  // 以后做 Tauri 套壳时，可以让 Tauri 起这个 Next 服务，或另做桌面端接口层。
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    unoptimized: true,
  },
  // 生产环境资源用相对前缀，避免打包后写死 localhost / 根路径
  assetPrefix: isProd ? './' : undefined,
  reactStrictMode: false,
  experimental: {
    // better-sqlite3 是原生模块，不参与打包
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
