import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, X, User, Phone, Mail, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

function fechaLocal(fechaStr) {
  const [y, m, d] = fechaStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatearFecha(fechaStr) {
  return fechaLocal(fechaStr).toLocaleDateString("es-EC", {
    weekday: "long", day: "numeric", month: "long"
  });
}

function EstadoBadge({ estado }) {
  const map = {
    confirmada: "bg-green-100 text-green-700",
    pendiente: "bg-amber-100 text-amber-700",
    cancelada: "bg-red-100 text-red-700"
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[estado] || "bg-gray-100 text-gray-600"}`}>
      {estado}
    </span>
  );
}

function NuevaCitaModal({ onClose, onGuardada, fechaInicial }) {
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [clienteInfo, setClienteInfo] = useState(null); // datos del cliente seleccionado
  const [esNuevoCliente, setEsNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ telefono: "", email: "", alergias: "Ninguna" });
  const [form, setForm] = useState({
    cliente: "", servicio: "", profesional: "",
    fecha: fechaInicial || new Date().toLocaleDateString("en-CA"),
    hora: "", duracion: 60, precio: 0, estado: "confirmada"
  });
  const [cargando, setCargando] = useState(false);

  const HORAS = [];
  for (let h = 8; h < 19; h++) {
    HORAS.push(`${String(h).padStart(2,"0")}:00`);
    HORAS.push(`${String(h).padStart(2,"0")}:30`);
  }

  useEffect(() => {
    supabase.from("servicios").select("*").order("nombre")
      .then(({ data }) => setServicios(data || []));
    cargarClientes();
  }, []);

  async function cargarClientes() {
    // Clientes de tabla clientes + clientes de reservas públicas (sin duplicar)
    const [{ data: clientesDB }, { data: reservas }] = await Promise.all([
      supabase.from("clientes").select("nombre, telefono, email, alergias, notas").order("nombre"),
      supabase.from("reservas_publicas").select("nombre, telefono, email").neq("estado", "cancelada"),
    ]);
    const map = {};
    (clientesDB || []).forEach(c => { map[c.nombre] = { ...c, fuente: "clientes" }; });
    (reservas || []).forEach(r => {
      if (!map[r.nombre]) map[r.nombre] = { ...r, fuente: "reserva" };
    });
    setClientes(Object.values(map));
  }

  useEffect(() => {
    if (!form.fecha) return;
    Promise.all([
      supabase.from("citas").select("hora").eq("fecha", form.fecha).neq("estado", "cancelada"),
      supabase.from("reservas_publicas").select("hora").eq("fecha", form.fecha).eq("estado", "confirmada"),
    ]).then(([{ data: c }, { data: r }]) => {
      setHorasOcupadas([...(c || []), ...(r || [])].map(x => x.hora));
    });
  }, [form.fecha]);

  function seleccionarCliente(nombre) {
    setForm(f => ({ ...f, cliente: nombre }));
    const found = clientes.find(c => c.nombre === nombre);
    if (found) {
      setClienteInfo(found);
      setEsNuevoCliente(false);
    } else if (nombre) {
      setClienteInfo(null);
      setEsNuevoCliente(true);
    } else {
      setClienteInfo(null);
      setEsNuevoCliente(false);
    }
  }

  function seleccionarServicio(val) {
    const s = servicios.find(sv => sv.nombre === val);
    if (s) setForm(f => ({ ...f, servicio: s.nombre, duracion: s.duracion, precio: s.precio }));
    else setForm(f => ({ ...f, servicio: val }));
  }

  async function guardar() {
    if (!form.cliente || !form.servicio || !form.hora) {
      alert("Cliente, servicio y hora son obligatorios");
      return;
    }
    setCargando(true);

    // Si es cliente nuevo, guardarlo en tabla clientes
    if (esNuevoCliente) {
      const existe = clientes.find(c => c.nombre === form.cliente);
      if (!existe) {
        await supabase.from("clientes").insert([{
          nombre: form.cliente,
          telefono: nuevoCliente.telefono,
          email: nuevoCliente.email,
          alergias: nuevoCliente.alergias || "Ninguna",
        }]);
      }
    }

    const { error } = await supabase.from("citas").insert([form]);
    setCargando(false);
    if (!error) { onGuardada(); onClose(); }
    else alert("Error al guardar: " + error.message);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Nueva cita</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">

          {/* Cliente con autocomplete */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Cliente *</label>
            <input
              list="lista-clientes"
              placeholder="Busca o escribe un nombre nuevo"
              value={form.cliente}
              onChange={e => seleccionarCliente(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <datalist id="lista-clientes">
              {clientes.map(c => <option key={c.nombre} value={c.nombre} />)}
            </datalist>
          </div>

          {/* Info del cliente existente */}
          {clienteInfo && (
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100 space-y-1">
              <p className="text-xs font-semibold text-rose-600 mb-1">
                {clienteInfo.fuente === "reserva" ? "📋 Cliente desde reserva en línea" : "👤 Cliente registrado"}
              </p>
              {clienteInfo.telefono && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Phone size={11} className="text-gray-400" /> {clienteInfo.telefono}
                </p>
              )}
              {clienteInfo.email && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Mail size={11} className="text-gray-400" /> {clienteInfo.email}
                </p>
              )}
              {clienteInfo.alergias && clienteInfo.alergias !== "Ninguna" && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} /> Alergias: {clienteInfo.alergias}
                </p>
              )}
              {clienteInfo.notas && (
                <p className="text-xs text-gray-400 italic">"{clienteInfo.notas}"</p>
              )}
            </div>
          )}

          {/* Formulario cliente nuevo */}
          {esNuevoCliente && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-3">
              <p className="text-xs font-semibold text-blue-600">✨ Cliente nuevo — se guardará automáticamente</p>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Teléfono</label>
                <input placeholder="0987654321" value={nuevoCliente.telefono}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                <input placeholder="cliente@email.com" value={nuevoCliente.email}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Alergias</label>
                <input placeholder="Ninguna" value={nuevoCliente.alergias}
                  onChange={e => setNuevoCliente({ ...nuevoCliente, alergias: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>
          )}

          {/* Servicio */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Servicio *</label>
            <select value={form.servicio} onChange={e => seleccionarServicio(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
              <option value="">Selecciona un servicio</option>
              {servicios.map(s => (
                <option key={s.id} value={s.nombre}>
                  {s.nombre} — {s.duracion}min — ${s.precio}
                </option>
              ))}
            </select>
          </div>

          {/* Profesional */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Profesional</label>
            <input placeholder="Nombre del profesional" value={form.profesional}
              onChange={e => setForm({ ...form, profesional: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Fecha</label>
            <input type="date" value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value, hora: "" })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>

          {/* Horas */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">
              Hora * {form.hora && <span className="text-rose-500 font-semibold">→ {form.hora}</span>}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {HORAS.map(h => {
                const ocupada = horasOcupadas.includes(h);
                return (
                  <button key={h} type="button" disabled={ocupada} onClick={() => setForm({ ...form, hora: h })}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      ocupada ? "bg-red-50 text-red-300 cursor-not-allowed line-through"
                      : form.hora === h ? "bg-rose-500 text-white shadow-sm"
                      : "bg-gray-50 text-gray-700 hover:bg-rose-50 hover:text-rose-600"
                    }`}>
                    {h}
                  </button>
                );
              })}
            </div>
            {horasOcupadas.length > 0 && (
              <p className="text-xs text-red-400 mt-2">🔴 = hora ya ocupada</p>
            )}
          </div>

          {/* Precio y estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Precio ($)</label>
              <input type="number" value={form.precio}
                onChange={e => setForm({ ...form, precio: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
                <option value="confirmada">Confirmada</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={guardar} disabled={cargando}
            className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
            {cargando ? "Guardando..." : "Guardar cita"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Agenda() {
  const [modal, setModal] = useState(false);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [paginaSemana, setPaginaSemana] = useState(0);
  const hoy = new Date().toLocaleDateString("en-CA");
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy);

  function generarSemana(offset) {
    const dias = [];
    const base = new Date();
    base.setDate(base.getDate() + offset * 7);
    const lunes = new Date(base);
    lunes.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    for (let i = 0; i < 6; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      dias.push({
        fecha: d.toLocaleDateString("en-CA"),
        label: d.toLocaleDateString("es-EC", { weekday: "short", day: "numeric" }),
      });
    }
    return dias;
  }

  const diasSemana = generarSemana(paginaSemana);

  async function cargarCitas() {
    setCargando(true);
    const { data } = await supabase.from("citas").select("*")
      .eq("fecha", diaSeleccionado).order("hora");
    setCitas(data || []);
    setCargando(false);
  }

  useEffect(() => { cargarCitas(); }, [diaSeleccionado]);

  return (
    <div className="p-6 space-y-5">
      {modal && (
        <NuevaCitaModal
          onClose={() => setModal(false)}
          onGuardada={cargarCitas}
          fechaInicial={diaSeleccionado}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-400 mt-0.5">{diaSeleccionado ? formatearFecha(diaSeleccionado) : ""}</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
          <Plus size={16} /> Nueva cita
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setPaginaSemana(p => p - 1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <span className="text-xs font-medium text-gray-500">
            {paginaSemana === 0 ? "Semana actual" : paginaSemana > 0 ? `+${paginaSemana} semana${paginaSemana > 1 ? "s" : ""}` : `${Math.abs(paginaSemana)} semana${Math.abs(paginaSemana) > 1 ? "s" : ""} atrás`}
          </span>
          <button onClick={() => setPaginaSemana(p => p + 1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {diasSemana.map(d => (
            <button key={d.fecha} onClick={() => setDiaSeleccionado(d.fecha)}
              className={`flex flex-col items-center py-2 rounded-lg transition-colors text-xs font-medium ${
                diaSeleccionado === d.fecha ? "bg-rose-500 text-white"
                : d.fecha === hoy ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "hover:bg-gray-50 text-gray-600"
              }`}>
              {d.label.split(" ").map((p, i) => (
                <span key={i} className={i === 1 ? "text-base font-bold mt-0.5" : ""}>{p}</span>
              ))}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-medium text-gray-900 text-sm mb-4">
          {cargando ? "Cargando..." : `${citas.length} cita${citas.length !== 1 ? "s" : ""} este día`}
        </h2>
        {!cargando && citas.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No hay citas agendadas</p>
            <button onClick={() => setModal(true)} className="mt-3 text-rose-500 text-sm hover:underline">+ Agregar cita</button>
          </div>
        ) : (
          <div className="space-y-3">
            {citas.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-rose-50 transition-colors">
                <div className="flex-shrink-0 text-center w-14">
                  <p className="text-sm font-semibold text-rose-500">{c.hora}</p>
                  <p className="text-xs text-gray-400">{c.duracion}min</p>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-xs font-semibold text-rose-600 flex-shrink-0">
                  {c.cliente?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{c.cliente}</p>
                  <p className="text-xs text-gray-400">{c.servicio} · {c.profesional || "Sin asignar"}</p>
                </div>
                <EstadoBadge estado={c.estado} />
                <p className="text-sm font-semibold text-gray-800 flex-shrink-0">${c.precio}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}