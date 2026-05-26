# Explicación detallada de `backend/modules/direcciones/models.py`

## Modelo principal: `DireccionEntrega`

Representa direcciones de entrega asociadas a usuarios.

---

## Campos importantes

- `id`: PK.
- `usuario_id`: FK a `usuario.id`.
- `alias`: nombre corto opcional (ej: "Casa").
- `linea1`, `linea2`, `ciudad`, `provincia`, `codigo_postal`: datos postales.
- `latitud`, `longitud`: coordenadas opcionales.
- `es_principal`: marca la dirección preferida.

Timestamps:

- `created_at`
- `updated_at`
- `deleted_at` (soft delete)

---

## Relación

`pedidos: List[Pedido] = Relationship(back_populates="direccion")`

Permite navegar desde dirección hacia sus pedidos vinculados.

---

## Notas de diseño

- Soporta geolocalización pero no la obliga.
- Usa soft delete para mantener historial funcional.
