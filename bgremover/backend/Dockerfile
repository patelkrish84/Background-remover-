FROM node:20-bookworm

WORKDIR /app

COPY package*.json ./

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv libgomp1 \
  && python3 -m venv /opt/rembg-venv \
  && /opt/rembg-venv/bin/pip install --no-cache-dir "rembg[cpu]" \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

ENV PATH="/opt/rembg-venv/bin:${PATH}"

RUN npm ci --omit=dev

COPY middleware ./middleware
COPY models ./models
COPY routes ./routes
COPY scripts ./scripts
COPY downloadModel.js firebase.js server.js ./

RUN mkdir -p /app/.u2net

EXPOSE 5000

CMD ["npm", "start"]
