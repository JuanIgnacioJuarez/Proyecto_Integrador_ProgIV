/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useMemo, useState } from 'react';

import type { CarritoContextType, CarritoItem, CarritoState } from './Carrito';
import type { Producto } from './Producto';
import { useAuth } from './useAuth';

const STORAGE_PREFIX = 'carrito_v1_user_';

export const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

function getStorageKey(userId: number): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function readStoredCart(userId: number): CarritoItem[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CarritoState;
    if (!parsed || !Array.isArray(parsed.items)) return [];
    return parsed.items.filter((item) => item.producto_id > 0 && item.cantidad > 0);
  } catch {
    return [];
  }
}

function persistCart(userId: number, items: CarritoItem[]): void {
  localStorage.setItem(getStorageKey(userId), JSON.stringify({ items }));
}

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CarritoItem[]>([]);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
      return;
    }
    setItems(readStoredCart(user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    persistCart(user.id, items);
  }, [user, items]);

  const agregarProducto = (producto: Producto, cantidad = 1) => {
    if (!producto.id || cantidad <= 0) return;
    const productoId = producto.id;
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.producto_id === productoId);
      const stock = Math.max(0, producto.stock_cantidad ?? 0);
      if (stock <= 0) return prev;

      if (idx === -1) {
        return [
          ...prev,
          {
            producto_id: productoId,
            nombre: producto.nombre,
            precio_unitario: Number(producto.precio_base ?? 0),
            cantidad: Math.min(cantidad, stock),
            stock_disponible: stock,
          },
        ];
      }

      return prev.map((item, currentIndex) => {
        if (currentIndex !== idx) return item;
        return {
          ...item,
          nombre: producto.nombre,
          precio_unitario: Number(producto.precio_base ?? item.precio_unitario),
          stock_disponible: stock,
          cantidad: Math.min(item.cantidad + cantidad, stock),
        };
      });
    });
  };

  const incrementarItem = (productoId: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.producto_id !== productoId) return item;
        return { ...item, cantidad: Math.min(item.cantidad + 1, item.stock_disponible) };
      }),
    );
  };

  const decrementarItem = (productoId: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.producto_id !== productoId) return item;
          return { ...item, cantidad: item.cantidad - 1 };
        })
        .filter((item) => item.cantidad > 0),
    );
  };

  const quitarItem = (productoId: number) => {
    setItems((prev) => prev.filter((item) => item.producto_id !== productoId));
  };

  const vaciarCarrito = () => {
    setItems([]);
  };

  const totalItems = useMemo(
    () => items.reduce((acum, item) => acum + item.cantidad, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((acum, item) => acum + item.precio_unitario * item.cantidad, 0),
    [items],
  );

  const value = useMemo<CarritoContextType>(
    () => ({
      items,
      totalItems,
      subtotal,
      agregarProducto,
      incrementarItem,
      decrementarItem,
      quitarItem,
      vaciarCarrito,
    }),
    [items, totalItems, subtotal],
  );

  return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;
}


