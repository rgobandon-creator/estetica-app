import { useState, useEffect } from "react";
import { Scissors, Clock, Tag, Plus, Pencil, Trash2, X, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "../lib/supabase";

const CATEGORIAS_BASE = ["Cabello", "Uñas", "Depilación", "Spa", "Maquillaje", "Otro"];
const EMOJI_DEFAULT = { "Cabello":"✂️", "Uñas":"💅", "Depilación":"🌸", "Spa":"🤲", "Maquillaje":"💄", "Otro":"✨" };

function ServicioModal({ servicio, iconos, onClose, onGuardado }) {
  const [form, setForm] = useState(servicio || { nombre:"", duracion:30, precio:0, categoria:"Cabello", orden:0 });
  const [nuevaCategoria, setNuevaCategoria] = useState(false);
  const [catNombre, setCatNombre] = useState("");
  const [catEmoji, setCatEmoji] = useState("✨");
  const [cargando, setCargando] = useState(false);
  const esEdicion = !!servicio?.id;

  async function guardar() {
    if (!form.nombre || !form.precio) { alert("Nombre y precio son obligatorios"); return; }
    let categoriaFinal = form.categoria;
    setCargando(true);

    if (nuevaCategoria) {
      if (!catNombre.trim()) { alert("Escribe el nombre de la nueva categoría"); setCargando(false); return; }
      categoriaFinal = catNombre.trim();
      const iconosActualizados = { ...iconos, [categoriaFinal]: catEmoji || "✨" };
      await supabase.from("configuracion").upsert({ clave: "categorias_iconos", valor: iconosActualizados }, { onConflict: "clave" });
    }

    let error;
    if (esEdicion) {
      ({ error } = await supabase.from("servicios").update({ nombre:form.nombre, duracion:form.duracion, precio:form.precio, categoria:categoriaFinal, orden:form.orden||0 }).eq("id", servicio.id));
    } else {
      ({ error } = await supabase.from("servicios").insert([{ nombre:form.nombre, duracion:form.duracion, precio:form.precio, categoria:categoriaFinal, orden:form.orden||0 }]));
    }
    setCargando(false);
    if (!error) { onGuardado(); onClose(); }
    else alert("Error: " + error.message);
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar "${servicio.nombre}"?`)) return;
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
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Nombre *</label>
            <input placeholder="Ej: Corte de cabello" value={form.nombre}
              onChange={e => setForm({...form, nombre:e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Categoría</label>
            {!nuevaCategoria ? (
              <select value={form.categoria} onChange={e => {
                  if (e.target.value === "__nueva__") { setNuevaCategoria(true); }
                  else setForm({...form, categoria:e.target.value});
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
                {[...new Set([...CATEGORIAS_BASE, ...Object.keys(iconos||{})])].map(c =>
                  <option key={c} value={c}>{iconos?.[c]||EMOJI_DEFAULT[c]||"✨"} {c}</option>
                )}
                <option value="__nueva__">➕ Nueva categoría...</option>
              </select>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={catEmoji} onChange={e=>setCatEmoji(e.target.value)} maxLength={4}
                    placeholder="✨" className="w-16 text-center border border-gray-200 rounded-lg px-2 py-2 text-lg"/>
                  <input value={catNombre} onChange={e=>setCatNombre(e.target.value)}
                    placeholder="Nombre de la categoría (ej: Pestañas)"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
                </div>
                <button onClick={()=>setNuevaCategoria(false)} className="text-xs text-gray-400 hover:text-rose-500">← Elegir de la lista existente</button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Duración (min)</label>
              <input type="number" value={form.duracion}
                onChange={e => setForm({...form, duracion:Number(e.target.value)})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Precio ($)</label>
              <input type="number" step="0.01" value={form.precio}
                onChange={e => setForm({...form, precio:Number(e.target.value)})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Orden de aparición</label>
            <input type="number" value={form.orden||0}
              onChange={e => setForm({...form, orden:Number(e.target.value)})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
            <p className="text-xs text-gray-400 mt-1">Entre más bajo el número, aparece primero (0 = primero de todos)</p>
          </div>
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
            {cargando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear servicio"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [ordenCategorias, setOrdenCategorias] = useState([]);
  const [iconos, setIconos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);

  async function cargar() {
    setCargando(true);
    const [{ data: s }, { data: cfgOrden }, { data: cfgIconos }] = await Promise.all([
      supabase.from("servicios").select("*").order("orden").order("nombre"),
      supabase.from("configuracion").select("valor").eq("clave","categorias_orden").maybeSingle(),
      supabase.from("configuracion").select("valor").eq("clave","categorias_iconos").maybeSingle(),
    ]);
    setServicios(s || []);
    setOrdenCategorias(cfgOrden?.valor || []);
    setIconos({ ...EMOJI_DEFAULT, ...(cfgIconos?.valor || {}) });
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  const categoriasDetectadas = [...new Set(servicios.map(s => s.categoria))];
  // Combina el orden guardado con categorías nuevas que no estén todavía en esa lista
  const categorias = [
    ...ordenCategorias.filter(c => categoriasDetectadas.includes(c)),
    ...categoriasDetectadas.filter(c => !ordenCategorias.includes(c)),
  ];

  async function moverCategoria(cat, direccion) {
    const actual = [...categorias];
    const i = actual.indexOf(cat);
    const j = i + direccion;
    if (j < 0 || j >= actual.length) return;
    [actual[i], actual[j]] = [actual[j], actual[i]];
    setOrdenCategorias(actual);
    await supabase.from("configuracion").upsert({ clave: "categorias_orden", valor: actual }, { onConflict: "clave" });
  }

  return (
    <div className="p-6 space-y-5">
      {(modal || editando) && (
        <ServicioModal servicio={editando} iconos={iconos} onClose={() => { setModal(false); setEditando(null); }} onGuardado={cargar}/>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Servicios</h1>
          <p className="text-sm text-gray-400 mt-0.5">{servicios.length} disponibles</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
          <Plus size={16}/> Nuevo servicio
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : categorias.map((cat, i) => (
        <div key={cat} className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="text-base">{iconos[cat] || "✨"}</span>{cat}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => moverCategoria(cat, -1)} disabled={i===0}
                title="Mover categoría hacia arriba"
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-transparent">
                <ChevronUp size={16} className="text-gray-400"/>
              </button>
              <button onClick={() => moverCategoria(cat, 1)} disabled={i===categorias.length-1}
                title="Mover categoría hacia abajo"
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 disabled:hover:bg-transparent">
                <ChevronDown size={16} className="text-gray-400"/>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {servicios.filter(s => s.categoria === cat).map(s => (
              <div key={s.id} onClick={() => setEditando(s)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer group">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={11}/>{s.duracion} min</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-base font-semibold text-rose-500">${Number(s.precio).toFixed(2)}</p>
                  <Pencil size={14} className="text-gray-300 group-hover:text-rose-400"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}