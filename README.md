# ISO 27002 Maturity Dashboard

[![Repo](https://img.shields.io/badge/GitHub-viggo2040-181717?logo=github)](https://github.com/viggo2040/iso27002-maturity-dashboard)
[![Issues](https://img.shields.io/github/issues/viggo2040/iso27002-maturity-dashboard)](https://github.com/viggo2040/iso27002-maturity-dashboard/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Dashboard de madurez ISO 27002 con **PHP + JavaScript + p5.js** y **look Gradio Dark**.
Pensado para **Hostinger** (hosting compartido, sin Composer).

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

## Contribución
Ver [CONTRIBUTING.md](CONTRIBUTING.md) y [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Licencia
[MIT](LICENSE) © 2025 viggo2040
