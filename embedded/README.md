# Embedded Browser Blueprint

Este directorio define un blueprint para ejecutar la extensión en navegadores embebidos (CEF/JCEF/Electron/Playwright) con perfiles temporales o persistentes y carga de extensiones adicionales.

## Flujo recomendado
1) Genera el build MV3 de Chrome:
   ```bash
   npm install --legacy-peer-deps
   npm run build:prod:chrome
   ```
   El paquete quedará en `dist/chrome`.

2) Copia `dist/chrome` a tu contenedor embebido:
   - CEF/JCEF: coloca el contenido en `embedded/extensions/buster` y apunta el loader a `embedded/extensions/buster/manifest.json`.
   - Electron/Playwright: usa la API de carga de extensiones del contexto de navegador (p.ej., `chromium.launch({ args: ['--disable-extensions-except=path', '--load-extension=path'] })`).

3) Perfiles persistentes o temporales:
   - Persistente: crea un directorio de usuario (p.ej., `embedded/profiles/default`) y lanza el contenedor apuntando a ese perfil.
   - Temporal: usa un directorio temporal por sesión.

4) API de automatización:
   - Habilita CDP/WebSocket en tu contenedor para que Selenium/Playwright/Puppeteer puedan conectarse.
   - Expón un puerto local para comandos (opcional) si necesitas integrarlo con scripts Python.

## manifest.json de ejemplo para contenedores
Si tu contenedor requiere ajustes, duplica el `dist/chrome/manifest.json` y modifica:
```json
{
  "name": "Buster Embedded",
  "version": "0.1.0",
  "manifest_version": 3,
  "host_permissions": ["<all_urls>"],
  "permissions": ["storage", "notifications", "webRequest", "webNavigation", "nativeMessaging", "offscreen", "scripting"],
  "content_security_policy": {
    "extension_pages": "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
  }
}
```
Usa este manifest en `embedded/extensions/buster/manifest.json` si necesitas un ID distinto o permisos adicionales.

## Pruebas rápidas con Playwright (carga de extensión)
Ejemplo de lanzamiento (requiere playwright-chromium instalado):
```js
const {chromium} = require('playwright');
const path = require('path');

const EXT_PATH = path.join(__dirname, '..', 'dist', 'chrome');

(async () => {
  const context = await chromium.launchPersistentContext(path.join(__dirname, 'profiles', 'tmp'), {
    headless: false,
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`
    ]
  });
  const page = await context.newPage();
  await page.goto('https://www.google.com/recaptcha/api2/demo');
})();
```
Adapta este snippet a tu contenedor o framework de automatización.

## Notas
- Mantén permisos y CSP abiertas en el manifest embebido si el contenedor lo permite, para máxima compatibilidad.
- Si el contenedor no soporta `nativeMessaging` u `offscreen`, elimina esas claves del manifest embebido.

## Scripts de conveniencia (npm)
- `npm run embedded:playwright`: lanza Playwright con la extensión cargada (perfil persistente configurable con `BUSTER_PROFILE_PATH`).
- `npm run embedded:playwright:smoke`: smoke headless tras haber generado `dist/chrome` (o define `BUSTER_EXT_PATH`).
- `npm run embedded:electron`: intenta lanzar Electron con la extensión; requiere entorno con GUI y que Electron exponga `app`.
- `npm run embedded:clean-profiles`: limpia perfiles temporales (Playwright/Electron).
- `npm run smoke:playwright`: limpia `dist`, construye `dist/chrome` y ejecuta el smoke de Playwright.
