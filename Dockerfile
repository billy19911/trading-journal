# 1. Frontend Build
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. Production Web Server (Nginx + PHP 8.4 FPM)
FROM php:8.4-fpm-alpine

# Install system dependencies & PostgreSQL PHP driver
RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-dev \
    libzip-dev \
    icu-dev \
    git \
    unzip \
    && docker-php-ext-install \
    pdo_pgsql \
    pgsql \
    intl \
    zip \
    bcmath \
    opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy Backend
COPY backend/composer*.json ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY backend/ ./
RUN composer dump-autoload --optimize

# Copy built frontend assets to Nginx static folder
COPY --from=frontend-builder /app/dist /var/www/frontend

# Configure Nginx & Supervisord
COPY deploy/nginx.conf /etc/nginx/http.d/default.conf
COPY deploy/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
