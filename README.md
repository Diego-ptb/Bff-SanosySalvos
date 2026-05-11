# BFF "Sanos y Salvos" — Documentación Técnica

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Instalación y Setup](#instalación-y-setup)
5. [Configuración](#configuración)
6. [API Endpoints](#api-endpoints)
7. [Observaciones Críticas sobre los Contratos](#observaciones-críticas-sobre-los-contratos)
8. [Flujo de Autenticación (JWT)](#flujo-de-autenticación-jwt)
9. [Caché y Rendimiento](#caché-y-rendimiento)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Descripción General

**BFF (Backend for Frontend)** es una capa de agregación y orquestación construida en **NestJS 10.x** que sirve como único punto de entrada para el frontend de "Sanos y Salvos". 

### Responsabilidades del BFF

- **Orquestación**: Coordina llamadas a múltiples microservicios (Auth, Vet, Pet)
- **Agregación**: Combina datos de distintas fuentes en respuestas únicas (Dashboard, Profile)
- **Traducción**: Mapea DTOs del BFF hacia los contratos reales de los microservicios
- **Seguridad**: Centraliza CORS, rate limiting, validación y manejo de errores
- **Observabilidad**: Correlacion de requests mediante `x-correlation-id`, logging estructurado

### NO responsabilidades del BFF

- ❌ Lógica de negocio: Los microservicios aportan eso
- ❌ Base de datos propia: Es stateless
- ❌ Generación de JWT: Solo propaga tokens
- ❌ Validación de firmas de JWT: Auth-service es responsable

---

## Arquitectura

### Diagrama de Flujo

```
┌─────────────────────┐
│   Frontend (Futuro) │
│  HTTP/HTTPS :443    │
└──────────┬──────────┘
           │
           │ :443 (HTTPS)
           │
    ┌──────▼──────────────────┐
    │   BFF NestJS            │
    │   :3000 (único entrada) │
    │   Stateless             │
    └──────┬──────┬───────┬───┘
           │      │       │
      ┌────┘      │       └────┬──────┐
      │           │            │      │
      │        HTTP (red Docker interna)
      │           │            │      │
      ▼           ▼            ▼      ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐
│Auth-Srv │ │Vet-Srv   │ │Pet-Srv   │ │Redis   │
│:8080    │ │:8081     │ │:8082     │ │:6379   │
└─────────┘ └─────┬────┘ └─────┬────┘ │(Caché) │
                  │             │      └────────┘
                  └──┬──────┬───┘
                     │      │
                     ▼      ▼
              ┌─────────────────┐
              │ PostgreSQL      │
              │ RabbitMQ        │
              └─────────────────┘
```

### Flujo del JWT

```
1. [Frontend] POST /api/auth/login
                    │
                    ▼
2. [BFF] AuthController.login(dto)
            │
            ├─> AuthClient.login(dto)
            │
            ▼
3. [Auth-Service] POST /auth/login
                         │
                         ▼
                    Valida credenciales
                         │
                         ▼
                 Genera JWT + RefreshToken
                         │
                         ▼
4. [BFF] Recibe tokens
            │
            ▼
5. [Frontend] Almacena JWT en localStorage
                         │
6. [Frontend] GET /api/profile (con Authorization: Bearer <JWT>)
                    │
                    ▼
7. [BFF] JwtPropagationGuard valida formato (NO firma)
            │
            ├─> Propaga Authorization header a todos los microservicios
            │
            ├─> AuthClient.getMe(token)      → Auth-Service verifica
            ├─> VetClient.getMy(token)       → Vet-Service verifica (si es VET)
            ├─> PetClient.getMy(token)       → Pet-Service verifica
            │
            ▼
8. [Microservicios] Verifican firma JWT y resuelven userId desde JWT.getClaim("sub")
            │
            ▼
9. [BFF] Agrega resultados
            │
            ▼
10. [Frontend] Recibe ProfileDto con datos completos
```

### Red Docker

- **sanos-network**: Bridge network que conecta todos los contenedores
- **BFF expone**: Puerto 3000 al host
- **Microservicios internos**: :8080, :8081, :8082 (solo dentro de la red, sin ports expuestos)
- **Redis**: :6379 (compartido, caché)
- **PostgreSQL**: :5432 (compartido)
- **RabbitMQ**: :5672 (compartido)

---

## Decisión Arquitectónica de Seguridad: BFF como Único Perímetro

### Modelo Implementado

El **BFF es la única autoridad de autenticación efectiva** que ve el usuario frontend. Los microservicios mantienen SecurityConfig permisivos (permitAll en GET públicos), pero el **BFF los protege en el layer de aplicación**.

```
┌─────────────────┐
│   Frontend      │
│  (localhost)    │
└────────┬────────┘
         │ Authorization: Bearer <JWT>
         │
    ┌────▼─────────────┐
    │ BFF (3000)       │  ◄─── PUNTO DE PROTECCIÓN
    │ - JwtGuard       │       - Valida formato
    │ - CORS           │       - Rate limiting
    │ - Throttle       │       - Validación
    └────┬─────────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │          │          │          │
┌───▼──┐ ┌────▼──┐ ┌─────▼──┐
│Auth  │ │Vet    │ │Pet     │  ◄─── Internos (red interna)
│:8080 │ │:8081  │ │:8082   │       Sin ports: expostos
└──────┘ └───────┘ └────────┘
  (sin ports,  (sin ports,   (sin ports,
   expose:)    expose:)      expose:)
```

### Por qué este modelo es defensible

| Aspecto | Justificación |
|--------|--------------|
| **Única capa de entrada** | El frontend nunca habla directo con microservicios (redirección HTTP y firewall lo previene) |
| **Defensa en profundidad NO** | Microservicios confían en BFF. Es sencillo, no es fortaleza |
| **Mejor que nada** | Es más que un paso (mejor que todo público) |
| **Asimetría aceptable** | BFF "falla seguro": si cae, frontend offline (no hay data leaks) |
| **Caché es seguro** | Caché privado, no público (Cache-Control: private, max-age=60) |

### Mitigaciones Implementadas

✅ **Aislamiento de red Docker**
   - Microservicios sin `ports:` en docker-compose.yml
   - Solo `expose:` o ninguna directiva (interno)
   - Accesibles solo desde BFF dentro de sanos-network

✅ **JwtPropagationGuard en endpoints sensibles**
   - Validación de formato "Bearer <token>"
   - Aplica a: GET /vets, GET /vets/:id, GET /vets/nearby, GET /pets/lost, GET /pets/:id, GET /dashboard
   - Bloquea 401 si falta token

✅ **Logging estructurado con correlationId**
   - Cada request tiene X-Correlation-ID único
   - Rastreable end-to-end (BFF → microservicios)
   - Auditable en logs con timestamps

✅ **Rate limiting global + específico**
   - Global: 100 req/min
   - Login: 5 req/min (brute force prevention)

✅ **Validación de entrada**
   - ValidationPipe global: whitelist=true, forbidNonWhitelisted=true
   - Rechaza campos desconocidos

✅ **Caché privado**
   - Cache-Control: private, max-age=60 (no public)
   - Previene cachés intermediarios (CDN, proxies)

### Cuándo Migrar a Defensa en Profundidad

Si alguna de estas condiciones es verdadera, **agregar defensa en profundidad a microservicios**:

```
[ ] Múltiples clientes sin control del backend (móvil, web, terceros)
[ ] Requisito de cumplimiento: "microservicios nunca deben confiar en frontera anterior"
[ ] Microservicios accesibles desde clientes no controlados
[ ] Seguridad compartida entre diferentes tenants
[ ] Arquitectura event-driven donde microservicios llaman entre sí sin BFF
```

Si ninguna aplica → Modelo actual es suficiente.

---

## Estructura del Proyecto

```
bff-service/
│
├── src/
│   ├── common/                          # Código transversal reutilizable
│   │   ├── decorators/
│   │   │   ├── auth-token.decorator.ts      # Extrae JWT del request
│   │   │   ├── correlation-id.decorator.ts  # Extrae correlation ID
│   │   │   └── index.ts
│   │   ├── filters/
│   │   │   ├── all-exceptions.filter.ts     # RFC 7807 Problem Details
│   │   │   └── index.ts
│   │   ├── guards/
│   │   │   └── jwt-propagation.guard.ts     # Valida formato Bearer token
│   │   ├── interceptors/
│   │   │   ├── correlation-id.interceptor.ts # Inyecta correlation ID
│   │   │   ├── logging.interceptor.ts       # Log de requests/responses
│   │   │   └── index.ts
│   │   ├── enums/
│   │   │   ├── role.enum.ts                 # RoleId (1=ADMIN, 2=VET, 3=USER)
│   │   │   └── pet-type.enum.ts             # PetType (DOG, CAT, OTHER)
│   │   └── types/
│   │       └── index.ts                     # ProblemDetails, AggregationMeta
│   │
│   ├── config/
│   │   ├── configuration.ts                 # Joi schema de validación
│   │   └── index.ts                         # registerAs('app', ...)
│   │
│   ├── http-clients/                    # Clientes tipados para microservicios
│   │   ├── http-client.base.ts          # Base con retry automático
│   │   ├── auth/
│   │   │   └── auth.client.ts
│   │   ├── vet/
│   │   │   └── vet.client.ts
│   │   └── pet/
│   │       └── pet.client.ts
│   │
│   ├── modules/
│   │   ├── auth/                        # Pass-through a auth-service
│   │   │   ├── dto/
│   │   │   │   └── auth.dto.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── vets/                        # Pass-through a vet-service (con caché)
│   │   │   ├── dto/
│   │   │   │   └── vet.dto.ts
│   │   │   ├── vet.controller.ts
│   │   │   ├── vet.service.ts
│   │   │   └── vet.module.ts
│   │   │
│   │   ├── pets/                        # Pass-through a pet-service
│   │   │   ├── dto/
│   │   │   │   └── pet.dto.ts
│   │   │   ├── pet.controller.ts
│   │   │   ├── pet.service.ts
│   │   │   └── pet.module.ts
│   │   │
│   │   ├── dashboard/                   # AGREGADOR: vets + lost pets
│   │   │   ├── dto/
│   │   │   │   └── dashboard.dto.ts
│   │   │   ├── dashboard.controller.ts
│   │   │   ├── dashboard.service.ts
│   │   │   └── dashboard.module.ts
│   │   │
│   │   └── profile/                     # AGREGADOR: user + vet + pets
│   │       ├── dto/
│   │       │   └── profile.dto.ts
│   │       ├── profile.controller.ts
│   │       ├── profile.service.ts
│   │       └── profile.module.ts
│   │
│   ├── health/                          # Health checks
│   │   ├── health.controller.ts         # /health/live, /health/ready
│   │   ├── upstream-services.health.ts
│   │   └── health.module.ts
│   │
│   ├── app.module.ts                    # Módulo raíz
│   └── main.ts                          # Punto de entrada
│
├── test/
│   ├── e2e/
│   │   ├── auth.e2e-spec.ts
│   │   ├── dashboard.e2e-spec.ts
│   │   ├── profile.e2e-spec.ts
│   │   └── jest-e2e.json
│   └── ...
│
├── Dockerfile                           # Multi-stage build
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── package.json
├── tsconfig.json
└── README.md
```

### Explicación de Carpetas Clave

| Carpeta | Rol |
|---------|-----|
| `common/` | Código reutilizable: decorators, guards, filters, interceptores, tipos |
| `config/` | Variables de entorno y validación con Joi |
| `http-clients/` | Clientes HTTP tipados que se comunican con microservicios |
| `modules/` | Módulos de negocio: auth, vets, pets (pass-through) + dashboard, profile (agregadores) |
| `health/` | Health checks para Kubernetes/orchestration |

---

## Instalación y Setup

### Requisitos

- **Node.js**: 20 LTS
- **npm**: 9+
- **Docker** & **Docker Compose** (para orquestación)

### Pasos

#### 1. Clonar y instalar dependencias

```bash
cd bff-service
npm install
```

#### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores reales:

```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

AUTH_SERVICE_URL=http://auth-service:8080
VET_SERVICE_URL=http://vet-service:8081
PET_SERVICE_URL=http://pet-service:8082

HTTP_TIMEOUT_MS=5000
HTTP_MAX_RETRIES=3

REDIS_URL=redis://redis:6379/0
CORS_ORIGINS=http://localhost:3001,http://localhost:3002

THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

#### 3. Iniciar con Docker Compose

```bash
docker-compose up -d
```

Esto lanza:
- BFF en :3000
- Auth-Service en :8080
- Vet-Service en :8081
- Pet-Service en :8082
- Redis en :6379
- PostgreSQL en :5432
- RabbitMQ en :5672

#### 4. Desarrollo local (sin Docker)

Si quieres correr el BFF contra microservicios locales:

```bash
# En terminal 1: BFF
npm run start:dev

# En terminal 2, 3, 4: Microservicios (suponiendo que los tienes)
# $ cd ../auth-service && ./mvnw spring-boot:run
# $ cd ../vet-service && ./mvnw spring-boot:run
# $ cd ../pet-service && ./mvnw spring-boot:run

# En terminal 5: Redis
redis-server
```

---

## Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NODE_ENV` | Entorno (development, staging, production) | `development` |
| `PORT` | Puerto de escucha | `3000` |
| `LOG_LEVEL` | Nivel de logs (debug, info, warn, error) | `info` |
| `AUTH_SERVICE_URL` | URL de auth-service | `http://auth-service:8080` |
| `VET_SERVICE_URL` | URL de vet-service | `http://vet-service:8081` |
| `PET_SERVICE_URL` | URL de pet-service | `http://pet-service:8082` |
| `HTTP_TIMEOUT_MS` | Timeout para llamadas HTTP | `5000` |
| `HTTP_MAX_RETRIES` | Reintentos con backoff exponencial | `3` |
| `REDIS_URL` | URL de Redis para caché | `redis://localhost:6379/0` |
| `CORS_ORIGINS` | Orígenes permitidos (CSV) | `http://localhost:3001` |
| `THROTTLE_TTL` | TTL para rate limiting (ms) | `60000` |
| `THROTTLE_LIMIT` | Límite de requests por TTL | `100` |
| `HEALTH_CHECK_TIMEOUT_MS` | Timeout para health checks | `5000` |

### main.ts: Inicialización

```typescript
// 1. Carga AppModule
const app = await NestFactory.create(AppModule);

// 2. Aplica helmet (CSP, X-Frame-Options, etc.)
app.use(helmet());

// 3. Configura CORS
app.enableCors({ origin: corsOrigins, ... });

// 4. Global prefix
app.setGlobalPrefix('');

// 5. ValidationPipe global (whitelist, transform)
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, transform: true })
);

// 6. Interceptores
app.useGlobalInterceptors(
  new CorrelationIdInterceptor(),
  new LoggingInterceptor()
);

// 7. Filtro de excepciones global
app.useGlobalFilters(new AllExceptionsFilter());

// 8. Swagger en /docs (desarrollo)
SwaggerModule.setup('docs', app, document);

// 9. Graceful shutdown
app.enableShutdownHooks();

// 10. Escucha
await app.listen(port);
```

---

## API Endpoints

### Tabla maestro de endpoints

| Método | Ruta | Auth | Caché | Descripción |
|--------|------|------|-------|-------------|
| `POST` | `/api/auth/register` | ❌ | ❌ | Registrar usuario |
| `POST` | `/api/auth/login` | ❌ | ❌ | Login (JWT + refresh) |
| `POST` | `/api/auth/refresh` | ✅ | ❌ | Refrescar JWT |
| `GET` | `/api/auth/me` | ✅ | ❌ | Info del usuario actual |
| `GET` | `/api/vets` | ✅ | ✅ 60s | Todas las veterinarias |
| `POST` | `/api/vets` | ✅ | ❌ | Crear veterinaria (rol VET) |
| `GET` | `/api/vets/my` | ✅ | ❌ | Mi veterinaria |
| `PATCH` | `/api/vets/my` | ✅ | ❌ | Actualizar mi veterinaria |
| `GET` | `/api/vets/:id` | ✅ | ✅ 5m | Veterinaria por ID |
| `GET` | `/api/vets/nearby/search?lat=&lng=&radius=` | ✅ | ✅ 60s | Veterinarias cercanas |
| `POST` | `/api/pets` | ✅ | ❌ | Crear mascota |
| `GET` | `/api/pets/me` | ✅ | ❌ | Mis mascotas |
| `GET` | `/api/pets/lost` | ✅ | ❌ | Mascotas perdidas |
| `GET` | `/api/pets/:id` | ✅ | ❌ | Mascota por ID |
| `PUT` | `/api/pets/:id` | ✅ | ❌ | Actualizar mascota |
| `PUT` | `/api/pets/:id/found` | ✅ | ❌ | Marcar como encontrada |
| `DELETE` | `/api/pets/:id` | ✅ | ❌ | Eliminar mascota |
| `GET` | `/api/dashboard?lat=&lng=&radius=` | ✅ | ✅ 60s | Agregado GeoJSON: vets + lost pets |
| `GET` | `/api/profile` | ✅ | ❌ | Agregado: user + vet + pets |
| `GET` | `/health/live` | ❌ | ❌ | Liveness probe |
| `GET` | `/health/ready` | ❌ | ❌ | Readiness probe |

**Cambios recientes**:
- ✨ Endpoints `/api/vets`, `/api/vets/:id`, `/api/vets/nearby/search`, `/api/pets/lost` ahora requieren Bearer token (UX: solo usuarios autenticados ven el mapa)
- ✨ Nuevo endpoint `GET /api/pets/:id` para obtener una mascota específica
- ✨ `GET /api/dashboard` ahora retorna GeoJSON FeatureCollection (compatible con Leaflet/MapLibre)
- 🔒 Microservicios aislados en red interna (sin ports expuestos al host)

### Ejemplos de Requests

#### 1. Registrar usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securePass123"
  }'
```

**Response** (200 OK):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "johndoe",
  "roles": [3]
}
```

#### 2. Get Dashboard as GeoJSON (con autenticación)

```bash
curl "http://localhost:3000/api/dashboard?lat=-33.8688&lng=-151.2093&radius=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Correlation-ID: req-12345"
```

**Response** (200 OK) - GeoJSON FeatureCollection compatible con Leaflet/MapLibre:

```json
{
  "vets": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [-70.6483, -33.4569]
        },
        "properties": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Veterinaria Central",
          "address": "Calle Principal 123",
          "phone": "+56912345678",
          "imageUrl": "https://example.com/vet.jpg"
        }
      }
    ]
  },
  "lostPets": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [-70.65, -33.45]
        },
        "properties": {
          "id": "pet-uuid",
          "name": "Firulais",
          "type": "DOG",
          "imageUrl": "https://example.com/firulais.jpg",
          "ownerId": "owner-uuid",
          "description": "Golden retriever, friendly"
        }
      }
    ]
  },
  "metrics": {
    "totalVets": 12,
    "totalLostPets": 3
  },
  "_meta": {
    "partial": false,
    "correlationId": "01HXYZ...",
    "timestamp": "2026-05-09T12:00:00Z"
  }
}
```

**Frontend usage** (Leaflet):

```javascript
// Fetch dashboard
const response = await fetch('/api/dashboard?lat=-33.87&lng=-70.65&radius=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

// Agregar capas de vets y mascotas perdidas al mapa
L.geoJSON(data.vets, {
  onEachFeature: (feature, layer) => {
    layer.bindPopup(`<b>${feature.properties.name}</b><br>${feature.properties.address}`);
  }
}).addTo(map);

L.geoJSON(data.lostPets, {
  onEachFeature: (feature, layer) => {
    layer.bindPopup(`<b>🐕 ${feature.properties.name}</b> (${feature.properties.type})`);
  }
}).addTo(map);
```

#### 3. Get Pet by ID

```bash
curl "http://localhost:3000/api/pets/550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response** (200 OK):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Firulais",
  "type": "DOG",
  "age": 3,
  "description": "Golden retriever, friendly",
  "ownerId": "550e8400-e29b-41d4-a716-446655440002",
  "imageUrl": "https://example.com/firulais.jpg",
  "latitude": -33.4569,
  "longitude": -70.6483
}
```
        "phone": "+56912345678",
        "imageUrl": "https://example.com/vet.jpg"
      }
    ],
    "ok": true
  },
  "lostPets": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Firulais",
        "type": "DOG",
        "age": 3,
        "ownerId": "550e8400-e29b-41d4-a716-446655440002",
        "lost": true,
        "latitude": -33.869,
        "longitude": -151.209
      }
    ],
    "ok": true
  },
  "_meta": {
    "partial": false,
    "correlationId": "req-12345",
    "timestamp": "2026-05-09T14:30:00.000Z"
  },
  "metrics": {
    "totalVets": 1,
    "totalLostPets": 1
  }
}
```

#### 3. Get Profile (agregado, con autenticación)

```bash
curl "http://localhost:3000/api/profile" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Correlation-ID: req-67890"
```

**Response** (200 OK):

```json
{
  "user": {
    "username": "johndoe",
    "email": "john@example.com",
    "roles": [3]
  },
  "vet": null,
  "pets": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Firulais",
        "type": "DOG",
        "age": 3,
        "ownerId": "550e8400-e29b-41d4-a716-446655440002",
        "lost": false
      }
    ],
    "ok": true
  },
  "_meta": {
    "partial": false,
    "correlationId": "req-67890",
    "timestamp": "2026-05-09T14:35:00.000Z"
  }
}
```

#### 4. Error con RFC 7807 Problem Details

```bash
curl http://localhost:3000/api/vets/nearby/search?lat=invalid
```

**Response** (400 Bad Request):

```json
{
  "type": "https://sanosysalvos.dev/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/vets/nearby/search",
  "correlationId": "1715326800000-5a8c2b",
  "timestamp": "2026-05-09T14:30:00.000Z",
  "errors": {
    "validation": [
      "lat must be a number"
    ]
  }
}
```

---

## Observaciones Críticas sobre los Contratos

### Problema #1: UserInfo no expone UUID

**Hallazgo**: `/auth/me` devuelve `{ username, email, roles }`, pero NO el UUID del usuario.

**Impacto**: El BFF no puede resolver el `userId` del token sin decodificarlo.

**Decisión del BFF**: 
- ✅ El BFF **NO decodifica** JWT (solo lo propaga)
- ✅ Los microservicios resuelven userId desde el claim `sub` del JWT
- ✅ El BFF mantiene correlación de requests mediante `x-correlation-id` en logs

**Recomendación**: Solicitar a auth-service que agregue `id: UUID` a `UserInfo` o exponer un nuevo endpoint `/auth/me/full`.

### Problema #2: Roles como int64[], no string[]

**Hallazgo**: `roles` es `integer[]` (p.ej. `[1, 2, 3]`), no `string[]`.

**Decisión del BFF**:
- ✅ Mantener tipo numérico en DTOs
- ✅ Crear enum `RoleId` documentado:
  ```typescript
  export enum RoleId {
    ADMIN = 1,
    VET = 2,
    USER = 3,
  }
  ```
- ✅ Usar enum para checks: `userInfo.roles.includes(RoleId.VET)`

### Problema #3: Inconsistencia en Pet schema (timestamps)

**Hallazgo**: 
- `POST /pets` y `PUT /pets/{id}` devuelven `Pet` con `createdAt`, `updatedAt`
- `GET /pets/me` y `GET /pets/lost` devuelven `PetResponse` sin timestamps

**Decisión del BFF**:
- ✅ Unificar en un solo `PetDto` con campos opcionales: `createdAt?`, `updatedAt?`
- ✅ El frontend siempre recibe el mismo shape
- ✅ Si falta el timestamp, es `undefined` (no error)

### Problema #4: No existe `GET /pets/{id}`

**Hallazgo**: No hay endpoint para obtener un pet por ID individual.

**Decisión del BFF**:
- ✅ NO inventar endpoint (no violar regla inviolable)
- ✅ Documentar gap en este README con TODO
- ✅ Si el frontend lo necesita, abrir issue en pet-service

**TODO**: `GET /pets/{id}` — requiere endpoint en pet-service

### Problema #5: `GET /vets` sin paginación

**Hallazgo**: Devuelve TODAS las veterinarias. Si crecen a 10.000, es problema.

**Decisión del BFF**:
- ✅ Aplicar caché Redis con TTL 60s
- ✅ Header `Cache-Control: public, max-age=60`
- ✅ Documentar riesgo de crecimiento y solicitar paginación

**Recomendación**: Agregar a vet-service `GET /vets?page=0&size=20`.

### Problema #6: POST /vets solo para role=VET

**Hallazgo**: OpenAPI no documenta la restricción, pero microservicio devuelve 403.

**Decisión del BFF**:
- ✅ El BFF NO duplica validación
- ✅ Reenvía response 403 con Problem Details mapeado

### Problema #7: No hay endpoint `/auth/logout`

**Hallazgo**: JWT es stateless puro, no hay logout server-side.

**Decisión del BFF**:
- ✅ El BFF tampoco expone `/api/auth/logout`
- ✅ El frontend elimina el token localmente

### Problema #8: `GET /pets/lost` es público

**Hallazgo**: No tiene `security` explícito en OpenAPI → asumir público.

**Decisión del BFF**:
- ✅ `GET /api/pets/lost` sin guard (público)
- ✅ Permitir que cualquiera busque mascotas perdidas

### Problema #9: `markAsFound` vs `update` con `lost: false`

**Hallazgo**: Dos formas de marcar una mascota como encontrada.

**Decisión del BFF**:
- ✅ Exponer ambas:
  - `PUT /api/pets/:id` (genérica, puede actualizar cualquier campo)
  - `PUT /api/pets/:id/found` (específica, idempotente, acción dedicada)

---

## Flujo de Autenticación (JWT)

### Componentes

1. **JwtPropagationGuard**: Valida que exista el header `Authorization: Bearer <token>` con formato correcto
2. **@AuthToken()**: Decorator que extrae el token del request
3. **AuthClient**: Envía requests autenticados a auth-service
4. **CorrelationIdInterceptor**: Inyecta `x-correlation-id` en todas las requests salientes

### Flujo Paso a Paso

```
1. Frontend: POST /api/auth/login { username, password }
   ↓
2. BFF: AuthController.login()
   ├─ ✅ Valida con class-validator
   ├─ Llama AuthClient.login()
   ↓
3. Auth-Service: POST /auth/login
   ├─ Valida credenciales vs BD
   ├─ Genera JWT (HS256, claim "sub": userId)
   ├─ Genera RefreshToken
   ↓
4. BFF: Recibe { token, refreshToken, username, roles }
   ├─ Propaga al frontend
   ↓
5. Frontend: Almacena JWT en localStorage
   ├─ Usa para requests posteriores
   ↓
6. Frontend: GET /api/profile
   ├─ Header: Authorization: Bearer <JWT>
   ├─ Header: X-Correlation-ID: req-xyz
   ↓
7. BFF: ProfileController.getProfile()
   ├─ JwtPropagationGuard: ✅ Valida formato Bearer
   ├─ CorrelationIdInterceptor: ✅ Inyecta correlation ID
   ├─ Extrae token con @AuthToken()
   ├─ Ejecuta en paralelo:
   │  ├─ AuthClient.getMe(token)
   │  ├─ VetClient.getMy(token)
   │  └─ PetClient.getMy(token)
   ↓
8. Microservicios:
   ├─ Cada uno recibe el token en Authorization header
   ├─ Verifica firma JWT
   ├─ Extrae claim "sub" → userId
   ├─ Devuelve datos del usuario actual
   ↓
9. BFF: Agrega respuestas
   ↓
10. Frontend: Recibe ProfileDto completo
```

### Seguridad

- ✅ **No decoding de JWT en BFF**: Solo formato (Bearer token)
- ✅ **Firma verificada por auth-service**: Responsabilidad delegada
- ✅ **CORS habilitado** solo para orígenes permitidos
- ✅ **Helmet**: CSP, X-Frame-Options, etc.
- ✅ **Rate limiting**: 100 req/min por IP (configurable)
- ✅ **Throttle reforzado en /api/auth/login**: 5 req/min (anti-brute-force)

---

## Caché y Rendimiento

### Estrategia de Caché

| Endpoint | Caché | TTL | Clave | Lógica |
|----------|-------|-----|-------|--------|
| `GET /api/vets` | ✅ Redis | 60s | `vets:all` | Todas las veterinarias (siempre igual) |
| `GET /api/vets/:id` | ✅ Redis | 5m | `vets:by-id` | Info estática de una vet |
| `GET /api/vets/nearby?lat=&lng=&radius=` | ✅ Redis | 60s | `vets:${lat}:${lng}:${radius}` | Búsqueda espacial (varía por ubicación) |
| `GET /api/dashboard?lat=&lng=` | ✅ Redis | 60s | `dashboard:${lat}:${lng}:${radius}` | Agregado dinámico |
| `POST /api/vets` | ❌ | — | — | Invalidar caché relevante |
| `GET /api/auth/me` | ❌ | — | — | Datos del usuario actual (personalizado) |

### Invalidación de Caché

Cuando se actualiza/crea:
- `POST /api/vets` → Invalidar `vets:all`, `vets:by-id`, `vets:*:*:*`, `dashboard:*`
- `PATCH /api/vets/my` → Invalidar `vets:all`, `dashboard:*`
- `POST /api/pets` → Invalidar `dashboard:*`
- `PUT /api/pets/:id/found` → Invalidar `dashboard:*` (lost pets cambió)

**Nota**: El BFF actual NO implementa invalidación automática (simplifcación). En producción:
- Usar Redis pub/sub para eventos de actualización
- O usar TTL conservador (60s es aceptable)

### Optimizaciones

1. **Promise.allSettled** en agregadores: No fallar si un servicio está down
2. **Retry con backoff exponencial**: 100ms, 200ms, 400ms para 5xx idempotentes
3. **Timeouts**: 5s para HTTP calls
4. **Connection pooling**: Axios reutiliza conexiones
5. **Compression**: Express comprime responses gzip automáticamente

---

## Testing

### Estructura

```
test/
├── e2e/
│   ├── auth.e2e-spec.ts
│   ├── dashboard.e2e-spec.ts
│   ├── profile.e2e-spec.ts
│   └── jest-e2e.json
└── jest.config.js
```

### Ejecutar Tests

```bash
# Unit tests (con jest)
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Ejemplo: Dashboard E2E

```typescript
describe('Dashboard (e2e)', () => {
  it('GET /api/dashboard (success)', async () => {
    // Mock de vet-service y pet-service con nock
    nock('http://vet-service:8081')
      .get('/vets/nearby?lat=-33.8688&lng=-151.2093&radius=10')
      .reply(200, [{ id: '1', name: 'Vet 1', latitude: -33.8688, longitude: -151.2093 }]);

    nock('http://pet-service:8082')
      .get('/pets/lost')
      .reply(200, [{ id: '2', name: 'Firulais', lost: true }]);

    const response = await request(app.getHttpServer())
      .get('/api/dashboard?lat=-33.8688&lng=-151.2093&radius=10')
      .expect(200);

    expect(response.body.vets.ok).toBe(true);
    expect(response.body.lostPets.ok).toBe(true);
    expect(response.body._meta.partial).toBe(false);
  });

  it('GET /api/dashboard (partial failure)', async () => {
    // vet-service retorna 500, pet-service OK
    nock('http://vet-service:8081')
      .get('/vets/nearby?lat=-33.8688&lng=-151.2093')
      .reply(500);

    nock('http://pet-service:8082')
      .get('/pets/lost')
      .reply(200, []);

    const response = await request(app.getHttpServer())
      .get('/api/dashboard?lat=-33.8688&lng=-151.2093')
      .expect(200); // ✅ Aun retorna 200 (graceful degradation)

    expect(response.body.vets.ok).toBe(false);
    expect(response.body.lostPets.ok).toBe(true);
    expect(response.body._meta.partial).toBe(true); // ✅ Indica fallo parcial
  });

  it('GET /api/dashboard (all services down)', async () => {
    nock('http://vet-service:8081')
      .get('/vets/nearby?lat=-33.8688&lng=-151.2093')
      .reply(500);

    nock('http://pet-service:8082')
      .get('/pets/lost')
      .reply(500);

    const response = await request(app.getHttpServer())
      .get('/api/dashboard?lat=-33.8688&lng=-151.2093')
      .expect(503); // ✅ Service Unavailable
  });
});
```

---

## Deployment

### Docker Build

```bash
docker build -t sanosysalvos/bff:latest .
```

### Docker Compose (desarrollo completo)

```bash
docker-compose up -d
```

Acceso:
- **BFF API**: http://localhost:3000
- **Swagger/OpenAPI**: http://localhost:3000/docs
- **Health Live**: http://localhost:3000/health/live
- **Health Ready**: http://localhost:3000/health/ready

### Kubernetes (conceptual)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bff
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bff
  template:
    metadata:
      labels:
        app: bff
    spec:
      containers:
      - name: bff
        image: sanosysalvos/bff:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: AUTH_SERVICE_URL
          value: http://auth-service:8080
        # ... más env vars
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## Troubleshooting

### 1. "Connection refused" a vet-service

```
Error: connect ECONNREFUSED 127.0.0.1:8081
```

**Causa**: Micro servicio no está levantado o URL incorrecta.

**Solución**:
```bash
# Verif car que el servicio esté corriendo
docker ps | grep vet-service

# Verificar URL en .env
cat .env | grep VET_SERVICE_URL

# Si usas docker-compose, todos están en la red "sanos-network"
docker network inspect sanos-network
```

### 2. JWT token inválido

```json
{
  "type": "https://sanosysalvos.dev/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid Authorization header format"
}
```

**Causa**: Header falta Bearer o formato incorrecto.

**Solución**:
```bash
# ✅ Correcto
curl -H "Authorization: Bearer eyJhbGciOi..."

# ❌ Incorrecto
curl -H "Authorization: eyJhbGciOi..."
curl -H "Authorization: Basic ..."
```

### 3. CORS error en el frontend

```
Access-Control-Allow-Origin header missing
```

**Causa**: Origen del frontend no está en CORS_ORIGINS.

**Solución**:
```bash
# .env
CORS_ORIGINS=http://localhost:3001,http://localhost:3002,https://app.sanosysalvos.cl
```

### 4. Lentitud en agregadores

**Causa**: Un microservicio responde lentamente.

**Solución**:
```bash
# Reducir timeout (pero con cuidado)
HTTP_TIMEOUT_MS=3000

# O aumentar límite de reintentos
HTTP_MAX_RETRIES=5

# Ver logs
docker logs bff | grep latency
```

### 5. Error de validación extraño

```json
{
  "errors": {
    "latitude": ["latitude must be a number"]
  }
}
```

**Causa**: class-validator rechaza tipos.

**Solución**: Usar `@Type(() => Number)` en DTO y verificar que el cliente envía JSON correctamente.

---

## Contacto / Soporte

Para preguntas o reportar bugs:
- 📧 team@sanosysalvos.dev
- 🐛 GitHub Issues: https://github.com/sanosysalvos/bff-service/issues

---

**Última actualización**: 9 de mayo de 2026  
**Versión**: 1.0.0  
**Estado**: Production-Ready ✅
