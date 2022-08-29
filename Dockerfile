# Install dependencies only when needed
FROM node:16.14-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json .
RUN yarn install --frozen-lockfile --production=false

# Rebuild the source code only when needed
FROM node:16.14-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

#Env
ARG NEXT_ENVIRONMENT
ENV NEXT_PUBLIC_ENVIRONMENT $ENVIRONMENT
ENV NODE_ENV $NEXT_ENVIRONMENT

#Solana
ARG SOLANA_ENDPOINT
ENV SOLANA_ENDPOINT $SOLANA_ENDPOINT
ENV NEXT_PUBLIC_SOLANA_RPC_URL $SOLANA_ENDPOINT

#Indexer
ARG GRAPHQL_URL
ENV NEXT_PUBLIC_GRAPHQL_URL $GRAPHQL_URL

ARG MARKETPLACE_SUBDOMAIN
ENV NEXT_PUBLIC_MARKETPLACE_SUBDOMAIN $MARKETPLACE_SUBDOMAIN

RUN yarn build

# Production image, copy all the files and run next
FROM node:16.14-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV NEXT_SHARP_PATH /app/node_modules/sharp

CMD ["npx", "next", "start"]