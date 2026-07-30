# Xpenz

Gastos e ingresos que se anotan hablándole a un chat. Se guarda todo en el
dispositivo, funciona sin conexión y se instala en la pantalla de inicio del
iPhone como una app más.

---

## Cómo se usa

Escribís en el chat de abajo, en castellano normal:

```
café 1.200
nafta 15 mil y super 8.400
ayer farmacia 9800
cobré 180 mil del freelance
```

Se parsea a JSON, se categoriza solo y aparece en la lista. La app entiende
`1.200` (mil doscientos), `1.200,50`, `5k`, `5 mil`, `2 lucas`, `2 palos`,
fechas relativas (`ayer`, `anteayer`, `12/3`) y varios movimientos en un mismo
mensaje.

**Arriba** está el saldo total. Debajo, ocho puntitos: cada uno es un
movimiento anotado hoy — naranjas los usados, grises los que faltan.

**La mini nav** es solo texto. `mes` abre un dropdown para cambiar a `semana`;
en modo semana la barra pasa a mostrar `lun mar mié jue vie sáb dom`. Las
flechas `‹ ›` recorren meses o semanas hacia atrás.

---

## Correr el proyecto

```bash
npm install
npm run dev
```

```bash
npm run build && npm run preview
```

`npm run build` genera los íconos, tipa el proyecto y compila a `dist/`, que es
una carpeta estática: sirve en Vercel, Netlify, Cloudflare Pages, GitHub Pages
o cualquier hosting de archivos.

Si lo publicás en un subdirectorio (GitHub Pages), poné el nombre del repo en
`base` dentro de `vite.config.ts`.

---

## La IA (Groq)

Sin configurar nada, la app usa un **lector local** por reglas: regex para los
montos y un diccionario de palabras clave para las categorías. Anda offline y
resuelve bien los casos comunes.

Con una clave de Groq se usa un modelo para los casos raros, y el lector local
queda de red de contención: si falla la red, la clave, el CORS o el JSON, se
cae al parser local y te avisa en la misma línea del chat.

Clave gratis en [console.groq.com/keys](https://console.groq.com/keys). Modelos
disponibles en Ajustes: Llama 3.3 70B (default), GPT-OSS 120B / 20B, Llama 3.1
8B.

### ⚠️ Seguridad de la clave — leelo antes de publicar el link

Hay dos formas de conectar Groq, y **no son igual de seguras**:

| | Clave en el dispositivo | Proxy propio |
|---|---|---|
| Dónde vive la clave | `localStorage` del navegador | Variable de entorno del servidor |
| ¿El navegador la ve? | **Sí** | No |
| ¿Se puede leer desde devtools? | **Sí** | No |
| ¿Sirve si compartís el link? | **No** — cada visitante tendría que poner la suya, y la tuya queda expuesta si la dejaste puesta | Sí |
| Configuración | Pegar la clave en Ajustes | Deployar `api/parse.js` |

**La clave en el dispositivo queda a la vista.** Está en `localStorage`, viaja
en el header de cada request y aparece en la pestaña Network. Cualquiera que
abra las herramientas de desarrollador en ese teléfono o computadora la puede
copiar. Para un uso personal en tu propio teléfono es un riesgo aceptable: la
clave es gratis, no tiene datos de pago atrás y la rotás en dos clics. **No lo
uses si vas a compartir la URL con otra gente.**

**El proxy es la opción correcta si el link es público.** Deployás
`api/parse.js`, ponés `GROQ_API_KEY` como variable de entorno del servidor, y
apuntás `VITE_LLM_PROXY_URL` (o el campo Proxy en Ajustes) a ese endpoint. El
navegador nunca recibe la clave.

**Lo que el proxy igual no puede hacer:** es una URL pública, así que cualquiera
que la descubra puede pegarle. Una app que corre en el navegador no tiene forma
de guardar un secreto — cualquier token que le pongas al cliente se lee en el
bundle. Por eso `api/parse.js` trae:

- **Allowlist de origen** (`ALLOWED_ORIGIN`) — corta el uso desde otras webs.
  **Configurala**; si la dejás vacía queda en `*`.
- **Rate limit por IP** (`RATE_PER_MIN`, default 20) — frena un loop.
- **Forma de request fijada del lado del servidor** — el cliente elige el modelo
  (de una lista cerrada) y el texto, nada más. No se puede usar como relay
  genérico a Groq.

Nada de eso frena a alguien decidido con `curl`. El límite real es la cuota del
free tier de Groq: revisá el uso de vez en cuando y rotá la clave si algo pinta
raro.

**Los gastos nunca salen del dispositivo** salvo el texto que escribís en el
chat, que va a Groq para parsearse. Si no configurás IA, no sale nada.

### Deploy del proxy (Vercel)

```bash
vercel env add GROQ_API_KEY          # tu clave gsk_…
vercel env add ALLOWED_ORIGIN        # https://tu-app.vercel.app
vercel deploy --prod
```

Después, en Ajustes → Proxy, pegá `https://tu-app.vercel.app/api/parse`.
O al buildear: `VITE_LLM_PROXY_URL=https://tu-app.vercel.app/api/parse npm run build`.

---

## Instalar en el iPhone

Safari → Compartir → **Agregar a pantalla de inicio**. Queda en modo standalone
(sin barra de Safari), respeta el notch y la barra inferior, y funciona sin
conexión gracias al service worker.

---

## Los datos

Todo vive en `localStorage`, en este dispositivo. No hay cuenta ni servidor.

- **Exportar** baja un `.json` con todos los movimientos.
- **Importar** lo vuelve a cargar (reemplaza lo que haya).
- **Borrar todo** limpia el dispositivo, con confirmación.

Si borrás los datos del navegador, se van los movimientos. Exportá cada tanto.

---

## Diseño

Dieter Rams / Braun: fondo off-white cálido, negro casi puro para el texto, un
solo naranja como acento. Tipografía Helvetica (Helvetica Neue → Arial según el
sistema). **Sin sombras en ninguna parte**: las superficies se separan por un
escalón de tono más una línea de 1px, como los paneles de un aparato Braun.

El color se escribe en OKLCH para que los neutros compartan un mismo tono (85°)
y los pasos de luminosidad sean parejos. Los valores están elegidos para pasar
WCAG AA sobre su fondo real:

| Par | Claro | Oscuro | Mínimo |
|---|---|---|---|
| Texto / fondo | 14.9:1 | 15.8:1 | 4.5 |
| Texto secundario / fondo | 4.69:1 | 6.94:1 | 4.5 |
| Naranja como texto / fondo | 4.64:1 | 8.25:1 | 4.5 |
| Naranja como marca / tarjeta | 3.45:1 | 5.92:1 | 3.0 |

Modo claro / oscuro / sistema se elige en Ajustes.

El naranja significa una sola cosa: **movimiento de dinero**. Los puntos del
día, el subrayado de la pestaña activa, los ingresos. No se usa de adorno.

---

## Estructura

```
src/
  App.tsx                 estado, filtros por período, orquestación
  components/
    BalanceCard.tsx       saldo + los 8 puntos del día
    RangeNav.tsx          mini nav de texto + dropdown mes/semana
    MovementList.tsx      lista agrupada por día
    ChatBar.tsx           input + confirmación
    SettingsSheet.tsx     apariencia, Groq, datos
    icons.tsx             wrappers de Iconoir (un stroke, currentColor)
  lib/
    llm.ts                Groq + coerción y validación de la respuesta
    parse.ts              lector local por reglas (fallback y offline)
    categories.ts         categorías + diccionario de palabras clave
    dates.ts              semana con lunes primero, fechas locales
    format.ts             plata en es-AR
    storage.ts            localStorage + export/import
    theme.ts              claro / oscuro / sistema
api/parse.js              proxy serverless opcional
scripts/make-icons.mjs    genera los PNG del PWA sin dependencias
```

## Stack

React 18 · TypeScript · Vite · vite-plugin-pwa · Iconoir · Groq
