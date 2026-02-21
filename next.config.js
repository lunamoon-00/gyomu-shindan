/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    // .env.local の編集で開発サーバーが再起動しないようにする
    if (dev && config.watchOptions) {
      config.watchOptions.ignored = [
        ...(Array.isArray(config.watchOptions.ignored) ? config.watchOptions.ignored : []),
        "**/.env.local",
        "**/.env*.local",
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
