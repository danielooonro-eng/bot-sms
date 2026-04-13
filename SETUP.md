# 📋 Guía de Configuración: Migrar LittlePay a Supabase

## 1️⃣ Crear Proyecto en Supabase

### Paso 1: Registrarse y crear proyecto
1. Ve a https://supabase.com
2. Haz clic en **"Sign In"** y crea una cuenta (o inicia sesión)
3. Haz clic en **"New Project"**
4. Completa:
   - **Name**: `littlepay-bot` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura
   - **Region**: Elige la más cercana a ti (ej: `us-east-1` para América)
5. Haz clic en **"Create new project"** y espera a que se inicialice (2-3 min)

### Paso 2: Obtener credenciales
1. Una vez creado el proyecto, ve al menú lateral izquierdo
2. Haz clic en **"Settings"** (engranaje en la esquina inferior izquierda)
3. Ve a **"API"**
4. Copia y guarda estos valores:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## 2️⃣ Crear la Tabla de Usuarios

### Paso 1: Abrir SQL Editor
1. En Supabase, ve a **"SQL Editor"** en el menú lateral izquierdo
2. Haz clic en **"New Query"**

### Paso 2: Ejecutar el script SQL
Copia y ejecuta este SQL:

```sql
-- Crear tabla users
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL,
  credits INT NOT NULL DEFAULT 0,
  order_id TEXT,
  service VARCHAR(50),
  history TEXT[] DEFAULT '{}',
  message_id BIGINT,
  has_photo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice en user_id para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);

-- Habilitar Row Level Security (opcional pero recomendado)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Crear política de acceso anónimo (CUIDADO: esto es para desarrollo)
-- En producción, asegúrate de tener políticas más restrictivas
CREATE POLICY "Allow anon read/write" ON public.users
FOR ALL
USING (true)
WITH CHECK (true);
```

### Paso 3: Verificar tabla creada
1. Ve a **"Table Editor"** en el menú lateral
2. Deberías ver una tabla llamada `users`
3. Si ves columnas como `user_id`, `credits`, `history`, etc., ¡está correcto!

## 3️⃣ Configurar Variables de Entorno

### Actualizar .env
Edita el archivo `.env` con tus credenciales:

```bash
# Telegram
TELEGRAM_TOKEN=8350072112:AAGyAPx8xkXUQzpQLjwTEPO6fzLVEBtx_0I

# 5Sim API
FIVESIM_API=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4MDY3NDk1ODQsImlhdCI6MTc3NTIxMzU4NCwicmF5IjoiMGRjMzkxYWZkYzY2M2U3ZTEwMDE2NDYwYzk0YjVlYzMiLCJzdWIiOjM1MjM0Mjl9.znDvm0_FaMuTAgzYkqydgaLWBvEVLTIvYKPxIYse2Yle6_i2PR7I_8Wohx8O68qW3s7KbA2NrvXX6io1SQc3bUHkedPrxYJW2t7Q28AKSfsW2sRpDfZOvi5zSZckNs2IGo8XXXnPEI2OdoQoSxqsYdc3NurSnNBhB2rD2B-gSI4kMm1yHzj3DTP6TB5OXfs7bMGogWSfj80AaeHNZdz70_E6z9umwOTWySnmgUYvByltHY7PTUj-X3HgerfGSMaj7JBVx8qJJdVS3bKPsCCdy8kfpphmql6onT2Caj2OnnA6i8qLVqH4YfZ50Ko73F1s2S6fYESHXaNy1ceRgnuYCw

# Supabase - REEMPLAZA CON TUS VALORES
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-aqui
```

## 4️⃣ Instalar Dependencias

```bash
npm install
```

Esto instala:
- `@supabase/supabase-js` - Cliente de Supabase
- `axios` - Peticiones HTTP
- `dotenv` - Variables de entorno
- `node-telegram-bot-api` - Bot de Telegram

## 5️⃣ Ejecutar la Migración

### Si tienes un archivo users.json antiguo:

```bash
npm run migrate
```

Este comando:
1. Lee el archivo `users.json` local
2. Conecta a tu base de datos Supabase
3. Copia todos los usuarios a la tabla `users`
4. Muestra un resumen de usuarios migrados

**Nota**: Si no tienes `users.json`, puedes saltar este paso. El bot creará usuarios automáticamente cuando se registren.

## 6️⃣ Ejecutar el Bot

```bash
npm start
```

**Salida esperada**:
```
🐣 LittlePay Bot corriendo con Supabase...
```

Si ves este mensaje, ¡el bot está conectado a Supabase exitosamente! 🎉

## 🔄 Cambios Principales Respecto al Original

### Almacenamiento
| Función | Antes (JSON) | Ahora (Supabase) |
|---------|-------------|------------------|
| Cargar usuario | `loadUsers()` | `getUser(id)` async |
| Guardar cambios | `saveUsers()` | `updateUser(id, data)` async |
| Agregar evento | Manual | `addHistory(id, event)` async |
| Persistencia | Archivo local | Base de datos en la nube |

### Ventajas de Supabase
✅ **Escalabilidad**: Maneja miles de usuarios sin problemas
✅ **Confiabilidad**: Tu base de datos está respaldada en la nube
✅ **Acceso remoto**: Accede a datos desde cualquier lugar
✅ **Dashboard web**: Visualiza y edita datos directamente en Supabase
✅ **Backups automáticos**: Supabase hace respaldos diarios

## 🐛 Solución de Problemas

### Error: "SUPABASE_URL o SUPABASE_ANON_KEY no definidas"
→ Verifica que .env tenga las variables correctas (ver paso 3)

### Error: "Cannot find table 'users'"
→ Ejecuta el script SQL para crear la tabla (ver paso 2)

### Error: "No se pudo conectar a Supabase"
→ Verifica que SUPABASE_URL sea correcto (debe ser https://xxx.supabase.co)

### La migración no funciona
→ Asegúrate de que:
1. El archivo `users.json` existe en la raíz del proyecto
2. El `.env` tenga `SUPABASE_SERVICE_ROLE_KEY` (para migración)
3. La tabla `users` ya existe en Supabase

## 📊 Verificar Datos en Supabase

1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla `users`
3. Verás todas las columnas y registros de usuarios
4. Puedes editar datos manualmente si es necesario

## 🔐 Seguridad

Para producción, considera:
- Usar `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor (no en cliente)
- Configurar Row Level Security (RLS) para limitar acceso
- Cambiar políticas de acceso público a más restrictivas
- Usar variables de entorno seguras (secrets en tu plataforma de hosting)

## 📞 Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs del bot: busca mensajes `Error` o `❌`
2. Verifica credenciales de Supabase en `.env`
3. Prueba la conexión con un `node migracion.js` simple
4. Consulta documentación de Supabase: https://supabase.com/docs

---

**¡Listo!** Tu bot ahora usa Supabase en lugar de archivos JSON locales. 🚀
