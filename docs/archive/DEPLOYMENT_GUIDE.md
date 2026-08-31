# دليل النشر والتشغيل على خادم الإنتاج (Production Deployment Guide)
# نظام إدارة محل الأصيل للمنظفات

هذا الدليل مخصص لشرح خطوات تثبيت ونشر نظام **"الأصيل للمنظفات"** على خادم إنتاج حقيقي (VPS / Cloud Server / Dedicated Server) يعمل بنظام Ubuntu Linux أو Windows Server.

---

## 1. متطلبات الخادم الأساسية (System Requirements)

- **نظام التشغيل:** Ubuntu 22.04 LTS / 24.04 LTS (أو Windows Server 2019/2022)
- **معالج الخادم:** 2 Cores فما فوق
- **الذاكرة العشوائية (RAM):** 2 GB كحد أدنى (4 GB مستحسن)
- **مساحة التخزين:** 20 GB SSD
- **خادم الويب:** Nginx (مستحسن) أو Apache2
- **إصدار PHP:** PHP 8.2 أو PHP 8.3 مع الامتدادات التالية:
  - `php8.2-fpm`, `php8.2-mysql`, `php8.2-mbstring`, `php8.2-xml`, `php8.2-curl`, `php8.2-zip`, `php8.2-bcmath`, `php8.2-intl`
- **محرك قاعدة البيانات:** MySQL 8.0+ أو MariaDB 10.11+
- **إصدار Node.js:** Node.js 18 LTS أو 20 LTS مع مدير الحزم `npm`
- **مدير حزم PHP:** Composer 2.x

---

## 2. تثبيت الحزم والمتطلبات على Ubuntu

```bash
# تحديث المستودعات
sudo apt update && sudo apt upgrade -y

# تثبيت Nginx و MySQL و Git و Unzip
sudo apt install -y nginx mysql-server git unzip curl

# تثبيت PHP 8.2 وامتداداتها
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath php8.2-intl

# تثبيت Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# تثبيت Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 3. إعداد قاعدة البيانات (MySQL Setup)

```sql
-- تسجيل الدخول كـ root
sudo mysql

-- إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE store_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'alaseel_user'@'localhost' IDENTIFIED BY 'Strong_Password_Here_123!';
GRANT ALL PRIVILEGES ON store_pos.* TO 'alaseel_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 4. إعداد وتهيئة الـ Backend (Laravel)

```bash
# الانتقال لمجلد المشروع
cd /var/www/alaseel/backend

# تثبيت حزم الاعتماديات دون حزم التطوير
composer install --no-dev --optimize-autoloader

# نسخ وإعداد ملف البيئة
cp .env.example .env
nano .env
```

### ضبط إعدادات `.env` في الإنتاج:
```ini
APP_NAME="Al-Aseel Cleaning Supplies"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://alaseel-pos.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=store_pos
DB_USERNAME=alaseel_user
DB_PASSWORD=Strong_Password_Here_123!

FRONTEND_URL=https://alaseel-pos.com
SANCTUM_STATEFUL_DOMAINS=alaseel-pos.com
```

```bash
# توليد مفتاح التشفير
php artisan key:generate

# تشغيل الـ Migrations والبيانات الأولية
php artisan migrate --force --seed

# تحسين أداء Laravel للإنتاج
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ضبط الصلاحيات لمجلدات التخزين
sudo chown -R www-data:www-data /var/www/alaseel/backend/storage /var/www/alaseel/backend/bootstrap/cache
sudo chmod -R 775 /var/www/alaseel/backend/storage /var/www/alaseel/backend/bootstrap/cache
```

---

## 5. بناء وتهيئة الواجهة الأمامية (Frontend Build)

```bash
cd /var/www/alaseel/frontend

# ضبط عنوان الـ API للإنتاج
nano .env
# VITE_API_URL=https://alaseel-pos.com/api

# تثبيت الحزم وبناء المشروع
npm ci
npm run build
```

ستتولد الملفات المجمعة داخل مجلد `/var/www/alaseel/frontend/dist`.

---

## 6. إعداد خادم الويب Nginx مع شهادة SSL

قم بإنشاء ملف إعداد Nginx في `/etc/nginx/sites-available/alaseel`:

```nginx
server {
    listen 80;
    server_name alaseel-pos.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name alaseel-pos.com;

    ssl_certificate /etc/letsencrypt/live/alaseel-pos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alaseel-pos.com/privkey.pem;

    # مسار الواجهة الأمامية مبنية
    root /var/www/alaseel/frontend/dist;
    index index.html;

    # توجيه مسارات واجهة React
    location / {
        try_files $uri $uri/ /index.html;
    }

    # توجيه طلبات API للـ Laravel Backend
    location /api {
        alias /var/www/alaseel/backend/public;
        try_files $uri $uri/ @laravel;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_param SCRIPT_FILENAME /var/www/alaseel/backend/public/index.php;
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/index.php?/$1 last;
    }

    # الحماية والأمان
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
# تفعيل الموقع وإعادة تشغيل Nginx
sudo ln -s /etc/nginx/sites-available/alaseel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. النسخ الاحتياطي التلقائي (Automated Backups via Cron)

لجدولة نسخ احتياطي لقاعدة البيانات يومياً في الساعة 2:00 صباحاً:

```bash
crontab -e
```
أضف السطر التالي:
```bash
0 2 * * * mysqldump -u alaseel_user -p'Strong_Password_Here_123!' store_pos > /var/backups/store_pos_$(date +\%F).sql
```

---

## 8. بيانات الدخول الافتراضية للمحل

- **مدير المحل (Admin):**
  - البريد: `admin@alaseel.local`
  - كلمة المرور: `password` (يُنصح بتغييرها فور النشر)
- **كاشير المحل (Cashier):**
  - البريد: `cashier@alaseel.local`
  - كلمة المرور: `password`
