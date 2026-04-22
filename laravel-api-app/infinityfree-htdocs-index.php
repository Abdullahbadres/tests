<?php

/**
 * Copy this file's contents to public_html/htdocs/index.php on InfinityFree
 * when your layout is: /htdocs/index.php and /htdocs/laravel-app/ (vendor, app, bootstrap, …)
 *
 * Not the layout: /htdocs/index.php with /laravel-app/ beside htdocs (folder above).
 * For a sibling layout, change '/laravel-app/' to '/../laravel-app/' on each path line.
 */

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// ——— Adjust: APP_KEY must be valid (from `php artisan key:generate`) ———
putenv('APP_NAME=AI Sales Page Generator API');
putenv('APP_ENV=production');
putenv('APP_DEBUG=true'); // temporarily true to surface errors; set false after things work
putenv('APP_KEY=base64:REPLACE_WITH_APP_KEY_FROM_ARTISAN_KEY_GENERATE');
putenv('APP_URL=https://aisalesgen.gt.tc');

putenv('LOG_CHANNEL=stack');
putenv('LOG_LEVEL=debug'); // temporarily debug; set error after things work

putenv('DB_CONNECTION=mysql');
putenv('DB_HOST=sql100.infinityfree.com');
putenv('DB_PORT=3306');
putenv('DB_DATABASE=if0_41719118_test');
putenv('DB_USERNAME=if0_41719118');
putenv('DB_PASSWORD=YOUR_DATABASE_PASSWORD');

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

// Laravel path: laravel-app folder lives in the same directory as this index.php (htdocs)
$laravelBase = __DIR__.'/laravel-app';

if (file_exists($maintenance = $laravelBase.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $laravelBase.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once $laravelBase.'/bootstrap/app.php';

$app->handleRequest(Request::capture());
