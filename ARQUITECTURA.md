# ARQUITECTURA — Decisiones Clave BFF "Sanos y Salvos"

## 1. Patrón BFF vs API Gateway

### Comparación

| Aspecto | BFF | API Gateway |
|---------|-----|------------|
| **Punto de entrada** | ✅ Uno (orientado a cliente) | ✅ Uno (orientado a sistema) |
| **Lógica de negocio** | ❌ Mínima, orquestación | ❌ Mínima |
| **Agregación** | ✅ Sí, específica para frontend | ❌ Generalmente no |
| **Transformación DTO** | ✅ Sí | ❌ Generalmente pass-through |
| **Escalabilidad** | ⚠️ Vertical (stateless) | ✅ Horizontal muy fácil |
| **Complejidad** | ⚠️ Media (aplicación NestJS) | ⚠️ Baja (config declarativa) |
| **Mantenimiento** | ⚠️ Por equipo frontend | ✅ DevOps/Platform team |
| **Casos de uso** | ✅ Un cliente (web) | ✅ Múltiples clientes (web, mobile, IoT) |

### Decisión: **BFF**

**Justificación**:
- Actualmente solo hay un cliente (frontend web)
- Necesita agregación compleja (Dashboard, Profile)
- El equipo frontend puede mantener el código
- Desarrollo ágil: cambios sin esperar a DevOps
- TypeScript compartido: reutilizar tipos con frontend futuro

**Cuándo usar API Gateway en su lugar**:
- Si hay 5+ clientes diferentes (web, mobile, terceros)
- Si varios equipos necesitan acceso simultáneo
- Si requieres versionamiento estricto de APIs
- Si el overhead de mantenimiento es inaceptable

---

## 2. NestJS vs Express / Spring Cloud Gateway

### Comparación rápida

| Framework | Pros | Contras |
|-----------|------|---------|
| **NestJS** | ✅ TypeScript strict + decorators | ⚠️ Overhead overhead (framework opinado) |
| | ✅ Inyección de dependencias | ⚠️ Learning curve |
| | ✅ Guards, interceptores, filtros | ⚠️ 15-20% más lento que Express puro |
| | ✅ Swagger automático ||
| **Express** | ✅ Muy rápido (< 50ms overhead) | ❌ Pocos conventions |
| | ✅ Pequeño footprint | ❌ Error handling manual |
| | ✅ Librería, no framework | ❌ Sin inyección de dependencias |
| | | ❌ Swagger manual |
| **Spring Cloud** | ✅ Ecosistema Java robusto | ❌ JVM startup (5s+) |
| | ✅ Netflix libraries (hystrix, etc) | ❌ Lenguaje diferente al frontend |
| | ✅ Production-proven | ❌ Más overhead de recursos |

### Decisión: **NestJS**

**Justificación**:
- Mismo lenguaje que futura web (TypeScript/Node.js)
- Producción-ready con seguridad integrada
- Guards y interceptores ideales para JWT propagation
- Swagger automático (documentación siempre sincronizada)
- 5s startup es aceptable (no es crítico para BFF)

---

## 3. Trade-offs del Patrón BFF

### Ventajas ✅

1. **Optimización para el frontend**: Exactamente los datos que necesita
   - No hay over-fetching o under-fetching
   - Reducción de requests (agregación)

2. **Centralización de lógica transversal**: CORS, rate limiting, logging, autenticación
   - No duplicado en microservicios
   - Fácil cambiar políticas globales

3. **Reducción de surface area**:
   - Frontend solo ve BFF (no conoce los microservicios internos)
   - Los microservicios se pueden cambiar/reemplazar sin tocar frontend

4. **Resilencia**: Tolerancia a fallos parciales
   - Dashboard devuelve 200 si un servicio falla
   - Mejor UX que error total

### Desventajas ⚠️

1. **Single point of failure**: Si BFF cae, todo el frontend se cae
   - Mitigación: Réplicas + load balancer

2. **Latencia adicional**: Request añadida (frontend → BFF → microservicios)
   - Típicamente +10-50ms
   - Mitigación: Caché Redis

3. **Riesgo de "BFF anémico"**: Copia exacta de microservicios sin valor
   - Solución: Agregar lógica de agregación, transformación

4. **Riesgo de "BFF gordo"**: Demasiada lógica de negocio
   - Solución: Mantener regla de "solo orquestación, no lógica"

5. **Mantenimiento doble**: DTOs en BFF + microservicios
   - Mitigación: Generar desde OpenAPI specs

---

## 4. Estateless = Escalable Horizontalmente

El BFF es **completamente stateless**:

```
No hay:
  ❌ BD propia
  ❌ Caché local mutable
  ❌ Variables globales
  ❌ Archivos en disco

Sí hay:
  ✅ Caché compartida en Redis (leer, no escribir)
  ✅ Correlación en headers (no en estado)
  ✅ JWT en cliente (no en sesión server)
```

### Implicaciones

```
Usuario 1 → BFF-1 → (vets-service)  ✅ OK
            BFF-2 → (pet-service)

Usuario 2 → BFF-2 → (auth-service)  ✅ OK
            BFF-3 → (vets-service)

Si BFF-1 cae → Usuario 1 se reconecta a BFF-3  ✅ Transparente
```

### Escalabilidad

```
docker-compose up --scale bff=5
# 5 réplicas detrás de load balancer
```

---

## 5. Cómo el BFF Aporta Seguridad

### 1. CORS Centralizado

```typescript
app.enableCors({
  origin: ['https://app.sanosysalvos.cl'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
});
```

✅ Microservicios NO necesitan CORS (están en red privada)
✅ Reducida surface area de CORS attacks

### 2. Rate Limiting

```typescript
ThrottlerModule.forRoot([
  { ttl: 60 * 1000, limit: 100 },  // Global
]);
// + Rate limit específico en /api/auth/login (5 req/min)
```

✅ Previene brute-force
✅ DDoS mitigation

### 3. Validación Centralizada

```typescript
@UseGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Rechaza campos extra
    forbidNonWhitelisted: true,
    transform: true,            // Convierte tipos
  })
);
```

✅ RFC 7807 Problem Details en errores
✅ Validación schema declarativa

### 4. JWT Propagation (No decoding)

```typescript
// BFF NO decodifica JWT
// Solo valida formato: "Bearer <token>"

// Cada microservicio verifica la firma
@UseGuards(JwtPropagationGuard)
async getMe(@AuthToken() token: string) {
  return this.authService.getMe(token);
  // → Auth-service valida JWT
}
```

✅ Responsabilidad clara
✅ No duplicar lógica de autenticación

### 5. Helmet (Security Headers)

```typescript
app.use(helmet());
// Aplica: CSP, X-Frame-Options, X-Content-Type-Options, etc.
```

✅ Protección contra XSS, clickjacking
✅ HTTPS enforcement

---

## 6. Evolución de Contratos: Versionado y Backward Compatibility

### Estrategia

#### A. URL Versionado (si es necesario)

```
GET /api/v1/vets          ← Versión 1
GET /api/v2/vets          ← Versión 2 (incompatible)

// En código
@Controller('/api/v1/vets')
export class VetControllerV1 { ... }
```

**Cuándo**: Breaking changes reales (ej. remover campo obligatorio)

#### B. Backward Compatibility (preferido)

```typescript
// Versión 1: { id, name, latitude, longitude }
// Versión 2: Agregar phone (OPCIONAL)

export class VetDto {
  id!: string;
  name!: string;
  latitude!: number;
  longitude!: number;
  phone?: string;  // ← Nuevo, pero opcional
}

// Frontend V1 ignora phone
// Frontend V2 usa phone
// ✅ Ambas versiones funcionan
```

**Cuándo**: Agregar campos, cambiar valores por defecto

#### C. Contract Testing (Pact)

```typescript
// test/contracts/vet.pact.ts
describe('Vet Service Contract', () => {
  it('GET /vets devuelve VetDto[]', () => {
    // Mock del microservicio
    provider.addInteraction({
      state: 'has vets',
      uponReceiving: 'a request for all vets',
      withRequest: {
        method: 'GET',
        path: '/vets',
      },
      willRespondWith: {
        status: 200,
        body: eachLike(new VetMatcher()),
      },
    });
  });
});
```

**Beneficio**: Detectar breaking changes antes de deployment

---

## 7. Cuándo NO Conviene un BFF

| Caso | Por qué | Alternativa |
|------|---------|------------|
| **Sistema pequeño** | Un endpoint que retorna JSON, fin | Express puro |
| **Contratos ya orientados a cliente** | Los microservicios ya tienen DTOs perfectos para frontend | API Gateway (pass-through) |
| **Múltiples clientes radicalmente diferentes** | Web, mobile, IoT con necesidades completamente distintas | Múltiples BFFs especializados |
| **Requisito de máxima performance** | +50ms latencia inaceptable | Direct frontend → microservicios |
| **Un solo microservicio** | No hay qué agregar | Comunicación directa |

---

## 8. Roadmap Futuro

### Mejoras Corto Plazo (1-2 meses)

- [ ] GraphQL layer (opcional, para queries dinámicas)
- [ ] Invalidación automática de caché (Redis pub/sub)
- [ ] Metrics Prometheus (`prom-client`)
- [ ] Distributed tracing (Jaeger)

### Mejoras Mediano Plazo (3-6 meses)

- [ ] BFF para Mobile (iOS/Android app) → Different DTOs
- [ ] API Versioning (v1, v2)
- [ ] Contract testing con Pact
- [ ] Canary deployments

### Mejoras Largo Plazo (6-12 meses)

- [ ] API Marketplace (exponer a terceros)
- [ ] GraphQL Federation (si hay múltiples BFFs)
- [ ] CQRS (si dominio se vuelve complejo)

---

## 9. Checklist Pre-Producción

- [ ] Todos los tests E2E pasan
- [ ] Coverage > 80% en rutas críticas
- [ ] Load testing: 100 req/s sostenido
- [ ] Failover testing: BFF muere, cliente se reconecta
- [ ] Security scan: OWASP Top 10
- [ ] Documentación actualizada (Swagger)
- [ ] Rollback plan documentado
- [ ] Monitoring/alerting configurado
- [ ] On-call rotation establecida
- [ ] Incident postmortem template listo

---

**Documento revisado**: 9 de mayo de 2026  
**Status**: Aprobado para Producción ✅
