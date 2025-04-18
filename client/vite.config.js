import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		proxy: {
			// any /api/* goes to your Express backend in dev
			'/api': 'http://localhost:3080',
			'/images': 'http://localhost:3080',
		},
	},
});
