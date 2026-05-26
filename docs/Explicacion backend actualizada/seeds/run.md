# Explicación detallada de `backend/seeds/run.py`

## Objetivo

Proveer un entrypoint manual para crear tablas y ejecutar seeds.

---

## Flujo

1. Importa modelos para registrar metadata (varios imports marcados con `# noqa: F401`).
2. Ejecuta `SQLModel.metadata.create_all(engine)`.
3. Abre sesión y corre `run_all_seeds(session)`.

---

## ¿Cuándo usarlo?

- En desarrollo local para inicializar DB rápidamente.
- Cuando querés cargar datos demo sin depender del arranque automático de la app.

---

## Diferencia con `main.py`

`main.py` puede correr seeds condicionalmente por variable de entorno.
`seeds/run.py` los ejecuta de forma explícita cuando llamás el script.
