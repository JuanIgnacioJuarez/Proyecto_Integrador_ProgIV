import type { Producto } from './Producto';

export interface CarritoItem {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  stock_disponible: number;
}

export interface CarritoState {
  items: CarritoItem[];
}

export interface CarritoContextType {
  items: CarritoItem[];
  totalItems: number;
  subtotal: number;
  agregarProducto: (producto: Producto, cantidad?: number) => void;
  incrementarItem: (productoId: number) => void;
  decrementarItem: (productoId: number) => void;
  quitarItem: (productoId: number) => void;
  vaciarCarrito: () => void;
}
