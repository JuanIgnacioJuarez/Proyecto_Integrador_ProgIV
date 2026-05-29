# Explicación detallada de `backend/seeds/run.py`

## Objetivo

Brindar un script manual para:

1. Crear tablas.
2. Ejecutar seeds.

---

## Qué hace internamente

- Importa modelos para registrar metadata (varios imports con `# noqa: F401`).
- Ejecuta `SQLModel.metadata.create_all(engine)`.
- Abre sesión y llama `run_all_seeds(session)` desde `backend.seeds.seed_data`.

---

## Cuándo conviene usarlo

- Inicializar una base local rápidamente.
- Recargar datos demo fuera del arranque automático de la app.

---

## Diferencia con `main.py`

- `main.py`: puede seedear en startup de la API (opcional por variable de entorno).
- `seeds/run.py`: se ejecuta manualmente cuando querés seed explícito.
