import { useState, useEffect } from "react";
import { Users, Plus, Pencil, Trash2, X, Scissors } from "lucide-react";
import { supabase } from "../lib/supabase";

const DIAS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];

function ProfesionalModal({ profesional, servicios, onClose, onGuardado }) {
  const [form, setForm] = useState(profesional || {
    nombre: "", servicios: [], dias: ["lunes","martes","miercoles","jueves","viernes","sabado"],
    horario_inicio: "09:00", horario_fin: "19:00", activo: true,
  });
  const [cargando, setCargando] = useState(false);
  const esEdicion = !!profesional?.id;

  function toggleServicio(nombre) {
    setForm(f => ({
      ...f,
      servicios: f.servicios.includes(nombre) ? f.servicios.filter(s => s !== nombre) : [...f.servicios, nombre],
    }));
  }

  function toggleDia(dia) {
    setForm(f => ({
      ...f,
      dias: f.dias.includes(dia) ? f.dias.filter(d => d !== dia) : [...f.dias, dia],
    }));
  }

  async function guardar() {
    if (!form.nombre) { alert("El nombre es obligatorio"); return; }
    setCargando(true);
    const payload = {
      nombre: form.nombre, servicios: form.servicios, dias: form.dias,
      horario_inicio: form.horario_inicio, horario_fin: form.horario_fin, activo: form.activo,
    };
    let error;
    if (esEdicion) {
      ({ error } = await supabase.from("profesionales").update(payload).eq("id", profesional.id));
    } else {
      ({ error } = await supabase.from("profesionales").insert([payload]));
    }
    setCargando(false);
    if (!error) { onGuardado(); onClose(); }
    else alert("Error: " + error.message);
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar a "${profesional.nombre}"?`)) return;
    setCargando(true);
    const { error } = await supabase.from("profesionales").delete().eq("id", profesional.id);
    setCargando(false);
    if (!error) { onGuardado(); onClose(); }
    else alert("Error: " + error.message);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{esEdicion ? "Editar profesional" : "Nuevo profesional"}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Nombre *</label>
            <input placeholder="Ej: Zamia Vaca" value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Servicios que realiza</label>
            {servicios.length === 0 ? (
              <p className="text-xs text-gray-400">Primero agrega servicios en la sección Servicios.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {servicios.map(s => (
                  <button key={s.id} type="button" onClick={() => toggleServicio(s.nombre)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.servicios.includes(s.nombre) ? "bg-rose-500 text-white border-rose-500" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300"}`}>
                    {s.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Días que trabaja</label>
            <div className="flex flex-wrap gap-2">
              {DIAS.map(d => (
                <button key={d} type="button" onClick={() => toggleDia(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${form.dias.includes(d) ? "bg-blue-500 text-white border-blue-500" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                  {d.slice(0,3)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Hora inicio</label>
              <input type="time" value={form.horario_inicio}
                onChange={e => setForm({...form, horario_inicio: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Hora fin</label>
              <input type="time" value={form.horario_fin}
                onChange={e => setForm({...form, horario_fin: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})}/>
            Activo (visible para reservas en línea)
          </label>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          {esEdicion && (
            <button onClick={eliminar} disabled={cargando}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
              <Trash2 size={16}/>
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">Cancelar</button>
          <button onClick={guardar} disabled={cargando}
            className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
            {cargando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear profesional"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Profesionales() {
  const [profesionales, setProfesionales] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);

  async function cargar() {
    setCargando(true);
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("profesionales").select("*").order("nombre"),
      supabase.from("servicios").select("id,nombre").order("nombre"),
    ]);
    setProfesionales(p || []);
    setServicios(s || []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {(modal || editando) && (
        <ProfesionalModal profesional={editando} servicios={servicios}
          onClose={() => { setModal(false); setEditando(null); }} onGuardado={cargar}/>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Profesionales</h1>
          <p className="text-sm text-gray-400 mt-0.5">{profesionales.length} registrados</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center justify-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
          <Plus size={16}/> Nuevo profesional
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : profesionales.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 text-center py-14 text-gray-400">
          <Users size={28} className="mx-auto mb-2 opacity-30"/>
          <p className="text-sm">No hay profesionales registrados</p>
          <button onClick={() => setModal(true)} className="mt-3 text-rose-500 text-sm hover:underline">+ Agregar el primero</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profesionales.map(p => (
            <div key={p.id} onClick={() => setEditando(p)}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-rose-200 transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-sm font-semibold text-rose-600">
                    {p.nombre?.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                    <p className="text-xs text-gray-400">{p.horario_inicio} – {p.horario_fin}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!p.activo && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inactivo</span>}
                  <Pencil size={14} className="text-gray-300"/>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(p.servicios || []).length === 0 ? (
                  <span className="text-xs text-gray-400">Sin servicios asignados</span>
                ) : p.servicios.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                    <Scissors size={10}/>{s}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 capitalize">{(p.dias || []).map(d => d.slice(0,3)).join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}