# Spens

<p align="center">
  <img src="docs/icon-512-preview.jpg" width="120" alt="Spens Logo" style="border-radius: 28px;" />
</p>

<p align="center">
  <strong>Gestión de gastos e ingresos conversacional en español argentino.</strong><br />
  100% privado · Funcionamiento offline · PWA Instalable · Diseño minimalista Braun
</p>

<p align="center">
  <a href="https://felivander.github.io/SPEN/"><img src="https://img.shields.io/badge/Demo-Probar_Spens-orange?style=for-the-badge&logo=pwa" alt="Demo en Vivo" /></a>
  <a href="#-instalar-en-el-celular"><img src="https://img.shields.io/badge/App-Instalar_PWA-black?style=for-the-badge&logo=apple" alt="PWA" /></a>
</p>

---

## ⚡ Demo en Tiempo Real

<p align="center">
  <img src="docs/demo.gif" width="380" alt="Demostración de Spens en vivo" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" /><br />
  <em>Escribí <code>hamburguesa 6.500</code> o <code>nafta 18k</code> y se interpreta e ingresa al instante.</em>
</p>

---

## 📱 Capturas de Pantalla

| **Pantalla Principal** | **Filtro Expandido** | **Historial Mensual** | **Panel de Ajustes** |
| :---: | :---: | :---: | :---: |
| <img src="docs/screenshots/dashboard.png" width="220" /> | <img src="docs/screenshots/range-nav-expanded.png" width="220" /> | <img src="docs/screenshots/history.png" width="220" /> | <img src="docs/screenshots/settings.png" width="220" /> |
| *Saldo y chat* | *`anteayer` · `ayer` · `hoy`* | *Desglose y navegación* | *Gestos y datos* |

---

## 🚀 Lo Destacado

- 🗣️ **Parser Local es-AR**: Entiende `15 mil`, `2 lucas`, `5k`, `2 palos`, palabras escritas (`dos mil`), cobros (`cobré 180k`), y fechas relativas (`ayer`, `anteayer`, `12/3`).
- 🗓️ **Filtros por Fecha**: Al presionar `hoy`, el menú se despliega animadamente mostrando `anteayer` y `ayer`. Al ingresar un gasto estando en `ayer`, se asigna directamente a ese día.
- 🏷️ **Edición Rápida de Categorías**: Tocá cualquier ítem de la lista para reasignar su categoría al instante con un selector horizontal con *glassmorphism*.
- 🤏 **Gestos Táctiles**: Deslizá hacia abajo para cerrar Ajustes con resistencia elástica (*rubber-band*), o arrastrá de izquierda a derecha para cerrar el Historial.
- 🔒 **100% Privado y Offline**: Guardado en `localStorage`. No requiere cuenta ni servidor. Podés exportar e importar tus datos en `.json` en 1 clic.
- 🎨 **Estética Dieter Rams**: Paleta cálida basada en OKLCH, tipografía limpia, sin sombras pesadas y color acento naranja Braun.

---

## 🛠️ Desarrollo Local

```bash
# Clonar e instalar
git clone https://github.com/Felivander/SPEN.git
cd SPEN
npm install

# Correr servidor local (Vite)
npm run dev

# Compilar para producción
npm run build
```

---

## 📲 Instalar en el Celular

1. Entrá a **[https://felivander.github.io/SPEN/](https://felivander.github.io/SPEN/)** desde tu iPhone o Android.
2. En Safari/Chrome: **Compartir** ➔ **Agregar a pantalla de inicio**.
3. ¡Listo! Se abre como una App nativa en pantalla completa y funciona sin conexión.

---

## ⚙️ Tech Stack

`React 18` · `TypeScript` · `Vite` · `Vanilla CSS (OKLCH)` · `vite-plugin-pwa` · `Iconoir` · `Playwright`
