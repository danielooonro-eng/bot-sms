# ✅ Checklist de Pruebas - Arreglos Críticos

Use este documento para verificar que todos los arreglos funcionan correctamente.

---

## 📋 Pre-requisitos

- [ ] Crear tablas en Supabase (ejecutar `create_tables.sql`)
- [ ] Configurar `.env.local` en panel con credenciales Supabase
- [ ] Configurar variables en Railway para bot
- [ ] Reiniciar bot y panel
- [ ] Bot debe mostrar "✅ Usuario X sincronizado" en logs

---

## 🧪 Test 1: Sincronización de Créditos

**Objetivo:** Verificar que créditos se sincronicen del bot al panel

### Pasos:
1. [ ] Abrir Telegram y enviar `/addcredits 8349475987 10` como admin
2. [ ] Esperar 2 segundos
3. [ ] Revisar logs del bot en Railway
   - [ ] Debe decir: "✅ Usuario 8349475987 sincronizado a Supabase"
4. [ ] Abrir panel admin en navegador
5. [ ] Ir a sección "Usuarios"
6. [ ] Buscar usuario "8349475987"
7. [ ] [ ] Verificar que créditos sean 10 (o anterior + 10)
8. [ ] Si no aparece, esperar 5 segundos y click en "Actualizar"

**Resultado esperado:** ✅ Créditos aparecen en panel dentro de 10 segundos

**Si falla:**
- [ ] Revisar logs del bot: "❌ Error sincronizando"
- [ ] Verificar que tabla `users` existe en Supabase
- [ ] Verificar `SUPABASE_ANON_KEY` en variables del bot

---

## 🧪 Test 2: Compra de Número y Logs

**Objetivo:** Verificar que compra se registre en logs

### Pasos:
1. [ ] En panel, ir a "Logs"
2. [ ] Anotar el número de logs actual
3. [ ] Desde Telegram como usuario:
   - [ ] `/start`
   - [ ] Click "Comprar número"
   - [ ] Seleccionar servicio (ej: Google)
   - [ ] Seleccionar país (ej: USA)
4. [ ] El usuario debe recibir un número
5. [ ] Esperar 5 segundos
6. [ ] En panel, actualizar Logs (F5 o botón)
7. [ ] [ ] Debe haber nueva entrada con `action: "number_rented"`
8. [ ] [ ] Debe mostrar el servicio (ej: "google")
9. [ ] [ ] Estado debe ser "success"

**Resultado esperado:** ✅ Nueva entrada en logs dentro de 10 segundos

**Si falla:**
- [ ] Revisar que tabla `logs` existe en Supabase
- [ ] Verificar que bot sincroniza (ver Test 1)
- [ ] Revisar `SUPABASE_ANON_KEY`

---

## 🧪 Test 3: Auto-Refresh del Panel

**Objetivo:** Verificar que panel se actualiza automáticamente sin F5

### Pasos:
1. [ ] Abrir panel en navegador
2. [ ] Ir a "Usuarios"
3. [ ] **NO HACER NADA** en el navegador
4. [ ] Desde Telegram, ejecutar: `/addcredits 8633276289 5`
5. [ ] Volver al navegador
6. [ ] [ ] Esperar máximo 10 segundos
7. [ ] [ ] Verificar que créditos del usuario 8633276289 se actualizaron SIN hacer F5
8. [ ] Si la tabla se actualiza sin refresco manual = ✅

**Resultado esperado:** ✅ Tabla actualiza cada 10 segundos automáticamente

**Si falla:**
- [ ] Revisar console (F12 → Console)
- [ ] Debe haber requests a `/api/users` cada 10 segundos
- [ ] Si no hay requests, verificar que JavaScript está funcionando

---

## 🧪 Test 4: Exportación de Logs (CSV)

**Objetivo:** Verificar que exportación a CSV funciona

### Pasos:
1. [ ] En panel, ir a "Logs"
2. [ ] Click en botón "Descargar CSV"
3. [ ] [ ] Esperar a que se descargue automáticamente
4. [ ] [ ] Verificar que el archivo se llamó `logs_YYYY-MM-DD.csv`
5. [ ] Abrir archivo con editor de texto o Excel
6. [ ] [ ] Debe tener cabecera: "ID","User ID","Acción","Servicio","Estado","Fecha"
7. [ ] [ ] Debe haber al menos una fila de datos
8. [ ] [ ] No debe haber caracteres extraños (encoding correcto)

**Resultado esperado:** ✅ CSV se descarga correctamente con datos formateados

**Si falla:**
- [ ] Si dice "Error al exportar a CSV", verificar:
  - [ ] Que estés autenticado (hacer login de nuevo)
  - [ ] Que `SUPABASE_SERVICE_ROLE_KEY` sea correcto
  - [ ] Ver console (F12 → Network) para detalles del error

---

## 🧪 Test 5: Exportación de Logs (JSON)

**Objetivo:** Verificar que exportación a JSON funciona

### Pasos:
1. [ ] En panel, ir a "Logs"
2. [ ] Click en botón "Descargar JSON"
3. [ ] [ ] Esperar a que se descargue automáticamente
4. [ ] [ ] Verificar que el archivo se llamó `logs_YYYY-MM-DD.json`
5. [ ] Abrir archivo con editor de texto
6. [ ] [ ] Debe empezar con `[` (array)
7. [ ] [ ] Debe tener objetos con campos: id, user_id, action, service, status, created_at
8. [ ] [ ] Debe terminar con `]`
9. [ ] [ ] JSON debe ser válido (sin errores de sintaxis)

**Resultado esperado:** ✅ JSON se descarga correctamente con estructura válida

**Si falla:**
- [ ] Mismo troubleshooting que Test 4

---

## 🧪 Test 6: Tabla de Usuarios con Datos Reales

**Objetivo:** Verificar que panel consulta datos reales de Supabase, no mock data

### Pasos:
1. [ ] Agregar un usuario nuevo desde el panel
   - [ ] Click "Crear Usuario"
   - [ ] ID: 1234567890
   - [ ] Créditos: 50
   - [ ] Guardar
2. [ ] En Telegram, espiar en Supabase Console
   - [ ] Ir a Supabase → Table Editor → `users`
   - [ ] [ ] Debe aparecer usuario con ID 1234567890
3. [ ] Volver al panel
4. [ ] Buscar "1234567890"
5. [ ] [ ] Debe aparecer el usuario con 50 créditos

**Resultado esperado:** ✅ Datos en panel coinciden con Supabase

**Si falla:**
- [ ] Verificar que tabla `users` tiene el dato
- [ ] Verificar que endpoint `/api/users` consulta Supabase y no usa mock data
- [ ] Revisar código en `app/api/users/route.ts`

---

## 🧪 Test 7: Fallback a JSON (Sin Supabase)

**Objetivo:** Verificar que bot funciona incluso si Supabase no está disponible

**Solo si quieres probar robustez:**

### Pasos:
1. [ ] Comentar variables de Supabase en .env del bot
2. [ ] Reiniciar bot
3. [ ] [ ] Bot debe iniciar sin errores
4. [ ] [ ] Debe decir "⚠️ Supabase no está configurado, usando solo JSON"
5. [ ] Desde Telegram: `/start` → Comprar número → Completar compra
6. [ ] [ ] Bot debe funcionar normalmente
7. [ ] [ ] Datos se guardan en `users.json`
8. [ ] Restaurar variables de Supabase y reiniciar

**Resultado esperado:** ✅ Bot es resiliente, funciona sin Supabase

---

## 📊 Resumen de Resultados

Marcar el resultado final:

### Sincronización
- [ ] Test 1: Créditos se sincronizan ✅
- [ ] Test 2: Compras aparecen en logs ✅
- [ ] Test 3: Panel auto-refresca ✅

### Exportación
- [ ] Test 4: Exportación CSV funciona ✅
- [ ] Test 5: Exportación JSON funciona ✅

### Datos
- [ ] Test 6: Datos son reales, no mock ✅
- [ ] Test 7: Fallback a JSON funciona ✅

---

## ✨ Resumen Final

**Si todos los tests pasaron:** ✅ **SISTEMA COMPLETAMENTE FUNCIONAL**

El proyecto ahora tiene:
- ✅ Sincronización bot ↔ Supabase
- ✅ Logs reales en panel
- ✅ Auto-refresh automático
- ✅ Exportación CSV/JSON
- ✅ Fallback a JSON si falla Supabase

**Próximos pasos:**
1. Deploy a producción
2. Configurar monitoreo
3. Hacer backup regular
4. Documentar cambios para el equipo

---

**Fecha de pruebas:** _____________  
**Responsable:** _____________  
**Ambiente:** [ ] Desarrollo [ ] Staging [ ] Producción  
**Resultado:** [ ] ✅ TODO BIEN [ ] ⚠️ ERRORES [ ] ❌ CRÍTICO
