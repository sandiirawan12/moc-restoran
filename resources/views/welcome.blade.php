<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>MOC Restoran — Dashboard Antrean & Meja Interaktif</title>
    <meta name="description" content="Sistem Manajemen Antrean dan Denah Meja Restoran Real-time Interaktif dengan Algoritma Prioritas Party Terbesar.">

    <!-- Google Fonts: Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
    <div id="app"></div>
</body>
</html>
