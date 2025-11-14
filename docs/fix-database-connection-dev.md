# Fix Database Connection Error trong Docker Compose Dev

## Vấn đề

Lỗi: `Role "postgres" does not exist` hoặc `password authentication failed for user "postgres"`

**Nguyên nhân:**
- PostgreSQL container đã được tạo với user khác (ví dụ: `nff_user`)
- Nhưng `DATABASE_URL` đang dùng user `postgres`
- Hoặc biến môi trường `POSTGRES_USER` không khớp với user đã tạo trong container

## Giải pháp

### Cách 1: Xóa volume và tạo lại (Khuyến nghị)

```bash
# Dừng containers
docker-compose -f docker-compose.dev.yml down

# Xóa volume PostgreSQL (CẨN THẬN: Mất dữ liệu!)
docker volume rm nff-auto-report_postgres-data-dev

# Hoặc xóa tất cả volumes của dev
docker-compose -f docker-compose.dev.yml down -v

# Khởi động lại với default values
docker-compose -f docker-compose.dev.yml up -d
```

### Cách 2: Sửa .env file (nếu có)

Nếu bạn có file `.env`, đảm bảo các giá trị sau:

```env
POSTGRES_USER=nff_user
POSTGRES_PASSWORD=nff_password
POSTGRES_DB=nff_db
```

### Cách 3: Tạo user mới trong PostgreSQL container

Nếu không muốn xóa dữ liệu:

```bash
# Vào PostgreSQL container
docker exec -it nff-postgres-dev psql -U nff_user -d nff_db

# Tạo user postgres nếu chưa có
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nff_db TO postgres;
ALTER USER postgres WITH SUPERUSER;
\q
```

Sau đó sửa `.env` hoặc set environment variables:
```bash
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=your_password
```

### Cách 4: Kiểm tra user hiện tại trong container

```bash
# Vào PostgreSQL container
docker exec -it nff-postgres-dev psql -U postgres

# Hoặc nếu không được, thử với user khác
docker exec -it nff-postgres-dev psql -U nff_user -d nff_db

# Kiểm tra users
\du

# Xem database
\l
```

## Kiểm tra sau khi fix

```bash
# Kiểm tra containers đang chạy
docker-compose -f docker-compose.dev.yml ps

# Kiểm tra logs
docker-compose -f docker-compose.dev.yml logs nff-api-gateway | grep -i database
docker-compose -f docker-compose.dev.yml logs nff-data-ingestion | grep -i database

# Test connection từ container
docker exec -it nff-api-gateway-dev sh
# Trong container:
echo $DATABASE_URL
```

## Default Values trong docker-compose.dev.yml

Sau khi fix, `docker-compose.dev.yml` sẽ dùng default values:
- `POSTGRES_USER`: `nff_user` (nếu không set trong .env)
- `POSTGRES_PASSWORD`: `nff_password` (nếu không set trong .env)
- `POSTGRES_DB`: `nff_db` (nếu không set trong .env)

## Lưu ý

1. **Volume persistence**: Nếu PostgreSQL container đã được tạo trước đó, user và database đã được khởi tạo. Khi thay đổi `POSTGRES_USER`, cần xóa volume để tạo lại.

2. **Environment variables**: Docker Compose sẽ ưu tiên:
   - Environment variables từ shell
   - File `.env` trong thư mục root
   - Default values trong docker-compose.yml

3. **Development vs Production**: 
   - Dev: Dùng default values (`nff_user`, `nff_password`, `nff_db`)
   - Production: Nên set explicit values trong `.env` file

