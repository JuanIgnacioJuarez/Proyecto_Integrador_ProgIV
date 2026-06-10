import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/http';

type Estado = 'cargando' | 'aprobado' | 'pendiente' | 'rechazado' | 'error';

export function PagoExitoPage() {
  const [params] = useSearchParams();
  const pedidoId = params.get('external_reference');
  const paymentId = params.get('payment_id');

  const [estado, setEstado] = useState<Estado>('cargando');

  useEffect(() => {
    if (!pedidoId || !paymentId) {
      setEstado('error');
      return;
    }

    api
      .post('/pagos/confirm', {
        pedido_id: Number(pedidoId),
        payment_id: Number(paymentId),
      })
      .then((res) => {
        const e = res.data?.estado;
        if (e === 'aprobado') setEstado('aprobado');
        else if (e === 'pendiente') setEstado('pendiente');
        else setEstado('rechazado');
      })
      .catch(() => setEstado('error'));
  }, [pedidoId, paymentId]);

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Confirmando tu pago...</p>
        </div>
      </div>
    );
  }

  if (estado === 'aprobado') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-5">
          <div className="flex justify-center">
            <div className="bg-emerald-100 rounded-full p-4">
              <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pago aprobado</h1>
            <p className="text-gray-500 text-sm mt-1">Tu pago fue procesado correctamente.</p>
          </div>
          {pedidoId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 space-y-1">
              <p>Pedido <span className="font-bold">#{pedidoId}</span> confirmado.</p>
              {paymentId && <p className="text-xs text-emerald-600">ID de pago MP: {paymentId}</p>}
            </div>
          )}
          <p className="text-sm text-gray-500">
            Tu pedido fue confirmado y ya esta en preparacion.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link to="/mis-pedidos" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
              Ver mis pedidos
            </Link>
            <Link to="/productos" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="bg-amber-100 rounded-full p-4">
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {estado === 'pendiente' ? 'Pago pendiente' : 'No se pudo confirmar el pago'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {estado === 'pendiente'
              ? 'Tu pago esta siendo procesado y se confirmara en breve.'
              : 'Revisá el estado de tu pedido o intentá de nuevo.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <Link to="/mis-pedidos" className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            Ver mis pedidos
          </Link>
          <Link to="/productos" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
