import { useState, useEffect } from "react";
import { Scissors, Clock, Tag, Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const CATEGORIAS_BASE = ["Cabello", "Uñas", "Depilación", "Spa", "Maquillaje", "Otro"];

function ServicioModal({ servicio, onClose, onGuardado }) {
  const [form, setForm] = useState(servicio || { nombre: "", duracion: 30, precio: 0, categoria: "Cabello" });
  const [cargando, setCargando] = useState(false);
  const esEdicion = !!servicio?.id;

  async function guardar() {
    if (!form.nombre || !form.precio) { alert("Nombre y precio son obligatorios"); return; }
    setCargando(true);
    let error;
    if (esEdicion) {
      ({ error } = await supabase.from("servicios").update({
        nombre: form.nombre, duracion: form.duracion, precio: form.precio, categoria: form.categoria
      }).eq("id", servicio.id));
    } else {
      ({ error } = await supabase.from("servicios").insert([{
        nombre: form.nombre, duracion: form.duracion, precio: form.precio, categoria: form.categoria
      }]));
    }
    setCargando(false);
    if (!error) { onGuardado(); onClose(); }
    else alert("Error: " + error.message);
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar "${servicio.nombre}"? Esta acción no se puede deshacer.`)) return;
    setCargando(true);
    const { error } = await supabase.from("servicios").delete().eq("id", servicio.id);
    setCargando(false);
    if (!error) { onGuardado(); onClose(); }
    else alert("Error: " + error.message);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{esEdicion ? "Editar servicio" : "Nuevo servicio"}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Nombre del servicio *</label>
            <input
              placeholder="Ej: Corte de cabello"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Categoría</label>
            <select
              value={form.categoria}
              onChange={e => setForm({ ...form, categoria: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {CATEGORIAS_BASE.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Duración (min) *</label>
              <input
                type="number"
                value={form.duracion}
                onChange={e => setForm({ ...form, duracion: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Precio ($) *</label>
              <input
                type="number"
                step="0.01"
                value={form.precio}
                onChange={e => setForm({ ...form, precio: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          {esEdicion && (
            <button onClick={eliminar} disabled={cargando}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={guardar} disabled={cargando}
            className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
            {cargando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear servicio"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase.from("servicios").select("*").order("categoria").order("nombre");
    setServicios(data || []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  const categorias = [...new Set(servicios.map(s => s.categoria))];

  return (
    <div className="p-6 space-y-5">
      {(modal || editando) && (
        <ServicioModal
          servicio={editando}
          onClose={() => { setModal(false); setEditando(null); }}
          onGuardado={cargar}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Servicios</h1>
          <p className="text-sm text-gray-400 mt-0.5">{servicios.length} servicios disponibles</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
          <Plus size={16} /> Nuevo servicio
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : servicios.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-16 text-gray-400">
          <Scissors size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay servicios aún</p>
          <button onClick={() => setModal(true)} className="mt-3 text-rose-500 text-sm hover:underline">
            + Crear primer servicio
          </button>
        </div>
      ) : (
        categorias.map(cat => (
          <div key={cat} className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Tag size={14} className="text-rose-400" />
              {cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {servicios.filter(s => s.categoria === cat).map(s => (
                <div key={s.id}
                  onClick={() => setEditando(s)}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer group">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.nombre}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Clock size={11} /> {s.duracion} min
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-semibold text-rose-500">${Number(s.precio).toFixed(2)}</p>
                    <Pencil size={14} className="text-gray-300 group-hover:text-rose-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function Reportes() {
  const [pagos, setPagos] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from("pagos").select("*");
      setPagos(data || []);
      setCargando(false);
    }
    cargar();
  }, []);

  const totalMes = pagos.filter(p => p.estado === "pagado").reduce((s, p) => s + Number(p.monto), 0);

  if (cargando) {
    return <div className="p-6 flex justify-center"><div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumen general</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Ingresos por método de pago</h2>
        {["Efectivo", "Transferencia", "Tarjeta"].map(m => {
          const monto = pagos.filter(p => p.metodo === m && p.estado === "pagado").reduce((s, p) => s + Number(p.monto), 0);
          const pct = totalMes > 0 ? Math.round((monto / totalMes) * 100) : 0;
          return (
            <div key={m} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{m}</span>
                <span className="font-medium text-gray-800">${monto.toFixed(2)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-400 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {totalMes === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin cobros registrados aún</p>}
      </div>
    </div>
  );
}