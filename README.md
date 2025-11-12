# ISO 27002 Maturity Dashboard

[![Repo](https://img.shields.io/badge/GitHub-viggo2040-181717?logo=github)](https://github.com/viggo2040/iso27002-maturity-dashboard)
[![Issues](https://img.shields.io/github/issues/viggo2040/iso27002-maturity-dashboard)](https://github.com/viggo2040/iso27002-maturity-dashboard/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Dashboard de madurez ISO 27002 con **PHP + JavaScript + p5.js**.

## Funcionalidad
- **Subida de CSV** (`/public/upload.html`) → guarda en `data/data.csv` (requiere contraseña).
- **Resumen JSON** (`/api/summary.php`) → promedios por dominio.
- **Dashboard** (`/public/index.html`) → KPIs, gráfico p5.js y tabla.

## Estructura
```
api/               # endpoints PHP (upload + summary)
public/            # frontend (HTML, JS, CSS)
data/              # CSV (no se versiona; se crea en servidor)
docs/Objetivos.txt # copia de objetivos del proyecto
```

## Deploy en Hostinger
1. Sube todo a `public_html/` respetando estructura.
2. Edita `api/config.php`:
   ```php
   'data_file' => __DIR__ . '/../data/data.csv',
   'auth_password' => 'CAMBIA_ESTA_CONTRASEÑA',
   ```
3. Asegura permisos de escritura en `data/`.
4. Verifica:
   - `https://TU_DOMINIO/api/summary.php` → JSON
   - `https://TU_DOMINIO/public/upload.html` → subir CSV
   - `https://TU_DOMINIO/public/index.html` → dashboard

## Contribución
Ver [CONTRIBUTING.md](CONTRIBUTING.md) y [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Licencia
[MIT](LICENSE) © 2025 viggo2040
