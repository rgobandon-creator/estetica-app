import { Scissors, Clock, Tag } from "lucide-react";
import { servicios, profesionales, pagos } from "../data/mockData";

const CATEGORIAS = [...new Set(servicios.map(s => s.categoria))];

export function Servicios() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Servicios</h1>
          <p className="text-sm text-gray-400 mt-0.5">{servicios.length} servicios disponibles</p>
        </div>
        <button className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
          <Scissors size={16} /> Nuevo servicio
        </button>
      </div>

      {CATEGORIAS.map(cat => (
        <div key={cat} className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Tag size={14} className="text-rose-400" />
            {cat}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {servicios.filter(s => s.categoria === cat).map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.nombre}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <Clock size={11} /> {s.duracion} min
                  </div>
                </div>
                <p className="text-base font-semibold text-rose-500">${s.precio}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Reportes() {
  const totalMes = pagos.filter(p => p.estado === "pagado").reduce((s, p) => s + p.monto, 0);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-400 mt-0.5">Junio 2024</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ingresos por método */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Ingresos por método de pago</h2>
          {["Efectivo", "Transferencia", "Tarjeta"].map(m => {
            const monto = pagos.filter(p => p.metodo === m && p.estado === "pagado").reduce((s, p) => s + p.monto, 0);
            const pct = totalMes > 0 ? Math.round((monto / totalMes) * 100) : 0;
            return (
              <div key={m} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{m}</span>
                  <span className="font-medium text-gray-800">${monto} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Profesionales */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Desempeño del equipo</h2>
          <div className="space-y-4">
            {profesionales.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-600 flex-shrink-0">
                  {p.nombre.split(" ").map(n => n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                  <p className="text-xs text-gray-400">{p.especialidad}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">${p.ingresos}</p>
                  <p className="text-xs text-gray-400">{p.citas} citas</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Servicios más vendidos */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 md:col-span-2">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Servicios más realizados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {servicios.slice(0,4).map((s, i) => (
              <div key={s.id} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-rose-500">{8 - i * 2}</p>
                <p className="text-xs text-gray-600 mt-1">{s.nombre}</p>
                <p className="text-xs text-gray-400">${s.precio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
