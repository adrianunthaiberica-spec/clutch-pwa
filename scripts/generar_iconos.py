#!/usr/bin/env python3
"""
UNTHA CLUTCH — genera los iconos cuadrados de la PWA a partir del logotipo horizontal
(img/logo-untha.png).

El logo es muy apaisado y no tiene monograma cuadrado, así que el icono es: fondo teal
solido + logo centrado ocupando ~60% del ancho del icono. Eso deja margen de sobra para
la zona segura de la mascara adaptativa de Android (que puede recortar hasta un circulo
del 80% del icono): con el logo tan alargado, incluso al 60% del ancho la banda
resultante es muy fina en altura, asi que sobra margen vertical tambien.

Ninguno de los tres iconos lleva canal alfa (fondo solido, y ademas iOS no respeta la
transparencia en apple-touch-icon).

Uso:
    pip install Pillow
    python3 scripts/generar_iconos.py

Volver a ejecutarlo cada vez que cambie img/logo-untha.png.
"""

import os

from PIL import Image

DIR_RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_ORIGEN = os.path.join(DIR_RAIZ, 'img', 'logo-untha.png')

COLOR_TEAL = (0x00, 0x7A, 0x6E)
ANCHO_LOGO_PROPORCION = 0.60  # el logo ocupa ~60% del ancho del icono

ICONOS = [
    (192, os.path.join(DIR_RAIZ, 'icons', 'icon-192.png')),
    (512, os.path.join(DIR_RAIZ, 'icons', 'icon-512.png')),
    (180, os.path.join(DIR_RAIZ, 'icons', 'apple-touch-icon.png')),
]


def generar_icono(logo, tamano, ruta_salida):
    fondo = Image.new('RGB', (tamano, tamano), COLOR_TEAL)

    ancho_logo_destino = round(tamano * ANCHO_LOGO_PROPORCION)
    alto_logo_destino = round(ancho_logo_destino * logo.height / logo.width)
    logo_redimensionado = logo.resize((ancho_logo_destino, alto_logo_destino), Image.LANCZOS)

    x = (tamano - ancho_logo_destino) // 2
    y = (tamano - alto_logo_destino) // 2

    # Se pega usando el propio canal alfa del logo como mascara: donde el logo es
    # transparente se ve el fondo teal. `fondo` es RGB (sin alfa) y lo sigue siendo tras
    # el paste, asi que el PNG resultante no lleva canal alfa.
    fondo.paste(logo_redimensionado, (x, y), logo_redimensionado)

    os.makedirs(os.path.dirname(ruta_salida), exist_ok=True)
    fondo.save(ruta_salida, 'PNG')
    print(f'{ruta_salida} ({tamano}x{tamano}, logo {ancho_logo_destino}x{alto_logo_destino})')


def main():
    logo = Image.open(LOGO_ORIGEN).convert('RGBA')
    for tamano, ruta_salida in ICONOS:
        generar_icono(logo, tamano, ruta_salida)


if __name__ == '__main__':
    main()
