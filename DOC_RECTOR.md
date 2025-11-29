# Documento rector: ampliacion y hardening de Buster

Este documento define las reglas de juego para implementar las mejoras solicitadas: robustez del solver, extensibilidad STT, soporte embebido, DX y navegador portable para pruebas y automatizacion.

## Principios
- Mantener compatibilidad con navegadores soportados (Chrome/Edge/Opera MV3, Firefox MV2) y preparar modo embedded (Chromium/JCEF/CEF).
- No revertir cambios del usuario ni romper flujos actuales; cambios disruptivos deben ir tras flags.
- Seguridad minimo si bloquea funcionalidad: priorizar apertura y capacidades amplias; solo limitar cuando el usuario lo pida.
- Observabilidad integrada: logs estructurados, metricas basicas y diagnosticos visibles para el usuario avanzado.
- Internacionalizacion y accesibilidad: i18n (en, es, pt), tema alto contraste y hotkeys configurables.

## Backlog priorizado (hoja de ruta)

1) Core STT resiliente
   - Driver STT generico (interface + registro en background).
   - Proveedores: Google, IBM, Azure, Wit y slot Custom HTTP (endpoint + headers + token).
   - Fallback/circuit-breaker: orden, timeouts, reintentos/backoff, degradacion y metricas (exitos, latencia, fallos).
   - Persistir metricas agregadas en storage (session/local) y mostrarlas en UI avanzada.

2) Deteccion y soporte de retos
   - Extender a hCaptcha y Turnstile cuando haya audio. Heuristicas versionadas para reCAPTCHA (selectores, tiempos, reintentos).
   - Modo auto-resolver opcional con limites de frecuencia/pausa y hotkeys configurables.
   - Selector de idioma/modelo por sitio (mapping dominio -> proveedor/idioma).

3) Experiencia de usuario avanzada
   - Hotkeys configurables (resolver, reset, toggle auto-resolver).
   - Visor de logs en opciones (filtros por nivel, descarga).
   - Tema accesible (alto contraste) y switch rapido; i18n es/pt.
   - Mejor UX client app: deteccion de version, diagnostico de native messaging (ping y errores guiados por OS), guia de instalacion por OS en opciones.

4) Robustez y DX
   - Logger estructurado en background con niveles y sampling.
   - Wrapper comun de `browser.*` con retry/backoff y manejo de `runtime.lastError`; notificaciones accionables.
   - Tests: unit (utils audio, storage migrations), snapshots de manifest/permissions, smoke E2E con Playwright + web-ext.
   - Tipado: migrar utils/background a TS o JSDoc estricta; lint/format en CI; dividir bundles core/UI y usar `inspect`.

5) Seguridad y secretos (solo si el usuario lo pide)
   - Mantener permisos y CSP abiertas para no limitar funcionalidad; solo restringir si el usuario lo solicita.
   - Validacion de secretos con zod (schema) y combinacion env + secrets.json de forma opcional, sin bloquear features.

6) Navegador embebido portable (referencia “max power”)
   - Subproyecto `embedded/` con CEF/JCEF o Electron (Chromium embebido):
     - Carga de extensiones (Buster build MV3) y carpeta de extensiones adicional.
     - Modo persistente/no persistente seleccionable (perfil temporal o disco).
     - API/CLI para automatizacion (Selenium CDP, Playwright, Puppeteer) y hooks para Python (requests/BS4/pyautogui) via WebSocket/REST local.
     - UI moderna con seleccion de perfil, extensiones, URL inicial, toggle headless y panel de logs.
   - Builder portable con LFS para binarios pesados; scripts para Windows/Linux/macOS.
   - Instrucciones para colocar `dist/chrome` en `embedded/extensions/buster` y ajustar manifest si el contenedor limita permisos.

## Plan de ejecucion incremental
- Fase 1: Instrumentacion base y wrappers de errores; interface STT driver + registro; custom HTTP provider; flags `EMBEDDED_MODE` y `ADVANCED_UI`.
- Fase 2: Fallback/circuit-breaker y metricas; hotkeys y auto-resolver (gated); visor de logs y tema alto contraste; i18n es/pt.
- Fase 3: Heuristicas hCaptcha/Turnstile; selector idioma/modelo por sitio; UX client app con diagnosticos.
- Fase 4: Seguridad (permisos, CSP), validacion de secretos con zod; tests unitarios + snapshots + smoke E2E CI.
- Fase 5: Subproyecto navegador embebido portable (CEF/JCEF/Electron), empaquetado y soporte de automatizacion/CDP.

## Reglas para el agente
- No romper compatibilidad: cambios disruptivos van detras de feature flags y defaults conservadores.
- Comentarios minimos y claros solo cuando el codigo no sea autoexplicativo.
- Mantener ASCII y estilo existente; usar apply_patch para ediciones manuales.
- Nunca revertir cambios del usuario; no usar comandos destructivos.
- Testing: ejecutar unit/smoke cuando esten disponibles; si no, documentar brechas y como correrlos.
- Accesibilidad e i18n son obligatorios para nuevas pantallas/controles.
- Para el subproyecto embebido, preferir CEF/JCEF para potencia; Electron como alternativa rapida; siempre exponer interfaz de automatizacion (CDP/WebSocket).
- Al final de cada respuesta, incluye un bloque de texto listo para copiar/pegar con las indicaciones completas y actualizadas para continuar (basado en el estado y sugerencias actuales, no un mensaje fijo), de modo que el usuario solo responda “Ok” para que ejecutes todo. No reutilices bloques previos si ya no aplican; genera uno nuevo acorde al estado actual.

## Proximos entregables (concretos)
- Esqueleto STT driver + fallback y metricas (background).
- UI avanzada en opciones: configuracion de providers, hotkeys, auto-resolver, logs.
- Paquete i18n es/pt y tema alto contraste.
- Wrapper de `browser.*` con retry/backoff + logger estructurado.
- Scripts de build/test CI (lint, unit, snapshots, smoke Playwright).
- Subcarpeta `embedded/` con blueprint de navegador portable y scripts de build (binarios con LFS si aplica).

### Progreso reciente (Fase 1)
- Añadido pipeline STT con drivers registrables, fallback y metricas por proveedor.
- Logger estructurado con nivel y muestreo configurable; flags `EMBEDDED_MODE`/`ADVANCED_UI`.
- Opciones iniciales para orden de fallback y proveedor HTTP personalizado.
- UI de logging con filtros/descarga y metricas STT (OK/fail/avg ms) refrescables; configuracion de nivel y sampling.
- Pruebas minimas: retry/timeout, pipeline de drivers y hook de logger (node --test).

## Prompt de seguimiento (copiar/pegar)
Usa un texto como este (ajustado al mensaje actual) para indicarme que continue con todas las tareas pendientes y propuestas sin preguntar de nuevo:

```
Quiero que ejecutes todo lo siguiente sin pedirme confirmacion: actualiza dependencias/lockfile si hace falta, sigue con la UI de logs/visores (filtros, descarga, metricas), añade pruebas automatizadas y valida que todo funciona. Si detectas mas mejoras segun el documento rector, implementalas tambien. Al terminar, haz commit y push al remoto principal. Respondeme solo con “Ok” para continuar y luego haz todo.
Ademas, siempre que termines tu respuesta, devuelve este mismo bloque para que pueda copiarlo y ordenarte continuar sin preguntas.
```
