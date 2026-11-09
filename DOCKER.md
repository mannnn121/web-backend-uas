# Build Image Frontend & Backend

Jalankan dari **root repo**.

## Build

```bash
docker build -t frontend ./frontend
docker build -t backend ./backend
```

`-t` = nama image. `./frontend` dan `./backend` = folder yang berisi Dockerfile.
Cek hasilnya: `docker images` (atau tab Images di Docker Desktop).

## Jalankan (tes manual)

```bash
# Frontend -> http://localhost:3001
docker run --name pos_frontend -p 3001:3000 frontend

# Backend (butuh env + database yang bisa dijangkau)
docker run --name pos_backend -p 3000:3000 \
  -e DATABASE_URL="mysql://root:PASSWORD@host.docker.internal:3306/pos_db" \
  -e JWT_SECRET="rahasia" \
  -e FRONTEND_URL="http://localhost:3001" \
  backend
```

- `-p LAPTOP:CONTAINER` meneruskan port laptop ke port di dalam container.
- `host.docker.internal` = alamat laptop dari dalam container (dipakai kalau DB jalan di laptop).
- Backend butuh DB. Untuk jalan penuh (3 container bersama) pakai docker compose.

## Kelola container

```bash
docker ps                    # container yang jalan
docker logs -f pos_backend   # lihat log
docker stop pos_backend      # stop
docker rm pos_backend        # hapus container (image tetap ada)
docker rmi backend           # hapus image
```

## Catatan

- `.env` tidak masuk image (di `.dockerignore`). Env diberikan saat `docker run` / compose.
- Frontend: alamat API ditentukan saat build (`NEXT_PUBLIC_API_URL`). Di localhost otomatis ke `http://localhost:3000/api/backend`.
- Backend: `postinstall` menjalankan `prisma generate`, jadi `prisma/` dan `prisma.config.ts` disalin sebelum `npm ci`.
- Tabel DB dibuat dengan `prisma db push` (sekali, terhadap DB yang sudah jalan).
