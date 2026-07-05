import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, CreditCard, Banknote, Smartphone, Plus, X } from "lucide-react";
import { supabase } from "../lib/supabase";

const METODO_ICON = { "Efectivo": Banknote, "Transferencia": Smartphone, "Tarjeta": CreditCard };

function NuevoCobro({ onClose, onGuardado }) {
  const [form, setForm] = useState({ cliente: "", servicio: "", monto: "", metodo: "Efectivo", estado: "pagado" });
  const [cargando, setCargando] = useState(false);

  async function guardar() {
    setCargando(true);
    const { error } = await supabase.from("pagos").insert([{ ...form, monto: Number(form.monto) }]);
    setCargando(false);
    if (!error) { onGuardado(); onClose(); }
    else alert("Error: " + error.message);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Registrar cobro</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Cliente</label>
            <input placeholder="Nombre del cliente" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Servicio</label>
            <input placeholder="Ej: Corte, Tinte..." value={form.servicio} onChange={e => setForm({...form, servicio: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Monto ($)</label>
            <input type="number" placeholder="0.00" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {["Efectivo", "Transferencia", "Tarjeta"].map(m => {
                const Icon = METODO_ICON[m];
                return (
                  <button key={m} onClick={() => setForm({...form, metodo: m})}
                    className={`flex flex-col items-center gap-1 p-3 border rounded-lg transition-colors text-xs ${form.metodo === m ? "border-rose-400 bg-rose-50 text-rose-600" : "border-gray-200 hover:border-rose-300 text-gray-600"}`}>
                    <Icon size={18} className={form.metodo === m ? "text-rose-500" : "text-gray-400"} />
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Estado</label>
            <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={guardar} disabled={cargando} className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
            {cargando ? "Guardando..." : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalCobrarSaldo({ grupo, onClose, onGuardado }) {
  const saldo = grupo.pendientes.reduce((s, p) => s + Number(p.monto), 0);
  const [monto, setMonto] = useState(saldo);
  const [metodo, setMetodo] = useState("Efectivo");
  const [cargando, setCargando] = useState(false);

  async function cobrar() {
    setCargando(true);
    if (grupo.pendientes.length === 1) {
      await supabase.from("pagos").update({ monto: Number(monto), metodo, estado: "pagado" }).eq("id", grupo.pendientes[0].id);
    } else {
      // Varios pagos pendientes en el mismo grupo: se marcan todos como pagados con el método elegido
      for (const p of grupo.pendientes) {
        await supabase.from("pagos").update({ metodo, estado: "pagado" }).eq("id", p.id);
      }
    }
    setCargando(false);
    onGuardado();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Cobrar saldo pendiente</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-3 bg-rose-50 rounded-lg mb-4">
          <p className="text-sm font-medium text-gray-900">{grupo.cliente}</p>
          <p className="text-xs text-gray-500">{grupo.servicio}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Monto a cobrar ($)</label>
            <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
              disabled={grupo.pendientes.length > 1}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:bg-gray-50"/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {["Efectivo", "Transferencia", "Tarjeta"].map(m => {
                const Icon = METODO_ICON[m];
                return (
                  <button key={m} onClick={() => setMetodo(m)}
                    className={`flex flex-col items-center gap-1 p-3 border rounded-lg transition-colors text-xs ${metodo === m ? "border-rose-400 bg-rose-50 text-rose-600" : "border-gray-200 hover:border-rose-300 text-gray-600"}`}>
                    <Icon size={18} className={metodo === m ? "text-rose-500" : "text-gray-400"}/>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={cobrar} disabled={cargando}
            className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50">
            {cargando ? "Cobrando..." : "Cobrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Cobros() {
  const [pagos, setPagos] = useState([]);
  const [modal, setModal] = useState(false);
  const [cobrandoGrupo, setCobrandoGrupo] = useState(null);

  async function cargar() {
    const { data } = await supabase.from("pagos").select("*").order("created_at", { ascending: false });
    setPagos(data || []);
  }

  useEffect(() => { cargar(); }, []);

  const total = pagos.filter(p => p.estado === "pagado").reduce((s, p) => s + Number(p.monto), 0);
  const pendiente = pagos.filter(p => p.estado === "pendiente").reduce((s, p) => s + Number(p.monto), 0);

  // Agrupar pagos de una misma cita (abono + saldo) en un solo registro
  const grupos = {};
  pagos.forEach(p => {
    const clave = p.cita_id || `solo-${p.id}`;
    if (!grupos[clave]) grupos[clave] = { clave, cliente: p.cliente, servicio: p.servicio, metodo: p.metodo, pagados: [], pendientes: [], created_at: p.created_at };
    if (p.estado === "pagado") grupos[clave].pagados.push(p);
    else grupos[clave].pendientes.push(p);
  });
  const filas = Object.values(grupos).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {modal && <NuevoCobro onClose={() => setModal(false)} onGuardado={cargar} />}
      {cobrandoGrupo && <ModalCobrarSaldo grupo={cobrandoGrupo} onClose={() => setCobrandoGrupo(null)} onGuardado={cargar} />}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Cobros</h1>
          <p className="text-sm text-gray-400 mt-0.5">{filas.length} transacciones</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center justify-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
          <Plus size={16} /> Registrar cobro
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <p className="text-xs text-gray-400">Total cobrado</p>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">${total.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <p className="text-xs text-gray-400">Por cobrar</p>
          <p className="text-xl sm:text-2xl font-semibold text-amber-500 mt-1">${pendiente.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400">Transacciones</p>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">{filas.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {filas.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <CreditCard size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin cobros registrados</p>
            <button onClick={() => setModal(true)} className="mt-3 text-rose-500 text-sm hover:underline">+ Registrar primer cobro</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Cliente</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 hidden md:table-cell">Servicio</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">Método</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-400">Monto</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-400">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map(g => {
                const pagado = g.pagados.reduce((s,p) => s + Number(p.monto), 0);
                const saldo = g.pendientes.reduce((s,p) => s + Number(p.monto), 0);
                const totalGrupo = pagado + saldo;
                const Icon = METODO_ICON[g.metodo] || CreditCard;
                return (
                  <tr key={g.clave} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-xs font-semibold text-rose-600">
                          {g.cliente?.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-800">{g.cliente}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 hidden md:table-cell">{g.servicio}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Icon size={14} className="text-gray-400" />{g.metodo}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <p className="text-sm font-semibold text-gray-900">${totalGrupo.toFixed(2)}</p>
                      {saldo > 0 && pagado > 0 && (
                        <p className="text-xs text-gray-400">${pagado.toFixed(2)} abono + ${saldo.toFixed(2)} saldo</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {saldo === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle size={11} />pagado</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><AlertCircle size={11} />${saldo.toFixed(2)} pendiente</span>
                          <button onClick={() => setCobrandoGrupo(g)}
                            className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-lg hover:bg-green-600 transition-colors">
                            Cobrar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}