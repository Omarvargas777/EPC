# Home EPC — Empresa de Servicios Públicos de Cajicá

Réplica del home mostrado en la captura, lista para subir a GitHub (GitHub Pages incluido).

## Estructura

```
epc-site/
├── index.html      → toda la estructura y el texto del home
├── styles.css       → colores, tipografías, layout y responsive
└── images/          → imágenes de reemplazo (ver tabla abajo)
```

## Cómo publicarlo en GitHub

1. Crea un repositorio nuevo (ej. `epc-home`).
2. Sube estos 3 elementos (`index.html`, `styles.css`, la carpeta `images/`) a la raíz.
3. Ve a **Settings → Pages**, elige la rama `main` y carpeta `/root`. Guarda.
4. En un par de minutos tu sitio queda publicado en `https://tuusuario.github.io/epc-home/`.

## Dónde poner tus propias imágenes

Reemplaza cada archivo en `/images` por el tuyo **con el mismo nombre** (o cambia la ruta en `index.html` si prefieres otros nombres):

| Archivo | Dónde se usa | Tamaño sugerido |
|---|---|---|
| `images/hero.jpg` | Fondo del banner principal (embalse/planta) | 1600×900 px |
| `images/ambiental.jpg` | Fondo de "Programas ambientales" | 1200×500 px |
| `images/encuesta-persona.jpg` | Foto circular del banner de encuesta | 300×300 px |
| `images/noticia-1.jpg` | Primera noticia | 500×300 px |
| `images/noticia-2.jpg` | Segunda noticia | 500×300 px |
| `images/noticia-3.jpg` | Tercera noticia | 500×300 px |
| `images/logo-alcaldia.png` | Logo Alcaldía de Cajicá | fondo transparente |
| `images/logo-cajica.png` | Logo Cajicá Tejiendo Futuro | fondo transparente |
| `images/logo-gobierno.png` | Logo Gobierno de Colombia | fondo transparente |
| `images/logo-superservicios.png` | Logo Superservicios | fondo transparente |
| `images/logo-minvivienda.png` | Logo MinVivienda | fondo transparente |

Ahora mismo esas imágenes son **placeholders** (rectángulos con el nombre escrito) solo para que el layout se vea completo — reemplázalas antes de publicar.

## Qué recreé de la imagen original

- Barra superior con línea de atención, emergencias y redes sociales.
- Encabezado con logo EPC, menú (Inicio, La Empresa, Servicios, Atención al ciudadano, Contratación, Transparencia), botón "Iniciar sesión" y buscador.
- Hero con titular en dos estilos (recto + script en verde), texto, dos botones y puntos de navegación.
- Barra de 9 accesos con ícono (¿Quiénes somos?, Acueducto, Alcantarillado, Aseo, Edictos, Administrativa, Comercial, Contratación, Gerencia).
- Bloque "Simplifica tu pago" con panel azul + dos tarjetas (Paga tu factura / Guía de pago).
- Bloque "Programas ambientales" (verde oscuro) con PGIRS, PUEAA y Plan de saneamiento.
- Sección "Trámites EPC" con 3 tarjetas (en línea, presenciales, PQRS).
- Banner de encuesta de satisfacción.
- Noticias (3 tarjetas) + panel "EPC en cifras" con 4 estadísticas.
- Carrusel de "Entidades y enlaces de interés".
- Footer completo con datos de contacto, enlaces rápidos y horarios.

Todo el texto, los números (98.456 usuarios, 1.250 km de red, etc.) y el orden de las secciones son fieles a la captura. Los íconos están hechos en SVG (no dependen de librerías externas), así que puedes recolorearlos fácilmente cambiando `stroke="..."` en el HTML o las variables de color en `styles.css` (`:root`).

## Personalizar colores

Todo el sistema de color vive en la parte superior de `styles.css`:

```css
:root {
  --azul-oscuro: #0b2c52;
  --verde: #7cb143;
  ...
}
```
