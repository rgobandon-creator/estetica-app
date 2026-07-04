import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Sparkles, Clock, User, Phone, Mail,
  CheckCircle, ChevronLeft, ChevronRight,
  Copy, Check, AlertCircle, ArrowRight, ArrowLeft,
  Upload, X
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
  const [form, setForm] = useState({ nombre:"", telefono:"", email:"", notas:"" });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [reservaId, setReservaId] = useState(null);
  const [reservaUUID, setReservaUUID] = useState(null);
  const [paginaDia, setPaginaDia] = useState(0);
  const [categoriaAbierta, setCategoriaAbierta] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [comprobanteSubido, setComprobanteSubido] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    supabase.from("configuracion").select("valor").eq("clave","salon_config").single()
      .then(({ data }) => { if (data?.valor) setConfig({ ...CONFIG_DEFAULT, ...data.valor }); });
    supabase.from("servicios").select("*").order("categoria").order("nombre")
      .then(({ data }) => {
        setServicios(data || []);
        if (data && data.length > 0) setCategoriaAbierta(data[0].categoria || "Otro");
      });
  }, []);

  const HORAS = generarHoras(config.horario_inicio||"09:00", config.horario_fin||"19:00");
  const dias = generarDias(config.dias||CONFIG_DEFAULT.dias);
  const DIAS_POR_PAGINA = 5;
  const diasVisibles = dias.slice(paginaDia*DIAS_POR_PAGINA, (paginaDia+1)*DIAS_POR_PAGINA);

  useEffect(() => {
    if (!fecha) return;
    Promise.all([
      supabase.from("horarios_citas").select("hora,duracion").eq("fecha",fecha).neq("estado","cancelada"),
      supabase.from("horarios_reservas").select("hora,servicio").eq("fecha",fecha).eq("estado","confirmada"),
    ]).then(([{data:c},{data:r}]) => {
      const duracionServicio = {};
      servicios.forEach(s => { duracionServicio[s.nombre] = s.duracion; });
      const items = [
        ...(c||[]).map(x => ({ hora:x.hora, duracion: x.duracion || 60 })),
        ...(r||[]).map(x => ({ hora:x.hora, duracion: duracionServicio[x.servicio] || 60 })),
      ];
      setBloqueos(items.map(x => {
        const inicio = minutosDesde(x.hora);
        return { inicio, fin: inicio + x.duracion };
      }));
    });
  }, [fecha, servicios]);

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
    if (!form.nombre||!form.telefono) { setError("Nombre y teléfono son obligatorios"); return; }
    setCargando(true); setError("");
    const { data, error: err } = await supabase.from("reservas_publicas").insert([{
      nombre:form.nombre, telefono:form.telefono, email:form.email,
      servicio:servicio.nombre, fecha, hora,
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
    setPaso(1); setServicio(null); setFecha(null); setHora(null);
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
          {config.whatsapp && (
            <a href={`https://wa.me/593${config.whatsapp.startsWith("0")?config.whatsapp.slice(1):config.whatsapp}?text=Hola! Tengo una duda sobre una reserva en ${config.nombre}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors">
              📲 <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 lg:flex lg:gap-8 lg:items-start">
        <div className="max-w-lg w-full mx-auto lg:mx-0">
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
              ).map(([categoria, items]) => {
                const abierta = categoriaAbierta === categoria;
                return (
                  <div key={categoria} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <button onClick={() => setCategoriaAbierta(categoriaAbierta === categoria ? null : categoria)}
                      className="w-full flex items-center justify-between p-4 hover:bg-rose-50 transition-colors text-left">
                      <span className="flex items-center gap-2 font-medium text-gray-800">
                        <span className="text-xl">{EMOJI_CATEGORIA[categoria] || "✨"}</span>
                        {categoria}
                        <span className="text-xs font-normal text-gray-400">({items.length})</span>
                      </span>
                      {abierta ? <ChevronLeft size={16} className="text-gray-400 rotate-90"/> : <ChevronRight size={16} className="text-gray-400"/>}
                    </button>
                    {abierta && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {items.map(s => (
                          <button key={s.id} onClick={()=>{setServicio(s);setPaso(2);}}
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
                    const finHorario = minutosDesde(config.horario_fin || "19:00");
                    const ahora = new Date();
                    const esHoy = fecha === ahora.toLocaleDateString("en-CA");
                    const yaPaso = esHoy && inicio <= (ahora.getHours()*60 + ahora.getMinutes());
                    const ocupada = yaPaso || fin > finHorario || bloqueos.some(b => inicio < b.fin && fin > b.inicio);
                    return <button key={h} disabled={ocupada} onClick={()=>setHora(h)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${ocupada?"bg-gray-100 text-gray-300 cursor-not-allowed line-through":hora===h?"bg-rose-500 text-white":"bg-gray-50 text-gray-700 hover:bg-rose-50 hover:text-rose-600"}`}>
                      {h}
                    </button>;
                  })}
                </div>
              </div>
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
              {[["nombre","Nombre completo *",User,"Ej: María Torres"],["telefono","WhatsApp *",Phone,"0987654321"],["email","Email (opcional)",Mail,"tu@email.com"]].map(([key,label,Icon,ph])=>(
                <div key={key}>
                  <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
                  <div className="relative">
                    <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
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
            <button onClick={()=>{ if(!form.nombre||!form.telefono){setError("Nombre y teléfono son obligatorios");return;} setError(""); setMostrarConfirmacion(true); }} disabled={cargando}
              className="w-full py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {cargando?"Registrando...":<><span>Ver instrucciones de pago</span><ArrowRight size={16}/></>}
            </button>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN */}
        {mostrarConfirmacion && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
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
              <p className="text-sm text-gray-400 mt-1">Transfiere y sube el comprobante aquí</p>
            </div>
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

        {(config.instagram || config.facebook || config.tiktok) && (
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Síguenos</h3>
              <div className="space-y-2">
                {config.instagram && (
                  <a href={linkRedSocial(config.instagram,"instagram")} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-rose-500 transition-colors">
                    📷 Instagram
                  </a>
                )}
                {config.facebook && (
                  <a href={linkRedSocial(config.facebook,"facebook")} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-rose-500 transition-colors">
                    👍 Facebook
                  </a>
                )}
                {config.tiktok && (
                  <a href={linkRedSocial(config.tiktok,"tiktok")} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-rose-500 transition-colors">
                    🎵 TikTok
                  </a>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Redes sociales en móvil (debajo del contenido) */}
      {(config.instagram || config.facebook || config.tiktok) && (
        <div className="lg:hidden max-w-lg mx-auto px-4 pb-2 flex items-center justify-center gap-5">
          {config.instagram && <a href={linkRedSocial(config.instagram,"instagram")} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-rose-500">📷 Instagram</a>}
          {config.facebook && <a href={linkRedSocial(config.facebook,"facebook")} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-rose-500">👍 Facebook</a>}
          {config.tiktok && <a href={linkRedSocial(config.tiktok,"tiktok")} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-rose-500">🎵 TikTok</a>}
        </div>
      )}

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