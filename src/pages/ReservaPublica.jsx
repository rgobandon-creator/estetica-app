import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Sparkles, Clock, User, Phone, Mail,
  CheckCircle, ChevronLeft, ChevronRight,
  Copy, Check, AlertCircle, ArrowRight, ArrowLeft,
  Upload, X, Instagram, Facebook, MessageCircle, Music2, Send
} from "lucide-react";

const CONFIG_DEFAULT = {
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
  direccion: "",
  google_maps_url: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  telegram: "",
  qr_deuna_url: "",
};

const EMOJI_CATEGORIA = {
  "Cabello": "✂️", "Uñas": "💅", "Depilación": "🌸",
  "Spa": "🤲", "Maquillaje": "💄", "Otro": "✨"
};

function linkRedSocial(valor, tipo) {
  if (!valor) return null;
  if (valor.startsWith("http")) return valor;
  const usuario = valor.replace("@", "").trim();
  if (tipo === "instagram") return `https://instagram.com/${usuario}`;
  if (tipo === "facebook") return `https://facebook.com/${usuario}`;
  if (tipo === "tiktok") return `https://tiktok.com/@${usuario}`;
  if (tipo === "telegram") return `https://t.me/${usuario}`;
  return valor;
}

function emojiPorNombre(nombre, categoria) {
  if (categoria && EMOJI_CATEGORIA[categoria]) return EMOJI_CATEGORIA[categoria];
  const n = nombre.toLowerCase();
  if (n.includes("corte")) return "✂️";
  if (n.includes("tinte") || n.includes("color")) return "🎨";
  if (n.includes("manicure") || n.includes("uña")) return "💅";
  if (n.includes("pedicure")) return "🦶";
  if (n.includes("tratamiento") || n.includes("capilar")) return "💆";
  if (n.includes("peinado")) return "👑";
  if (n.includes("depilacion") || n.includes("depilación")) return "🌸";
  if (n.includes("masaje")) return "🤲";
  if (n.includes("maquillaje")) return "💄";
  if (n.includes("facial") || n.includes("limpieza")) return "✨";
  return "⭐";
}

const DIAS_MAP = { domingo:0, lunes:1, martes:2, "miércoles":3, jueves:4, viernes:5, sábado:6 };

function IconoWhatsApp({ size=24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M17.6 6.32A8.9 8.9 0 0 0 12.05 3.5 8.9 8.9 0 0 0 3.5 12.05c0 1.57.4 3.05 1.17 4.36L3.5 20.5l4.24-1.11a8.87 8.87 0 0 0 4.31 1.1h.01c4.91 0 8.9-3.99 8.9-8.9a8.87 8.87 0 0 0-2.36-6.27ZM12.06 19a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.8.73.75-2.73-.18-.28a7.4 7.4 0 0 1-1.13-3.94c0-4.1 3.33-7.43 7.43-7.43 1.98 0 3.85.78 5.25 2.18a7.37 7.37 0 0 1 2.18 5.25c0 4.1-3.35 7.41-7.46 7.41Zm4.07-5.56c-.22-.11-1.31-.65-1.51-.72-.2-.08-.35-.11-.5.11-.15.22-.57.72-.7.87-.13.15-.26.16-.48.05-.22-.11-1.29-.47-2.32-1.44-.85-.76-1.43-1.7-1.6-1.98-.16-.29-.02-.44.13-.6.13-.15.29-.38.44-.57.15-.19.19-.32.29-.53.1-.22.05-.4-.03-.56-.08-.15-.65-1.56-.89-2.14-.24-.57-.48-.49-.66-.5h-.56c-.19 0-.5.07-.68.35-.19.28-.72.98-.72 2.38s.75 2.75.85 2.94c.11.19 1.51 2.5 3.75 3.44 2.24.93 2.24.62 2.64.58.4-.04 1.31-.53 1.5-1.05.19-.51.19-.95.13-1.05-.06-.09-.22-.15-.44-.26Z"/>
    </svg>
  );
}
function IconoFacebook({ size=24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8v-6.65H7.9V12H10V9.8c0-2.4 1.42-3.72 3.6-3.72.68 0 1.4.05 2.1.15v2.34h-1.2c-1.18 0-1.55.73-1.55 1.48V12h2.66l-.43 3.15H12.95V22c4.56-.93 9.05-4.96 9.05-10Z"/>
    </svg>
  );
}
function IconoInstagram({ size=24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5"/>
      <circle cx="12" cy="12" r="4.2"/>
      <circle cx="17.2" cy="6.8" r="0.9" fill="white" stroke="none"/>
    </svg>
  );
}
function IconoTikTok({ size=24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M16.6 3H14v12.4a2.9 2.9 0 1 1-2.1-2.79V9.9a5.6 5.6 0 1 0 4.7 5.5V8.63a6.9 6.9 0 0 0 4 1.27V7.2a4 4 0 0 1-4-4.2Z"/>
    </svg>
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
  const resultado = (10 - (suma % 10)) % 10;
  return resultado === verificador;
}

function quitarAcentos(s) {
  return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const ACENTO_DIA = { miercoles: "miércoles", sabado: "sábado" };
function normalizarDiasHabiles(arr) {
  return (arr || []).map(d => {
    const limpio = quitarAcentos(d.toLowerCase());
    return ACENTO_DIA[limpio] || limpio;
  });
}

function minutosDesde(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function generarHoras(inicio, fin) {
  const horas = [];
  const [hi] = inicio.split(":").map(Number);
  const [hf] = fin.split(":").map(Number);
  for (let h = hi; h < hf; h++) {
    horas.push(`${String(h).padStart(2,"0")}:00`);
    horas.push(`${String(h).padStart(2,"0")}:30`);
  }
  return horas;
}

function generarDias(diasHabiles) {
  const dias = [];
  const nums = diasHabiles.map(d => DIAS_MAP[d]).filter(n => n !== undefined);
  const hoy = new Date();
  for (let i = 0; i <= 30; i++) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    if (nums.includes(d.getDay())) {
      dias.push({
        fecha: d.toLocaleDateString("en-CA"),
        label: d.toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" }),
      });
    }
  }
  return dias;
}

function Paso({ n, label, activo, completado }) {
  return (
    <div className={`flex items-center gap-2 ${activo?"text-rose-600":completado?"text-green-600":"text-gray-400"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${activo?"border-rose-500 bg-rose-50":completado?"border-green-500 bg-green-50":"border-gray-200"}`}>
        {completado ? <Check size={13}/> : n}
      </div>
      <span className="text-xs font-medium hidden sm:block">{label}</span>
    </div>
  );
}

function CopiarBtn({ texto }) {
  const [copiado, setCopiado] = useState(false);
  function copiar() { navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(()=>setCopiado(false),2000); }
  return (
    <button onClick={copiar} className="ml-2 text-rose-500 hover:text-rose-700">
      {copiado ? <Check size={14}/> : <Copy size={14}/>}
    </button>
  );
}

export default function ReservaPublica() {
  const [config, setConfig] = useState(CONFIG_DEFAULT);
  const [servicios, setServicios] = useState([]);
  const [paso, setPaso] = useState(1);
  const [servicio, setServicio] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const [bloqueos, setBloqueos] = useState([]);
  const [form, setForm] = useState({ nombre:"", telefono:"", cedula:"", email:"", notas:"" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [reservaId, setReservaId] = useState(null);
  const [reservaUUID, setReservaUUID] = useState(null);
  const [paginaDia, setPaginaDia] = useState(0);
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);
  const [ordenCategorias, setOrdenCategorias] = useState([]);
  const [iconosCategorias, setIconosCategorias] = useState(EMOJI_CATEGORIA);
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalElegido, setProfesionalElegido] = useState(null); // null | 'cualquiera' | objeto profesional
  const [itemsDia, setItemsDia] = useState([]);
  const [metodoPago, setMetodoPago] = useState("transferencia");
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [comprobanteSubido, setComprobanteSubido] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    supabase.from("configuracion").select("valor").eq("clave","salon_config").single()
      .then(({ data }) => { if (data?.valor) setConfig({ ...CONFIG_DEFAULT, ...data.valor }); });
    supabase.from("servicios").select("*").order("orden").order("nombre")
      .then(({ data }) => {
        setServicios(data || []);
      });
    supabase.from("profesionales").select("*").eq("activo", true).order("nombre")
      .then(({ data }) => setProfesionales(data || []));
    supabase.from("configuracion").select("valor").eq("clave","categorias_orden").maybeSingle()
      .then(({ data }) => setOrdenCategorias(data?.valor || []));
    supabase.from("configuracion").select("valor").eq("clave","categorias_iconos").maybeSingle()
      .then(({ data }) => setIconosCategorias({ ...EMOJI_CATEGORIA, ...(data?.valor || {}) }));
  }, []);

  const calificados = servicio ? profesionales.filter(p => (p.servicios||[]).includes(servicio.nombre)) : [];

  let diasHabiles;
  let horarioIni = config.horario_inicio || "09:00";
  let horarioFinDia = config.horario_fin || "19:00";
  if (calificados.length === 0) {
    diasHabiles = config.dias || CONFIG_DEFAULT.dias;
  } else if (profesionalElegido === "cualquiera") {
    diasHabiles = [...new Set(calificados.flatMap(p => normalizarDiasHabiles(p.dias)))];
    horarioIni = calificados.reduce((min,p)=> p.horario_inicio<min?p.horario_inicio:min, calificados[0].horario_inicio);
    horarioFinDia = calificados.reduce((max,p)=> p.horario_fin>max?p.horario_fin:max, calificados[0].horario_fin);
  } else if (profesionalElegido) {
    diasHabiles = normalizarDiasHabiles(profesionalElegido.dias);
    horarioIni = profesionalElegido.horario_inicio;
    horarioFinDia = profesionalElegido.horario_fin;
  } else {
    diasHabiles = [];
  }

  const HORAS = generarHoras(horarioIni||"09:00", horarioFinDia||"19:00");
  const dias = generarDias(diasHabiles);
  const DIAS_POR_PAGINA = 5;
  const diasVisibles = dias.slice(paginaDia*DIAS_POR_PAGINA, (paginaDia+1)*DIAS_POR_PAGINA);

  useEffect(() => {
    if (!fecha) return;
    Promise.all([
      supabase.from("horarios_citas").select("hora,duracion,profesional").eq("fecha",fecha).neq("estado","cancelada"),
      supabase.from("horarios_reservas").select("hora,servicio,profesional").eq("fecha",fecha).eq("estado","confirmada"),
    ]).then(([{data:c},{data:r}]) => {
      const duracionServicio = {};
      servicios.forEach(s => { duracionServicio[s.nombre] = s.duracion; });
      const items = [
        ...(c||[]).map(x => ({ hora:x.hora, duracion: x.duracion || 60, profesional: x.profesional })),
        ...(r||[]).map(x => ({ hora:x.hora, duracion: duracionServicio[x.servicio] || 60, profesional: x.profesional })),
      ];
      setItemsDia(items);
    });
  }, [fecha, servicios]);

  function profesionalLibre(prof, inicio, fin) {
    const horaIni = minutosDesde(prof.horario_inicio||"09:00");
    const horaFin = minutosDesde(prof.horario_fin||"19:00");
    if (inicio < horaIni || fin > horaFin) return false;
    const ocupado = itemsDia.some(it => {
      if (it.profesional && it.profesional !== prof.nombre) return false;
      const itIni = minutosDesde(it.hora);
      return inicio < (itIni + it.duracion) && fin > itIni;
    });
    return !ocupado;
  }

  function seleccionarArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setArchivo(file);
    setPreview(URL.createObjectURL(file));
    setComprobanteSubido(false);
  }

  async function subirComprobante() {
    if (!archivo||!reservaUUID) return;
    setSubiendoComprobante(true);
    const ext = archivo.name.split(".").pop();
    const path = `${reservaUUID}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("comprobantes").upload(path, archivo, { upsert:true });
    if (uploadError) { alert("Error al subir: "+uploadError.message); setSubiendoComprobante(false); return; }
    const { data: urlData } = supabase.storage.from("comprobantes").getPublicUrl(path);
    await supabase.from("reservas_publicas").update({ comprobante_url: urlData.publicUrl }).eq("id", reservaUUID);
    setComprobanteSubido(true);
    setSubiendoComprobante(false);
  }

  async function enviarReserva() {
    if (!form.nombre||!form.telefono||!form.cedula) { setError("Nombre, cédula y teléfono son obligatorios"); return; }
    if (!validarCedulaEcuador(form.cedula)) { setError("La cédula ingresada no es válida, revísala"); return; }
    setCargando(true); setError("");

    let profesionalFinal = null;
    if (profesionalElegido && profesionalElegido !== "cualquiera") {
      profesionalFinal = profesionalElegido.nombre;
    } else if (profesionalElegido === "cualquiera") {
      const inicio = minutosDesde(hora);
      const fin = inicio + (servicio?.duracion || 30);
      const libres = calificados.filter(p => profesionalLibre(p, inicio, fin));
      if (libres.length === 0) {
        setCargando(false);
        setError("Ese horario ya no está disponible, elige otro.");
        return;
      }
      profesionalFinal = libres[Math.floor(Math.random()*libres.length)].nombre;
    }

    const { data, error: err } = await supabase.from("reservas_publicas").insert([{
      nombre:form.nombre, telefono:form.telefono, cedula:form.cedula, email:form.email,
      servicio:servicio.nombre, fecha, hora, profesional: profesionalFinal,
      abono: config.abono_minimo||5,
      notas:form.notas, estado:"pendiente",
    }]).select().single();
    setCargando(false);
    if (err) { setError("Error: " + err.message + " | Code: " + err.code); return; }
    setReservaId(data.id.slice(0,8).toUpperCase());
    setReservaUUID(data.id);
    setPaso(4);
  }

  function resetear() {
    setPaso(1); setServicio(null); setFecha(null); setHora(null); setProfesionalElegido(null);
    setForm({ nombre:"", telefono:"", email:"", notas:"" });
    setArchivo(null); setPreview(null); setComprobanteSubido(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-white"/>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 text-base">{config.nombre}</h1>
            <p className="text-xs text-gray-400">
              {config.dias?.slice(0,2).map(d=>d.charAt(0).toUpperCase()+d.slice(1)).join(" – ")} · {config.horario_inicio} – {config.horario_fin}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="w-full">
        {paso < 5 && (
          <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 border border-gray-100">
            <Paso n={1} label="Servicio" activo={paso===1} completado={paso>1}/>
            <div className="flex-1 h-px bg-gray-200 mx-2"/>
            <Paso n={2} label="Horario" activo={paso===2} completado={paso>2}/>
            <div className="flex-1 h-px bg-gray-200 mx-2"/>
            <Paso n={3} label="Tus datos" activo={paso===3} completado={paso>3}/>
            <div className="flex-1 h-px bg-gray-200 mx-2"/>
            <Paso n={4} label="Pago" activo={paso===4} completado={paso>4}/>
          </div>
        )}

        {/* PASO 1 */}
        {paso===1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">¿Qué servicio deseas?</h2>
              <p className="text-sm text-gray-400 mt-0.5">{config.descripcion}</p>
            </div>
            {servicios.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">
                <p className="text-sm">Cargando servicios...</p>
              </div>
            ) : Object.entries(
                servicios.reduce((grupos, s) => {
                  const cat = s.categoria || "Otro";
                  (grupos[cat] = grupos[cat] || []).push(s);
                  return grupos;
                }, {})
              ).sort(([a], [b]) => {
                const ia = ordenCategorias.indexOf(a);
                const ib = ordenCategorias.indexOf(b);
                if (ia === -1 && ib === -1) return 0;
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
              }).map(([categoria, items]) => {
                const abierta = categoriaAbierta === categoria;
                return (
                  <div key={categoria} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <button onClick={() => setCategoriaAbierta(categoriaAbierta === categoria ? null : categoria)}
                      className="w-full flex items-center justify-between p-4 hover:bg-rose-50 transition-colors text-left">
                      <span className="flex items-center gap-2 font-medium text-gray-800">
                        <span className="text-xl">{iconosCategorias[categoria] || "✨"}</span>
                        {categoria}
                        <span className="text-xs font-normal text-gray-400">({items.length})</span>
                      </span>
                      {abierta ? <ChevronLeft size={16} className="text-gray-400 rotate-90"/> : <ChevronRight size={16} className="text-gray-400"/>}
                    </button>
                    {abierta && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {items.map(s => (
                          <button key={s.id} onClick={()=>{setServicio(s);setProfesionalElegido(null);setFecha(null);setHora(null);setPaso(2);}}
                            className="w-full flex items-center gap-4 p-4 hover:bg-rose-50 transition-all text-left group">
                            <span className="text-xl flex-shrink-0">{emojiPorNombre(s.nombre, s.categoria)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 group-hover:text-rose-700">{s.nombre}</p>
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={11}/>{s.duracion} min</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-rose-500 text-lg">${Number(s.precio).toFixed(2)}</p>
                              <p className="text-xs text-gray-400">abono ${config.abono_minimo}</p>
                            </div>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-rose-400 flex-shrink-0"/>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* PASO 2 */}
        {paso===2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={()=>setPaso(1)} className="p-2 hover:bg-white rounded-lg"><ArrowLeft size={18} className="text-gray-400"/></button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Elige fecha y hora</h2>
                <p className="text-sm text-gray-400">{servicio?.nombre} · {servicio?.duracion} min</p>
              </div>
            </div>
            {calificados.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500 mb-3">¿Quién te atiende?</p>
                <div className="grid grid-cols-2 gap-2">
                  {calificados.map(p => (
                    <button key={p.id} onClick={()=>{setProfesionalElegido(p);setFecha(null);setHora(null);}}
                      className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium border transition-all ${profesionalElegido?.id===p.id?"bg-rose-500 text-white border-rose-500":"bg-gray-50 text-gray-700 border-gray-100 hover:border-rose-300"}`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${profesionalElegido?.id===p.id?"bg-white/20":"bg-rose-100 text-rose-600"}`}>
                        {p.nombre.slice(0,2).toUpperCase()}
                      </span>
                      {p.nombre}
                    </button>
                  ))}
                  <button onClick={()=>{setProfesionalElegido("cualquiera");setFecha(null);setHora(null);}}
                    className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium border transition-all ${profesionalElegido==="cualquiera"?"bg-rose-500 text-white border-rose-500":"bg-gray-50 text-gray-700 border-gray-100 hover:border-rose-300"}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${profesionalElegido==="cualquiera"?"bg-white/20":"bg-blue-100"}`}>🎲</span>
                    Cualquiera disponible
                  </button>
                </div>
              </div>
            )}
            {(calificados.length === 0 || profesionalElegido) && (
            <>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={()=>setPaginaDia(p=>Math.max(0,p-1))} disabled={paginaDia===0}
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronLeft size={16} className="text-gray-500"/></button>
                <span className="text-xs font-medium text-gray-500">Próximos días disponibles</span>
                <button onClick={()=>setPaginaDia(p=>p+1)} disabled={(paginaDia+1)*DIAS_POR_PAGINA>=dias.length}
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30"><ChevronRight size={16} className="text-gray-500"/></button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {diasVisibles.map(d=>(
                  <button key={d.fecha} onClick={()=>{setFecha(d.fecha);setHora(null);}}
                    className={`flex flex-col items-center py-3 rounded-xl text-xs transition-all ${fecha===d.fecha?"bg-rose-500 text-white font-semibold":"hover:bg-rose-50 text-gray-600 bg-gray-50"}`}>
                    {d.label.split(" ").map((p,i)=><span key={i} className={i===1?"text-base font-bold":""}>{p}</span>)}
                  </button>
                ))}
              </div>
            </div>
            {fecha && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500 mb-3">Horas disponibles</p>
                <div className="grid grid-cols-4 gap-2">
                  {HORAS.map(h=>{
                    const inicio = minutosDesde(h);
                    const fin = inicio + (servicio?.duracion || 30);
                    const finHorario = minutosDesde(horarioFinDia || "19:00");
                    const ahora = new Date();
                    const esHoy = fecha === ahora.toLocaleDateString("en-CA");
                    const yaPaso = esHoy && inicio <= (ahora.getHours()*60 + ahora.getMinutes());
                    let ocupada;
                    if (yaPaso || fin > finHorario) {
                      ocupada = true;
                    } else if (calificados.length === 0) {
                      ocupada = itemsDia.some(b => { const bIni=minutosDesde(b.hora); return inicio < (bIni+b.duracion) && fin > bIni; });
                    } else if (profesionalElegido === "cualquiera") {
                      ocupada = !calificados.some(p => profesionalLibre(p, inicio, fin));
                    } else if (profesionalElegido) {
                      ocupada = !profesionalLibre(profesionalElegido, inicio, fin);
                    } else {
                      ocupada = true; // aún no elige profesional
                    }
                    return <button key={h} disabled={ocupada} onClick={()=>setHora(h)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${ocupada?"bg-gray-100 text-gray-300 cursor-not-allowed line-through":hora===h?"bg-rose-500 text-white":"bg-gray-50 text-gray-700 hover:bg-rose-50 hover:text-rose-600"}`}>
                      {h}
                    </button>;
                  })}
                </div>
              </div>
            )}
            </>
            )}
            {fecha&&hora&&(
              <button onClick={()=>setPaso(3)}
                className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 flex items-center justify-center gap-2">
                Continuar <ArrowRight size={16}/>
              </button>
            )}
          </div>
        )}

        {/* PASO 3 */}
        {paso===3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={()=>setPaso(2)} className="p-2 hover:bg-white rounded-lg"><ArrowLeft size={18} className="text-gray-400"/></button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Tus datos</h2>
                <p className="text-sm text-gray-400">Para confirmar tu reserva</p>
              </div>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 space-y-1.5">
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-2">Resumen</p>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Servicio</span><span className="font-medium">{servicio?.nombre}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Fecha</span><span className="font-medium">{fecha&&new Date(fecha+"T12:00:00").toLocaleDateString("es-EC",{weekday:"long",day:"numeric",month:"long"})}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Hora</span><span className="font-medium">{hora}</span></div>
              <div className="border-t border-rose-200 pt-2 mt-2 flex justify-between text-sm">
                <span className="text-gray-500">Abono ahora</span>
                <span className="font-bold text-rose-700">${config.abono_minimo}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              {[["nombre","Nombre completo *",User,"Ej: María Torres"],["cedula","Cédula *",User,"10 dígitos"],["telefono","WhatsApp *",Phone,"0987654321"],["email","Email (opcional)",Mail,"tu@email.com"]].map(([key,label,Icon,ph])=>(
                <div key={key}>
                  <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
                  <div className="relative">
                    <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input placeholder={ph} value={form[key]}
                      inputMode={key==="cedula"?"numeric":undefined} maxLength={key==="cedula"?10:undefined}
                      onChange={e=>setForm({...form,[key]: key==="cedula" ? e.target.value.replace(/\D/g,"") : e.target.value})}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
                  </div>
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Notas (opcional)</label>
                <textarea placeholder="Alergias, preferencias..." value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"/>
              </div>
            </div>
            {error&&<div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600"><AlertCircle size={15}/>{error}</div>}
            <button onClick={()=>{
                if(!form.nombre||!form.telefono||!form.cedula){setError("Nombre, cédula y teléfono son obligatorios");return;}
                if(!validarCedulaEcuador(form.cedula)){setError("La cédula ingresada no es válida, revísala");return;}
                setError(""); setMostrarConfirmacion(true);
              }} disabled={cargando}
              className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {cargando?"Registrando...":<><span>Ver instrucciones de pago</span><ArrowRight size={16}/></>}
            </button>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN */}
        {mostrarConfirmacion && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={()=>setMostrarConfirmacion(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={e=>e.stopPropagation()}>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                  <AlertCircle size={22} className="text-amber-500"/>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirma tu reserva</h3>
                <p className="text-sm text-gray-400 mt-1">Verifica que tus datos sean correctos antes de continuar</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Servicio</span><span className="font-medium">{servicio?.nombre}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Fecha</span><span className="font-medium">{fecha&&new Date(fecha+"T12:00:00").toLocaleDateString("es-EC",{weekday:"long",day:"numeric",month:"long"})}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Hora</span><span className="font-medium">{hora}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Nombre</span><span className="font-medium">{form.nombre}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Cédula</span><span className="font-medium">{form.cedula}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">WhatsApp</span><span className="font-medium">{form.telefono}</span></div>
              </div>
              <p className="text-xs text-gray-400 text-center">Al confirmar, se apartará este horario y deberás realizar el abono para asegurar tu cita.</p>
              <div className="flex gap-3">
                <button onClick={()=>setMostrarConfirmacion(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
                  Revisar datos
                </button>
                <button onClick={()=>{ setMostrarConfirmacion(false); enviarReserva(); }} disabled={cargando}
                  className="flex-1 py-2.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
                  {cargando?"Confirmando...":"Sí, confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 4 */}
        {paso===4 && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3"><span className="text-2xl">🏦</span></div>
              <h2 className="text-lg font-semibold text-gray-900">Realiza el abono de ${config.abono_minimo}</h2>
              <p className="text-sm text-gray-400 mt-1">Elige tu método de pago y sube el comprobante aquí</p>
            </div>

            {config.qr_deuna_url && (
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button onClick={()=>setMetodoPago("transferencia")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${metodoPago==="transferencia"?"bg-white text-rose-600 shadow-sm":"text-gray-500"}`}>
                  🏦 Transferencia
                </button>
                <button onClick={()=>setMetodoPago("deuna")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${metodoPago==="deuna"?"bg-white text-rose-600 shadow-sm":"text-gray-500"}`}>
                  📱 De Una (QR)
                </button>
              </div>
            )}

            {metodoPago === "deuna" && config.qr_deuna_url ? (
              <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Escanea con la app De Una</p>
                <img src={config.qr_deuna_url} alt="QR De Una" className="w-56 h-56 object-contain mx-auto rounded-lg border border-gray-100"/>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-sm text-gray-500">Monto exacto:</span>
                  <span className="text-sm font-bold text-rose-600">${config.abono_minimo}.00</span>
                  <CopiarBtn texto={`${config.abono_minimo}.00`}/>
                </div>
              </div>
            ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Datos para transferencia</p>
              <div className="space-y-3">
                {[["Banco",config.banco],["Tipo de cuenta",config.tipo_cuenta],["N° de cuenta",config.numero_cuenta],["Titular",config.titular],["Cédula",config.cedula],["Monto exacto",`$${config.abono_minimo}.00`]].map(([label,valor])=>(
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400">{label}</span>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${label==="Monto exacto"?"text-rose-600 font-bold":"text-gray-800"}`}>{valor}</span>
                      {["N° de cuenta","Monto exacto"].includes(label)&&<CopiarBtn texto={String(valor)}/>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 text-center">
              <p className="text-xs text-rose-500 font-medium mb-1">Tu código de reserva</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold text-rose-700 tracking-widest">{reservaId}</p>
                <CopiarBtn texto={reservaId||""}/>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm font-medium text-gray-700 mb-1">Sube tu comprobante</p>
              <p className="text-xs text-gray-400 mb-4">Foto o captura de la transferencia</p>
              {!preview ? (
                <button onClick={()=>inputRef.current.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-rose-300 hover:bg-rose-50 transition-colors">
                  <Upload size={24} className="text-gray-300"/>
                  <span className="text-sm text-gray-400">Toca para seleccionar imagen</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <img src={preview} alt="Comprobante" className="w-full rounded-xl border border-gray-100 max-h-48 object-cover"/>
                    {!comprobanteSubido&&<button onClick={()=>{setArchivo(null);setPreview(null);}} className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center"><X size={14} className="text-gray-500"/></button>}
                  </div>
                  {!comprobanteSubido ? (
                    <button onClick={subirComprobante} disabled={subiendoComprobante}
                      className="w-full py-2.5 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2">
                      {subiendoComprobante?"Subiendo...":"Enviar comprobante"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                      <CheckCircle size={16} className="text-green-500"/>Comprobante enviado correctamente
                    </div>
                  )}
                </div>
              )}
              <input ref={inputRef} type="file" accept="image/*,application/pdf" onChange={seleccionarArchivo} className="hidden"/>
            </div>
            <a href={`https://wa.me/593${config.whatsapp?.startsWith("0")?config.whatsapp.slice(1):config.whatsapp}?text=Hola! Mi código de reserva es *${reservaId}*. Adjunto comprobante de $${config.abono_minimo}.`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors">
              📲 Enviar comprobante por WhatsApp
            </a>
            <button onClick={()=>setPaso(5)}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${comprobanteSubido?"bg-green-500 text-white hover:bg-green-600":"border border-gray-200 text-gray-500 text-sm"}`}>
              {comprobanteSubido?"Ver confirmación →":"Continuar sin comprobante"}
            </button>
          </div>
        )}

        {/* PASO 5 */}
        {paso===5 && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-green-500"/>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">¡Reserva registrada!</h2>
              <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
                {comprobanteSubido?"Revisaremos tu comprobante y recibirás confirmación por WhatsApp.":"En cuanto verifiquemos tu pago, recibirás confirmación por WhatsApp."}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 text-left space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Servicio</span><span className="font-medium">{servicio?.nombre}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Fecha</span><span className="font-medium">{fecha&&new Date(fecha+"T12:00:00").toLocaleDateString("es-EC",{weekday:"long",day:"numeric",month:"long"})}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Hora</span><span className="font-medium">{hora}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Código</span><span className="font-bold text-rose-600 tracking-widest">{reservaId}</span></div>
            </div>
            <button onClick={resetear} className="text-sm text-rose-500 hover:underline">Hacer otra reserva</button>
          </div>
        )}
        </div>
      </div>

      {/* Botones flotantes de redes sociales + WhatsApp */}
      <div className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
        {config.whatsapp && (
          <a href={`https://wa.me/593${config.whatsapp.startsWith("0")?config.whatsapp.slice(1):config.whatsapp}?text=Hola! Tengo una duda sobre una reserva en ${config.nombre}`}
            target="_blank" rel="noopener noreferrer" title="WhatsApp"
            className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg ring-2 ring-white/50 hover:scale-110 transition-transform">
            <IconoWhatsApp size={24}/>
          </a>
        )}
        {config.instagram && (
          <a href={linkRedSocial(config.instagram,"instagram")} target="_blank" rel="noopener noreferrer" title="Instagram"
            className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg ring-2 ring-white/50 hover:scale-110 transition-transform">
            <IconoInstagram size={22}/>
          </a>
        )}
        {config.facebook && (
          <a href={linkRedSocial(config.facebook,"facebook")} target="_blank" rel="noopener noreferrer" title="Facebook"
            className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-lg ring-2 ring-white/50 hover:scale-110 transition-transform">
            <IconoFacebook size={22}/>
          </a>
        )}
        {config.tiktok && (
          <a href={linkRedSocial(config.tiktok,"tiktok")} target="_blank" rel="noopener noreferrer" title="TikTok"
            className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg ring-2 ring-white/50 hover:scale-110 transition-transform">
            <IconoTikTok size={20}/>
          </a>
        )}
      </div>

      {/* Pie de página con dirección */}
      {config.direccion && (
        <div className="text-center px-4 pb-8 pt-2">
          <p className="text-xs text-gray-400">📍 {config.direccion}</p>
          {config.google_maps_url && (
            <a href={config.google_maps_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-rose-500 hover:underline">
              Ver ubicación en el mapa
            </a>
          )}
        </div>
      )}
    </div>
  );
}