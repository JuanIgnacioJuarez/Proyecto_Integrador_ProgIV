from sqlalchemy import text

from backend.core.database import engine


def ensure_schema_compatibility() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                ALTER TABLE ingrediente
                ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(20) NOT NULL DEFAULT 'unidad'
                """
            )
        )
        conn.execute(
            text(
                """
                ALTER TABLE ingrediente
                ADD COLUMN IF NOT EXISTS stock_cantidad DOUBLE PRECISION NOT NULL DEFAULT 0
                """
            )
        )
        conn.execute(
            text(
                """
                ALTER TABLE producto
                ADD COLUMN IF NOT EXISTS imagenes_url JSON NOT NULL DEFAULT '[]'::json
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS producto_ingrediente_cantidad (
                    producto_id INTEGER NOT NULL REFERENCES producto(id),
                    ingrediente_id INTEGER NOT NULL REFERENCES ingrediente(id),
                    cantidad DOUBLE PRECISION NOT NULL,
                    PRIMARY KEY (producto_id, ingrediente_id)
                )
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE ingrediente
                SET unidad_medida = 'gr'
                WHERE lower(unidad_medida) IN ('g', 'gr', 'gramo', 'gramos', 'kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos')
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE ingrediente
                SET unidad_medida = 'litros'
                WHERE lower(unidad_medida) IN ('l', 'lt', 'litro', 'litros', 'ml', 'mililitro', 'mililitros')
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE ingrediente
                SET unidad_medida = 'unidad'
                WHERE lower(unidad_medida) IN ('u', 'un', 'unidad', 'unidades', 'pieza', 'piezas')
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE ingrediente
                SET unidad_medida = 'unidad'
                WHERE lower(nombre) IN (
                    'pan de hamburguesa',
                    'masa de pizza',
                    'masa de empanada',
                    'huevo',
                    'masa de tarta',
                    'limon',
                    'lim\u00f3n'
                )
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE ingrediente
                SET unidad_medida = 'gr'
                WHERE unidad_medida IS NULL OR trim(unidad_medida) = ''
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE ingrediente
                SET stock_cantidad = CASE
                    WHEN lower(nombre) = 'agua' THEN 50
                    WHEN lower(nombre) = 'leche' THEN 120
                    WHEN lower(nombre) = 'harina de trigo' THEN 20000
                    WHEN lower(nombre) = 'azucar' THEN 8000
                    WHEN lower(nombre) = 'cafe' THEN 5000
                    ELSE 100
                END
                WHERE stock_cantidad = 0
                """
            )
        )
