FROM php:8.3-cli

WORKDIR /var/www/html

# System dependencies + PHP extensions needed by Laravel (Postgres, mbstring, etc.)
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql mbstring bcmath pcntl zip \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy source code
COPY . .

# Install PHP dependencies (no dev for production)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Ensure Laravel writable dirs exist
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 10000

# Render provides $PORT at runtime
CMD sh -c "php artisan config:clear && php artisan route:clear && php artisan view:clear && php artisan serve --host=0.0.0.0 --port=${PORT:-10000}"
