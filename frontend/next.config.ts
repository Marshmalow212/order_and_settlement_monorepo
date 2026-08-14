import type { NextConfig } from "next"

const backendBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api/v1"

const nextConfig: NextConfig = {
	async rewrites() {
		// Proxy all /api/* requests to the backend to avoid CORS in development
		const dest = backendBase.replace(/\/$/, "") + "/:path*"
		return [
			{
				source: "/api/:path*",
				destination: dest,
			},
		]
	},
}

export default nextConfig
