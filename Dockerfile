######################
# BUILD STAGE
######################
FROM node:20-alpine AS builder

WORKDIR /build

# Copiar package files
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias (incluyendo devDependencies)
RUN npm ci

# Copiar código fuente
COPY src ./src

# Compilar TypeScript
RUN npm run build

######################
# RUNTIME STAGE
######################
FROM node:20-alpine

WORKDIR /app

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copiar package files
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar código compilado desde builder
COPY --from=builder --chown=nestjs:nodejs /build/dist ./dist

# Switch al usuario no-root
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health/live', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Exponer puerto
EXPOSE 3000

# Start
CMD ["node", "dist/main"]
