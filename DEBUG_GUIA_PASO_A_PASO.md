# 🔍 Guía Paso a Paso - Depuración del Error "Servicio no disponible"

## 🎯 Objetivo
Identificar y resolver el error "Servicio no disponible" que aparece al comprar números.

---

## 🚀 Paso 1: Verifica la Configuración de .env

### ¿Qué hacer?
Abre tu archivo `.env` y verifica que contenga:

```env
TELEGRAM_TOKEN=tu_token_aqui
FIVESIM_API=tu_api_key_de_5sim
SUPABASE_URL=tu_url_supabase
SUPABASE_ANON_KEY=tu_anon_key
```

### ¿Cómo verificar desde terminal?
```bash
cat .env | grep FIVESIM_API
```

Debe mostrar:
```
FIVESIM_API=ghu_1234567890abcdefg...
```

### ✅ Si ves la key: Continúa al Paso 2
### ❌ Si NO la ves: 
1. Agrega `FIVESIM_API=tu_key` a tu archivo `.env`
2. Guarda el archivo
3. Reinicia el bot
4. Ve al Paso 2

---

## 🔄 Paso 2: Reinicia el Bot

### ¿Por qué?
Los cambios en `.env` solo se cargan cuando el bot inicia.

### ¿Cómo hacerlo?
```bash
# Si está ejecutándose, presiona Ctrl+C para detenerlo
# Luego ejecuta:
npm start
# o
node bot.js
```

Deberías ver en los logs:
```
🚀 Inicializando bot...
```

---

## 💬 Paso 3: Intenta una Compra Desde el Telegram Bot

### ¿Qué hacer?
1. Abre el bot en Telegram
2. Presiona `/start`
3. Haz clic en "📱 Comprar número"
4. Selecciona un servicio (ej: Amazon)
5. Selecciona un país (ej: USA)
6. Espera la respuesta

### ⏰ Mientras hace esto, revisa los logs del bot

---

## 📊 Paso 4: Interpreta los Logs

### Escenario A: ✅ ÉXITO

**Verás estos logs:**
```
🛒 ━━━ COMPRANDO NÚMERO ━━━
   Service: amazon
   Country: usa
   Operator: any
   URL: https://5sim.net/v1/user/buy/activation/usa/any/amazon
   API Key present: ✅ SÍ

✅ Respuesta 5sim exitosa: {
  "id": 123456789,
  "phone": "+1234567890",
  ...
}
```

**Acción:** ✅ ¡El bot está funcionando! El problema fue algo temporal.

---

### Escenario B: ❌ API_KEY NO CARGADA

**Verás este log:**
```
❌ ERROR CRÍTICO: API_KEY (FIVESIM_API) no está configurada en .env
```

**Causas posibles:**
- La variable `FIVESIM_API` no está en `.env`
- El bot no se reinició después de actualizar `.env`
- El archivo `.env` no se guardó correctamente

**Solución:**
1. Verifica tu `.env` tiene: `FIVESIM_API=tu_key`
2. Reinicia el bot completamente
3. Intenta de nuevo

---

### Escenario C: ❌ ERROR DE AUTENTICACIÓN (Status 401)

**Verás estos logs:**
```
❌ ━━━ ERROR AL COMPRAR NÚMERO ━━━
   Service: amazon
   Country: usa
   Status HTTP: 401
   Mensaje error: Unauthorized
   Data completa: {...}
```

**Causas posibles:**
- Tu API key de 5sim es inválida
- Tu API key expiró
- Tu API key no tiene permisos suficientes

**Solución:**
1. Ve a tu panel de 5sim
2. Genera una nueva API key
3. Actualiza `.env` con la nueva key
4. Reinicia el bot
5. Intenta de nuevo

---

### Escenario D: ❌ PARÁMETROS INVÁLIDOS (Status 400)

**Verás estos logs:**
```
❌ ━━━ ERROR AL COMPRAR NÚMERO ━━━
   Service: amazon
   Country: usa
   Status HTTP: 400
   Mensaje error: Invalid service/country combination
```

**Causas posibles:**
- El servicio no está disponible en ese país
- El operador no es válido
- 5sim cambió sus parámetros

**Solución:**
1. Verifica en tu panel de 5sim qué servicios/países están disponibles
2. Intenta con otro país
3. Intenta con otro servicio

---

### Escenario E: ❌ ERROR DEL SERVIDOR (Status 500)

**Verás estos logs:**
```
❌ ━━━ ERROR AL COMPRAR NÚMERO ━━━
   Status HTTP: 500
   Mensaje error: Internal Server Error
```

**Causas posibles:**
- Servidor de 5sim está caído
- Problema temporal en su infraestructura
- Sobrecarga de solicitudes

**Solución:**
1. Espera 5-10 minutos
2. Intenta de nuevo
3. Si persiste, contacta al soporte de 5sim

---

## 🔧 Paso 5: Depuración Avanzada

Si ninguno de los escenarios anteriores aplica, necesitamos más información.

### Extrae los logs completos:

```bash
# Si usas Railway o similar, descarga los logs
# Si lo ejecutas localmente:
npm start > bot_logs.txt 2>&1

# Luego intenta una compra y espera que falle
# Los logs se guardarán en bot_logs.txt
```

### Busca por "ERROR AL COMPRAR NÚMERO" en los logs

La sección `Data completa:` contendrá la respuesta exacta de 5sim que explica el problema.

---

## 📞 Paso 6: Si Aún Tienes Problemas

Recopila:
1. **El log exacto del error** (de "ERROR AL COMPRAR NÚMERO")
2. **Tu versión de 5sim API** (si la conoces)
3. **El servicio/país que intentaste**
4. **Tu API key funciona en el sitio web de 5sim?** (intenta desde su panel)

Con esta información podemos identificar el problema exacto.

---

## 📋 Checklist de Debugging

- [ ] Verificaste que `.env` tiene `FIVESIM_API=...`
- [ ] Reiniciaste el bot
- [ ] Intentaste una compra
- [ ] Revisaste los logs de "COMPRANDO NÚMERO"
- [ ] Identificaste el escenario (A, B, C, D o E)
- [ ] Ejecutaste la solución para ese escenario
- [ ] Intentaste de nuevo

---

## 🎉 Éxito!

Si después de estos pasos:
1. ✅ Ves "Respuesta 5sim exitosa"
2. ✅ El usuario recibe el teléfono
3. ✅ El usuario recibe el SMS con el código

¡El bot está funcionando correctamente! 🚀

Si algo no funciona, comparte los logs y podemos investigar más.
