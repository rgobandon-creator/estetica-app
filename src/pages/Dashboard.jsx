import { useState, useEffect } from "react";
import { Users, Calendar, CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

// Fix zona horaria Ecuador
const hoy = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3.5 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-semibold text-gray-900 mt-1 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const map = {
    confirmada: "text-green-600",
    pendiente: "text-amber-600",
    cancelada: "text-red-500",
  };
  return <span className={`text-xs font-medium ${map[estado] || "text-gray-500"}`}>{estado}</span>;
}

export default function Dashboard() {
  const [citas, setCitas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [todosPagos, setTodosPagos] = useState([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [cargando, setCargando] = useState(true);

  const fechaHoyLabel = new Date().toLocaleDateString("es-EC", {
    weekday: "long", day: "numeric", month: "long"
  });

  useEffect(() => {
    async function cargarDatos() {
      const [{ data: citasHoy }, { data: pagosRecientes }, { data: pagosTodos }, { count }] = await Promise.all([
        supabase.from("citas").select("*").eq("fecha", hoy).order("hora"),
        supabase.from("pagos").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("pagos").select("*"),
        supabase.from("clientes").select("*", { count: "exact", head: true }),
      ]);
      setCitas(citasHoy || []);
      setPagos(pagosRecientes || []);
      setTodosPagos(pagosTodos || []);
      setTotalClientes(count || 0);
      setCargando(false);
    }
    cargarDatos();
  }, []);

  const ingresosMes = todosPagos.filter(p => p.estado === "pagado").reduce((s, p) => s + Number(p.monto), 0);
  const pendientes = todosPagos.filter(p => p.estado === "pendiente").reduce((s, p) => s + Number(p.monto), 0);

  if (cargando) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {fechaHoyLabel} · {citas.length} cita{citas.length !== 1 ? "s" : ""} hoy
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={CreditCard} label="Ingresos recientes" value={`$${ingresosMes}`} sub="Pagos confirmados" color="bg-rose-50 text-rose-500" />
        <StatCard icon={Calendar} label="Citas hoy" value={citas.length} sub={fechaHoyLabel} color="bg-violet-50 text-violet-500" />
        <StatCard icon={Users} label="Clientes" value={totalClientes} sub="Total registrados" color="bg-blue-50 text-blue-500" />
        <StatCard icon={TrendingUp} label="Por cobrar" value={`$${pendientes}`} sub="Pendiente de pago" color="bg-amber-50 text-amber-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900 text-sm">Citas de hoy</h2>
            <span className="text-xs text-gray-400">{citas.length} en total</span>
          </div>
          {citas.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Calendar size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay citas para hoy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citas.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-xs font-semibold text-rose-600 flex-shrink-0">
                    {c.cliente?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.cliente}</p>
                    <p className="text-xs text-gray-400">{c.servicio} · {c.profesional || "Sin asignar"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-500 justify-end mb-1">
                      <Clock size={11} />{c.hora}
                    </div>
                    <EstadoBadge estado={c.estado} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-medium text-gray-900 text-sm mb-4">Cobros recientes</h2>
          {pagos.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <CreditCard size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin cobros registrados aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pagos.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${p.estado === "pagado" ? "bg-green-50" : "bg-amber-50"}`}>
                    {p.estado === "pagado"
                      ? <CheckCircle size={14} className="text-green-500" />
                      : <AlertCircle size={14} className="text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.cliente}</p>
                    <p className="text-xs text-gray-400">{p.servicio} · {p.metodo}</p>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ${p.estado === "pagado" ? "text-gray-800" : "text-amber-600"}`}>
                    ${Number(p.monto).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}