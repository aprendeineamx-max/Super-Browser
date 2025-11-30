# Documento rector: ampliacion y hardening de Buster
```
## Fase 2 Completada
- Pipeline STT con drivers registrables, fallback configurable y m�tricas por proveedor.
- UI avanzada: configuraci�n de providers, hotkeys, auto-resolver, visor de logs/m�tricas, tema alto contraste, i18n es/pt.
- Wrapper `browser.*` con retry/backoff + logger estructurado y sincronizaci�n on-change.
- CI: lint, unit, build; smoke Playwright listo.
- Portable: blueprint de navegador, instalador de binario, launcher con fallback local y ZIP portable.
- Auto-resolver en content script con detecci�n, disparo autom�tico (gated) y manejo de errores.

## Progreso reciente
- Pipeline STT resiliente y m�tricas por proveedor; fallback configurable.
- Logger estructurado con nivel/muestreo y persistencia; visor de logs en UI.
- Opciones avanzadas con orden de fallback, custom HTTP, hotkeys, auto-resolver y visor r�pido de logs.
- i18n es/pt, tema alto contraste aplicado a la UI.
- CI: lint + unit + build; smoke E2E local con Playwright.
- Portable: blueprint de navegador, instalador de binario, launcher con fallback local y ZIP release portable.

## Fase 3: Hardening y Humanizaci�n (ideas)
- Simulaci�n de movimiento de mouse para evadir detecci�n de bots.
- Rotaci�n de User-Agents y fingerprinting en el navegador portable.
- Soporte de proxies en el launcher (args/config).

## Experimento: Lanzador basico con extension arbitraria
Objetivo: iniciar un navegador minimo cargando cualquier extension indicada por ruta absoluta, sin hardening ni logica adicional.

- Inputs:
  - EXT_PATH: ruta absoluta a la carpeta de la extension (desempaquetada, con manifest.json).
  - CHROME_PATH opcional: binario de Chrome/Chromium; si no, usar ruta por defecto del sistema.
  - PROFILE_DIR opcional: carpeta de perfil; si no, usar temp con limpieza previa.
- Pasos:
  1. Validar que EXT_PATH/manifest.json exista.
  2. Lanzar chrome con flags minimos: --load-extension=EXT_PATH, --user-data-dir=PROFILE_DIR, --no-first-run, --no-default-browser-check.
  3. No aplicar flags de stealth ni staging; solo asegurar que la extension se monte.
- Verificacion:
  - Abrir chrome://extensions y confirmar que la extension aparece habilitada.
  - Abrir una URL de prueba (p. ej., https://example.com) para validar que los scripts de la extension se cargan sin errores.

