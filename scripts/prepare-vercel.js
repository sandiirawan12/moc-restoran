import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

console.log('📦 Preparing static output for Vercel deployment...');

// 1. Copy public directory to dist
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, distDir, { recursive: true });
} else {
  fs.mkdirSync(distDir, { recursive: true });
}

// 2. Read manifest.json to get exact hashed bundle paths
const manifestPath = path.join(publicDir, 'build', 'manifest.json');
let cssFile = '';
let jsFile = '';

if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (manifest['resources/css/app.css']) {
      cssFile = '/build/' + manifest['resources/css/app.css'].file;
    }
    if (manifest['resources/js/app.jsx']) {
      jsFile = '/build/' + manifest['resources/js/app.jsx'].file;
    }
  } catch (err) {
    console.warn('⚠️ Could not parse manifest.json:', err.message);
  }
}

// Fallback search if manifest reading failed
if (!jsFile || !cssFile) {
  const assetsDir = path.join(publicDir, 'build', 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const js = files.find(f => f.endsWith('.js'));
    const css = files.find(f => f.endsWith('.css'));
    if (js) jsFile = `/build/assets/${js}`;
    if (css) cssFile = `/build/assets/${css}`;
  }
}

// 3. Generate standalone index.html in dist
const htmlContent = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MOC Restoran — Dashboard Antrean & Meja Interaktif</title>
    <meta name="description" content="Sistem Manajemen Antrean dan Denah Meja Restoran Real-time Interaktif dengan Algoritma Prioritas Party Terbesar.">
    
    <!-- Google Fonts: Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    ${cssFile ? `<link rel="stylesheet" href="${cssFile}">` : ''}
</head>
<body class="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
    <div id="app"></div>
    ${jsFile ? `<script type="module" src="${jsFile}"></script>` : ''}
</body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent, 'utf-8');
console.log('✅ Successfully created dist/ folder and dist/index.html for Vercel deployment!');
