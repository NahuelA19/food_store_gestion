# Changes — Qué son y cómo trabajar con ellos

## ¿Qué es un change?

Un **change** es la unidad mínima de trabajo en el flujo SDD. No es una tarea suelta ni un ticket — es un conjunto de tres artefactos que juntos describen, diseñan e implementan una funcionalidad del sistema de forma completa y trazable.

Cada change tiene su propia carpeta dentro de `openspec/changes/` y contiene exactamente estos tres archivos:

```
openspec/changes/nombre-del-change/
├── proposal.md   ← QUÉ se va a construir y POR QUÉ
├── design.md     ← CÓMO técnicamente (arquitectura, modelos, endpoints)
└── tasks.md      ← CHECKLIST atómica de implementación
```

Una vez que el change está completamente implementado y verificado, se **archiva**: las specs se sincronizan en `openspec/specs/` y la carpeta del change se mueve al historial. Esa documentación viva queda disponible para todos los changes futuros.

---

## ¿Para qué sirve?

- **Trazabilidad**: cada línea de código tiene una propuesta y un diseño que la justifica.
- **Revisión antes de implementar**: el diseño se aprueba en papel antes de que el agente escriba una sola línea de código. Un error en el diseño cuesta 0. El mismo error en código cuesta horas de refactor.
- **Contexto persistente**: cuando el agente empieza un nuevo change, lee las specs de los changes anteriores ya archivados. Sabe qué existe, qué patrones se usaron, y no propone código duplicado o inconsistente.
- **Documentación automática**: al terminar el proyecto, `openspec/specs/` es la documentación completa del sistema. No hay que escribirla por separado.

---

## ¿Cómo se generan?

Los changes **no se crean a mano** — los genera el agente a partir de los documentos del proyecto y las historias de usuario. El flujo es siempre el mismo:

### 1. Explorar (opcional)
Antes de proponer, podés pedirle al agente que piense y analice el problema:
```
/opsx:explore [tema o pregunta]
```
El agente investiga el codebase y razona con vos. No genera código ni toma compromisos. Útil cuando no tenés claro cómo encaja algo en la arquitectura.

### 2. Proponer
Le pedís al agente que genere los tres artefactos del change:
```
/opsx:propose [nombre-del-change]
```
El agente lee los documentos en `docs/`, las historias de usuario relevantes y las specs ya archivadas. Genera `proposal.md`, `design.md` y `tasks.md`.

**Antes de continuar, revisás los artefactos.** Verificás que:
- El diseño respeta la arquitectura en capas (Router → Service → UoW → Repository → Model)
- Las tareas son atómicas (horas, no días)
- Las reglas de negocio están reflejadas
- El stack tecnológico es el correcto

Si algo está mal, lo corregís antes de implementar.

### 3. Aplicar
Una vez aprobados los artefactos, el agente implementa tarea por tarea:
```
/opsx:apply [nombre-del-change]
```
El agente lee `design.md` y `tasks.md`, implementa cada tarea en orden y la marca como completada. No improvisa — sigue el plan.

### 4. Archivar
Cuando todas las tareas están completas y los tests pasan:
```
/opsx:archive [nombre-del-change]
```
Las specs se sincronizan, el change se mueve al historial y el próximo change ya puede usarlas como contexto.

---

## ¿Cómo saber qué changes crear para este proyecto?

Los changes **no están predefinidos** — son una decisión de diseño que tomás vos basándote en los documentos del sistema.

El agente ha analizado los tres documentos de `docs/` y propuesto el mapa completo de 23 changes organizados en 6 fases:

### Mapa de Changes — Food Store

**FASE 0 — Cimientos** (6-8 días, parallelizable):
1. **`infrastructure-setup`** → Monorepo, FastAPI, React, patrones base (US-000, US-000a-e)
2. **`database-domain-models`** → ERD completa, 18 entidades, Alembic migrations (estructura datos)
3. **`global-error-handling-validation`** → RFC 7807, Pydantic validators, rate limiting (US-068, US-074)

**FASE 1 — Autenticación** (7 días, secuencial):
4. **`authentication-system`** → Login, JWT, refresh tokens, rate limiting (US-001, US-002, US-003, US-004, US-073)
5. **`rbac-authorization`** → Roles CRUD, guards frontend, ownership checks (US-005, US-006, US-075, US-076)
6. **`user-management`** → CRUD usuarios, asignación roles, soft delete (US-053, US-054, US-055, US-061, US-062, US-063)

**FASE 2 — Catálogo** (5-6 días, parallelizable: categories + ingredients):
7. **`categories-hierarchy`** → CTE recursivo, validación ciclos, árbol anidado (US-007 a US-010)
8. **`ingredients-allergen-system`** → CRUD ingredientes, marcado alérgenos (US-011 a US-014)
9. **`products-catalog`** → CRUD, M2M categorías/ingredientes, stock, snapshots (US-015 a US-023)

**FASE 3 — Cliente** (5-6 días, parallelizable: cart + navigation):
10. **`client-addresses`** → CRUD direcciones, dirección principal única (US-024 a US-028)
11. **`shopping-cart-ui`** → 100% client-side Zustand + localStorage, personalización (US-029 a US-034)
12. **`navigation-layout`** → Header/Sidebar, token refresh transparente, guards (US-075, US-076, US-066, US-067)

**FASE 4 — Pedidos (CRÍTICA, 12-14 días, secuencial):**
13. **`order-creation-uow-atomic`** → Transacción atómica, snapshots, SELECT FOR UPDATE (US-035 a US-038, US-069, US-070) **[PIVOT]**
14. **`payment-mercadopago-integration`** → Orders API, webhooks IPN, idempotencia (US-045 a US-048)
15. **`order-fsm-state-machine`** → 6 estados, transiciones validadas, historial append-only (US-039 a US-044)
16. **`order-visualization`** → Listado, detalle, tracking, timeline de estados (US-049 a US-052)
17. **`payment-ui-feedback`** → Modal confirmación, return URLs MercadoPago, toasts (US-071, US-072)

**FASE 5 — Admin** (5 días, parallelizable):
18. **`admin-dashboard-metrics`** → KPIs, gráficos ventas, top productos, Recharts (US-056 a US-059)
19. **`admin-catalog-management`** → CRUD avanzado con permisos, bulk stock (US-064, US-065)
20. **`system-configuration`** → Key-value store, configuración global, auditoría (US-060)

**FASE 6 — Refinamiento** (5-8 días):
21. **`testing-coverage-pytest`** → Tests > 60% cobertura, fixtures (Bonus +10 pts)
22. **`deployment-railway-or-render`** → URL pública, secrets management (Bonus +10 pts)
23. **`documentation-comprehensive`** → README, Swagger /docs, ReDoc, arquitectura

**Estimación total**: 45-57 días (2-3 meses con 1-2 devs) · 30-40 días (~6-8 semanas con 3+ devs en paralelo)

Revisás la propuesta, la discutís, la ajustás si hace falta — y recién entonces empezás con el primer `/opsx:propose`.

---

## Reglas importantes

- **Nunca implementes sin artefactos.** Si no existe `proposal.md` y `design.md` aprobados, no hay `/opsx:apply`.
- **El orden importa.** Si el change B necesita código del change A, A tiene que estar archivado antes de proponer B.
- **Un change = un commit** (o varios commits atómicos). Nunca mezcles dos changes en un mismo commit.
- **Las specs son código.** Se versionan en git, se revisan en PRs, evolucionan con el proyecto.
