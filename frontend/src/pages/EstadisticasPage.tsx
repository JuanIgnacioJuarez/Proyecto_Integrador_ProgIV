import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  fetchEstadisticasResumen,
  fetchIngresos,
  fetchPedidosPorEstado,
  fetchProductosTop,
  fetchVentas,
} from "../api/estadisticasApi";
import { ESTADOS } from "../models/Pedido";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

function toNumber(value: number | string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number | string): string {
  return toNumber(value).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function formatFormaPago(codigo: string): string {
  const labels: Record<string, string> = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
    TRANSFERENCIA: "Transferencia (Mercado Pago)",
    MERCADOPAGO: "Transferencia (Mercado Pago)",
  };
  return labels[codigo] ?? codigo;
}

export function EstadisticasPage() {
  const resumenQuery = useQuery({
    queryKey: ["estadisticas", "resumen"],
    queryFn: fetchEstadisticasResumen,
  });
  const ventasQuery = useQuery({
    queryKey: ["estadisticas", "ventas"],
    queryFn: fetchVentas,
  });
  const productosQuery = useQuery({
    queryKey: ["estadisticas", "productos-top"],
    queryFn: fetchProductosTop,
  });
  const estadosQuery = useQuery({
    queryKey: ["estadisticas", "pedidos-por-estado"],
    queryFn: fetchPedidosPorEstado,
  });
  const ingresosQuery = useQuery({
    queryKey: ["estadisticas", "ingresos"],
    queryFn: fetchIngresos,
  });

  const resumen = resumenQuery.data;
  const ventas = useMemo(
    () => (ventasQuery.data ?? []).map((item) => ({ ...item, total: toNumber(item.total) })),
    [ventasQuery.data],
  );
  const productos = useMemo(
    () => (productosQuery.data ?? []).map((item) => ({ ...item, total: toNumber(item.total) })),
    [productosQuery.data],
  );
  const estados = useMemo(
    () => (estadosQuery.data ?? []).map((item) => ({
      ...item,
      label: ESTADOS[item.estado]?.label ?? item.estado,
    })),
    [estadosQuery.data],
  );
  const ingresos = useMemo(
    () => (ingresosQuery.data ?? []).map((item) => ({
      ...item,
      forma_pago_label: formatFormaPago(item.forma_pago),
      total: toNumber(item.total),
    })),
    [ingresosQuery.data],
  );

  const isLoading = resumenQuery.isLoading || ventasQuery.isLoading || productosQuery.isLoading || estadosQuery.isLoading;
  const isError = resumenQuery.isError || ventasQuery.isError || productosQuery.isError || estadosQuery.isError;

  if (isLoading) {
    return <div className="p-8 text-gray-600">Cargando estadisticas...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-700">No se pudieron cargar las estadisticas.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Estadisticas</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Ventas hoy</p>
          <p className="mt-2 text-2xl font-bold">{money(resumen?.ventas_hoy ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Ticket promedio</p>
          <p className="mt-2 text-2xl font-bold">{money(resumen?.ticket_promedio ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Pedidos activos</p>
          <p className="mt-2 text-2xl font-bold">{resumen?.pedidos_activos ?? 0}</p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Pedidos totales</p>
          <p className="mt-2 text-2xl font-bold">{resumen?.pedidos_totales ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">Ventas por dia</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" label={{ value: "Fecha", position: "insideBottom", offset: -4 }} height={45} />
                <YAxis label={{ value: "Ingresos ($)", angle: -90, position: "insideLeft" }} width={72} />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Legend verticalAlign="top" height={24} formatter={() => "Ventas"} />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">Productos top</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} height={86} angle={-25} textAnchor="end" label={{ value: "Producto", position: "insideBottom", offset: -2 }} />
                <YAxis label={{ value: "Ingresos ($)", angle: -90, position: "insideLeft" }} width={72} />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Legend verticalAlign="top" height={24} formatter={() => "Ingresos por producto"} />
                <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">Pedidos por estado</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={estados} dataKey="cantidad" nameKey="label" outerRadius={100} label>
                  {estados.map((item, index) => (
                    <Cell key={item.estado} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">Ingresos aprobados por forma de pago</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ingresos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="forma_pago_label" label={{ value: "Forma de pago", position: "insideBottom", offset: -4 }} height={50} />
                <YAxis label={{ value: "Ingresos aprobados ($)", angle: -90, position: "insideLeft" }} width={82} />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Legend verticalAlign="top" height={24} formatter={() => "Total aprobado"} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {ingresos.map((item, index) => (
                    <Cell key={item.forma_pago} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
