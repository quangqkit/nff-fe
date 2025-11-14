# Kết nối Docker Containers đến Database Local

## Vấn đề

Khi chạy `docker-compose.production.yml` nhưng muốn connect đến database PostgreSQL chạy trên host (local), không phải container `postgres`.

## Giải pháp

### Cách 1: Sử dụng `host.docker.internal` (Mac/Windows) hoặc `172.17.0.1` (Linux)

#### Bước 1: Sửa `docker-compose.production.yml`

Comment out service `postgres` và sửa `DATABASE_URL`:

```yaml
services:
  # Comment out postgres service nếu dùng DB local
  # postgres:
  #   image: postgres:15-alpine
  #   ...

  nff-api-gateway:
    # ...
    environment:
      # Trên Linux, dùng 172.17.0.1 hoặc IP của host
      - DATABASE_URL=postgresql://user:password@172.17.0.1:5432/dbname
      # Trên Mac/Windows, dùng host.docker.internal
      # - DATABASE_URL=postgresql://user:password@host.docker.internal:5432/dbname
    # Bỏ depends_on postgres
    # depends_on:
    #   postgres:
    #     condition: service_healthy
```

#### Bước 2: Tìm IP của host (Linux)

```bash
# Cách 1: Dùng IP của docker0 interface
ip addr show docker0 | grep "inet " | awk '{print $2}' | cut -d/ -f1

# Cách 2: Dùng gateway của default network
docker network inspect bridge | grep Gateway

# Cách 3: Dùng 172.17.0.1 (default Docker bridge gateway)
```

#### Bước 3: Đảm bảo PostgreSQL trên host cho phép remote connections

Sửa `/etc/postgresql/15/main/postgresql.conf`:
```conf
listen_addresses = '*'  # hoặc 'localhost,172.17.0.1'
```

Sửa `/etc/postgresql/15/main/pg_hba.conf`:
```
host    all             all             172.17.0.0/16           md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Cách 2: Dùng `network_mode: host` (Linux only)

```yaml
services:
  nff-api-gateway:
    network_mode: host
    environment:
      - DATABASE_URL=postgresql://user:password@localhost:5432/dbname
    # Bỏ ports vì dùng host network
    # ports:
    #   - "3000:3000"
```

**Lưu ý:** Cách này không khuyến khích vì mất tính isolation của Docker.

## Chạy Migrations

Sau khi connect được database, cần chạy Prisma migrations:

### Cách 1: Chạy migrations từ trong container

```bash
# Vào container
docker exec -it nff-api-gateway sh

# Chạy migrations
cd /app
npx prisma migrate deploy

# Hoặc generate Prisma client nếu cần
npx prisma generate
```

### Cách 2: Chạy migrations từ host (nếu có Prisma CLI)

```bash
cd services/nff-api-gateway

# Set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Chạy migrations
npx prisma migrate deploy
```

### Cách 3: Thêm migration vào Dockerfile hoặc entrypoint

Thêm vào `Dockerfile.production` hoặc tạo entrypoint script:

```dockerfile
# Trong Dockerfile.production, sau khi build
RUN npx prisma generate

# Hoặc tạo entrypoint.sh
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
```

`entrypoint.sh`:
```bash
#!/bin/sh
npx prisma migrate deploy
exec node dist/src/main
```

## Kiểm tra kết nối

```bash
# Test từ container đến host database
docker exec -it nff-api-gateway sh
wget -O- "http://172.17.0.1:5432"  # Không work vì PostgreSQL không phải HTTP

# Hoặc dùng psql từ container (nếu có)
docker exec -it nff-api-gateway sh
apk add postgresql-client  # Nếu dùng Alpine
psql $DATABASE_URL -c "SELECT 1;"
```

## Troubleshooting

### Lỗi: "Connection refused"

**Nguyên nhân:** PostgreSQL không cho phép remote connections hoặc firewall block.

**Giải pháp:**
1. Kiểm tra PostgreSQL đang listen trên interface nào:
```bash
sudo netstat -tlnp | grep 5432
```

2. Kiểm tra firewall:
```bash
sudo ufw status
sudo ufw allow 5432/tcp
```

3. Kiểm tra `pg_hba.conf` đã cho phép Docker network chưa.

### Lỗi: "The table 'public.User' does not exist"

**Nguyên nhân:** Chưa chạy migrations.

**Giải pháp:**
```bash
docker exec -it nff-api-gateway npx prisma migrate deploy
```

### Lỗi: "Authentication failed"

**Nguyên nhân:** Username/password sai hoặc user không có quyền.

**Giải pháp:**
1. Kiểm tra credentials trong `DATABASE_URL`
2. Tạo user và database:
```sql
CREATE USER nff_user WITH PASSWORD 'nff_password';
CREATE DATABASE nff_db OWNER nff_user;
GRANT ALL PRIVILEGES ON DATABASE nff_db TO nff_user;
```

## Quick Reference

```bash
# 1. Tìm IP host (Linux)
HOST_IP=$(ip addr show docker0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)
echo $HOST_IP

# 2. Sửa docker-compose.production.yml
# DATABASE_URL=postgresql://user:pass@${HOST_IP}:5432/dbname

# 3. Chạy containers
docker-compose -f docker-compose.production.yml up -d

# 4. Chạy migrations
docker exec -it nff-api-gateway npx prisma migrate deploy

# 5. Kiểm tra logs
docker logs nff-api-gateway
```

