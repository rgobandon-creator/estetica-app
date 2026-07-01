import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Save, Sparkles, Clock, CreditCard, Phone, Copy, Check } from "lucide-react";

const CONFIG_KEY = "salon_config";

const DEFAULT_CONFIG = {
  nombre: "GlowSuite Salón",
  descripcion: "Reserva tu cita en línea y asegura tu lugar con un abono de $5",
  whatsapp: "0997201130",
  horario_inicio: "09:00",
  horario_fin: "19:00",
  dias: ["lunes","martes","miércoles","jueves","viernes","sábado"],
  banco: "Banco Pichincha",
  tipo_cuenta: "Ahorro",
  numero_cuenta: "2207894561",
  titular: "Valeria Suárez",
  cedula: "1003456789",
  abono_minimo: 5,
};

const DIAS_SEMANA = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];

function CopiarBtn({ texto }) {
  const [copiado, setCopiado] = useState(false);
  function copiar() { navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(()=>setCopiado(false),2000); }
  return (
    <button onClick={copiar} className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700">
      {copiado ? <><Check size={13}/>Copiado</> : <><Copy size={13}/>Copiar</>}
    </button>
  );
}

export default function Configuracion() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    supabase.from("configuracion").select("*").eq("clave", CONFIG_KEY).single()
      .then(({ data }) => {
        if (data?.valor) setConfig({ ...DEFAULT_CONFIG, ...data.valor });
        setCargando(false);
      });
  }, []);

  async function guardar() {
    setGuardando(true);
    const { data: existe } = await supabase.from("configuracion").select("id").eq("clave", CONFIG_KEY).single();
    if (existe) {
      await supabase.from("configuracion").update({ valor: config }).eq("clave", CONFIG_KEY);
    } else {
      await supabase.from("configuracion").insert([{ clave: CONFIG_KEY, valor: config }]);
    }
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  function toggleDia(dia) {
    const dias = config.dias.includes(dia)
      ? config.dias.filter(d => d !== dia)
      : [...config.dias, dia];
    setConfig({ ...config, dias });
  }

  const urlReservas = window.location.origin + "/reservar";

  if (cargando) return (
    <div className="p-6 flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-400 mt-0.5">Datos del salón y página de reservas</p>
        </div>
        <button onClick={guardar} disabled={guardando}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${guardado ? "bg-green-500 text-white" : "bg-rose-500 text-white hover:bg-rose-600"} disabled:opacity-50`}>
          <Save size={16}/>{guardado ? "¡Guardado!" : guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* Link de reservas */}
      <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
        <p className="text-xs font-semibold text-rose-600 mb-2">🔗 Link de reservas para compartir</p>
        <div className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2 border border-rose-200">
          <p className="text-sm text-gray-700 truncate">{urlReservas}</p>
          <CopiarBtn texto={urlReservas}/>
        </div>
        <p className="text-xs text-rose-400 mt-2">Comparte este link por WhatsApp e Instagram con tus clientes</p>
      </div>

      {/* Info del salón */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2"><Sparkles size={15} className="text-rose-400"/>Información del salón</h2>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Nombre del salón</label>
          <input value={config.nombre} onChange={e => setConfig({...config, nombre:e.target.value})}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Descripción (aparece en página de reservas)</label>
          <input value={config.descripcion} onChange={e => setConfig({...config, descripcion:e.target.value})}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">WhatsApp (con código de país sin +)</label>
          <input value={config.whatsapp} onChange={e => setConfig({...config, whatsapp:e.target.value})}
            placeholder="0997201130"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
        </div>
      </div>

      {/* Horario */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2"><Clock size={15} className="text-rose-400"/>Horario de atención</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Hora de apertura</label>
            <input type="time" value={config.horario_inicio} onChange={e => setConfig({...config, horario_inicio:e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Hora de cierre</label>
            <input type="time" value={config.horario_fin} onChange={e => setConfig({...config, horario_fin:e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-2">Días de atención</label>
          <div className="flex flex-wrap gap-2">
            {DIAS_SEMANA.map(dia => (
              <button key={dia} onClick={() => toggleDia(dia)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${config.dias.includes(dia) ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {dia}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Abono mínimo para reservar ($)</label>
          <input type="number" value={config.abono_minimo} onChange={e => setConfig({...config, abono_minimo:Number(e.target.value)})}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
        </div>
      </div>

      {/* Datos bancarios */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2"><CreditCard size={15} className="text-rose-400"/>Datos bancarios para transferencias</h2>
        {[
          ["banco","Banco","Banco Pichincha"],
          ["tipo_cuenta","Tipo de cuenta","Ahorro / Corriente"],
          ["numero_cuenta","Número de cuenta",""],
          ["titular","Nombre del titular",""],
          ["cedula","Cédula del titular",""],
        ].map(([key, label, ph]) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
            <input placeholder={ph} value={config[key]||""} onChange={e => setConfig({...config,[key]:e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
          </div>
        ))}
      </div>
    </div>
  );
}