# Documento rector: ampliación y hardening de Buster

Este documento define las reglas de juego para que el agente implemente las mejoras solicitadas: robustez del solver, extensibilidad STT, soporte embebido, DX y programa de navegador portable para pruebas y automatización.

## Principios
- Mantener compatibilidad con navegadores soportados (Chrome/Edge/Opera MV3, Firefox MV2) y preparar “embedded mode” (Chromium/JCEF/CEF).
- No revertir cambios del usuario ni romper flujos actuales. Cambios gated por flags/feature toggles cuando afecten al comportamiento.
- Seguridad primero: minimizar permisos, validar secretos, manejar errores y timeouts explícitamente.
- Observabilidad integrada: logs estructurados, métricas básicas y diagnósticos visibles para el usuario avanzado.
- Internacionalización y accesibilidad: i18n (en, es, pt al menos), tema alto contraste y hotkeys configurables.

## Backlog priorizado (hoja de ruta)

1) **Core STT resiliente**
   - Implementar un “driver” STT genérico (interface + registro en background).
   - Añadir proveedores: Google, IBM, Azure, Wit (existentes), y slot “Custom HTTP” (endpoint + headers + token).
   - Fallback/circuit-breaker: pool ordenado, timeouts por proveedor, reintentos con backoff, degradación automática y métricas por proveedor (éxitos, latencia, fallos).
   - Persistir métricas agregadas en storage (session/local) y mostrarlas en UI avanzada.

2) **Detección y soporte de retos**
   - Extender detección a hCaptcha y Turnstile cuando haya audio. Heurísticas versionadas para reCAPTCHA (selectores, tiempos y reintentos).
   - Modo “auto-resolver” opcional con límites de frecuencia/pause y hotkeys configurables.
   - Selector de idioma/modelo por sitio (mapping dominio → proveedor/idioma).

3) **Experiencia de usuario avanzada**
   - Hotkeys configurables (resolver, reset, toggle auto-resolver).
   - Visor de logs en opciones (con filtros por nivel y descarga).
   - Tema accesible (alto contraste) y switch rápido; i18n es/pt.
   - Mejor UX client app: detección de versión, diagnóstico de native messaging (ping y errores guiados por OS), guía de instalación por OS en opciones.

4) **Robustez y DX**
   - Logger estructurado en background con niveles y sampling.
   - Wrapper común de `browser.*` con retry/backoff y manejo de `runtime.lastError`; notificaciones accionables (reintentar, cambiar proveedor, abrir opciones).
   - Tests: unit tests (utils audio, storage migrations), snapshots de manifest/permissions, smoke E2E con Playwright + web-ext en sitio de prueba de reCAPTCHA.
   - Tipado: migrar utils/background a TS o JSDoc estricta; lint/format en CI; dividir bundles core/UI y usar `inspect`.

5) **Seguridad y secretos**
   - Reducir `<all_urls>` si es viable; limitar `webRequest`/`declarativeNetRequest` a dominios de reCAPTCHA/STT.
   - Revisar CSP para embedded; flag `EMBEDDED_MODE` para desactivar features no soportadas (native messaging/offscreen).
   - Validación de secretos con zod (schema); combinar env + secrets.json; tooling para rotación/caducidad por idioma.

6) **Navegador embebido portable (referencia “max power”)**
   - Crear subproyecto (p.ej. `embedded/`) basado en CEF/JCEF o Electron con Chromium embebido:
     - Soporte de carga de extensiones (Buster build MV3) y carpeta de extensiones adicional.
     - Modo persistente/no persistente seleccionable al lanzar (perfil temporal o con storage en disco).
     - API/CLI para automatización (Selenium CDP, Playwright, Puppeteer) y hooks para scripts Python (requests/BS4/pyautogui) vía WebSocket/REST local.
     - UI moderna (shell minimal) con selección de perfil, extensiones a cargar, URL inicial, toggle headless, y panel de logs.
   - Builder portable: empaquetar binarios pesados con LFS si se suben a git; scripts para Windows/Linux/macOS.
   - Instrucciones para colocar `dist/chrome` en `embedded/extensions/buster` y ajustar manifest si el contenedor exige permisos limitados.

## Plan de ejecución incremental
- Fase 1: Instrumentación base y wrappers de errores; definir interface STT driver + registro; añadir custom HTTP provider; introducir flags `EMBEDDED_MODE` y `ADVANCED_UI`.
- Fase 2: Fallback/circuit-breaker y métricas; hotkeys y auto-resolver (gated); visor de logs y tema alto contraste; i18n es/pt.
- Fase 3: Heurísticas hCaptcha/Turnstile; selector de idioma/modelo por sitio; UX client app con diagnósticos.
- Fase 4: Seguridad (permisos, CSP), validación de secretos con zod; tests unitarios + snapshots + smoke E2E CI.
- Fase 5: Subproyecto navegador embebido portable (CEF/JCEF/Electron), empaquetado y soporte de automatización/CDP.

## Reglas para el agente
- No romper compatibilidad: cambios disruptivos van detrás de feature flags y defaults conservadores.
- Añadir comentarios mínimos y claros solo cuando el código no sea autoexplicativo.
- Mantener ASCII y estilo existente; usar apply_patch para ediciones manuales.
- Nunca revertir cambios del usuario; no usar comandos destructivos.
- Testing: ejecutar unit/smoke cuando estén disponibles; si no, documentar brechas y cómo correrlos.
- Accesibilidad e i18n son obligatorios para nuevas pantallas/controles.
- Para subproyecto embebido, preferir CEF/JCEF para potencia; Electron como alternativa rápida; siempre exponer interfaz de automatización (CDP/WebSocket).

## Próximos entregables (concretos)
- Esqueleto STT driver + fallback y métricas (background).
- UI avanzada en opciones: configuración de providers, hotkeys, auto-resolver, logs.
- Paquete i18n es/pt y tema alto contraste.
- Wrapper de `browser.*` con retry/backoff + logger estructurado.
- Scripts de build/test CI (lint, unit, snapshots, smoke Playwright).
- Subcarpeta `embedded/` con blueprint de navegador portable y scripts de build (binarios gestionados con LFS si se agregan).

### Progreso reciente (Fase 1)
- Añadido pipeline STT con drivers registrables, fallback y métricas por proveedor.
- Logger estructurado con nivel y muestreo configurable; flags `EMBEDDED_MODE`/`ADVANCED_UI`.
- Opciones iniciales para orden de fallback y proveedor HTTP personalizado.
- Pruebas mínimas: retry/timeout y pipeline de drivers (node --test).
