// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	typescript: {
		ignoreBuildErrors: true,
	},
	webpack(config) {
		// stub out Node-only modules so face-api’s Node bits don’t get bundled
		config.resolve.fallback = {
			fs: false,
			path: false,
			os: false,
		};
		return config;
	},
};

module.exports = nextConfig;
