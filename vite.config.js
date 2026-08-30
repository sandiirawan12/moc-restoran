import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

// Bypass Laravel Vite Plugin HMR check when running Vitest in CI environments
process.env.LARAVEL_BYPASS_ENV_CHECK = '1';

function vercelPreparePlugin() {
    return {
        name: 'vercel-prepare-plugin',
        closeBundle() {
            try {
                const rootDir = process.cwd();
                const publicDir = path.join(rootDir, 'public');
                const distDir = path.join(rootDir, 'dist');

                if (fs.existsSync(publicDir)) {
                    fs.cpSync(publicDir, distDir, { recursive: true });
                } else {
                    fs.mkdirSync(distDir, { recursive: true });
                }

                const manifestPath = path.join(publicDir, 'build', 'manifest.json');
                let cssFile = '';
                let jsFile = '';

                if (fs.existsSync(manifestPath)) {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                    if (manifest['resources/css/app.css']) {
                        cssFile = '/build/' + manifest['resources/css/app.css'].file;
                    }
                    if (manifest['resources/js/app.jsx']) {
                        jsFile = '/build/' + manifest['resources/js/app.jsx'].file;
                    }
                }

                const htmlContent = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MOC Restoran — Dashboard Antrean & Meja Interaktif</title>
    <meta name="description" content="Sistem Manajemen Antrean dan Denah Meja Restoran Real-time Interaktif dengan Algoritma Prioritas Party Terbesar.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    ${cssFile ? `<link rel="stylesheet" href="${cssFile}">` : ''}
</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen selection:bg-blue-600 selection:text-white">
    <div id="app"></div>
    ${jsFile ? `<script type="module" src="${jsFile}"></script>` : ''}
</body>
</html>
`;
                fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent, 'utf-8');
            } catch (err) {
                console.error('Vercel plugin error:', err);
            }
        }
    };
}

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
        vercelPreparePlugin(),
    ],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: './resources/js/setupTests.js',
    },
});


