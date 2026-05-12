# Food Store — Mapa de Changes (TPI v5.0)

> **Objetivo**: Mapa de ruta para alcanzar el 100% de compliance con los 3 documentos de la cátedra:
> `docs/Integrador.txt`, `docs/Historias_de_usuario.txt`, `docs/Descripcion.txt`.
>
> Los changes están organizados por criterio de la **Rúbrica de 200 puntos** del TPI.
> Los features fuera del TPI que ya están implementados se listan en **Extras**.

---

## 🎯 CAMBIOS TPI — Impactan DIRECTAMENTE en los 200 pts

---

### FASE TPI-1: Infraestructura y Setup
**Criterio**: Backend — Estructura y Configuración (10 pts)

| ID | Change | Estado | Pts estimados |
|:--:|--------|:------:|:-------------:|
| 1 | `setup-project-structure` | ✅ Archivado TPI | 2 |
| 2 | `add-database-layer` | ✅ Archivado TPI | 3 |
| 18 | `migracion-hacia-aprobacion` (UoW, core/, rate limiting, /api/v1) | 🏗️ 125/143 | 5 |

**Pendiente** en `migracion-hacia-aprobacion`:
- ✅ CORS: cambiar `["*"]` por lista desde variable de entorno
- ✅ Verificar `alembic upgrade head` en BD limpia (CE-04)

---

### FASE TPI-2: Modelo de Datos + UoW + Servicios
**Criterios**: Modelo de Datos (15 pts) + UoW/Repository (15 pts) + Capa Servicio (15 pts)

| ID | Change | Estado | Pts estimados |
|:--:|--------|:------:|:-------------:|
| 3 | `implement-authentication` | ✅ Archivado TPI | 5 |
| 7 | `implement-shopping-cart` | ✅ Archivado TPI | 5 |
| 8 | `implement-checkout-and-orders` | ✅ Archivado TPI | 5 |
| 4 | `create-user-service` | ✅ Archivado TPI | 5 |
| 5 | `create-product-service` | ✅ Archivado TPI | 5 |
| 18 | `migracion-hacia-aprobacion` (FSM, soft delete, snapshots) | 🏗️ Completo | 10 |
| **NUEVO** | `fix-seed-and-entities` | 🆕 **NO INICIADO** | **10** |

**`fix-seed-and-entities`** — Tareas pendientes:
- [ ] Crear migración: tabla `roles` (codigo VARCHAR PK, nombre, descripcion)
- [ ] Crear migración: tabla `usuario_rol` (usuario_id FK, rol_codigo FK, PK compuesta)
- [ ] Crear migración: tabla `direcciones_entrega` (usuario_id FK, alias, linea1, ciudad, codigo_postal, es_principal BOOLEAN)
- [ ] Crear modelo `Role` SQLModel
- [ ] Crear modelo `UsuarioRol` SQLModel
- [ ] Crear modelo `DireccionEntrega` SQLModel
- [ ] Agregar `direccion_snapshot` (TEXT) al modelo `Pedido` / `Order`
- [ ] Actualizar seed: insertar 4 roles (ADMIN, STOCK, PEDIDOS, CLIENT) con `ON CONFLICT DO NOTHING`
- [ ] Actualizar seed: insertar 1 usuario admin (`admin@foodstore.com` / `Admin1234!`) con rol ADMIN
- [ ] Actualizar seed: reemplazar estados actuales por los 6 del spec (PENDIENTE, CONFIRMADO, EN_PREP, EN_CAMINO, ENTREGADO, CANCELADO)
- [ ] Actualizar seed: agregar EFECTIVO y TRANSFERENCIA a formas de pago (total 3: MERCADOPAGO, EFECTIVO, TRANSFERENCIA)
- [ ] Alinear `FSM_TRANSITIONS` en `order_service.py` a los 6 estados del spec
- [ ] Migrar `auth.py` de `get_db_session` a `get_uow`
- [ ] Verificar `require_role` usa los 4 roles exactos del spec (ADMIN, STOCK, PEDIDOS, CLIENT)

---

### FASE TPI-3: Controladores REST
**Criterio**: Controladores REST (15 pts)

| ID | Change | Estado | Pts estimados |
|:--:|--------|:------:|:-------------:|
| 6 | `build-search-and-filtering` | ✅ Archivado TPI | 5 |
| 18 | `migracion-hacia-aprobacion` (schemas Pydantic, /api/v1) | 🏗️ Completo | 10 |

---

### FASE TPI-4: MercadoPago
**Criterio**: Backend — MercadoPago (15 pts)

| ID | Change | Estado | Pts estimados |
|:--:|--------|:------:|:-------------:|
| **NUEVO** | `fix-mp-webhook-and-stripe` | 🆕 **NO INICIADO** | **15** |

**`fix-mp-webhook-and-stripe`** — Tareas pendientes:
- [ ] Implementar `handle_ipn()` real en `payment_service.py`: consultar API de MP, actualizar tabla `pagos`, disparar FSM
- [ ] Completar `POST /api/v1/pagos/webhook`: verificar firma, llamar a `handle_ipn()`, retornar 200 rápido
- [ ] Reemplazar `schemas/payment.py`: eliminar schemas Stripe, crear `PagoResponse`, `MPPreferenceResponse`, `MPWebhookEvent`
- [ ] Implementar CardPayment embebido con `@mercadopago/sdk-react` en frontend (hoy solo redirect a MP)
- [ ] Agregar Timeline con polling 30s en `OrderDetailPage.tsx`
- [ ] Verificar flujo completo en sandbox MP (CE-09)

---

### FASE TPI-5: Frontend — Estado Global y Fetching
**Criterios**: Zustand (10 pts) + TanStack Query (15 pts)

| ID | Change | Estado | Pts estimados |
|:--:|--------|:------:|:-------------:|
| 18 | `migracion-hacia-aprobacion` (Zustand stores, TanStack Query hooks, Axios interceptor) | 🏗️ Completo | **25** |

---

### FASE TPI-6: Frontend — Cliente + Panel Admin
**Criterios**: Funcionalidades Cliente (15 pts) + Panel Admin (15 pts)

| ID | Change | Estado | Pts estimados |
|:--:|--------|:------:|:-------------:|
| 13 | `frontend-dashboard-redesign` | ✅ Archivado TPI | 8 |
| 17 | `admin-dashboard-pages` | ✅ Archivado TPI (30/30) | 8 |
| **NUEVO** | `add-dashboard-graphs-and-cruds` | 🆕 **NO INICIADO** | **14** |

**`add-dashboard-graphs-and-cruds`** — Tareas pendientes:
- [ ] Instalar `recharts` en frontend
- [ ] Agregar gráficos al dashboard admin (ventas, pedidos por estado, productos populares)
- [ ] Crear CRUD de categorías desde frontend admin
- [ ] Crear CRUD de productos desde frontend admin (con relaciones)
- [ ] Crear gestión de stock desde frontend admin
- [ ] Agregar CRUD de direcciones en perfil de usuario

---

### FASE TPI-7: Calidad + Tests
**Criterios**: Calidad de Código (10 pts) + Bonus Tests (10 pts)

| ID | Change | Estado | Pts estimados |
|:--:|--------|:------:|:-------------:|
| 18 | `migracion-hacia-aprobacion` (coverage, CORS, README, screenshots) | 🏗️ **Pendiente tasks 14.x** | **20** |

**Pendiente** en `migracion-hacia-aprobacion`:
- [ ] 14.2: Subir cobertura de tests a ≥60%
- [ ] 14.8: Probar sandbox MP end-to-end (CE-09)
- [ ] 14.9: Verificar screenshots de 10 pantallas (CE-12)
- [ ] 14.10: Verificar video demo (CE-13)
- [ ] 14.11: Verificar endpoints Swagger usan `/api/v1`
- [ ] 14.12: Ejecutar `alembic upgrade head` en BD limpia
- [ ] 14.13: Ejecutar seed (debe ser idempotente)
- [ ] 14.14: README con instrucciones claras de setup (CE-02)
- [ ] CORS: cambiar `["*"]` por `["http://localhost:5173"]` desde config

---

### 📊 Progreso estimado hacia los 200 pts

| Fase | Pts totales | Estado actual | Con cambios nuevos |
|:----|:-----------:|:-------------:|:------------------:|
| TPI-1: Infraestructura | 10 | 8 | 10 ✅ |
| TPI-2: Modelo+UoW+Servicios | 45 | 35 | 45 ✅ |
| TPI-3: Controladores REST | 15 | 15 | 15 ✅ |
| TPI-4: MercadoPago | 15 | 4 | 15 ✅ |
| TPI-5: Frontend Estado | 25 | 25 | 25 ✅ |
| TPI-6: Frontend Cliente+Admin | 30 | 16 | 30 ✅ |
| TPI-7: Calidad+Tests | 20 | 10 | 20 ✅ |
| **TOTAL** | **200** | **~113** | **~160+** 🎯 |

---

## ✨ CAMBIOS EXTRAS — Fuera del TPI

Features ya implementadas que **NO suman puntos en la rúbrica** pero muestran trabajo adicional del equipo.

| Change | Feature | Justificación académica |
|--------|---------|------------------------|
| `add-product-reviews` | ⭐ Reseñas con estrellas, moderación admin | Interacción social, engagement de usuarios |
| `implement-favorites-wishlist` | ❤️ Lista de deseos por usuario | Personalización, retención de clientes |
| `add-notifications` | 🔔 Notificaciones in-app (campanita + página) | Experiencia de usuario, feedback en tiempo real |
| `frontend-dashboard-redesign` | 🌙 Dark mode | Accesibilidad, preferencias visuales |
| ✅ En código | 🏪 **Sucursales / Branches** (CRUD completo + frontend) | Gestión multi-sucursal |
| ✅ En código | 👥 **Employees** (página en frontend) | Gestión de personal |

> **Nota**: Estos cambios están archivados como completados. El código ya existe en el repositorio y puede ser mostrado como valor agregado durante la defensa del TPI.

---

## 🗑️ Features Eliminadas

Features que estaban implementadas pero fueron eliminadas por no pertenecer al alcance del TPI y no haber sido solicitadas:

| Feature | Motivo de eliminación |
|---------|----------------------|
| ~~Recommendation Engine~~ | No está en .txt, código sin uso real |
| ~~Prometheus Metrics~~ | No está en .txt, requiere infraestructura externa |
| ~~Health Checks (K8s)~~ | No está en .txt, solo útil con Kubernetes |
| ~~Email notifications~~ | No está en .txt, funcionalidad no requerida |

---

**Última actualización**: 2026-05-12
**Mantenido por**: OPSX Orchestrator
