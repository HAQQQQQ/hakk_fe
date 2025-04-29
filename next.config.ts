import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactStrictMode: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	webpack(config) {
		config.resolve.fallback = {
			fs: false,
			path: false,
			os: false,
		};
		return config;
	},
};

export default nextConfig;
