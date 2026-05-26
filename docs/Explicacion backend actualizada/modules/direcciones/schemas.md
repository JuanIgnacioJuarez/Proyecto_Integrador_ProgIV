# Explicación detallada de `backend/modules/direcciones/schemas.py`

## Estructura de contratos

Este archivo define cómo entra y sale la información de direcciones.

---

## Base

### `DireccionEntregaBase`

Contiene campos compartidos de dirección:

- alias
- líneas de dirección
- ciudad/provincia/código postal
- latitud/longitud

Incluye validaciones de longitud mínima/máxima.

---

## Entrada

### `DireccionEntregaCreate`

Hereda de base sin cambios: para alta.

### `DireccionEntregaUpdate`

Versión parcial: todos los campos opcionales para `PATCH`.

---

## Salida

### `DireccionEntregaRead`

Agrega metadatos del registro:

- `id`
- `usuario_id`
- `es_principal`
- `created_at`
- `updated_at`

---

## Valor

Separar `Create`, `Update` y `Read` evita sobreexposición y deja reglas claras por operación.
