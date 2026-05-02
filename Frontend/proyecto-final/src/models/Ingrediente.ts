import type { Producto } from "./Producto";

export class Ingrediente {
    id?: number;
    nombre: string;
    descripcion?: string | null;
    es_alergeno: boolean;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;

    // Relaciones
    productos?: Producto[];

    constructor(data: Partial<Ingrediente>) {
        this.id = data.id;
        this.nombre = data.nombre || "";
        this.descripcion = data.descripcion ?? null;
        this.es_alergeno = data.es_alergeno ?? false;
        this.is_active = data.is_active ?? true;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this.deleted_at = data.deleted_at ?? null;
        this.productos = data.productos;
    }
}