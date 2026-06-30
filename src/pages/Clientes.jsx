import { useState, useEffect } from "react";
import { Search, Plus, Phone, Mail, AlertCircle, FileText, X, Users } from "lucide-react";
import { supabase } from "../lib/supabase";

function FichaCliente({ cliente, onClose }) {
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    supabase.from("citas").select("*").eq("cliente", cliente.nombre)
      .order("fecha", { ascending: false })
      .then(({ data }) => setHistorial(data || []));
  }, [cliente]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-lg font-semibold text-rose-600">
              {cliente.nombre?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{cliente.nombre}</h2>
              <p className="text-sm text-gray-400">{historial.length} servicios registrados</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={15} className="text-gray-400" />{cliente.telefono || "—"}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail size={15} className="text-gray-400" />{cliente.email || "—"}
            </div>
          </div>
          {cliente.alergias && cliente.alergias !== "Ninguna" && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-700">Alergias</p>
                <p className="text-sm text-red-600">{cliente.alergias}</p>
              </div>
            </div>
          )}
          {cliente.notas && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <FileText size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-700">Notas</p>
                <p className="text-sm text-amber-600">{cliente.notas}</p>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3">Historial de visitas</p>
            {historial.length === 0
              ? <p className="text-sm text-gray-400">Sin visitas registradas</p>
              : (
                <div className="space-y-2">
                  {historial.map(c => (
                    <div key={c.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm text-gray-800">{c.servicio}</p>
                        <p className="text-xs text-gray-400">{c.fecha} · {c.profesional}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-700">${c.precio}</p>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function NuevoClienteModal({ onClose, onGuardado }) {
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", alergias: "Ninguna", notas: "" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    if (!form.nombre) { setError("El nombre es obligatorio"); return; }
    setCargando(true);
    const { error: err } = await supabase.from("clientes").insert([form]);
    setCargando(false);
    if (err) { setError("Error al guardar: " + err.message); return; }
    onGuardado();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Nuevo cliente</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          {[
            ["nombre", "Nombre completo *", "Ej: María Torres"],
            ["telefono", "Teléfono", "0987654321"],
            ["email", "Email", "cliente@email.com"],
            ["alergias", "Alergias", "Ninguna"],
            ["notas", "Notas", "Preferencias, observaciones..."],
          ].map(([key, label, ph]) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
              <input
                placeholder={ph}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={guardar} disabled={cargando}
            className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
            {cargando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  async function cargar() {
    setCargando(true);
    setErrorMsg("");
    const { data, error } = await supabase.from("clientes").select("*").order("nombre");
    if (error) {
      setErrorMsg("Error al cargar clientes: " + error.message);
    } else {
      setClientes(data || []);
    }
    setCargando(false);
  }

  useEffect(() => { cargar(); }, []);

  const filtrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono?.includes(busqueda)
  );

  return (
    <div className="p-6 space-y-5">
      {seleccionado && <FichaCliente cliente={seleccionado} onClose={() => setSeleccionado(null)} />}
      {modalNuevo && <NuevoClienteModal onClose={() => setModalNuevo(false)} onGuardado={cargar} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clientes.length} registrados</p>
        </div>
        <button onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : errorMsg ? (
          <div className="text-center py-14 text-red-400">
            <AlertCircle size={28} className="mx-auto mb-2" />
            <p className="text-sm">{errorMsg}</p>
            <button onClick={cargar} className="mt-3 text-rose-500 text-sm hover:underline">Reintentar</button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <Users size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{busqueda ? "Sin resultados" : "No hay clientes aún"}</p>
            {!busqueda && (
              <button onClick={() => setModalNuevo(true)} className="mt-3 text-rose-500 text-sm hover:underline">
                + Agregar primer cliente
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Cliente</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Teléfono</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 hidden md:table-cell">Email</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id} onClick={() => setSeleccionado(c)}
                  className="border-b border-gray-50 last:border-0 hover:bg-rose-50 cursor-pointer transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-xs font-semibold text-rose-600 flex-shrink-0">
                        {c.nombre?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                        {c.alergias && c.alergias !== "Ninguna" && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle size={10} />{c.alergias}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{c.telefono || "—"}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 hidden md:table-cell">{c.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}