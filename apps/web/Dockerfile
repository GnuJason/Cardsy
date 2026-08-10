FROM node:18-alpine

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY . .

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @grandmagame/web build

WORKDIR /workspace/apps/web

EXPOSE 5173

CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "5173"]