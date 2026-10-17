// @ts-check

import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// When kylersison.com is connected, add:  site: 'https://kylersison.com',
	vite: {
		plugins: [tailwindcss()],
	},
});
