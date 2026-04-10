#!/usr/bin/env bash
# deploy.sh — Build & deploy pos-medicine-web trực tiếp trên server
# Yêu cầu: Docker đã cài, file web/.env tồn tại với VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
# Cách dùng: ./deploy.sh

set -euo pipefail

CONTAINER_NAME="pos-medicine-web-container"
IMAGE_NAME="pos-medicine-web-image"
ENV_FILE="web/.env"
PORT="${PORT:-3001}"

CREDENTIALS_ENV="/home/thuongtd/credentials/.env.pos-medicine"

# ─── Copy .env từ credentials ─────────────────────────────────────────────────
if [[ ! -f "$CREDENTIALS_ENV" ]]; then
  echo "Lỗi: Không tìm thấy $CREDENTIALS_ENV"
  exit 1
fi
cp "$CREDENTIALS_ENV" "$ENV_FILE"

# ─── Kiểm tra file .env ───────────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Lỗi: Không tìm thấy $ENV_FILE"
  echo "Tạo file dựa trên web/.env.example rồi điền giá trị thực."
  exit 1
fi

# Load biến môi trường từ .env
# shellcheck disable=SC2046
export $(grep -v '^#' "$ENV_FILE" | xargs)

if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_ANON_KEY:-}" ]]; then
  echo "Lỗi: VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY chưa được đặt trong $ENV_FILE"
  exit 1
fi

echo "▶ Build Docker image..."
docker build \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  -t "$IMAGE_NAME:latest" \
  ./web

echo "▶ Dừng container cũ (nếu có)..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm   "$CONTAINER_NAME" 2>/dev/null || true

echo "▶ Khởi động container mới..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "$PORT:80" \
  "$IMAGE_NAME:latest"

echo "▶ Dọn dẹp image cũ (dangling)..."
docker image prune -f

echo "✓ Deploy xong"
