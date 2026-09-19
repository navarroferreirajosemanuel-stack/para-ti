# Carta digital · Feliz Día del Amor y la Amistad 💛

Página estática (HTML + CSS + JS, sin dependencias) pensada para móviles.

```
index.html   estructura y textos (edítalos aquí)
style.css    diseño y animaciones
script.js    apertura, pétalos, sonido opcional
assets/      ramo, personaje, corazón, pétalo y favicon (SVG)
```

## Probar en local
```bash
python3 -m http.server 8000     # dentro de esta carpeta
# abre http://localhost:8000
```
(También funciona abriendo `index.html` directamente.)

## Publicar en GitHub Pages
1. Crea un repositorio y sube el contenido de esta carpeta a la rama `main`.
2. En el repositorio: **Settings → Pages → Build and deployment**.
3. *Source*: **Deploy from a branch** · *Branch*: `main` / `(root)` → **Save**.
4. En 1-2 minutos estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`

## Personalizar
- Textos: `index.html` (busca `TEXTOS`).
- Enlace personalizado: `.../?para=Ana` → "Hay algo para ti, Ana..."
- Abrir sola (para grabar video/GIF): `.../?auto`
