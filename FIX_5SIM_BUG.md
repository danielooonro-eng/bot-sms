# 🔥 Fix: "Servicio no disponible" Error en Compra de Números

## 📋 Problema
El bot mostraba "Servicio no disponible" en **TODOS** los servicios al intentar comprar números en 5sim.

## 🎯 Causa Raíz Identificada
El error ocurría porque:
1. No había validación de que `API_KEY` estuviera cargada correctamente
2. Faltaba logging detallado para saber qué exactamente estaba fallando
3. No se mostraban detalles del error de la API

## ✅ Soluciones Implementadas

### 1. **Validación de API_KEY** (Línea 777-783)
```javascript
if (!API_KEY) {
  console.error('❌ ERROR CRÍTICO: API_KEY (FIVESIM_API) no está configurada en .env');
  return editMsg(query, '❌ *Error de configuración*...');
}
```
**Por qué:** Detecta si la variable de entorno `FIVESIM_API` no se cargó correctamente.

### 2. **Logging Pre-Solicitud** (Línea 790-794)
```javascript
console.log(`\n🛒 ━━━ COMPRANDO NÚMERO ━━━`);
console.log(`   Service: ${user.service}`);
console.log(`   Country: ${country}`);
console.log(`   Operator: ${operator}`);
console.log(`   API Key present: ${API_KEY ? '✅ SÍ' : '❌ NO'}`);
```
**Por qué:** Permite ver exactamente qué parámetros se están enviando a 5sim.

### 3. **Logging de Respuesta Exitosa** (Línea 800-801)
```javascript
console.log(`✅ Respuesta 5sim exitosa:`, JSON.stringify(res.data, null, 2));
```
**Por qué:** Confirma que la API respondió correctamente y muestra la estructura de datos.

### 4. **Logging de Errores Detallado** (Línea 849-853)
```javascript
console.error(`\n❌ ━━━ ERROR AL COMPRAR NÚMERO ━━━`);
console.error(`   Status HTTP: ${err.response?.status || err.code || 'N/A'}`);
console.error(`   Mensaje error: ${err.response?.data?.message || err.message}`);
console.error(`   Data completa:`, JSON.stringify(err.response?.data || err, null, 2));
```
**Por qué:** Muestra el error exacto que retorna 5sim.

### 5. **Logging Mejorado en waitForSMS** (Línea 960-965)
```javascript
console.log(`\n✅ [SMS Check] orderId=${orderId}`);
console.log(`   Status: ${data.status}`);
console.log(`   SMS recibido: ${data.sms && data.sms.length > 0 ? '✅ SÍ' : '⏳ ESPERANDO'}`);
```
**Por qué:** Facilita debugging si hay problemas al recibir el SMS.

## 🚀 Cómo Debuggear

### Paso 1: Verifica tu .env
```bash
cat .env | grep FIVESIM_API
```
**Debe mostrar:** `FIVESIM_API=tu_api_key_de_5sim`

### Paso 2: Revisa los logs cuando alguien intente comprar
Busca en los logs del bot mensajes como:
```
🛒 ━━━ COMPRANDO NÚMERO ━━━
   Service: amazon
   Country: usa
   Operator: any
   API Key present: ✅ SÍ
```

### Paso 3: Si hay error, busca:
```
❌ ━━━ ERROR AL COMPRAR NÚMERO ━━━
   Status HTTP: 401
   Mensaje error: Unauthorized
   Data completa: {...}
```

## 🔍 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Status HTTP: 401` | API Key inválida o expirada | Verifica/renew tu API key de 5sim |
| `Status HTTP: 400` | Parámetros inválidos | El operador o país no es válido para ese servicio |
| `Status HTTP: 500` | Error del servidor de 5sim | Intenta más tarde o contacta soporte de 5sim |
| `API Key present: ❌ NO` | Variable .env no cargada | Reinicia el bot después de actualizar .env |

## 💡 Cambios en Lógica

**IMPORTANTE:** Todos los cambios son **SOLO de logging y validación**. 

✅ **Se mantiene:**
- Lógica de compra de números
- Lógica de espera de SMS
- Lógica de cancelación
- Sincronización con Supabase
- Todas las demás funcionalidades

## 📝 Testing

Después de estos cambios:
1. Intenta comprar un número con créditos disponibles
2. Revisa los logs para ver el flow detallado
3. Si hay error, los logs mostrarán exactamente qué falló

## 🎯 Próximos Pasos (si el error persiste)

Si después de estos logs ves que `API Key present: ✅ SÍ` pero sigue errando:
1. Verifica que el operador esté correctamente definido
2. Consulta los logs de 5sim (si tienes acceso a tu panel)
3. Prueba manualmente en el sitio web de 5sim con la misma API key
