# Panduan Hosting Trading Journey di VPS Sendiri

Hosting sendiri di VPS (Ubuntu 22.04 / 24.04 atau Debian) jauh lebih stabil, bebas batas serverless, dan frontend + backend berada di satu server tanpa masalah CORS.

---

## CARA 1: Docker Compose (Paling Praktis, 1 Perintah)

Semua sudah dikonfigurasi (PostgreSQL 17, PHP 8.4, Nginx, Frontend React, Migrasi otomatis).

### 1. Masuk ke VPS Anda via SSH:
```bash
ssh root@IP_VPS_ANDA
```

### 2. Install Docker & Git (jika belum ada):
```bash
apt update && apt install -y git docker.io docker-compose-plugin
systemctl enable --now docker
```

### 3. Clone Repository:
```bash
git clone https://github.com/billy19911/trading-journal.git /var/www/trading
cd /var/www/trading
```

### 4. Buat environment production:
```bash
cp deploy/.env.production.example deploy/.env.production
nano deploy/.env.production
```
Ganti `APP_KEY`, `APP_URL`, dan `DB_PASSWORD` sebelum expose server ke internet.

Generate key baru dengan PHP lokal atau container:
```bash
docker run --rm -it -v "$PWD/backend:/app" -w /app php:8.4-cli php artisan key:generate --show
```

### 5. Jalankan Container:
```bash
docker compose up -d --build
```

Selesai. Buka browser: `http://IP_VPS_ANDA`.
Aplikasi web langsung hidup bersama backend dan PostgreSQL.

---

## CARA 2: Native Nginx + PHP 8.4 (Tanpa Docker)

Jika VPS Anda sudah terpasang Nginx, PHP 8.4, dan PostgreSQL:

### 1. Install Dependencies:
```bash
add-apt-repository ppa:ondrej/php -y
apt update
apt install -y nginx postgresql php8.4-fpm php8.4-pgsql php8.4-bcmath php8.4-intl php8.4-zip php8.4-mbstring nodejs npm composer
```

### 2. Clone & Build:
```bash
git clone https://github.com/billy19911/trading-journal.git /var/www/trading
cd /var/www/trading

# Build Frontend
cd frontend
npm install
npm run build
cd ..

# Setup Backend
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
# Sesuaikan koneksi DB PostgreSQL di backend/.env
php artisan migrate --force
php artisan config:cache
php artisan route:cache
chown -R www-data:www-data storage bootstrap/cache
```

### 3. Konfigurasi Nginx (`/etc/nginx/sites-available/trading`):
```nginx
server {
    listen 80;
    server_name domain-anda.com; # atau IP VPS

    # Frontend Static
    root /var/www/trading/frontend/dist;
    index index.html;

    client_max_body_size 20m;

    # Backend API Laravel
    location /api {
        alias /var/www/trading/backend/public;
        try_files $uri $uri/ @laravel;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/trading/backend/public/index.php;
        }
    }

    location @laravel {
        rewrite ^/api/(.*)$ /api/index.php?/$1 last;
    }

    # Frontend SPA Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Aktifkan config:
```bash
ln -s /etc/nginx/sites-available/trading /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 4. Pasang SSL Gratis (Certbot):
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d domain-anda.com
```

Domain Anda langsung aktif dengan HTTPS dan API berjalan mulus.
