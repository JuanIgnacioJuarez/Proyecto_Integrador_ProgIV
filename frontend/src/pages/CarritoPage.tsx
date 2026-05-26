import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import type { PedidoCreatePayload } from '../entities/Pedido';
import { createPedido } from '../entities/pedidosApi';
import { useCarrito } from '../entities/useCarrito';
import { getApiErrorMessage } from '../shared/api/http';

const FORMAS_PAGO: PedidoCreatePayload['forma_pago_codigo'][] = [
  'EFECTIVO',
  'TARJETA',
  'TRANSFERENCIA',
];

const LABEL_FORMA_PAGO: Record<PedidoCreatePayload['forma_pago_codigo'], string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
};

function currency(value: number): string {
  return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

export function CarritoPage() {
  const { items, subtotal, totalItems, incrementarItem, decrementarItem, quitarItem, vaciarCarrito } =
    useCarrito();

  const [formaPago, setFormaPago] = useState<PedidoCreatePayload['forma_pago_codigo']>('EFECTIVO');
  const [notas, setNotas] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const payload = useMemo<PedidoCreatePayload>(
    () => ({
      forma_pago_codigo: formaPago,
      notas: notas.trim() || null,
      items: items.map((item) => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        personalizacion: [],
      })),
    }),
    [formaPago, notas, items],
  );

  const createMutation = useMutation({
    mutationFn: (body: PedidoCreatePayload) => createPedido(body),
    onSuccess: (pedido) => {
      vaciarCarrito();
      setNotas('');
      setFeedback(`Pedido #${pedido.id} creado correctamente. Estado inicial: ${pedido.estado_codigo}.`);
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, 'No se pudo crear el pedido'));
    },
  });

  const handleCheckout = () => {
    if (items.length === 0 || createMutation.isPending) return;
    setFeedback(null);
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Carrito</h2>
            <p className="text-sm text-gray-500 mt-1">
              {totalItems} item{totalItems === 1 ? '' : 's'} en el carrito
            </p>
          </div>
          <Link
            to="/productos"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Seguir comprando
          </Link>
        </div>

        {feedback && (
          <div
            className={`mb-4 text-sm rounded-lg p-3 border ${
              createMutation.isError
                ? 'text-red-700 bg-red-50 border-red-200'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
            }`}
          >
            {feedback}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-gray-500 text-lg mb-4">Tu carrito está vacío.</p>
            <Link
              to="/productos"
              className="inline-flex bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Ir a productos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto bg-white rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quitar</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.producto_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{currency(item.precio_unitario)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="inline-flex items-center rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() => decrementarItem(item.producto_id)}
                            className="px-3 py-1.5 text-gray-700 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="px-3 py-1.5 font-semibold">{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => incrementarItem(item.producto_id)}
                            disabled={item.cantidad >= item.stock_disponible}
                            className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {currency(item.precio_unitario * item.cantidad)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => quitarItem(item.producto_id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <label className="block text-sm font-semibold text-gray-700" htmlFor="forma-pago">
                  Forma de pago
                </label>
                <select
                  id="forma-pago"
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value as PedidoCreatePayload['forma_pago_codigo'])}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {FORMAS_PAGO.map((codigo) => (
                    <option key={codigo} value={codigo}>
                      {LABEL_FORMA_PAGO[codigo]}
                    </option>
                  ))}
                </select>

                <label className="block text-sm font-semibold text-gray-700" htmlFor="notas-pedido">
                  Notas (opcional)
                </label>
                <textarea
                  id="notas-pedido"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="Ejemplo: sin cebolla, entregar en portería, etc."
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Resumen</h3>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Items</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-gray-800">
                  <span>Subtotal</span>
                  <span>{currency(subtotal)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  El total final puede ajustarse por envio o promociones al confirmar el pedido.
                </p>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={createMutation.isPending || items.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  {createMutation.isPending ? 'Creando pedido...' : 'Realizar pedido'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
