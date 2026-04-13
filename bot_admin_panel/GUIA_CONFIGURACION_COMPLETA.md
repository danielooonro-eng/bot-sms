# GUÍA COMPLETA DE CONFIGURACIÓN Y DESPLIEGUE DEL PANEL DE ADMINISTRACIÓN

**Versión:** 1.0  
**Última actualización:** Abril 2025  
**Autor:** Bot Admin Panel Team  
**Estado:** Actualizado

---

## TABLA DE CONTENIDOS

1. [REQUISITOS PREVIOS](#1-requisitos-previos)
2. [ESTRUCTURA DEL PROYECTO](#2-estructura-del-proyecto)
3. [CONFIGURACIÓN DE SUPABASE](#3-configuración-de-supabase)
4. [CONFIGURACIÓN DE VARIABLES DE ENTORNO](#4-configuración-de-variables-de-entorno)
5. [INSTALACIÓN DE DEPENDENCIAS](#5-instalación-de-dependencias)
6. [EJECUCIÓN EN DESARROLLO](#6-ejecución-en-desarrollo-local)
7. [DESPLIEGUE EN PRODUCCIÓN](#7-despliegue-en-producción-vercel)
8. [VERIFICACIÓN POST-DESPLIEGUE](#8-verificación-post-despliegue)
9. [TROUBLESHOOTING COMÚN](#9-troubleshooting-común)
10. [COMANDOS ÚTILES](#10-comandos-útiles)
11. [ESTRUCTURA DE ARCHIVOS IMPORTANTES](#11-estructura-de-archivos-importantes)

---

## 1. REQUISITOS PREVIOS

### 1.1 Software Requerido

#### Node.js y npm

**¿Qué es?**  
Node.js es el entorno de ejecución de JavaScript que necesita Next.js para funcionar. npm es el gestor de paquetes que instala las dependencias del proyecto.

**Versión requerida:**
- **Node.js:** versión 16.x o superior (recomendado: 18.x o 20.x)
- **npm:** versión 8.x o superior

#### Git (Opcional pero recomendado)

Si planea desplegar en Vercel desde GitHub, necesitará Git.

---

### 1.2 Cómo Verificar si Ya Tiene Instalado

Abra una terminal y ejecute estos comandos:

```bash
# Verificar versión de Node.js
node --version

# Verificar versión de npm
npm --version

# Verificar si tiene Git instalado (opcional)
git --version
```

**Resultado esperado:**
```
v18.16.0    # (para Node.js)
8.15.1      # (para npm)
git version 2.34.1  # (para Git)
```

---

### 1.3 Instalación si No Tiene el Software

#### Para Linux (Distribuciones basadas en Debian/Ubuntu)

```bash
# Actualizar el gestor de paquetes
sudo apt update

# Instalar Node.js y npm
sudo apt install -y nodejs npm

# Instalar Git (opcional pero recomendado)
sudo apt install -y git

# Verificar instalación
node --version
npm --version
```

#### Para macOS

Usando Homebrew:

```bash
# Instalar Homebrew si no lo tiene
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js y npm
brew install node

# Instalar Git
brew install git

# Verificar instalación
node --version
npm --version
```

#### Para Windows

1. Descargar desde: https://nodejs.org/ (descargar LTS)
2. Ejecutar el instalador (.msi)
3. Seguir las instrucciones del instalador
4. Reiniciar la computadora
5. Abrir PowerShell y verificar: `node --version`

**Descarga directa:**
- Node.js LTS: https://nodejs.org/en/download/
- Git for Windows: https://git-scm.com/download/win

---

### 1.4 Requisitos de Cuenta

Para que el panel funcione completamente, necesitará:

1. **Cuenta de Supabase** (base de datos)
   - Regístrese en: https://supabase.com
   - Cree un proyecto nuevo

2. **Cuenta de Vercel** (despliegue en producción)
   - Regístrese en: https://vercel.com
   - Opcional, solo si quiere desplegar en producción

3. **Cuenta de GitHub** (recomendado para despliegue)
   - Regístrese en: https://github.com
   - Facilita el despliegue en Vercel

---

## 2. ESTRUCTURA DEL PROYECTO

### 2.1 Ubicación del Proyecto

El proyecto está ubicado en:

```
/home/ubuntu/bot_admin_panel/
```

El código fuente de Next.js está en:

```
/home/ubuntu/bot_admin_panel/nextjs_space/
```

### 2.2 Estructura de Carpetas

```
/home/ubuntu/bot_admin_panel/
├── nextjs_space/                    # Raíz del proyecto Next.js
│   ├── app/                         # Carpeta principal de la aplicación (App Router)
│   │   ├── page.tsx                 # Página de inicio
│   │   ├── login/                   # Página de login
│   │   │   └── page.tsx
│   │   ├── dashboard/               # Panel de administración
│   │   │   ├── page.tsx
│   │   │   ├── users/               # Gestión de usuarios
│   │   │   ├── numbers/             # Gestión de números
│   │   │   ├── campaigns/           # Gestión de campañas
│   │   │   └── settings/            # Configuración
│   │   ├── layout.tsx               # Layout principal
│   │   ├── api/                     # Rutas de API
│   │   │   ├── auth/                # Autenticación
│   │   │   ├── users/               # Endpoints de usuarios
│   │   │   └── [...]
│   │   └── globals.css              # Estilos globales
│   ├── public/                      # Archivos estáticos (imágenes, etc)
│   ├── components/                  # Componentes reutilizables
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── UserTable.tsx
│   │   └── [...]
│   ├── lib/                         # Librerías y utilidades
│   │   ├── supabase-client.ts       # Cliente de Supabase
│   │   ├── auth.ts                  # Funciones de autenticación
│   │   └── utils.ts                 # Utilidades
│   ├── .env.local                   # VARIABLES DE ENTORNO (CRÍTICO)
│   ├── .env.example                 # Ejemplo de variables
│   ├── next.config.js               # Configuración de Next.js
│   ├── package.json                 # Dependencias del proyecto
│   ├── package-lock.json            # Lock de dependencias
│   ├── tsconfig.json                # Configuración de TypeScript
│   ├── tailwind.config.js           # Configuración de Tailwind CSS
│   └── README.md                    # Información del proyecto
│
├── docs/                            # Documentación adicional
├── GUIA_CONFIGURACION_COMPLETA.md   # Esta guía
└── README.md                        # Información general
```

### 2.3 Archivos Críticos

| Archivo | Ubicación | Descripción | Editable |
|---------|-----------|-------------|----------|
| `.env.local` | `/home/ubuntu/bot_admin_panel/nextjs_space/.env.local` | Variables de entorno (credenciales) | ✅ SÍ |
| `package.json` | `/home/ubuntu/bot_admin_panel/nextjs_space/package.json` | Dependencias del proyecto | ⚠️ Solo si sabe qué hace |
| `next.config.js` | `/home/ubuntu/bot_admin_panel/nextjs_space/next.config.js` | Configuración de Next.js | ⚠️ Solo si sabe qué hace |
| `tsconfig.json` | `/home/ubuntu/bot_admin_panel/nextjs_space/tsconfig.json` | Configuración de TypeScript | ❌ No |
| `tailwind.config.js` | `/home/ubuntu/bot_admin_panel/nextjs_space/tailwind.config.js` | Estilos Tailwind | ⚠️ Si quiere cambiar estilos |
| `app/page.tsx` | `/home/ubuntu/bot_admin_panel/nextjs_space/app/page.tsx` | Página de inicio | ✅ SÍ |
| `app/layout.tsx` | `/home/ubuntu/bot_admin_panel/nextjs_space/app/layout.tsx` | Layout principal | ✅ SÍ |

---

## 3. CONFIGURACIÓN DE SUPABASE

### 3.1 ¿Qué es Supabase?

Supabase es una plataforma de base de datos PostgreSQL alojada en la nube que proporciona:
- Base de datos relacional
- Autenticación
- APIs automáticas
- Almacenamiento de archivos

### 3.2 Acceder a Supabase

**Paso 1:** Abra su navegador y vaya a https://supabase.com

**Paso 2:** Haga clic en "Sign In" si ya tiene cuenta, o "Sign Up" para crear una nueva

**Paso 3:** Inicie sesión con su email y contraseña

### 3.3 Obtener SUPABASE_URL

**Paso 1:** En el dashboard de Supabase, haga clic en su proyecto

**Paso 2:** En la barra lateral izquierda, vaya a **Settings** → **API**

**Paso 3:** En la sección **Project API keys**, busque la línea que dice **Project URL**

**Ejemplo:** `https://xxxxxxxxxxxxxxxx.supabase.co`

**Paso 4:** Copie este valor (sin incluir nada más)

**Nota de seguridad:** Esta URL es pública y puede compartirse, pero no la publique en GitHub sin .env en .gitignore

### 3.4 Obtener SUPABASE_ANON_KEY

**En la misma página de Settings → API:**

**Paso 1:** Busque la sección **Project API keys**

**Paso 2:** Bajo **anon** `public`, encontrará una llave que comienza con `eyJ...`

**Ejemplo:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (muy larga)

**Paso 3:** Copie toda esta cadena completa

**Nota de seguridad:** Esta clave es pública pero tiene permisos limitados. Puede exponerse (está en el navegador), pero es segura.

### 3.5 Obtener SUPABASE_SERVICE_ROLE_KEY

⚠️ **ADVERTENCIA DE SEGURIDAD CRÍTICA** ⚠️

Esta clave tiene **permisos de administrador completo** en su base de datos. **NUNCA** la exponga públicamente.

**En la misma página de Settings → API:**

**Paso 1:** En **Project API keys**, busque la sección **Service Role** `secret`

**Paso 2:** Encontrará otra llave que comienza con `eyJ...`

**Paso 3:** Copie esta cadena completa

**Reglas de seguridad importantes:**
- ❌ NUNCA agregue al código fuente público
- ❌ NUNCA envíe por email o chat
- ❌ NUNCA comparta en GitHub sin configuración adecuada
- ✅ Solo úsela en variables de entorno de servidor
- ✅ Rote regularmente (cámbiela cada 3 meses)

### 3.6 Verificar Credenciales

Una vez que tenga las credenciales, puede verificarlas:

1. Vaya a https://supabase.com/dashboard
2. Ingrese a su proyecto
3. En **Settings** → **API**, confirme que las claves coinciden

---

## 4. CONFIGURACIÓN DE VARIABLES DE ENTORNO

### 4.1 ¿Qué es el archivo .env.local?

El archivo `.env.local` es un archivo de configuración que contiene variables secretas específicas de su entorno local:

- Credenciales de Supabase
- Claves API
- Contraseñas
- Configuraciones sensibles

**Características importantes:**
- Se carga automáticamente al iniciar la aplicación
- NO debe incluirse en Git (debe estar en .gitignore)
- Es diferente en desarrollo y producción
- Las variables con prefijo `NEXT_PUBLIC_` se exponen al navegador (cliente)
- Las variables sin prefijo son solo del servidor (privadas)

### 4.2 Ubicación Exacta

El archivo debe estar en:

```
/home/ubuntu/bot_admin_panel/nextjs_space/.env.local
```

**Ruta completa:** `/home/ubuntu/bot_admin_panel/nextjs_space/.env.local`

**NO en:**
- ❌ `/home/ubuntu/.env.local`
- ❌ `/home/ubuntu/bot_admin_panel/.env.local`
- ❌ `/home/ubuntu/bot_admin_panel/nextjs_space/app/.env.local`

### 4.3 Cómo Crear el Archivo

#### Opción A: Desde la Terminal (Recomendado)

```bash
# Navegar a la carpeta del proyecto
cd /home/ubuntu/bot_admin_panel/nextjs_space

# Crear el archivo .env.local vacío
touch .env.local

# Verificar que se creó
ls -la .env.local
```

#### Opción B: Copiar desde el ejemplo

Si existe un archivo `.env.example`:

```bash
cd /home/ubuntu/bot_admin_panel/nextjs_space
cp .env.example .env.local
```

#### Opción C: Manualmente con Editor de Texto

1. Abra su editor de texto (VS Code, nano, vim, etc)
2. Cree un archivo nuevo
3. Guárdelo como `.env.local` en `/home/ubuntu/bot_admin_panel/nextjs_space/`

### 4.4 Variables Requeridas (Guía Detallada)

#### NEXT_PUBLIC_SUPABASE_URL

**Qué es:** La URL del proyecto Supabase

**Dónde obtenerlo:**
1. Vaya a https://supabase.com/dashboard
2. Seleccione su proyecto
3. Vaya a **Settings** → **API**
4. Copie **Project URL**

**Formato:** `https://XXXXXXXXXXXXXXXX.supabase.co`

**Ejemplo:**
```
NEXT_PUBLIC_SUPABASE_URL=https://myproject123abc.supabase.co
```

**Nota:** El prefijo `NEXT_PUBLIC_` significa que esta variable es pública (se ve en el navegador), así que es segura compartir.

---

#### NEXT_PUBLIC_SUPABASE_ANON_KEY

**Qué es:** Clave anónima de Supabase (permisos limitados)

**Dónde obtenerlo:**
1. En **Settings** → **API**
2. Bajo **Project API keys**, busque **anon** `public`
3. Copie la clave completa (comienza con `eyJ...`)

**Formato:** Muy larga, comienza con `eyJ`

**Ejemplo:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcWFiY2Zvcmd3amtueXpyemllIiwiYW..."
```

**Nota:** Es seguro exponer esto en el navegador.

---

#### SUPABASE_SERVICE_ROLE_KEY

**⚠️ CRÍTICO:** Esta clave tiene acceso de administrador. **NUNCA** la exponga.

**Qué es:** Clave de administrador de Supabase (permisos completos)

**Dónde obtenerlo:**
1. En **Settings** → **API**
2. Bajo **Project API keys**, busque **Service Role** `secret`
3. Copie la clave completa (comienza con `eyJ...`)

**Formato:** Muy larga, comienza con `eyJ`

**Ejemplo:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcWFiY2Zvcmd3amtueXpyemllIiwiYW..."
```

**Reglas:**
- ❌ NUNCA en variables `NEXT_PUBLIC_`
- ❌ NUNCA en código visible
- ✅ Solo en servidor

---

#### ADMIN_EMAIL

**Qué es:** Email del administrador para iniciar sesión

**Ejemplo:**
```
ADMIN_EMAIL=danielooonro@gmail.com
```

**Nota:** Use su email real para poder acceder al panel.

---

#### ADMIN_PASSWORD_HASH

**Qué es:** Hash seguro de la contraseña del administrador

**Cómo generar:**

Opción 1 - Usar Node.js (desde la terminal):

```bash
# Ejecutar Node.js interactivo
node

# Dentro de Node.js:
const crypto = require('crypto');
const password = 'dansms@r';
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log(hash);

# Resultado (ejemplo):
# 2f5c3f8a9e1b7d4c6a9f2e8b5d1c3a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c
```

Opción 2 - Usar Python (desde la terminal):

```bash
python3 -c "import hashlib; print(hashlib.sha256('dansms@r'.encode()).hexdigest())"
```

Opción 3 - Usar una herramienta online:
- https://www.tools4noobs.com/online_tools/hash/
- Ingrese su contraseña y seleccione SHA256

**Ejemplo:**
```
ADMIN_PASSWORD_HASH=2f5c3f8a9e1b7d4c6a9f2e8b5d1c3a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c
```

**Nota de seguridad:** 
- Esta es la contraseña de desarrollo: `dansms@r`
- Para producción, cambie a una contraseña segura y fuerte

---

#### JWT_SECRET

**Qué es:** Clave secreta para firmar tokens JWT (autenticación)

**Cómo generar:**

Opción 1 - Usando Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Opción 2 - Usando OpenSSL:

```bash
openssl rand -hex 32
```

Opción 3 - Usando Python:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Resultado esperado (ejemplo):**
```
3a7f9c2e1b5d8f4a6c9e2f7a4d1c3b8e5a7f9c2e1b5d8f4a6c9e2f7a4d1c3b
```

**Ejemplo en .env.local:**
```
JWT_SECRET=3a7f9c2e1b5d8f4a6c9e2f7a4d1c3b8e5a7f9c2e1b5d8f4a6c9e2f7a4d1c3b
```

---

#### TELEGRAM_BOT_TOKEN (Opcional)

**Qué es:** Token para el bot de Telegram (si usa integración)

**Cómo obtener:**
1. Abra Telegram y busque **@BotFather**
2. Envíe `/newbot`
3. Siga las instrucciones
4. Copie el token proporcionado

**Ejemplo:**
```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIjKlmNoPqRsTuVwXyZ
```

**Si no usa Telegram:** Puede dejar esta variable vacía o comentarla.

---

#### FIVESIM_API_KEY (Opcional)

**Qué es:** API key para FiveSim (servicio de números SMS temporales)

**Cómo obtener:**
1. Regístrese en https://5sim.net
2. Vaya a **Settings** → **API Key**
3. Copie la clave

**Ejemplo:**
```
FIVESIM_API_KEY=your_5sim_api_key_here
```

**Si no usa FiveSim:** Puede dejar esta variable vacía o comentarla.

---

### 4.5 Archivo .env.local Completo (Ejemplo)

Cree el archivo `/home/ubuntu/bot_admin_panel/nextjs_space/.env.local` con este contenido:

```bash
# ============================================================
# CONFIGURACIÓN DE SUPABASE
# ============================================================

# URL del proyecto Supabase (encontrada en Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://myproject123abc.supabase.co

# Clave anónima de Supabase (encontrada en Settings → API bajo "anon public")
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcWFiY2Zvcmd3amtueXpyemllIiwiYW..."

# Clave de administrador de Supabase (encontrada en Settings → API bajo "Service Role secret")
# ⚠️ CRÍTICO: NUNCA la exponga públicamente
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcWFiY2Zvcmd3amtueXpyemllIiwiYW..."

# ============================================================
# CONFIGURACIÓN DE ADMINISTRADOR
# ============================================================

# Email del administrador para iniciar sesión
ADMIN_EMAIL=danielooonro@gmail.com

# Hash SHA256 de la contraseña del administrador (dansms@r)
# Genere con: node -e "console.log(require('crypto').createHash('sha256').update('dansms@r').digest('hex'))"
ADMIN_PASSWORD_HASH=2f5c3f8a9e1b7d4c6a9f2e8b5d1c3a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c

# ============================================================
# CONFIGURACIÓN DE AUTENTICACIÓN
# ============================================================

# Clave secreta para firmar tokens JWT
# Genere con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=3a7f9c2e1b5d8f4a6c9e2f7a4d1c3b8e5a7f9c2e1b5d8f4a6c9e2f7a4d1c3b

# ============================================================
# INTEGRACIONES OPCIONALES
# ============================================================

# Token de bot de Telegram (opcional)
# Obtenga de BotFather en Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIjKlmNoPqRsTuVwXyZ

# API Key de FiveSim (opcional)
# Obtenga de https://5sim.net en Settings → API Key
FIVESIM_API_KEY=your_5sim_api_key_here

# ============================================================
# CONFIGURACIÓN DE ENTORNO
# ============================================================

# Ambiente: development o production
NODE_ENV=development
```

### 4.6 Cómo Agregar Variables al Archivo

#### Método 1: Con echo (Terminal)

```bash
cd /home/ubuntu/bot_admin_panel/nextjs_space

# Agregar cada variable
echo 'NEXT_PUBLIC_SUPABASE_URL=https://myproject123abc.supabase.co' >> .env.local
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...' >> .env.local
echo 'SUPABASE_SERVICE_ROLE_KEY=eyJ...' >> .env.local
echo 'ADMIN_EMAIL=danielooonro@gmail.com' >> .env.local
echo 'ADMIN_PASSWORD_HASH=2f5c...' >> .env.local
echo 'JWT_SECRET=3a7f...' >> .env.local
```

#### Método 2: Con un Editor (Recomendado)

```bash
# Abrir con nano (editor de terminal)
nano /home/ubuntu/bot_admin_panel/nextjs_space/.env.local

# Pegar el contenido del ejemplo anterior
# Presione Ctrl+X, luego Y, luego Enter para guardar
```

#### Método 3: Crear desde cero con cat

```bash
cat > /home/ubuntu/bot_admin_panel/nextjs_space/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://myproject123abc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAIL=danielooonro@gmail.com
ADMIN_PASSWORD_HASH=2f5c...
JWT_SECRET=3a7f...
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIjKlmNoPqRsTuVwXyZ
FIVESIM_API_KEY=your_5sim_api_key_here
NODE_ENV=development
EOF
```

### 4.7 Verificar que el Archivo Está Correcto

```bash
# Ver contenido del archivo
cat /home/ubuntu/bot_admin_panel/nextjs_space/.env.local

# Ver archivos ocultos en la carpeta
ls -la /home/ubuntu/bot_admin_panel/nextjs_space/ | grep env

# Verificar que el archivo existe
test -f /home/ubuntu/bot_admin_panel/nextjs_space/.env.local && echo "✅ Archivo existe" || echo "❌ Archivo NO existe"
```

**Resultado esperado:**
```
✅ Archivo existe
```

---

## 5. INSTALACIÓN DE DEPENDENCIAS

### 5.1 ¿Qué son las dependencias?

Las dependencias son bibliotecas de código que el proyecto necesita para funcionar. Se definen en `package.json` e instaladas en la carpeta `node_modules`.

### 5.2 Navegar a la Carpeta del Proyecto

Abra una terminal y ejecute:

```bash
cd /home/ubuntu/bot_admin_panel/nextjs_space
```

**Verificar que está en la carpeta correcta:**

```bash
pwd
```

**Resultado esperado:**
```
/home/ubuntu/bot_admin_panel/nextjs_space
```

### 5.3 Instalar Dependencias

Ejecute el comando:

```bash
npm install
```

O alternativamente (si usa yarn):

```bash
yarn install
```

### 5.4 Qué Esperar Durante la Instalación

**Proceso típico:**

```
npm warn deprecated ...
npm notice ...
added 312 packages, and audited 316 packages in 45s
```

**Tiempo esperado:** 30-60 segundos (depende de la velocidad de internet)

**Carpeta generada:**

Después de `npm install`, verá una nueva carpeta `node_modules`:

```bash
# Verificar que se creó
ls -la /home/ubuntu/bot_admin_panel/nextjs_space/ | grep node_modules
```

**Resultado:**
```
drwxr-xr-x  312 ubuntu ubuntu  4096 Apr 10 2024 node_modules
```

### 5.5 Solución de Problemas durante la Instalación

#### Error: "npm: command not found"

**Causa:** npm no está instalado

**Solución:**
```bash
# Instalar Node.js y npm
sudo apt install -y nodejs npm

# Verificar versión
npm --version
```

#### Error: "node-gyp ERR!"

**Causa:** Falta compiladores C++

**Solución:**
```bash
sudo apt install -y build-essential python3
npm install
```

#### Error: "EACCES: permission denied"

**Causa:** Permisos insuficientes

**Solución:**
```bash
# Limpiar caché y reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Error: "ERR! code E404"

**Causa:** Paquete no encontrado

**Solución:**
```bash
# Reinstalar desde cero
rm -rf node_modules package-lock.json
npm install --no-optional
```

---

## 6. EJECUCIÓN EN DESARROLLO (LOCAL)

### 6.1 Iniciar el Servidor de Desarrollo

Asegúrese de estar en la carpeta correcta:

```bash
cd /home/ubuntu/bot_admin_panel/nextjs_space
```

Inicie el servidor:

```bash
npm run dev
```

### 6.2 Resultado Esperado

Verá algo como esto en la terminal:

```
> next dev
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

**Esto significa:**
- ✅ El servidor está funcionando
- ✅ Accesible en http://localhost:3000
- ✅ Está usando las variables de `.env.local`

### 6.3 Abrir en el Navegador

**Opción 1: En la máquina local del Abacus AI Agent VM**

Abra su navegador y vaya a:

```
http://localhost:3000
```

**Opción 2: Desde su navegador personal (fuera de la VM)**

Si la VM de Abacus AI Agent está configurada, use:

```
https://57ccdb0e2.na105.preview.abacusai.app
```

### 6.4 Credenciales de Login

**Email:** `danielooonro@gmail.com`  
**Contraseña:** `dansms@r`

### 6.5 Verificar que Funciona Correctamente

Una vez en el navegador, debería ver:

1. ✅ Página de login cargada
2. ✅ Campo para email y contraseña
3. ✅ Botón "Iniciar Sesión"
4. ✅ Sin errores en la consola (F12)

**Iniciar sesión:**

1. Ingrese el email: `danielooonro@gmail.com`
2. Ingrese la contraseña: `dansms@r`
3. Haga clic en "Iniciar Sesión"

**Después del login, debería ver:**

- Dashboard con estadísticas
- Menú lateral con opciones (Usuarios, Números, Campañas, etc.)
- Tabla de usuarios u otra información

### 6.6 Acceder a Páginas del Panel

Una vez autenticado, puede acceder a:

| Página | URL | Descripción |
|--------|-----|-------------|
| Dashboard | http://localhost:3000/dashboard | Panel principal |
| Usuarios | http://localhost:3000/dashboard/users | Gestión de usuarios |
| Números | http://localhost:3000/dashboard/numbers | Gestión de números SMS |
| Campañas | http://localhost:3000/dashboard/campaigns | Gestión de campañas |
| Configuración | http://localhost:3000/dashboard/settings | Ajustes del panel |

### 6.7 Ver Errores en la Consola

Si hay problemas, abra la consola del navegador:

```
Tecla F12 → Console
```

**Errores comunes:**

| Error | Causa | Solución |
|-------|-------|----------|
| `Supabase URL is required` | Falta `NEXT_PUBLIC_SUPABASE_URL` | Agregar a `.env.local` |
| `undefined is not a function` | Error en JavaScript | Revisar la consola para el error exacto |
| `Cannot read properties of null` | Datos no cargados | Esperar a que cargue, revisar conexión |

### 6.8 Detener el Servidor

En la terminal donde está corriendo, presione:

```
Ctrl + C
```

**Resultado:**
```
⠙ Stopping... 
✓ Stopped
```

---

## 7. DESPLIEGUE EN PRODUCCIÓN (VERCEL)

### 7.1 ¿Qué es Vercel?

Vercel es una plataforma de despliegue especializada en Next.js que:
- Proporciona hosting rápido y confiable
- Integración automática con GitHub
- Variables de entorno seguras
- CDN global
- Dominio automático o personalizado

### 7.2 Opción A: Desplegar desde GitHub

#### A.1 Preparar el Código para GitHub

**Paso 1: Crear un repositorio en GitHub**

1. Vaya a https://github.com/new
2. Nombre del repositorio: `bot-admin-panel`
3. Descripción: `Panel de administración para bot de SMS`
4. Seleccione **Private** (privado)
5. Haga clic en **Create repository**

#### A.2 Subir el Código a GitHub

En su terminal (en la carpeta del proyecto):

```bash
cd /home/ubuntu/bot_admin_panel/nextjs_space

# Inicializar el repositorio Git
git init

# Agregar todos los archivos
git add .

# Crear commit inicial
git commit -m "Initial commit: Bot Admin Panel"

# Agregar el repositorio remoto
# REEMPLACE: usuario con su usuario de GitHub y repo-name con el nombre del repositorio
git remote add origin https://github.com/usuario/bot-admin-panel.git

# Subir al repositorio
git branch -M main
git push -u origin main
```

**Si le pide credenciales:**

```bash
# Crear token de acceso en GitHub (Settings → Developer settings → Personal access tokens)
# Luego, cuando pida contraseña, ingrese el token
```

#### A.3 Conectar Vercel con GitHub

**Paso 1:** Vaya a https://vercel.com

**Paso 2:** Inicie sesión o cree una cuenta

**Paso 3:** Haga clic en **"New Project"**

**Paso 4:** Seleccione **"Import Git Repository"**

**Paso 5:** Busque su repositorio `bot-admin-panel` y haga clic **"Import"**

#### A.4 Configurar Variables de Entorno en Vercel

En la página de importación del proyecto:

**Paso 1:** Haga clic en **"Environment Variables"**

**Paso 2:** Agregue cada variable:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Su URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Su clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Su clave de administrador de Supabase |
| `ADMIN_EMAIL` | `danielooonro@gmail.com` |
| `ADMIN_PASSWORD_HASH` | Su hash de contraseña |
| `JWT_SECRET` | Su JWT secret aleatorio |
| `TELEGRAM_BOT_TOKEN` | Token (opcional) |
| `FIVESIM_API_KEY` | API Key (opcional) |

**Paso 3:** Haga clic en **"Deploy"**

**Vercel desplegará automáticamente:**

```
✓ Building...
✓ Optimizing...
✓ Generating preview...
```

#### A.5 Acceder a la URL Desplegada

Una vez completado el despliegue:

1. Vercel le proporciona una URL como: `https://bot-admin-panel-xxxxx.vercel.app`
2. Abra esa URL en su navegador
3. Use las mismas credenciales: `danielooonro@gmail.com` / `dansms@r`

### 7.3 Opción B: Desplegar con Vercel CLI

#### B.1 Instalar Vercel CLI

```bash
# Instalar globalmente
npm install -g vercel

# Verificar instalación
vercel --version
```

#### B.2 Autenticarse con Vercel

```bash
vercel login
```

Esto abrirá una ventana del navegador para autenticar.

#### B.3 Desplegar el Proyecto

En la carpeta del proyecto:

```bash
cd /home/ubuntu/bot_admin_panel/nextjs_space

# Desplegar
vercel
```

**Responda las preguntas:**

```
? Set up and deploy "~/bot_admin_panel/nextjs_space"? [Y/n] → Y
? Which scope do you want to deploy to? → Seleccione su cuenta
? Link to existing project? [y/N] → N
? What's your project's name? → bot-admin-panel
? In which directory is your code located? → . (punto)
? Want to modify these settings? [y/N] → N
```

#### B.4 Configurar Variables de Entorno

Una vez desplegado, configure las variables:

```bash
# Abrir dashboard de Vercel
vercel env

# O agregar variables directamente
vercel env add NEXT_PUBLIC_SUPABASE_URL https://myproject123abc.supabase.co
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY eyJ...
vercel env add SUPABASE_SERVICE_ROLE_KEY eyJ...
vercel env add ADMIN_EMAIL danielooonro@gmail.com
vercel env add ADMIN_PASSWORD_HASH 2f5c...
vercel env add JWT_SECRET 3a7f...
```

#### B.5 Redeploy después de Agregar Variables

```bash
vercel --prod
```

---

## 8. VERIFICACIÓN POST-DESPLIEGUE

### 8.1 Checklist de Verificación

Después de desplegar (en desarrollo o producción), verifique:

- [ ] Página de login carga sin errores
- [ ] Puede iniciar sesión con `danielooonro@gmail.com` / `dansms@r`
- [ ] Dashboard se carga con datos
- [ ] Tablas muestran información
- [ ] Botones funcionan correctamente
- [ ] No hay errores en la consola (F12)

### 8.2 Verificar Conexión con Supabase

**En la consola del navegador (F12):**

```javascript
// Ver si Supabase está conectado
console.log('Supabase Client:', supabaseClient);

// Ver datos de la sesión
console.log('Current Session:', session);
```

**Alternativa: Verificar en Supabase**

1. Vaya a https://supabase.com/dashboard
2. Seleccione su proyecto
3. Vaya a **Authentication**
4. Debería ver registros de login

### 8.3 Probar Funcionalidades Principales

| Funcionalidad | Cómo Probar | Resultado Esperado |
|--------------|------------|-------------------|
| Login | Ingrese credenciales | Redirige a dashboard |
| Ver usuarios | Click en "Usuarios" | Tabla con usuarios aparece |
| Crear usuario | Click en "Agregar usuario" | Modal o formulario aparece |
| Ver números | Click en "Números" | Tabla con números aparece |
| Estadísticas | Ver dashboard | Números/gráficos se muestran |

### 8.4 Verificar en Diferentes Navegadores

Pruebe en:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (si es macOS)
- [ ] Navegador de móvil

### 8.5 Verificar Rendimiento

En Vercel (si desplegó allí):

1. Vaya a https://vercel.com/dashboard
2. Seleccione su proyecto
3. Vaya a **Deployments**
4. Haga clic en el último deployment
5. Vea **Web Vitals** para rendimiento

**Métricas esperadas:**
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

---

## 9. TROUBLESHOOTING COMÚN

### 9.1 Error: "Cannot find module..."

**Síntoma:**
```
Error: Cannot find module 'next'
at Module._load (internal/modules/commonjs/loader.js:...)
```

**Causa:** Las dependencias no están instaladas

**Solución:**
```bash
cd /home/ubuntu/bot_admin_panel/nextjs_space
rm -rf node_modules
npm install
npm run dev
```

---

### 9.2 Error: "Invalid credentials"

**Síntoma:** Página de login rechaza credenciales correctas

**Causa:** 
- `ADMIN_PASSWORD_HASH` incorrecto
- `JWT_SECRET` no configurado
- Email incorrecto

**Verificar:**
```bash
# Ver variables en .env.local
cat /home/ubuntu/bot_admin_panel/nextjs_space/.env.local | grep ADMIN
cat /home/ubuntu/bot_admin_panel/nextjs_space/.env.local | grep JWT

# Verificar que ADMIN_PASSWORD_HASH es correcto
# Debe ser el hash SHA256 de la contraseña
node -e "console.log(require('crypto').createHash('sha256').update('dansms@r').digest('hex'))"
```

**Solución:**
```bash
# Regenerar hash
PASSWORD_HASH=$(node -e "console.log(require('crypto').createHash('sha256').update('dansms@r').digest('hex'))")

# Actualizar en .env.local
sed -i "s/ADMIN_PASSWORD_HASH=.*/ADMIN_PASSWORD_HASH=$PASSWORD_HASH/" /home/ubuntu/bot_admin_panel/nextjs_space/.env.local

# Reiniciar servidor
# Ctrl+C en la terminal donde corre npm run dev
# Luego: npm run dev
```

---

### 9.3 Error: "Database connection failed"

**Síntoma:**
```
Error: Database connection failed
Connection to Supabase failed
```

**Causa:**
- `NEXT_PUBLIC_SUPABASE_URL` incorrecto
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` incorrecto
- Proyecto Supabase pausado o eliminado
- Sin conexión a internet

**Verificar:**
```bash
# Ver credenciales de Supabase
cat /home/ubuntu/bot_admin_panel/nextjs_space/.env.local | grep SUPABASE

# Verificar que son válidas en Supabase
# 1. Vaya a https://supabase.com/dashboard
# 2. Seleccione el proyecto
# 3. Vaya a Settings → API
# 4. Copie las claves nuevamente
```

**Solución:**
```bash
# 1. Copie las credenciales nuevas de Supabase
# 2. Actualice .env.local
# 3. Reinicie el servidor
```

---

### 9.4 Error: "JWT secret not configured"

**Síntoma:**
```
Error: JWT_SECRET environment variable is not set
```

**Causa:** `JWT_SECRET` no está en `.env.local`

**Solución:**
```bash
# Generar JWT_SECRET
JWT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Agregar a .env.local
echo "JWT_SECRET=$JWT" >> /home/ubuntu/bot_admin_panel/nextjs_space/.env.local

# Reiniciar servidor
```

---

### 9.5 Página en Blanco

**Síntoma:** El navegador muestra página completamente blanca

**Causa:**
- Error de JavaScript
- Falta cargar recursos
- Credenciales inválidas

**Solución:**
```bash
# 1. Abra la consola del navegador (F12)
# 2. Vaya a la pestaña Console
# 3. Busque mensajes de error rojo
# 4. Copie el error exacto
# 5. Busque ese error en este documento

# O reinicie el servidor
cd /home/ubuntu/bot_admin_panel/nextjs_space
npm run dev
```

---

### 9.6 Login No Funciona

**Síntoma:** Botón de login no responde o muestra "Usuario o contraseña inválidos"

**Causa:**
- Credenciales incorrectas
- Base de datos no cargada
- Problema de conexión con Supabase

**Solución:**
```bash
# Verificar credenciales correctas
# Email: danielooonro@gmail.com
# Contraseña: dansms@r

# Verificar que las variables están configuradas
cat /home/ubuntu/bot_admin_panel/nextjs_space/.env.local

# Verificar en consola (F12) → Console:
# Debe ver logs de autenticación

# Reiniciar servidor
cd /home/ubuntu/bot_admin_panel/nextjs_space
npm run dev
```

---

### 9.7 Error: "Port 3000 already in use"

**Síntoma:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Causa:** Otro proceso está usando puerto 3000

**Solución:**

Opción 1: Usar otro puerto

```bash
PORT=3001 npm run dev
# Luego abra http://localhost:3001
```

Opción 2: Matar el proceso

```bash
# Encontrar qué está usando puerto 3000
lsof -i :3000

# Matar el proceso (reemplace PID con el número)
kill -9 PID

# Reiniciar npm run dev
npm run dev
```

---

### 9.8 Error: ".env.local not found"

**Síntoma:**
```
Error: ENOENT: no such file or directory, open '.env.local'
```

**Causa:** El archivo `.env.local` no existe o está en ubicación incorrecta

**Solución:**
```bash
# Verificar ubicación
ls -la /home/ubuntu/bot_admin_panel/nextjs_space/.env.local

# Si no existe, crear
cd /home/ubuntu/bot_admin_panel/nextjs_space
touch .env.local

# Agregar contenido (ver sección 4.5)
```

---

### 9.9 Error: "NEXT_PUBLIC_SUPABASE_URL is undefined"

**Síntoma:**
```
Error: NEXT_PUBLIC_SUPABASE_URL is undefined
```

**Causa:** Variable no está en `.env.local` o próximo servidor no se reinició después de agregarla

**Solución:**
```bash
# 1. Verificar que la variable está en .env.local
grep NEXT_PUBLIC_SUPABASE_URL /home/ubuntu/bot_admin_panel/nextjs_space/.env.local

# 2. Si no está, agregarla:
echo "NEXT_PUBLIC_SUPABASE_URL=https://myproject.supabase.co" >> /home/ubuntu/bot_admin_panel/nextjs_space/.env.local

# 3. Detener servidor (Ctrl+C) y reiniciar:
npm run dev
```

---

### 9.10 Error en Producción (Vercel)

**Síntoma:** Funciona en local pero no en Vercel

**Causa:** Variables de entorno no configuradas en Vercel

**Solución:**
```bash
# 1. Vaya a https://vercel.com/dashboard
# 2. Seleccione el proyecto
# 3. Vaya a Settings → Environment Variables
# 4. Agregue todas las variables (ver sección 7.4)
# 5. Haga redeploy:

vercel --prod
```

---

## 10. COMANDOS ÚTILES

### 10.1 Comandos de Desarrollo

| Comando | Ubicación | Descripción |
|---------|-----------|-------------|
| `npm run dev` | `/home/ubuntu/bot_admin_panel/nextjs_space` | Iniciar servidor de desarrollo |
| `npm run build` | `/home/ubuntu/bot_admin_panel/nextjs_space` | Compilar para producción |
| `npm run start` | `/home/ubuntu/bot_admin_panel/nextjs_space` | Iniciar servidor de producción |
| `npm test` | `/home/ubuntu/bot_admin_panel/nextjs_space` | Ejecutar pruebas (si existen) |
| `npm install` | `/home/ubuntu/bot_admin_panel/nextjs_space` | Instalar dependencias |
| `npm update` | `/home/ubuntu/bot_admin_panel/nextjs_space` | Actualizar paquetes |
| `npm audit` | `/home/ubuntu/bot_admin_panel/nextjs_space` | Verificar vulnerabilidades |

### 10.2 Comandos de Git

| Comando | Descripción |
|---------|-------------|
| `git init` | Inicializar repositorio |
| `git add .` | Agregar todos los cambios |
| `git commit -m "mensaje"` | Crear commit |
| `git push` | Subir cambios a GitHub |
| `git pull` | Descargar cambios de GitHub |
| `git status` | Ver estado de cambios |
| `git log` | Ver historial de commits |

### 10.3 Comandos de Vercel

| Comando | Descripción |
|---------|-------------|
| `vercel login` | Autenticarse con Vercel |
| `vercel` | Desplegar a preview |
| `vercel --prod` | Desplegar a producción |
| `vercel env` | Gestionar variables de entorno |
| `vercel logs` | Ver logs de despliegue |

### 10.4 Comandos de Navegación

| Comando | Resultado |
|---------|-----------|
| `cd /home/ubuntu/bot_admin_panel/nextjs_space` | Ir a la carpeta del proyecto |
| `pwd` | Mostrar ubicación actual |
| `ls -la` | Listar archivos (incluyendo ocultos) |
| `cat .env.local` | Ver contenido de .env.local |

---

## 11. ESTRUCTURA DE ARCHIVOS IMPORTANTES

### 11.1 Archivos Clave del Proyecto

#### Archivo: `.env.local`

**Ubicación:** `/home/ubuntu/bot_admin_panel/nextjs_space/.env.local`

**Qué contiene:**
- Credenciales de Supabase
- Claves API
- Configuración de autenticación

**Cuándo editar:** Cuando agregue nuevas integraciones o cambie credenciales

**Cómo editar:**
```bash
nano /home/ubuntu/bot_admin_panel/nextjs_space/.env.local
# Presione Ctrl+X para salir
```

---

#### Archivo: `package.json`

**Ubicación:** `/home/ubuntu/bot_admin_panel/nextjs_space/package.json`

**Qué contiene:**
- Dependencias del proyecto
- Scripts (dev, build, start)
- Metadatos del proyecto

**Cuándo editar:** Cuando agregue nuevas dependencias

**Cómo agregar dependencia:**
```bash
cd /home/ubuntu/bot_admin_panel/nextjs_space
npm install nombre-del-paquete
```

---

#### Archivo: `app/page.tsx`

**Ubicación:** `/home/ubuntu/bot_admin_panel/nextjs_space/app/page.tsx`

**Qué contiene:** Página de inicio

**Cuándo editar:** Para cambiar la página principal o de login

---

#### Archivo: `app/layout.tsx`

**Ubicación:** `/home/ubuntu/bot_admin_panel/nextjs_space/app/layout.tsx`

**Qué contiene:** Layout global (header, navegación, etc)

**Cuándo editar:** Para cambiar navegación global o estructura

---

#### Archivo: `next.config.js`

**Ubicación:** `/home/ubuntu/bot_admin_panel/nextjs_space/next.config.js`

**Qué contiene:** Configuración de Next.js

**Cuándo editar:** NO editar a menos que sepa qué hace

---

#### Archivo: `tsconfig.json`

**Ubicación:** `/home/ubuntu/bot_admin_panel/nextjs_space/tsconfig.json`

**Qué contiene:** Configuración de TypeScript

**Cuándo editar:** NO editar, cambios pueden romper el proyecto

---

#### Archivo: `tailwind.config.js`

**Ubicación:** `/home/ubuntu/bot_admin_panel/nextjs_space/tailwind.config.js`

**Qué contiene:** Configuración de estilos Tailwind CSS

**Cuándo editar:** Para cambiar temas, colores o agregar estilos personalizados

**Ejemplo: Cambiar color primario**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B', // Cambiar a su color
      },
    },
  },
}
```

---

### 11.2 Estructura de Carpetas Importantes

#### Carpeta: `app/`

```
app/
├── page.tsx              # Página de inicio/login
├── layout.tsx            # Layout global
├── globals.css           # Estilos globales
├── api/                  # Rutas de API
│   ├── auth/            # Autenticación
│   └── [...]            # Otros endpoints
└── dashboard/           # Panel de administración
    ├── page.tsx         # Página principal del dashboard
    ├── users/           # Gestión de usuarios
    ├── numbers/         # Gestión de números
    └── campaigns/       # Gestión de campañas
```

**Cuándo editar:** Cuando cambie funcionalidad de las páginas

---

#### Carpeta: `components/`

```
components/
├── Navbar.tsx           # Barra de navegación
├── Sidebar.tsx          # Menú lateral
├── UserTable.tsx        # Tabla de usuarios
├── Modal.tsx            # Modal genérico
└── [...]               # Otros componentes
```

**Cuándo editar:** Cuando modifique interfaz de usuario

---

#### Carpeta: `lib/`

```
lib/
├── supabase-client.ts   # Cliente de Supabase
├── auth.ts              # Funciones de autenticación
├── utils.ts             # Utilidades generales
└── [...]               # Otras librerías
```

**Cuándo editar:** Cuando cambie lógica de backend o utilidades

---

#### Carpeta: `public/`

```
public/
├── logo.png             # Logo del sitio
├── favicon.ico          # Ícono del navegador
└── [...]               # Otros archivos estáticos
```

**Cuándo editar:** Cuando agregue imágenes o archivos estáticos

---

### 11.3 Archivos NO Tocar

❌ **NO editar estos archivos** a menos que sea muy avanzado:

- `tsconfig.json` - Configuración de TypeScript
- `.gitignore` - Archivos a ignorar en Git
- `next.config.js` - Configuración de Next.js (sin razón válida)
- `node_modules/` - Carpeta de dependencias

---

## RESUMEN RÁPIDO

### Para Empezar Rápido:

```bash
# 1. Crear .env.local con credenciales
cd /home/ubuntu/bot_admin_panel/nextjs_space
nano .env.local
# Pegar contenido del ejemplo de la sección 4.5

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:3000

# 5. Login
# Email: danielooonro@gmail.com
# Password: dansms@r
```

### Para Desplegar en Producción:

```bash
# Opción A: GitHub + Vercel
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/usuario/bot-admin-panel.git
git push -u origin main

# Luego ir a https://vercel.com y conectar el repositorio

# Opción B: Vercel CLI
npm install -g vercel
vercel login
vercel
vercel env add VARIABLE_NAME value
vercel --prod
```

---

## CONTACTO Y SOPORTE

**En caso de problemas:**

1. Revise la sección **Troubleshooting Común** (sección 9)
2. Consulte los **Comandos Útiles** (sección 10)
3. Verifique que todas las variables de `.env.local` estén configuradas
4. Reinicie el servidor
5. Limpie caché si es necesario: `npm cache clean --force`

**Información útil para reportar problemas:**

- Versión de Node.js: `node --version`
- Versión de npm: `npm --version`
- Mensaje de error exacto
- Pasos para reproducir el problema
- Archivo `.env.local` (sin credenciales sensibles)

---

**Fin de la Guía Completa**

Última actualización: Abril 2025  
Versión: 1.0
