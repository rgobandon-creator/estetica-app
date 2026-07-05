import { useState, useEffect } from "react";
import { Search, Plus, Phone, Mail, AlertCircle, FileText, X, Users, Pencil } from "lucide-react";
import { supabase } from "../lib/supabase";

function nivelFidelidad(visitas) {
  if (visitas >= 10) return { label: "VIP", color: "bg-purple-100 text-purple-700", icon: "👑" };
  if (visitas >= 5) return { label: "Fiel", color: "bg-rose-100 text-rose-700", icon: "💖" };
  if (visitas >= 2) return { label: "Recurrente", color: "bg-blue-100 text-blue-700", icon: "🔁" };
  return { label: "Nuevo", color: "bg-gray-100 text-gray-500", icon: "🌱" };
}

function BadgeFidelidad({ visitas }) {
  const n = nivelFidelidad(visitas);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${n.color}`}>
      {n.icon} {n.label}
    </span>
  );
}

function validarCedulaEcuador(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = parseInt(cedula.slice(0,2), 10);
  if (provincia < 1 || provincia > 24) return false;
  const digitos = cedula.split("").map(Number);
  const verificador = digitos[9];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let val = digitos[i];
    if (i % 2 === 0) { val *= 2; if (val > 9) val -= 9; }
    suma += val;
  }
  return (10 - (suma % 10)) % 10 === verificador;
}

function ClienteModal({ cliente, onClose, onGuardado }) {
  const [form, setForm] = useState(cliente || { nombre:"", cedula:"", telefono:"", email:"", alergias:"Ninguna", notas:"" });
  const [cargando, setCargando] = useState(false);
  const esEdicion = !!cliente?.id;

  async function guardar() {
    if (!form.nombre) { alert("El nombre es obligatorio"); return; }
    if (form.cedula && !validarCedulaEcuador(form.cedula)) { alert("La cédula ingresada no es válida"); return; }
    setCargando(true);
    let error;
    if (esEdicion) {
      ({ error } = await supabase.from("clientes").update({
        nombre: form.nombre, cedula: form.cedula||null, telefono: form.telefono, email: form.email,
        alergias: form.alergias, notas: form.notas
      }).eq("id", cliente.id));
    } else {
      ({ error } = await supabase.from("clientes").insert([form]));
    }
    setCargando(false);
    if (!error) { onGuardado(); onClose(); }
    else alert("Error: " + error.message);
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar a "${cliente.nombre}"?`)) return;
    setCargando(true);
    const { error } = await supabase.from("clientes").delete().eq("id", cliente.id);
    setCargando(false);
    if (!error) { onGuardado(); onClose(); }
    else alert("Error: " + error.message);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{esEdicion ? "Editar cliente" : "Nuevo cliente"}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          {[
            ["nombre","Nombre completo *","Ej: María Torres"],
            ["cedula","Cédula","10 dígitos"],
            ["telefono","Teléfono","0987654321"],
            ["email","Email","cliente@email.com"],
            ["alergias","Alergias","Ninguna"],
          ].map(([key, label, ph]) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
              <input placeholder={ph} value={form[key]||""}
                inputMode={key==="cedula"?"numeric":undefined} maxLength={key==="cedula"?10:undefined}
                onChange={e => setForm({...form,[key]: key==="cedula" ? e.target.value.replace(/\D/g,"") : e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
              {key==="cedula" && form.cedula?.length===10 && !validarCedulaEcuador(form.cedula) && (
                <p className="text-xs text-red-500 mt-1">Cédula no válida</p>
              )}
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Notas</label>
            <textarea placeholder="Preferencias, observaciones..." value={form.notas||""} rows={2}
              onChange={e => setForm({...form, notas:e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"/>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          {esEdicion && (
            <button onClick={eliminar} disabled={cargando}
              className="px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-sm">
              Eliminar
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={guardar} disabled={cargando}
            className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
            {cargando ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FichaCliente({ cliente, onClose, onEditar }) {
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    supabase.from("citas").select("*").eq("cliente", cliente.nombre)
      .order("fecha", { ascending: false })
      .then(({ data }) => setHistorial(data || []));
  }, [cliente]);

  const totalGastado = historial.filter(c => c.estado === "cobrada").reduce((s,c) => s + Number(c.precio), 0);
  const visitasCobradas = historial.filter(c => c.estado === "cobrada").length;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-lg font-semibold text-rose-600">
              {cliente.nombre?.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">{cliente.nombre}</h2>
                <BadgeFidelidad visitas={visitasCobradas}/>
              </div>
              <p className="text-sm text-gray-400">{historial.length} visitas · ${totalGastado.toFixed(2)} total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEditar}
              className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-gray-400 hover:text-rose-500">
              <Pencil size={16}/>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={18} className="text-gray-400"/>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} className="text-gray-400"/>{cliente.telefono||"—"}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={14} className="text-gray-400"/>{cliente.email||"—"}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
              <span className="text-gray-400 text-xs">🪪 Cédula:</span> {cliente.cedula||"No registrada"}
            </div>
          </div>
          {cliente.alergias && cliente.alergias !== "Ninguna" && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0"/>
              <div><p className="text-xs font-medium text-red-700">Alergias</p><p className="text-sm text-red-600">{cliente.alergias}</p></div>
            </div>
          )}
          {cliente.notas && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <FileText size={14} className="text-amber-500 mt-0.5 flex-shrink-0"/>
              <div><p className="text-xs font-medium text-amber-700">Notas</p><p className="text-sm text-amber-600">{cliente.notas}</p></div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3">Historial de visitas</p>
            {historial.length === 0 ? (
              <p className="text-sm text-gray-400">Sin visitas registradas</p>
            ) : (
              <div className="space-y-2">
                {historial.map(c => (
                  <div key={c.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm text-gray-800">{c.servicio}</p>
                      <p className="text-xs text-gray-400">{c.fecha} · {c.profesional||"Sin asignar"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">${c.precio}</p>
                      <span className={`text-xs ${c.estado==="cobrada"?"text-blue-500":c.estado==="confirmada"?"text-green-500":"text-amber-500"}`}>{c.estado}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [editando, setEditando] = useState(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [cargando, setCargando] = useState(true);

  const [visitas, setVisitas] = useState({});

  async function cargar() {
    setCargando(true);
    const { data } = await supabase.from("clientes").select("*").order("nombre");
    setClientes(data || []);

    const { data: citas } = await supabase.from("citas").select("cliente").eq("estado", "cobrada");
    const conteo = {};
    (citas || []).forEach(c => { conteo[c.cliente] = (conteo[c.cliente] || 0) + 1; });
    setVisitas(conteo);

    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  const filtrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda)
  );

  return (
    <div className="p-6 space-y-5">
      {(modalNuevo || editando) && (
        <ClienteModal
          cliente={editando}
          onClose={() => { setModalNuevo(false); setEditando(null); }}
          onGuardado={() => { cargar(); setSeleccionado(null); }}
        />
      )}
      {seleccionado && !editando && (
        <FichaCliente
          cliente={seleccionado}
          onClose={() => setSeleccionado(null)}
          onEditar={() => { setEditando(seleccionado); setSeleccionado(null); }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clientes.length} registrados</p>
        </div>
        <button onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
          <Plus size={16}/> Nuevo cliente
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input type="text" placeholder="Buscar por nombre o teléfono..." value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"/>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <Users size={28} className="mx-auto mb-2 opacity-30"/>
            <p className="text-sm">{busqueda ? "Sin resultados" : "No hay clientes aún"}</p>
            {!busqueda && <button onClick={() => setModalNuevo(true)} className="mt-3 text-rose-500 text-sm hover:underline">+ Agregar primer cliente</button>}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Cliente</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Teléfono</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Fidelidad</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-rose-50 transition-colors">
                  <td className="px-5 py-3 cursor-pointer" onClick={() => setSeleccionado(c)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-xs font-semibold text-rose-600 flex-shrink-0">
                        {c.nombre?.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                        {c.alergias && c.alergias !== "Ninguna" && (
                          <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10}/>{c.alergias}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 cursor-pointer" onClick={() => setSeleccionado(c)}>{c.telefono||"—"}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 hidden md:table-cell cursor-pointer" onClick={() => setSeleccionado(c)}>{c.email||"—"}</td>
                  <td className="px-5 py-3 cursor-pointer" onClick={() => setSeleccionado(c)}>
                    <BadgeFidelidad visitas={visitas[c.nombre] || 0}/>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setEditando(c)}
                      className="p-1.5 hover:bg-rose-100 rounded-lg transition-colors group">
                      <Pencil size={14} className="text-gray-300 group-hover:text-rose-500"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}