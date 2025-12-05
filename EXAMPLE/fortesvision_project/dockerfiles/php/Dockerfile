FROM php:8.2-fpm

# System dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libzip-dev \
        libpng-dev \
        libonig-dev \
        libxml2-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libssl-dev \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        bcmath \
        mbstring \
        exif \
        pcntl \
        intl \
        zip \
        gd

# Redis extension
RUN pecl install redis \
    && docker-php-ext-enable redis

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Custom PHP config
COPY php.ini /usr/local/etc/php/conf.d/zz-custom.ini