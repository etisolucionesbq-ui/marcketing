# UP Gamer - pagina de ventas con CMS local

## Probar en local

Abre terminal en esta carpeta y ejecuta:

```powershell
npm.cmd run dev
```

Luego abre:

- Sitio: `http://localhost:4173/`
- Admin: `http://localhost:4173/admin/`

## Como funciona

- La tienda lee productos desde `data/products.json`.
- El carrusel y los avisos se leen desde `data/banners.json`.
- El admin guarda cambios reales en `data/products.json` y `data/site-settings.json`.
- En `/admin/` puedes agregar, editar y eliminar banners del carrusel y avisos promocionales.
- En `/admin/` tambien puedes cambiar logo, colores, estilo visual, ancho, altura del carrusel y forma de las tarjetas.
- El carrito vive en el navegador con `localStorage`.
- El boton de WhatsApp del carrito crea un mensaje con productos, cantidades y total.
- No hay login local, proxy ni Decap para probar en tu maquina.
- Para que el guardado funcione, debes entrar usando `npm run dev`, no abriendo el HTML directo.
- Si tu PowerShell bloquea `npm`, usa `npm.cmd run dev` o `node server.js`.

## Deploy en Netlify

El remoto Git ya apunta a:

```powershell
https://github.com/etisolucionesbq-ui/marcketing.git
```

Para subir:

```powershell
git -c safe.directory=C:/Users/AndresB/Documents/Codex/2026-05-25/hermano-que-mas-buen-dia add .
git -c safe.directory=C:/Users/AndresB/Documents/Codex/2026-05-25/hermano-que-mas-buen-dia commit -m "Initial ecommerce storefront"
git -c safe.directory=C:/Users/AndresB/Documents/Codex/2026-05-25/hermano-que-mas-buen-dia branch -M main
git -c safe.directory=C:/Users/AndresB/Documents/Codex/2026-05-25/hermano-que-mas-buen-dia push -u origin main
```

La tienda publica como sitio estatico con funciones de Netlify.

- Build command: dejar vacio.
- Publish directory: `.`
- Functions directory: `netlify/functions`

## Variables en Netlify

En Netlify, ve a **Site configuration > Environment variables** y crea:

```txt
ADMIN_USER=tu_usuario_admin
ADMIN_PASSWORD=tu_clave_segura
GITHUB_REPO=etisolucionesbq-ui/marcketing
GITHUB_BRANCH=main
GITHUB_TOKEN=token_privado_de_github
```

`GITHUB_TOKEN` debe tener permiso de lectura/escritura sobre contenidos del repo.

## Admin en produccion

- El link de admin no se muestra en la pagina publica.
- Entras manualmente a `/admin/`.
- Netlify pedira usuario y clave con Basic Auth.
- El admin guarda productos, banners y ajustes haciendo commits al repo por medio de `netlify/functions/content.js`.
