@echo off
cd /d "%~dp0"
echo Checking PHP extensions (Laravel needs mbstring, openssl, pdo_sqlite)...
php -r "exit(extension_loaded('mbstring') && extension_loaded('openssl') && extension_loaded('pdo_sqlite') ? 0 : 1);"
if errorlevel 1 (
  echo.
  echo ERROR: Required PHP extensions missing. Enable mbstring, openssl, pdo_sqlite in php.ini
  echo WinGet PHP: copy php.ini-development to php.ini in your PHP folder and uncomment those extensions.
  echo Laragon: Menu -^> PHP -^> php.ini -^> enable extension=mbstring
  echo.
  pause
  exit /b 1
)
echo OK. Starting API at http://127.0.0.1:8082
php artisan serve --host=127.0.0.1 --port=8082
