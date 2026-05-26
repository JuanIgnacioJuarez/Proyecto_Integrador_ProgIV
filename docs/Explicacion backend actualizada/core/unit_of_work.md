# Explicación detallada de `backend/core/unit_of_work.py`

## ¿Qué problema resuelve?

Este archivo centraliza el manejo transaccional.

En vez de que cada servicio haga `commit()` o `rollback()` por su cuenta, el `UnitOfWork` decide cómo cerrar la transacción según si hubo error o no.

---

## Dependencias principales

Importa `Session` y todos los repositorios de módulos (`categorias`, `productos`, `usuarios`, `pedidos`, etc.).

Cuando se instancia, crea una “fachada” única de acceso a datos:

- `uow.productos`
- `uow.usuarios`
- `uow.pedidos`
- `uow.historial_pedido`
- etc.

---

## Flujo de uso

Se usa así en servicios:

```python
with UnitOfWork(session) as uow:
    # lógica de negocio
```

### `__enter__`

Devuelve la instancia para operar dentro del bloque.

### `__exit__`

- Si no hubo excepción: `commit()`.
- Si hubo excepción: `rollback()`.
- Siempre: `close()` de sesión.

Esto garantiza cierre consistente de recursos.

---

## Métodos explícitos

También ofrece:

- `commit()`
- `rollback()`

Útil si querés controlar manualmente casos especiales, aunque el flujo principal ya está cubierto por el contexto `with`.

---

## Ventaja arquitectónica

Este patrón reduce errores de transacción y deja clara la responsabilidad:

- Repositorios: `flush()` y acceso a datos.
- Servicios: reglas de negocio.
- Unit of Work: commit/rollback/cierre.
