import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { CheckCircle, XCircle, Clock, Phone, Calendar, RefreshCw, Image, X } from "lucide-react";

const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", clase: "bg-amber-100 text-amber-700", icon: Clock },
  confirmada: { label: "Confirmada", clase: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelada: { label: "Cancelada", clase: "bg-red-100 text-red-700", icon: XCircle },
};

function ModalComprobante({ url, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:text-gray-300">
          <X size={24} />
        </button>
        <img src={url} alt="Comprobante" className="w-full rounded-2xl shadow-2xl" />
      </div>
    </div>
  );
}

export default function ReservasAdmin() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");
  const [comprobanteVer, setComprobanteVer] = useState(null);

  async function cargar() {
    setCargando(true);
    let query = supabase.from("reservas_publicas").select("*").order("created_at", { ascending: false });
    if (filtro !== "todas") query = query.eq("estado", filtro);
    const { data } = await query;
    setReservas(data || []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [filtro]);

  async function cambiarEstado(id, nuevoEstado) {
    await supabase.from("reservas_publicas").update({ estado: nuevoEstado }).eq("id", id);

    if (nuevoEstado === "confirmada") {
      const reserva = reservas.find(r => r.id === id);
      if (reserva) {
        await supabase.from("citas").insert([{
          cliente: reserva.nombre,
          servicio: reserva.servicio,
          profesional: "Por asignar",
          fecha: reserva.fecha,
          hora: reserva.hora,
          duracion: 60,
          precio: reserva.abono,
          estado: "confirmada",
        }]);
      }
    }
    cargar();
  }

  const pendientes = reservas.filter(r => r.estado === "pendiente").length;

  return (
    <div className="p-6 space-y-5">
      {comprobanteVer && <ModalComprobante url={comprobanteVer} onClose={() => setComprobanteVer(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reservas en línea</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {pendientes > 0
              ? <span className="text-amber-600 font-medium">{pendientes} pendiente{pendientes > 1 ? "s" : ""} de confirmar</span>
              : "Todo al día"}
          </p>
        </div>
        <button onClick={cargar} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw size={16} className={`text-gray-400 ${cargando ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[["pendiente","Pendientes"],["confirmada","Confirmadas"],["cancelada","Canceladas"],["todas","Todas"]].map(([val, label]) => (
          <button key={val} onClick={() => setFiltro(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === val ? "bg-rose-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {cargando ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : reservas.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
            <p className="text-sm">No hay reservas en esta categoría</p>
          </div>
        ) : reservas.map(r => {
          const cfg = ESTADO_CONFIG[r.estado] || ESTADO_CONFIG.pendiente;
          const Icon = cfg.icon;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="font-medium text-gray-900">{r.nombre}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${cfg.clase}`}>
                      <Icon size={11} />{cfg.label}
                    </span>
                    {r.comprobante_url && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                        📎 Con comprobante
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(r.fecha + "T12:00:00").toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" })} · {r.hora}
                    </span>
                    <span className="flex items-center gap-1"><Phone size={11} />{r.telefono}</span>
                    <span className="font-medium text-gray-700">✂️ {r.servicio}</span>
                    <span className="text-rose-600 font-medium">Abono: ${r.abono}</span>
                  </div>
                  {r.notas && <p className="mt-2 text-xs text-gray-400 italic">"{r.notas}"</p>}
                  <p className="mt-1 text-xs text-gray-300">Código: {r.id.slice(0,8).toUpperCase()}</p>
                </div>
              </div>

              {/* Ver comprobante */}
              {r.comprobante_url && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <button onClick={() => setComprobanteVer(r.comprobante_url)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <Image size={15} /> Ver comprobante de pago
                  </button>
                </div>
              )}

              {/* Acciones */}
              {r.estado === "pendiente" && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                  <button onClick={() => cambiarEstado(r.id, "confirmada")}
                    className="flex-1 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
                    <CheckCircle size={13} /> Confirmar cita
                  </button>
                  <button onClick={() => cambiarEstado(r.id, "cancelada")}
                    className="flex-1 py-2 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                    <XCircle size={13} /> Cancelar
                  </button>
                  <a href={`https://wa.me/593${r.telefono?.startsWith("0") ? r.telefono.slice(1) : r.telefono}?text=Hola ${r.nombre}! Tu cita para *${r.servicio}* el ${r.fecha} a las ${r.hora} ha sido *confirmada*. ¡Te esperamos!`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-3 py-2 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                    📲
                  </a>
                </div>
              )}
              {r.estado === "confirmada" && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                  <button onClick={() => cambiarEstado(r.id, "cancelada")}
                    className="text-xs text-red-400 hover:text-red-600">Cancelar reserva</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}