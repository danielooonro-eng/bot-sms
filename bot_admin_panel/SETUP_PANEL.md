# 🐣 LittlePay Admin Panel - Guía de Instalación

Panel de administración completo para el bot SMS LittlePay. Administra usuarios, visualiza analíticas, gestiona notificaciones y más.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Base de datos Supabase configurada
- Credenciales del bot Telegram
- Variables de entorno configuradas

## 🚀 Instalación Rápida

### 1. Clonar el repositorio

```bash
cd bot_admin_panel/nextjs_space
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto Next.js:

```bash
cp .env.example .env.local
```

Luego edita `.env.local` y configura las siguientes variables:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@host:port/database"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Admin Authentication
ADMIN_EMAIL="danielooonro@gmail.com"
ADMIN_PASSWORD_HASH="hash-of-password"
JWT_SECRET="your-secret-key-min-32-chars"

# Bot Configuration
BOT_NAME="LittlePay"
BOT_TOKEN="your-telegram-token"
FIVESIM_API="your-5sim-api-key"

# Environment
NODE_ENV="production"
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

El panel estará disponible en `http://localhost:3000`

### 5. Build para producción

```bash
npm run build
npm start
```

## 🔐 Credenciales de Acceso

Por defecto, el panel usa las siguientes credenciales:

```
Email: danielooonro@gmail.com
Contraseña: dansms@r
```

⚠️ **Importante**: Cambia estas credenciales en producción modificando el archivo `.env.local`

## 📊 Funcionalidades

### Dashboard Principal
- Métricas de usuarios registrados
- Usuarios activos (últimos 7, 30 días)
- Total números rentados
- Ingresos totales
- Tasa de crecimiento
- Historial de actividades recientes

### Analytics
- Países más solicitados (Top 10)
- Servicios más frecuentes (Top 10)
- Ingresos por período
- Actividad de usuarios

### Gestión de Usuarios
- Tabla con todos los usuarios
- Búsqueda y filtros
- Bloquear/desbloquear usuarios
- Ver detalles y historial

### Logs de Auditoría
- Registro completo de acciones
- Filtros por tipo y fecha
- Descargar en CSV/JSON
- Paginación

### Notificaciones
- Enviar mensajes a usuarios específicos
- Opción "Enviar a todos"
- Historial con estado de entrega

### Configuración
- Editar límites del bot
- Cambiar contraseña del admin
- Modo mantenimiento
- Variables de configuración

## 🗄️ Estructura de Supabase

### Tabla: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  credits INTEGER DEFAULT 0,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP,
  rented_numbers JSONB DEFAULT '[]',
  transactions JSONB DEFAULT '[]'
);
```

### Tabla: audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR NOT NULL,
  user_id BIGINT,
  admin_id VARCHAR,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id BIGINT,
  message TEXT NOT NULL,
  title VARCHAR,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR
);
```

### Tabla: bot_settings
```sql
CREATE TABLE bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_users INTEGER DEFAULT 1000,
  max_numbers_per_user INTEGER DEFAULT 5,
  credit_price DECIMAL DEFAULT 1.0,
  min_credits_to_buy INTEGER DEFAULT 1,
  sms_timeout_minutes INTEGER DEFAULT 20,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuración Avanzada

### Temas
El panel soporta tema oscuro automático (predeterminado) y tema claro.

### Autenticación
La autenticación usa JWT tokens guardados en cookies seguras.
- Duración: 24 horas
- HttpOnly: Sí
- Secure: Sí (en producción)
- SameSite: Lax

### API Routes
Todas las API routes requieren autenticación. Verifican el token JWT en la cookie `session`.

## 🚨 Troubleshooting

### "No se puede conectar a Supabase"
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` y las claves estén correctas
- Confirma que tu base de datos está activa

### "Error de autenticación"
- Asegúrate de que las credenciales en `.env.local` son correctas
- Limpia las cookies del navegador e intenta de nuevo

### "Las tablas no existen"
- Ejecuta los scripts SQL en tu base de datos Supabase
- Verifica que el usuario tenga permisos para crear tablas

## 📱 Respaldo y Recuperación

### Exportar datos
```bash
npm run export:users
npm run export:logs
npm run export:settings
```

### Importar datos
```bash
npm run import:users <file>
npm run import:logs <file>
```

## 🔒 Seguridad

### Mejores prácticas implementadas:
- ✅ JWT token authentication
- ✅ CORS protection
- ✅ SQL injection prevention
- ✅ XSS protection (Helmet)
- ✅ Rate limiting
- ✅ Input validation
- ✅ HTTPS in production
- ✅ Secure cookies

## 📝 Logs y Debugging

Los logs del servidor se guardan en `/logs` y incluyen:
- Intentos de acceso
- Cambios de configuración
- Errores de la aplicación
- Acciones del admin

## 🔄 Actualizaciones

Para actualizar las dependencias:

```bash
npm update
npm audit fix
```

## 📞 Soporte

Para problemas o preguntas:
1. Revisa este documento
2. Comprueba los logs
3. Verifica la configuración de Supabase

## 📜 Licencia

Este proyecto es parte de LittlePay Bot.

---

**Versión:** 1.0.0  
**Última actualización:** Abril 2026
