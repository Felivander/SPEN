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

## Deploy a GitHub Pages

Ya está configurado. En el repo: **Settings → Pages → Source: GitHub Actions**.
Con eso, cada push a `main` corre `.github/workflows/deploy.yml`, que tipa,
testea, buildea y publica.

Queda en `https://felivander.github.io/SPEN/`.

El `base` de Vite apunta a `/SPEN/` porque Pages sirve el repo en un subdirectorio.
Si renombrás el repo, cambiá esa constante en `vite.config.ts`. Para un dominio
propio o Vercel, buildeá con `BASE_PATH=/`.

---

## ¿Hace falta el LLM? No.

**El lector local es el camino principal, no un plan B.** Es determinístico,
instantáneo, gratis, funciona sin conexión y nada de lo que escribís sale del
dispositivo. Hay 26 casos cubiertos en `npm test`:

| Entiende | Ejemplos |
|---|---|
| Notación es-AR | `1.200` · `1.200,50` · `5k` · `15 mil` · `2 lucas` · `2 palos` |
| Números escritos | `dos mil` · `mil quinientos` · `cien mil` · `dos millones` |
| Ingresos vs gastos | `cobré` · `me devolvieron` · `me entraron` · `sueldo` · `vendí` |
| Fechas relativas | `ayer` · `anteayer` · `12/3` |
| Varios por mensaje | `super 8.400 y nafta 15000` |
| Categorías | ~200 palabras clave, incluidas cadenas de supermercado |

Y sabe **no** anotar: `hola`, `dos cafés` o `¿cuánto gasté este mes?` no generan
movimientos.

**Lo que suma el LLM** son los casos sueltos: un comercio que no está en el
diccionario, una frase muy conversacional, `el martes que viene`. Útil, no
necesario.

### En un link público, andá sin LLM

Es la opción correcta por tres razones: no hay clave que se filtre, no hay
cuota tuya que alguien pueda quemar, y los gastos de cada visitante nunca salen
de su dispositivo. Además GitHub Pages es hosting estático — no puede correr
`api/parse.js` de todos modos.

El build público sale sin IA por defecto: no pongas `VITE_LLM_PROXY_URL` y listo.
Cada visitante que quiera IA pega **su propia** clave de Groq en Ajustes, en su
propio dispositivo. Tu clave nunca entra en juego.

### Si igual querés el proxy (Vercel, no Pages)

`api/parse.js` guarda la clave del lado del servidor: el navegador nunca la ve.

```bash
vercel env add GROQ_API_KEY          # tu clave gsk_…
vercel env add ALLOWED_ORIGIN        # https://tu-app.vercel.app
vercel deploy --prod
```

Después, Ajustes → Proxy: `https://tu-app.vercel.app/api/parse`.

**Lo que el proxy no puede hacer:** es una URL pública, y una app de navegador no
tiene forma de guardar un secreto — cualquier token que le pases al cliente se
lee en el bundle. Por eso trae allowlist de origen (`ALLOWED_ORIGIN`, **ponela**
o queda en `*`), rate limit por IP (`RATE_PER_MIN`, default 20) y la forma del
request fijada del servidor. Nada de eso frena a alguien con `curl`: el límite
real es la cuota del free tier, así que mirá el uso de vez en cuando.

### La clave en el dispositivo queda a la vista

Está en `localStorage` y viaja en el header de cada request, así que se lee
desde devtools. Si es **tu** clave en **tu** teléfono, es un riesgo aceptable:
es gratis, no tiene medio de pago atrás y la rotás en dos clics. Lo que no hay
que hacer es buildear el sitio público con tu clave adentro.

---

## Tests

```bash
npm test
```

26 casos sobre el lector local, incluidos los que **no** deben registrar nada.
Corren también en CI antes de cada deploy.

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
    parse.ts              lector local por reglas — el camino principal
    numbers.ts            números escritos en palabras ("mil quinientos")
    llm.ts                Groq opcional + validación de la respuesta
    categories.ts         categorías + diccionario de palabras clave
    dates.ts              semana con lunes primero, fechas locales
    format.ts             plata en es-AR
    storage.ts            localStorage + export/import
    theme.ts              claro / oscuro / sistema
api/parse.js              proxy serverless opcional (no aplica en Pages)
scripts/make-icons.mjs    genera los PNG del PWA sin dependencias
scripts/test-parser.mjs   suite del lector local
.github/workflows/        build + deploy automático a Pages
```

## Stack

React 18 · TypeScript · Vite · vite-plugin-pwa · Iconoir · Groq
