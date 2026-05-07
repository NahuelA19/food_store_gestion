# 🍕 Food Store — Development Setup Guide

Este documento explica cómo configurar el entorno de desarrollo con Docker PostgreSQL.

---

## ⚡ Setup Rápido (Recomendado)

### Opción 1: Script Automático (Linux/macOS/WSL)

```bash
# Hacer el script ejecutable
chmod +x scripts/setup-dev.sh

# Ejecutar setup
bash scripts/setup-dev.sh
```

El script:
- ✅ Verifica que tengas Docker y Python instalados
- ✅ Levanta PostgreSQL en Docker
- ✅ Crea virtual environment de Python
- ✅ Instala dependencias (backend + frontend)
- ✅ Aplica migraciones de base de datos
- ✅ Configura variables de entorno

### Opción 2: Manual (Windows / si prefieres control total)

**Paso 1: Levanta PostgreSQL**

```bash
docker-compose up -d postgres
```

Espera a que muestre "✓ PostgreSQL is running and ready". Verifica:

```bash
docker-compose logs postgres
```

**Paso 2: Backend**

```bash
cd backend

# Crea virtual environment (primera vez)
python -m venv venv

# Activa venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Instala dependencias
pip install -r requirements.txt

# Copia el archivo .env
cp .env.docker-example .env

# Aplica migraciones
alembic upgrade head

# Verifica que funcione
uvicorn app.main:app --reload
# API estará en http://localhost:8000
```

**Paso 3: Frontend**

```bash
# (en otra terminal, en la raíz del proyecto)
npm install

# Configura .env si no existe
cat > frontend/.env.local << 'EOF'
VITE_API_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000
VITE_ENV=development
VITE_DEBUG=true
EOF

# Arranca el frontend
npm run dev --workspace frontend
# Frontend estará en http://localhost:5173
```

---

## 📋 Estructura de Docker

### docker-compose.yml

Define un servicio **PostgreSQL** con:
- ✅ Image: `postgres:18-alpine` (ligero y moderno)
- ✅ Volumen persistente: `postgres_data` (datos no se pierden si bajas el contenedor)
- ✅ Inicialización automática: `docker/init-db.sql` (crea user + bases de datos)
- ✅ Health check: verifica que PostgreSQL esté listo
- ✅ Networking: red privada `food_store_network` para comunicación segura

### docker/init-db.sql

Script SQL que se ejecuta automáticamente al iniciar el contenedor:

```sql
-- Crea usuario de aplicación
CREATE USER food_store_user WITH PASSWORD 'root';

-- Crea base de datos de desarrollo
CREATE DATABASE food_store OWNER food_store_user;

-- Crea base de datos de testing
CREATE DATABASE food_store_test OWNER food_store_user;

-- Da permisos al usuario
GRANT ALL PRIVILEGES ON DATABASE food_store TO food_store_user;
GRANT ALL PRIVILEGES ON DATABASE food_store_test TO food_store_user;
```

**Credenciales por defecto:**
- **Usuario**: `food_store_user`
- **Contraseña**: `root`
- **Host**: `postgres` (desde dentro de Docker) o `localhost` (desde tu máquina)
- **Puerto**: `5432`
- **Bases de datos**: `food_store` (dev), `food_store_test` (testing)

### backend/.env.docker-example

Archivo de ejemplo con la configuración correcta para Docker:

```env
DATABASE_URL=postgresql+asyncpg://food_store_user:root@postgres:5432/food_store
```

Cópialo a `backend/.env` y ajusta si necesitas.

---

## 🚀 Comandos Útiles

### PostgreSQL

```bash
# Ver logs
docker-compose logs postgres

# Acceder a psql (cliente de PostgreSQL)
docker-compose exec postgres psql -U food_store_user -d food_store

# Consultas útiles en psql
\dt                           # Ver tablas
SELECT * FROM users;          # Listar usuarios
\l                            # Listar bases de datos
\du                           # Listar usuarios de PostgreSQL

# Detener y remover (sin perder datos)
docker-compose down

# Remover TODO (incluyendo datos)
docker-compose down -v
```

### Backend

```bash
# Activar virtual environment
cd backend
source venv/bin/activate  # macOS/Linux
# o
venv\Scripts\activate     # Windows

# Instalar/actualizar dependencias
pip install -r requirements.txt

# Ejecutar servidor de desarrollo
uvicorn app.main:app --reload

# Ejecutar tests
python -m pytest -v

# Ejecutar tests específicos
python -m pytest tests/test_auth.py -v

# Ver cobertura
python -m pytest --cov=app

# Ejecutar linting
ruff check .
black .
mypy app/ --strict
```

### Frontend

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev --workspace frontend

# Tests
npm run test --workspace frontend

# Linting
npm run lint --workspace frontend

# Build para producción
npm run build --workspace frontend
```

---

## ✅ Verificar que todo funciona

### 1. PostgreSQL

```bash
docker-compose exec postgres psql -U food_store_user -d food_store -c "SELECT 1;"
# Deberías ver: ?column?
#      1
```

### 2. Backend

```bash
cd backend
source venv/bin/activate
python -c "import app.main; print('✓ Backend imports OK')"

# Intenta conectar a la BD
python -c "from database.client import init_engine; import asyncio; asyncio.run(init_engine())"
# Si no hay error, la BD está OK
```

### 3. Frontend

```bash
cd frontend
npm --version  # Verifica que npm esté instalado
# Deberías ver algo como: 10.x.x
```

---

## 🔧 Troubleshooting

### Error: "postgres container is not running"

```bash
# Verifica el estado
docker-compose ps

# Si no está corriendo:
docker-compose up -d postgres

# Espera unos segundos y verifica que esté healthy
docker-compose ps
```

### Error: "Cannot connect to postgres"

```bash
# 1. Verifica que el contenedor esté corriendo
docker-compose ps

# 2. Verifica los logs
docker-compose logs postgres

# 3. Intenta reiniciar
docker-compose restart postgres
```

### Error: "Database food_store does not exist"

```bash
# Significa que init-db.sql no se ejecutó
# Borra el volumen y reinicia
docker-compose down -v
docker-compose up -d postgres

# Espera 10 segundos a que se ejecute el script de inicialización
sleep 10

# Verifica
docker-compose exec postgres psql -U food_store_user -d food_store -c "\l"
```

### Error: "Permission denied" en Python

```bash
# En Linux/macOS, activa el venv:
source backend/venv/bin/activate

# En Windows:
backend\venv\Scripts\activate
```

### Error: "pip: command not found"

```bash
# Verifica que tengas Python 3.10+
python3 --version

# Usa pip3 en lugar de pip si es necesario
pip3 install -r requirements.txt
```

---

## 📚 Documentación Relacionada

- **AGENTS.md** — Instrucciones para contribuidores
- **docs/AUTHENTICATION.md** — Cómo funciona JWT
- **docs/CHANGES.md** — Roadmap del proyecto
- **backend/AGENTS.md** — Instrucciones para el backend
- **README.md** — Overview del proyecto

---

## 🤝 Contribuyendo

1. **Baja el repo**
   ```bash
   git clone https://github.com/NahuelA19/food_store_gestion.git
   cd food_store_gestion
   ```

2. **Ejecuta setup**
   ```bash
   bash scripts/setup-dev.sh
   ```

3. **Crea una rama**
   ```bash
   git checkout -b feat/my-feature
   ```

4. **Haz cambios, commitea**
   ```bash
   git commit -m "feat(users): add something cool"
   ```

5. **Pushea y abre PR**
   ```bash
   git push origin feat/my-feature
   ```

---

## ❓ Preguntas?

Si algo no funciona:
1. Revisa los logs: `docker-compose logs postgres`
2. Verifica que Docker esté corriendo
3. Intenta `docker-compose down -v && docker-compose up -d postgres`
4. Abre un issue en GitHub

---

**Last updated**: 2026-05-07  
**Maintainer**: Food Store Team
