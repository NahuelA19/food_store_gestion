## Why

El sistema actual no dispone de datos de mercado sobre precios de commodities (trigo, maíz, soja, azúcar, etc.) que son insumos críticos para la industria alimenticia. Tener un histórico diario de precios permite:
- Analizar tendencias y estacionalidad de costos de materias primas
- Tomar decisiones informadas sobre precios de productos finales
- Generar reportes de correlación entre costo de insumos y precios de venta
- Preparar el terreno para un módulo de predicción de costos a futuro

## What Changes

- Nuevo modelo de datos `commodity_prices` para almacenar precios históricos diarios de commodities
- Cliente HTTP asíncrono para consumir la API de commodities (`commodities-api.com`)
- Servicio ETL que orquesta: fetch → transform → persist
- Scheduler diario con APScheduler integrado al lifespan de FastAPI
- Endpoint REST para consultar precios históricos y disparar el ETL manualmente
- Tests unitarios y de integración para todo el pipeline

## Capabilities

### New Capabilities
- `commodities-etl`: Pipeline ETL que obtiene precios diarios de commodities desde una API externa, los transforma al modelo interno y los persiste en la base de datos con timestamp de la corrida.

### Modified Capabilities
- *(ninguna — es funcionalidad completamente nueva, no modifica requisitos de specs existentes)*

## Impact

- **Backend**: nuevo módulo `app/modules/commodities/` con model, schema, repo, service, router
- **Base de datos**: nueva tabla `commodity_prices` + migración Alembic
- **Dependencias**: se agrega `APScheduler` a `requirements.txt`
- **Config**: nuevas variables de entorno para API key de commodities y scheduler
- **API**: nuevo router `/api/v1/commodities` con endpoints GET (consulta histórica) y POST (trigger manual)
- **No impacta** frontend, auth, payments, órdenes ni ningún módulo existente

## Cumplimiento TPI

Este change no está directamente evaluado por la rúbrica del TPI, pero sienta las bases para funcionalidades de análisis de costos que podrían integrarse en futuras entregas. Respeta todas las restricciones arquitectónicas del proyecto:
- Capas: Router → Service → UnitOfWork → Repository → Model
- UnitOfWork para transacciones (sin `db.commit()` directo)
- Prefijo `/api/v1` en todos los endpoints
- Async en toda la cadena
- Pydantic v2 para schemas de request/response
