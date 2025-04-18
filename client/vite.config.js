// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			// forward /api/* calls to Express on port 3080
			'/api': {
				target: 'http://localhost:3080',
				changeOrigin: true,
			},
			// forward /images/* calls to Express as well
			'/images': {
				target: 'http://localhost:3080',
				changeOrigin: true,
			},
		},
	},
});
