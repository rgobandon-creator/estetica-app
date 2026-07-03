import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, X, Phone, Mail, AlertCircle, CreditCard, Banknote, Smartphone, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

function fechaLocal(f) { const [y,m,d] = f.split("-").map(Number); return new Date(y,m-1,d); }
function formatearFecha(f) { return fechaLocal(f).toLocaleDateString("es-EC",{weekday:"long",day:"numeric",month:"long"}); }
function minutosDesde(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }

function EstadoBadge({ estado }) {
  const map = { confirmada:"bg-green-100 text-green-700", pendiente:"bg-amber-100 text-amber-700", cancelada:"bg-red-100 text-red-700", cobrada:"bg-blue-100 text-blue-700" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[estado]||"bg-gray-100 text-gray-600"}`}>{estado}</span>;
}

function RegistrarCobroModal({ cita, onClose, onGuardado }) {
  const [metodo, setMetodo] = useState("Efectivo");
  const [monto, setMonto] = useState(cita.precio || 0);
  const [cargando, setCargando] = useState(false);

  async function cobrar() {
    setCargando(true);
    await supabase.from("pagos").insert([{
      cliente: cita.cliente, servicio: cita.servicio,
      monto: Number(monto), metodo, estado: "pagado"
    }]);
    await supabase.from("citas").update({ estado: "cobrada" }).eq("id", cita.id);
    setCargando(false);
    onGuardado();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Registrar cobro</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
            <p className="text-sm font-medium text-gray-800">{cita.cliente}</p>
            <p className="text-xs text-gray-500">{cita.servicio} · {cita.hora}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Monto a cobrar ($)</label>
            <input type="number" value={monto} onChange={e => setMonto(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {[["Efectivo", Banknote], ["Transferencia", Smartphone], ["Tarjeta", CreditCard]].map(([m, Icon]) => (
                <button key={m} onClick={() => setMetodo(m)}
                  className={`flex flex-col items-center gap-1 p-3 border rounded-lg text-xs transition-colors ${metodo===m?"border-rose-400 bg-rose-50 text-rose-600":"border-gray-200 text-gray-500 hover:border-rose-200"}`}>
                  <Icon size={16}/>{m}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">Cancelar</button>
          <button onClick={cobrar} disabled={cargando}
            className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
            {cargando ? "Registrando..." : "Cobrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NuevaCitaModal({ onClose, onGuardada, fechaInicial }) {
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [clienteInfo, setClienteInfo] = useState(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ telefono:"", email:"", alergias:"Ninguna" });
  const [form, setForm] = useState({ cliente:"", servicio:"", profesional:"", fecha: fechaInicial||new Date().toLocaleDateString("en-CA"), hora:"", duracion:60, precio:0, estado:"confirmada" });
  const [cargando, setCargando] = useState(false);

  const HORAS = [];
  for (let h=8;h<19;h++){HORAS.push(`${String(h).padStart(2,"0")}:00`);HORAS.push(`${String(h).padStart(2,"0")}:30`);}

  useEffect(() => {
    supabase.from("servicios").select("*").order("nombre").then(({data})=>setServicios(data||[]));
    Promise.all([
      supabase.from("clientes").select("nombre,telefono,email,alergias,notas").order("nombre"),
      supabase.from("reservas_publicas").select("nombre,telefono,email").neq("estado","cancelada")
    ]).then(([{data:c},{data:r}])=>{
      const map={};
      (c||[]).forEach(x=>{map[x.nombre]={...x,fuente:"clientes"};});
      (r||[]).forEach(x=>{if(!map[x.nombre])map[x.nombre]={...x,fuente:"reserva"};});
      setClientes(Object.values(map));
    });
  },[]);

  useEffect(()=>{
    if(!form.fecha)return;
    Promise.all([
      supabase.from("citas").select("hora,duracion").eq("fecha",form.fecha).neq("estado","cancelada"),
      supabase.from("reservas_publicas").select("hora,servicio").eq("fecha",form.fecha).eq("estado","confirmada")
    ]).then(([{data:c},{data:r}])=>{
      const duracionServicio={};
      servicios.forEach(s=>{duracionServicio[s.nombre]=s.duracion;});
      const items=[
        ...(c||[]).map(x=>({hora:x.hora,duracion:x.duracion||60})),
        ...(r||[]).map(x=>({hora:x.hora,duracion:duracionServicio[x.servicio]||60})),
      ];
      setBloqueos(items.map(x=>{
        const inicio=minutosDesde(x.hora);
        return {inicio,fin:inicio+x.duracion};
      }));
    });
  },[form.fecha, servicios]);

  function seleccionarCliente(nombre){
    setForm(f=>({...f,cliente:nombre}));
    const found=clientes.find(c=>c.nombre===nombre);
    if(found){setClienteInfo(found);setEsNuevo(false);}
    else if(nombre){setClienteInfo(null);setEsNuevo(true);}
    else{setClienteInfo(null);setEsNuevo(false);}
  }

  function seleccionarServicio(val){
    const s=servicios.find(sv=>sv.nombre===val);
    if(s)setForm(f=>({...f,servicio:s.nombre,duracion:s.duracion,precio:s.precio}));
    else setForm(f=>({...f,servicio:val}));
  }

  async function guardar(){
    if(!form.cliente||!form.servicio||!form.hora){alert("Cliente, servicio y hora son obligatorios");return;}
    setCargando(true);
    if(esNuevo&&!clientes.find(c=>c.nombre===form.cliente)){
      await supabase.from("clientes").insert([{nombre:form.cliente,...nuevoCliente}]);
    }
    const {error}=await supabase.from("citas").insert([form]);
    setCargando(false);
    if(!error){onGuardada();onClose();}
    else alert("Error: "+error.message);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Nueva cita</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Cliente *</label>
            <input list="lista-clientes" placeholder="Busca o escribe nombre" value={form.cliente}
              onChange={e=>seleccionarCliente(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
            <datalist id="lista-clientes">{clientes.map(c=><option key={c.nombre} value={c.nombre}/>)}</datalist>
          </div>
          {clienteInfo && (
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100 space-y-1">
              <p className="text-xs font-semibold text-rose-600">{clienteInfo.fuente==="reserva"?"📋 Desde reserva en línea":"👤 Cliente registrado"}</p>
              {clienteInfo.telefono&&<p className="text-xs text-gray-600 flex items-center gap-1"><Phone size={11}/>{clienteInfo.telefono}</p>}
              {clienteInfo.alergias&&clienteInfo.alergias!=="Ninguna"&&<p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11}/>Alergias: {clienteInfo.alergias}</p>}
              {clienteInfo.notas&&<p className="text-xs text-gray-400 italic">"{clienteInfo.notas}"</p>}
            </div>
          )}
          {esNuevo && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-3">
              <p className="text-xs font-semibold text-blue-600">✨ Cliente nuevo — se guardará automáticamente</p>
              {[["telefono","Teléfono","0987654321"],["email","Email","cliente@email.com"],["alergias","Alergias","Ninguna"]].map(([k,l,p])=>(
                <div key={k}>
                  <label className="text-xs font-medium text-gray-500 block mb-1">{l}</label>
                  <input placeholder={p} value={nuevoCliente[k]} onChange={e=>setNuevoCliente({...nuevoCliente,[k]:e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"/>
                </div>
              ))}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Servicio *</label>
            <select value={form.servicio} onChange={e=>seleccionarServicio(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
              <option value="">Selecciona un servicio</option>
              {servicios.map(s=><option key={s.id} value={s.nombre}>{s.nombre} — {s.duracion}min — ${s.precio}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Profesional</label>
            <input placeholder="Nombre del profesional" value={form.profesional}
              onChange={e=>setForm({...form,profesional:e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Fecha</label>
            <input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value,hora:""})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">
              Hora * {form.hora&&<span className="text-rose-500 font-semibold">→ {form.hora}</span>}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {HORAS.map(h=>{
                const inicio = minutosDesde(h);
                const fin = inicio + (form.duracion || 60);
                const ahora = new Date();
                const esHoy = form.fecha === ahora.toLocaleDateString("en-CA");
                const yaPaso = esHoy && inicio <= (ahora.getHours()*60 + ahora.getMinutes());
                const ocupada = yaPaso || fin > minutosDesde("19:00") || bloqueos.some(b => inicio < b.fin && fin > b.inicio);
                return <button key={h} type="button" disabled={ocupada} onClick={()=>setForm({...form,hora:h})}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${ocupada?"bg-red-50 text-red-300 cursor-not-allowed line-through":form.hora===h?"bg-rose-500 text-white":"bg-gray-50 text-gray-700 hover:bg-rose-50 hover:text-rose-600"}`}>
                  {h}
                </button>;
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Precio ($)</label>
              <input type="number" value={form.precio} onChange={e=>setForm({...form,precio:Number(e.target.value)})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Estado</label>
              <select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
                <option value="confirmada">Confirmada</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">Cancelar</button>
          <button onClick={guardar} disabled={cargando}
            className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
            {cargando?"Guardando...":"Guardar cita"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Agenda() {
  const [modal, setModal] = useState(false);
  const [citaCobro, setCitaCobro] = useState(null);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [paginaSemana, setPaginaSemana] = useState(0);
  const hoy = new Date().toLocaleDateString("en-CA");
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy);

  function generarSemana(offset) {
    const dias=[];
    const base=new Date();
    base.setDate(base.getDate()+offset*7);
    const lunes=new Date(base);
    lunes.setDate(base.getDate()-((base.getDay()+6)%7));
    for(let i=0;i<6;i++){
      const d=new Date(lunes);
      d.setDate(lunes.getDate()+i);
      dias.push({fecha:d.toLocaleDateString("en-CA"),label:d.toLocaleDateString("es-EC",{weekday:"short",day:"numeric"})});
    }
    return dias;
  }

  const diasSemana = generarSemana(paginaSemana);

  async function cargarCitas() {
    setCargando(true);
    const {data}=await supabase.from("citas").select("*").eq("fecha",diaSeleccionado).order("hora");
    setCitas(data||[]);
    setCargando(false);
  }

  useEffect(()=>{cargarCitas();},[diaSeleccionado]);

  const citasActivas = citas.filter(c=>c.estado!=="cancelada");
  const citasCanceladas = citas.filter(c=>c.estado==="cancelada");

  return (
    <div className="p-6 space-y-5">
      {modal && <NuevaCitaModal onClose={()=>setModal(false)} onGuardada={cargarCitas} fechaInicial={diaSeleccionado}/>}
      {citaCobro && <RegistrarCobroModal cita={citaCobro} onClose={()=>setCitaCobro(null)} onGuardado={cargarCitas}/>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-400 mt-0.5">{diaSeleccionado?formatearFecha(diaSeleccionado):""}</p>
        </div>
        <button onClick={()=>setModal(true)}
          className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
          <Plus size={16}/> Nueva cita
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={()=>setPaginaSemana(p=>p-1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16} className="text-gray-500"/></button>
          <span className="text-xs font-medium text-gray-500">
            {paginaSemana===0?"Semana actual":paginaSemana>0?`+${paginaSemana} semana${paginaSemana>1?"s":""}`:`${Math.abs(paginaSemana)} semana${Math.abs(paginaSemana)>1?"s":""} atrás`}
          </span>
          <button onClick={()=>setPaginaSemana(p=>p+1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={16} className="text-gray-500"/></button>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {diasSemana.map(d=>(
            <button key={d.fecha} onClick={()=>setDiaSeleccionado(d.fecha)}
              className={`flex flex-col items-center py-2 rounded-lg transition-colors text-xs font-medium ${diaSeleccionado===d.fecha?"bg-rose-500 text-white":d.fecha===hoy?"bg-rose-50 text-rose-600 border border-rose-200":"hover:bg-gray-50 text-gray-600"}`}>
              {d.label.split(" ").map((p,i)=><span key={i} className={i===1?"text-base font-bold mt-0.5":""}>{p}</span>)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-medium text-gray-900 text-sm mb-4">
          {cargando?"Cargando...":`${citasActivas.length} cita${citasActivas.length!==1?"s":""} este día`}
        </h2>
        {!cargando&&citasActivas.length===0?(
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No hay citas agendadas</p>
            <button onClick={()=>setModal(true)} className="mt-3 text-rose-500 text-sm hover:underline">+ Agregar cita</button>
          </div>
        ):(
          <div className="space-y-3">
            {citasActivas.map(c=>(
              <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-rose-50 transition-colors">
                <div className="flex-shrink-0 text-center w-14">
                  <p className="text-sm font-semibold text-rose-500">{c.hora}</p>
                  <p className="text-xs text-gray-400">{c.duracion}min</p>
                </div>
                <div className="w-px h-10 bg-gray-200"/>
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-xs font-semibold text-rose-600 flex-shrink-0">
                  {c.cliente?.slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{c.cliente}</p>
                  <p className="text-xs text-gray-400">{c.servicio} · {c.profesional||"Sin asignar"}</p>
                </div>
                <EstadoBadge estado={c.estado}/>
                <p className="text-sm font-semibold text-gray-800 flex-shrink-0">${c.precio}</p>
                {c.estado!=="cobrada"&&c.estado!=="cancelada"&&(
                  <button onClick={()=>setCitaCobro(c)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors flex-shrink-0">
                    <CheckCircle size={13}/> Cobrar
                  </button>
                )}
                {c.estado==="cobrada"&&(
                  <span className="text-xs text-blue-500 font-medium flex-shrink-0 flex items-center gap-1">
                    <CheckCircle size={13}/> Cobrada
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {citasCanceladas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-medium text-gray-400 text-xs mb-3">
            {citasCanceladas.length} cita{citasCanceladas.length!==1?"s":""} cancelada{citasCanceladas.length!==1?"s":""}
          </h2>
          <div className="space-y-2">
            {citasCanceladas.map(c=>(
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 opacity-60">
                <div className="flex-shrink-0 text-center w-14">
                  <p className="text-sm font-medium text-gray-400 line-through">{c.hora}</p>
                </div>
                <div className="w-px h-8 bg-gray-200"/>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 flex-shrink-0">
                  {c.cliente?.slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 line-through">{c.cliente}</p>
                  <p className="text-xs text-gray-400">{c.servicio}</p>
                </div>
                <EstadoBadge estado={c.estado}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}