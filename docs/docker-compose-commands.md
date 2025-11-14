# Docker Compose Commands - Dev và Production

## Development Mode

### Khởi động services
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Xem logs
```bash
# Xem tất cả logs
docker-compose -f docker-compose.dev.yml logs -f

# Xem logs của service cụ thể
docker-compose -f docker-compose.dev.yml logs -f nff-api-gateway
docker-compose -f docker-compose.dev.yml logs -f nff-data-ingestion
```

### Dừng services
```bash
docker-compose -f docker-compose.dev.yml down
```

### Restart services
```bash
docker-compose -f docker-compose.dev.yml restart
```

### Rebuild và khởi động lại
```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

### Xem status
```bash
docker-compose -f docker-compose.dev.yml ps
```

---

## Production Mode

### Khởi động services
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Xem logs
```bash
# Xem tất cả logs
docker-compose -f docker-compose.production.yml logs -f

# Xem logs của service cụ thể
docker-compose -f docker-compose.production.yml logs -f nff-api-gateway
docker-compose -f docker-compose.production.yml logs -f nff-data-ingestion
```

### Dừng services
```bash
docker-compose -f docker-compose.production.yml down
```

### Restart services
```bash
docker-compose -f docker-compose.production.yml restart
```

### Rebuild và khởi động lại
```bash
docker-compose -f docker-compose.production.yml up -d --build
```

### Xem status
```bash
docker-compose -f docker-compose.production.yml ps
```

---

## Kết nối đến Database Local

Nếu muốn connect containers đến PostgreSQL chạy trên host (không phải container):

### Bước 1: Tìm IP của host
```bash
# Linux
HOST_IP=$(ip addr show docker0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)
echo $HOST_IP
# Hoặc dùng: 172.17.0.1 (default Docker bridge gateway)
```

### Bước 2: Sửa docker-compose.production.yml

Comment out service `postgres` và sửa `DATABASE_URL`:

```yaml
services:
  # Comment out nếu dùng DB local
  # postgres:
  #   ...

  nff-api-gateway:
    environment:
      # Thay đổi từ @postgres:5432 thành @172.17.0.1:5432
      - DATABASE_URL=postgresql://user:password@172.17.0.1:5432/dbname
    # Bỏ depends_on postgres
    # depends_on:
    #   postgres:
```

### Bước 3: Chạy migrations
```bash
# Chạy migrations từ trong container
docker exec -it nff-api-gateway npx prisma migrate deploy

# Hoặc generate Prisma client
docker exec -it nff-api-gateway npx prisma generate
```

Xem chi tiết: **[Database Local Connection Guide](./database-local-connection.md)**

---

## So sánh Dev vs Production

| Tính năng | Development | Production |
|-----------|-------------|------------|
| Hot Reload | ✅ Có | ❌ Không |
| Volume Mounts | ✅ Có | ❌ Không |
| Build Optimization | ❌ Không | ✅ Multi-stage build |
| Image Size | Lớn hơn | Nhỏ hơn |
| Security | Development mode | Production mode |
| Performance | Chậm hơn | Nhanh hơn |

---

## Lệnh thường dùng

### Chuyển từ Dev sang Production
```bash
# Dừng dev
docker-compose -f docker-compose.dev.yml down

# Khởi động production
docker-compose -f docker-compose.production.yml up -d
```

### Chuyển từ Production sang Dev
```bash
# Dừng production
docker-compose -f docker-compose.production.yml down

# Khởi động dev
docker-compose -f docker-compose.dev.yml up -d
```

### Xóa tất cả containers và volumes
```bash
# Dev
docker-compose -f docker-compose.dev.yml down -v

# Production
docker-compose -f docker-compose.production.yml down -v
```

### Xem resource usage
```bash
docker stats
```

### Clean up Docker
```bash
# Xóa containers đã dừng
docker container prune

# Xóa images không dùng
docker image prune -a

# Xóa tất cả (cẩn thận!)
docker system prune -a
```
