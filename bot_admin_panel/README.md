# 🐣 LittlePay Admin Panel

Panel de administración completo y profesional para el bot SMS LittlePay. Construido con Next.js, TypeScript y Tailwind CSS.

## ✨ Características

### 🔐 Autenticación
- Login seguro con JWT tokens
- Cookies seguras (HttpOnly)
- Protección de rutas con middleware
- Sesiones de 24 horas

### 📊 Dashboard Principal
- Métricas en tiempo real
- Usuarios registrados y activos
- Números rentados (histórico y por período)
- Ingresos totales
- Tasa de crecimiento
- Historial de últimas 10 actividades
- Selector de período (7d, 30d, 90d, personalizado)

### 📈 Analytics
- Gráfico de barras: Top 10 países más solicitados
- Gráfico de pie: Top 10 servicios más frecuentes
- Gráfico de líneas: Ingresos por período
- Gráfico de líneas: Actividad de usuarios (registros nuevos)
- Filtros por período configurables

### 👥 Gestión de Usuarios
- Tabla completa con información de usuarios
- Búsqueda por ID Telegram, nombre
- Filtros por estado (activo/bloqueado)
- Ver detalles del usuario
- Bloquear/desbloquear usuarios
- Ver historial de transacciones
- Datos mostrados:
  - ID Telegram
  - Nombre
  - Saldo/créditos
  - Fecha de registro
  - Última actividad
  - Números rentados totales
  - Estado (activo/bloqueado)

### 📋 Logs de Auditoría
- Registro completo de todas las acciones
- Filtros por tipo de acción y fecha
- Búsqueda
- Descargar en CSV
- Descargar en JSON
- Paginación
- Acciones registradas:
  - Creación de usuarios
  - Números rentados
  - Pagos/transacciones
  - Usuarios bloqueados
  - Cambios de configuración

### 📢 Notificaciones
- Formulario para enviar mensajes
- Enviar a usuario específico
- Opción "Enviar a todos los usuarios"
- Historial de notificaciones enviadas
- Título y mensaje configurables
- Estado de entrega (enviado/pendiente)

### ⚙️ Configuración del Bot
- Editar límites del bot
- Máximo de usuarios
- Máx. números por usuario
- Precio por crédito
- Créditos mínimos para comprar
- Timeout para SMS
- Modo mantenimiento
- Cambiar contraseña del admin
- Guardar cambios en base de datos

### 🎨 Interfaz & Diseño
- Tema oscuro profesional
- Sidebar navegable
- Header con reloj y perfil
- Componentes de UI modernos
- Icons de lucide-react
- Responsive (Mobile, tablet, desktop)
- Loading states y spinners
- Toast notifications
- Animaciones suaves

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 14
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: JWT + Cookies
- **Gráficos**: Recharts
- **UI Components**: Radix UI
- **Forms**: React Hook Form
- **Notificaciones**: React Hot Toast

## 📦 Instalación

### Requisitos previos
- Node.js 18+
- npm o yarn
- Base de datos Supabase

### Pasos de instalación

1. **Clonar el repositorio**
```bash
cd bot_admin_panel/nextjs_space
```

2. **Instalar dependencias**
```bash
npm install --legacy-peer-deps
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales.

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Acceder al panel**
- URL: http://localhost:3000
- Email: danielooonro@gmail.com
- Contraseña: dansms@r

## 🏗️ Estructura del Proyecto

```
nextjs_space/
├── app/
│   ├── admin/                 # Páginas del panel
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── analytics/        # Gráficos y análisis
│   │   ├── users/           # Gestión de usuarios
│   │   ├── logs/            # Logs de auditoría
│   │   ├── notifications/   # Sistema de notificaciones
│   │   ├── settings/        # Configuración
│   │   └── layout.tsx       # Layout del admin
│   ├── api/                  # API Routes
│   │   ├── auth/            # Autenticación
│   │   ├── dashboard/       # Métricas y actividades
│   │   ├── analytics/       # Datos de gráficos
│   │   ├── users/           # Operaciones con usuarios
│   │   ├── logs/            # Logs
│   │   ├── notifications/   # Notificaciones
│   │   └── settings/        # Configuración
│   ├── login/               # Página de login
│   ├── layout.tsx           # Layout global
│   └── page.tsx             # Página de inicio
├── components/
│   ├── admin/               # Componentes del admin
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── ui/                  # Componentes UI reutilizables
│   └── layouts/             # Layouts
├── lib/
│   ├── auth.ts              # Funciones de autenticación
│   ├── db.ts                # Conexión a Supabase
│   ├── types.ts             # Tipos TypeScript
│   └── api-utils.ts         # Utilidades para APIs
├── middleware.ts            # Middleware de autenticación
├── .env.example             # Variables de entorno (ejemplo)
├── .env.local               # Variables de entorno (local)
└── package.json             # Dependencias
```

## 🔧 Configuración de Supabase

El panel requiere las siguientes tablas en Supabase:

- `users`: Datos de usuarios
- `audit_logs`: Registro de acciones
- `notifications`: Historial de notificaciones
- `bot_settings`: Configuración del bot

Ver `SETUP_PANEL.md` para instrucciones SQL completas.

## 🚀 Despliegue

### En Vercel (Recomendado)

```bash
vercel deploy
```

### En tu propio servidor

```bash
npm run build
npm start
```

## 📚 Documentación

- `SETUP_PANEL.md`: Guía completa de instalación y configuración
- `.env.example`: Variables de entorno requeridas
- `lib/types.ts`: Definición de tipos TypeScript

## 🔐 Seguridad

✅ Implementado:
- Autenticación JWT
- Cookies seguras (HttpOnly, Secure, SameSite)
- Protección de rutas
- Validación de entrada
- Manejo de errores
- CORS protection

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Dashboard
- `GET /api/dashboard/metrics` - Métricas
- `GET /api/dashboard/activities` - Actividades

### Analytics
- `GET /api/analytics/data` - Datos de gráficos

### Usuarios
- `GET /api/users` - Lista de usuarios
- `POST /api/users/[userId]/block` - Bloquear/desbloquear

### Logs
- `GET /api/logs` - Logs
- `GET /api/logs/export` - Exportar

### Notificaciones
- `GET /api/notifications` - Historial
- `POST /api/notifications/send` - Enviar

### Configuración
- `GET /api/settings` - Obtener
- `POST /api/settings` - Guardar
- `POST /api/settings/password` - Cambiar contraseña

## 🐛 Troubleshooting

### Login no funciona
**Problema**: El login falla o no redirige al dashboard  
**Solución**:
1. Verifica que las credenciales sean correctas: `danielooonro@gmail.com` / `dansms@r`
2. Asegúrate de que `.env.local` está configurado correctamente con:
   ```
   ADMIN_EMAIL="danielooonro@gmail.com"
   JWT_SECRET="littlepay-admin-panel-secret-key-development-mode-2024"
   ```
3. Limpia las cookies del navegador (Ctrl+Shift+Del)
4. Reinicia el servidor (`npm run dev`)
5. Intenta de nuevo

### Error de conexión a Supabase
Verifica que las variables de entorno sean correctas en `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

### Error de autenticación
Limpia las cookies del navegador e intenta de nuevo. Los tokens JWT tienen validez de 24 horas.

### Build falla
Usa `npm install --legacy-peer-deps` para resolver conflictos de dependencias

### Las rutas del admin no funcionan
Asegúrate de que los enlaces apunten a `/admin/*` y no a `/*`. Verifica `components/admin/sidebar.tsx`

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es parte de LittlePay Bot.

## 📞 Soporte

Para problemas o preguntas, verifica:
1. La documentación en `SETUP_PANEL.md`
2. Los logs de la aplicación
3. La configuración de Supabase

---

**Version**: 1.0.0  
**Última actualización**: Abril 2026  
**Autor**: Abacus AI
