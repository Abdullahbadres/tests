<?php

/**
 * Salin isi file INI ke public_html/htdocs/index.php di InfinityFree
 * apabila struktur Anda: /htdocs/index.php dan /htdocs/laravel-app/ (vendor, app, bootstrap, …)
 *
 * Bukan struktur: /htdocs/index.php dengan /laravel-app/ di samping htdocs (folder di atas).
 * Untuk struktur sibling, ganti '/laravel-app/' menjadi '/../laravel-app/' di tiap baris path.
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// ——— Sesuaikan: APP_KEY wajib valid (hasil `php artisan key:generate`) ———
putenv('APP_NAME=AI Sales Page Generator API');
putenv('APP_ENV=production');
putenv('APP_DEBUG=true'); // sementara true untuk melihat error; set false setelah sukses
putenv('APP_KEY=base64:GANTI_DENGAN_APP_KEY_DARI_ARTISAN_KEY_GENERATE');
putenv('APP_URL=https://aisalesgen.gt.tc');

putenv('LOG_CHANNEL=stack');
putenv('LOG_LEVEL=debug'); // sementara debug; set error setelah sukses

putenv('DB_CONNECTION=mysql');
putenv('DB_HOST=sql100.infinityfree.com');
putenv('DB_PORT=3306');
putenv('DB_DATABASE=if0_41719118_test');
putenv('DB_USERNAME=if0_41719118');
putenv('DB_PASSWORD=ISI_PASSWORD_DATABASE_ANDA');

putenv('SESSION_DRIVER=file');
putenv('SESSION_LIFETIME=120');
putenv('SESSION_ENCRYPT=false');
putenv('SESSION_PATH=/');
putenv('SESSION_DOMAIN=');

putenv('QUEUE_CONNECTION=sync');
putenv('CACHE_STORE=file');
putenv('FILESYSTEM_DISK=local');

putenv('FRONTEND_URL=');
putenv('SANCTUM_STATEFUL_DOMAINS=');

putenv('OPENAI_API_KEY=');
putenv('OPENAI_MODEL=gpt-4o');
putenv('OPENAI_MAX_TOKENS=4000');

// Path Laravel: folder laravel-app ada DI DALAM folder yang sama dengan index.php (htdocs)
$laravelBase = __DIR__.'/laravel-app';

if (file_exists($maintenance = $laravelBase.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $laravelBase.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $laravelBase.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
