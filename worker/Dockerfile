FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY scripts/render-jox-clip.mjs ./scripts/render-jox-clip.mjs
COPY worker/jox-clip-worker.mjs ./worker/jox-clip-worker.mjs
COPY worker/media-inspection.mjs ./worker/media-inspection.mjs
CMD ["node", "worker/jox-clip-worker.mjs"]
