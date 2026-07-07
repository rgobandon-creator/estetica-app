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
  const [pagoPendienteId, setPagoPendienteId] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    supabase.from("pagos").select("id,monto").eq("cliente", cita.cliente).eq("servicio", cita.servicio)
      .eq("estado", "pendiente").limit(1).maybeSingle()
      .then(({ data }) => { if (data) { setPagoPendienteId(data.id); setMonto(data.monto); } });
  }, []);

  async function cobrar() {
    setCargando(true);
    if (pagoPendienteId) {
      await supabase.from("pagos").update({ monto: Number(monto), metodo, estado: "pagado" }).eq("id", pagoPendienteId);
    } else {
      await supabase.from("pagos").insert([{
        cliente: cita.cliente, servicio: cita.servicio,
        monto: Number(monto), metodo, estado: "pagado"
      }]);
    }
    await supabase.from("citas").update({ estado: "cobrada" }).eq("id", cita.id);
    setCargando(false);
    onGuardado();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e=>e.stopPropagation()}>
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
            {pagoPendienteId && <p className="text-xs text-amber-600 mt-1">Saldo pendiente tras el abono ya pagado</p>}
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

function NuevaCitaModal({ onClose, onGuardada, fechaInicial, citaEditar }) {
  const [servicios, setServicios] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [clienteInfo, setClienteInfo] = useState(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ telefono:"", email:"", alergias:"Ninguna" });
  const [form, setForm] = useState(citaEditar ? {...citaEditar, cedula: citaEditar.cedula||"", profesional: citaEditar.profesional||""} : { cliente:"", cedula:"", servicio:"", profesional:"", fecha: fechaInicial||new Date().toLocaleDateString("en-CA"), hora:"", duracion:60, precio:0, estado:"confirmada" });
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [cargando, setCargando] = useState(false);
  const esEdicion = !!citaEditar?.id;

  const HORAS = [];
  for (let h=8;h<19;h++){HORAS.push(`${String(h).padStart(2,"0")}:00`);HORAS.push(`${String(h).padStart(2,"0")}:30`);}

  useEffect(() => {
    supabase.from("servicios").select("*").order("nombre").then(({data})=>setServicios(data||[]));
    supabase.from("profesionales").select("*").eq("activo",true).order("nombre").then(({data})=>setProfesionales(data||[]));
    Promise.all([
      supabase.from("clientes").select("nombre,cedula,telefono,email,alergias,notas").order("nombre"),
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
      supabase.from("citas").select("hora,duracion,profesional").eq("fecha",form.fecha).neq("estado","cancelada"),
      supabase.from("reservas_publicas").select("hora,servicio,profesional").eq("fecha",form.fecha).eq("estado","confirmada")
    ]).then(([{data:c},{data:r}])=>{
      const duracionServicio={};
      servicios.forEach(s=>{duracionServicio[s.nombre]=s.duracion;});
      const items=[
        ...(c||[]).map(x=>({hora:x.hora,duracion:x.duracion||60,profesional:x.profesional})),
        ...(r||[]).map(x=>({hora:x.hora,duracion:duracionServicio[x.servicio]||60,profesional:x.profesional})),
      ].filter(x =>
        // Sin profesional seleccionado en el formulario: se considera todo (bloqueo global, comportamiento anterior)
        // Con profesional seleccionado: solo bloquea lo de ESE profesional, o lo que no tiene profesional asignado aún
        !form.profesional || !x.profesional || x.profesional === form.profesional
      );
      setBloqueos(items.map(x=>{
        const inicio=minutosDesde(x.hora);
        return {inicio,fin:inicio+x.duracion};
      }));
    });
  },[form.fecha, servicios, form.profesional]);

  function seleccionarCliente(nombre){
    setForm(f=>({...f,cliente:nombre}));
    const found=clientes.find(c=>c.nombre===nombre);
    if(found){setClienteInfo(found);setEsNuevo(false);setForm(f=>({...f,cliente:nombre,cedula:found.cedula||""}));}
    else if(nombre){setClienteInfo(null);setEsNuevo(true);}
    else{setClienteInfo(null);setEsNuevo(false);}
  }

  function buscarPorCedula(cedula){
    setForm(f=>({...f,cedula}));
    if(cedula.length!==10)return;
    const found=clientes.find(c=>c.cedula===cedula);
    if(found){
      setForm(f=>({...f,cliente:found.nombre,cedula}));
      setClienteInfo(found);setEsNuevo(false);
    }
  }

  function seleccionarServicio(val){
    const s=servicios.find(sv=>sv.nombre===val);
    if(s){setForm(f=>({...f,servicio:s.nombre,duracion:s.duracion,precio:s.precio}));setMontoRecibido(s.precio);}
    else setForm(f=>({...f,servicio:val}));
  }

  async function guardar(){
    if(!form.cliente||!form.servicio||!form.hora||!form.cedula){alert("Cliente, cédula, servicio y hora son obligatorios");return;}
    if(!validarCedulaEcuador(form.cedula)){alert("La cédula ingresada no es válida");return;}
    setCargando(true);

    if(esEdicion){
      const {error}=await supabase.from("citas").update({
        cliente:form.cliente, cedula:form.cedula, servicio:form.servicio, profesional:form.profesional,
        fecha:form.fecha, hora:form.hora, duracion:form.duracion, precio:form.precio, estado:form.estado,
      }).eq("id", citaEditar.id);
      setCargando(false);
      if(!error){onGuardada();onClose();}
      else alert("Error: "+error.message);
      return;
    }

    // Buscar cliente existente por cédula (identificador real) antes de crear uno nuevo
    const { data: clienteExistente } = await supabase.from("clientes").select("*").eq("cedula", form.cedula).maybeSingle();
    if (clienteExistente) {
      form.cliente = clienteExistente.nombre; // usamos el nombre ya registrado, evita duplicados por variaciones de escritura
    } else if (esNuevo) {
      await supabase.from("clientes").insert([{nombre:form.cliente, cedula:form.cedula, ...nuevoCliente}]);
    }

    const {data:citaNueva,error}=await supabase.from("citas").insert([form]).select().single();

    if(!error && citaNueva){
      const precio = Number(form.precio)||0;
      const recibido = Math.min(Number(montoRecibido)||0, precio);

      if(recibido > 0){
        await supabase.from("pagos").insert([{
          cliente: form.cliente, servicio: form.servicio, cita_id: citaNueva.id,
          monto: recibido, metodo: "Efectivo", estado: "pagado",
        }]);
      }
      if(precio - recibido > 0){
        await supabase.from("pagos").insert([{
          cliente: form.cliente, servicio: form.servicio, cita_id: citaNueva.id,
          monto: precio - recibido, metodo: "Efectivo", estado: "pendiente",
        }]);
      }
    }

    setCargando(false);
    if(!error){onGuardada();onClose();}
    else alert("Error: "+error.message);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{esEdicion ? "Editar cita" : "Nueva cita"}</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Cédula *</label>
            <input placeholder="10 dígitos" value={form.cedula} inputMode="numeric" maxLength={10}
              onChange={e=>buscarPorCedula(e.target.value.replace(/\D/g,""))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
            {(form.cedula||"").length===10 && !validarCedulaEcuador(form.cedula) && (
              <p className="text-xs text-red-500 mt-1">Cédula no válida</p>
            )}
          </div>
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
            <select value={form.profesional} onChange={e=>setForm({...form,profesional:e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
              <option value="">Por asignar</option>
              {profesionales
                .filter(p => !form.servicio || (p.servicios||[]).includes(form.servicio))
                .map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
            </select>
            {form.servicio && profesionales.filter(p => (p.servicios||[]).includes(form.servicio)).length === 0 && (
              <p className="text-xs text-amber-500 mt-1">Nadie tiene asignado este servicio todavía (revisa Profesionales)</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Otro profesional (si no aparece en la lista)</label>
            <input placeholder="Escribe un nombre" value={profesionales.some(p=>p.nombre===form.profesional) || !form.profesional ? "" : form.profesional}
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
              <input type="number" value={form.precio} onChange={e=>{const p=Number(e.target.value);setForm({...form,precio:p});setMontoRecibido(p);}}
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
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Monto recibido ahora ($)</label>
            <input type="number" value={montoRecibido} onChange={e=>setMontoRecibido(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"/>
            <p className="text-xs text-gray-400 mt-1">
              {Number(montoRecibido) >= Number(form.precio) && Number(form.precio) > 0
                ? "Se registrará como pago completo"
                : Number(montoRecibido) > 0
                  ? `Se registrará $${Number(montoRecibido).toFixed(2)} pagado y $${(Number(form.precio)-Number(montoRecibido)).toFixed(2)} pendiente`
                  : "Se registrará todo el servicio como pendiente de cobro"}
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600">Cancelar</button>
          <button onClick={guardar} disabled={cargando}
            className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
            {cargando?"Guardando...":esEdicion?"Guardar cambios":"Crear cita"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Agenda({ soloProfesional }) {
  const [modal, setModal] = useState(false);
  const [citaEditando, setCitaEditando] = useState(null);
  const [citaCobro, setCitaCobro] = useState(null);
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [paginaSemana, setPaginaSemana] = useState(0);
  const hoy = new Date().toLocaleDateString("en-CA");
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy);
  const [vista, setVista] = useState("semana"); // "semana" | "mes"
  const [mesActual, setMesActual] = useState(() => { const d = new Date(); return { anio: d.getFullYear(), mes: d.getMonth() }; });
  const [conteoMes, setConteoMes] = useState({});

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

  function generarMes(anio, mes) {
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const inicioOffset = (primerDia.getDay() + 6) % 7; // lunes=0
    const celdas = [];
    for (let i = 0; i < inicioOffset; i++) celdas.push(null);
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const f = new Date(anio, mes, dia);
      celdas.push({ fecha: f.toLocaleDateString("en-CA"), numero: dia });
    }
    return celdas;
  }

  const celdasMes = generarMes(mesActual.anio, mesActual.mes);

  async function cargarConteoMes() {
    const inicio = new Date(mesActual.anio, mesActual.mes, 1).toLocaleDateString("en-CA");
    const fin = new Date(mesActual.anio, mesActual.mes + 1, 0).toLocaleDateString("en-CA");
    let query = supabase.from("citas").select("fecha").neq("estado","cancelada").gte("fecha",inicio).lte("fecha",fin);
    if (soloProfesional) query = query.eq("profesional", soloProfesional);
    const { data } = await query;
    const conteo = {};
    (data||[]).forEach(c => { conteo[c.fecha] = (conteo[c.fecha]||0) + 1; });
    setConteoMes(conteo);
  }

  useEffect(() => { if (vista === "mes") cargarConteoMes(); }, [vista, mesActual, soloProfesional]);

  async function cargarCitas() {
    setCargando(true);
    let query = supabase.from("citas").select("*").eq("fecha",diaSeleccionado).order("hora");
    if (soloProfesional) query = query.eq("profesional", soloProfesional);
    const {data}=await query;
    setCitas(data||[]);
    setCargando(false);
  }

  useEffect(()=>{cargarCitas();},[diaSeleccionado, soloProfesional]);

  const citasActivas = citas.filter(c=>c.estado!=="cancelada");
  const citasCanceladas = citas.filter(c=>c.estado==="cancelada");

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {(modal || citaEditando) && (
        <NuevaCitaModal
          onClose={()=>{setModal(false);setCitaEditando(null);}}
          onGuardada={cargarCitas}
          fechaInicial={diaSeleccionado}
          citaEditar={citaEditando}
        />
      )}
      {citaCobro && <RegistrarCobroModal cita={citaCobro} onClose={()=>setCitaCobro(null)} onGuardado={cargarCitas}/>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-400 mt-0.5">{diaSeleccionado?formatearFecha(diaSeleccionado):""}</p>
        </div>
        {!soloProfesional && (
          <button onClick={()=>setModal(true)}
            className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
            <Plus size={16}/> Nueva cita
          </button>
        )}
      </div>

      <div className="flex justify-end">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={()=>setVista("semana")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${vista==="semana"?"bg-white text-rose-600 shadow-sm":"text-gray-500"}`}>Semana</button>
          <button onClick={()=>setVista("mes")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${vista==="mes"?"bg-white text-rose-600 shadow-sm":"text-gray-500"}`}>Mes</button>
        </div>
      </div>

      {vista === "semana" ? (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={()=>setPaginaSemana(p=>p-1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16} className="text-gray-500"/></button>
            <span className="text-xs font-medium text-gray-500">
              {paginaSemana===0?"Semana actual":paginaSemana>0?`+${paginaSemana} semana${paginaSemana>1?"s":""}`:`${Math.abs(paginaSemana)} semana${Math.abs(paginaSemana)>1?"s":""} atrás`}
            </span>
            <button onClick={()=>setPaginaSemana(p=>p+1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={16} className="text-gray-500"/></button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:grid sm:grid-cols-6 sm:overflow-visible">
            {diasSemana.map(d=>(
              <button key={d.fecha} onClick={()=>setDiaSeleccionado(d.fecha)}
                className={`flex-shrink-0 w-14 sm:w-auto flex flex-col items-center py-2 rounded-lg transition-colors text-xs font-medium ${diaSeleccionado===d.fecha?"bg-rose-500 text-white":d.fecha===hoy?"bg-rose-50 text-rose-600 border border-rose-200":"hover:bg-gray-50 text-gray-600"}`}>
                {d.label.split(" ").map((p,i)=><span key={i} className={i===1?"text-base font-bold mt-0.5":""}>{p}</span>)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={()=>setMesActual(m=>{const d=new Date(m.anio,m.mes-1,1);return{anio:d.getFullYear(),mes:d.getMonth()};})}
              className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16} className="text-gray-500"/></button>
            <span className="text-sm font-medium text-gray-700 capitalize">
              {new Date(mesActual.anio,mesActual.mes,1).toLocaleDateString("es-EC",{month:"long",year:"numeric"})}
            </span>
            <button onClick={()=>setMesActual(m=>{const d=new Date(m.anio,m.mes+1,1);return{anio:d.getFullYear(),mes:d.getMonth()};})}
              className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={16} className="text-gray-500"/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-400 mb-1">
            {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d=><div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celdasMes.map((c,i)=> c===null ? <div key={"vacio"+i}/> : (
              <button key={c.fecha} onClick={()=>{setDiaSeleccionado(c.fecha);setVista("semana");}}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs sm:text-sm transition-colors
                  ${diaSeleccionado===c.fecha?"bg-rose-500 text-white font-semibold":c.fecha===hoy?"bg-rose-50 text-rose-600 border border-rose-200 font-medium":"hover:bg-gray-50 text-gray-600"}`}>
                {c.numero}
                {conteoMes[c.fecha] > 0 && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${diaSeleccionado===c.fecha?"bg-white":"bg-rose-400"}`}/>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">🔴 Días con citas · Toca un día para ver el detalle</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-medium text-gray-900 text-sm mb-4">
          {cargando?"Cargando...":`${citasActivas.length} cita${citasActivas.length!==1?"s":""} este día`}
        </h2>
        {!cargando&&citasActivas.length===0?(
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No hay citas agendadas</p>
            {!soloProfesional && <button onClick={()=>setModal(true)} className="mt-3 text-rose-500 text-sm hover:underline">+ Agregar cita</button>}
          </div>
        ):(
          <div className="space-y-3">
            {citasActivas.map(c=>(
              <div key={c.id} onClick={()=>{if(!soloProfesional)setCitaEditando(c);}}
                className={`flex flex-wrap items-center gap-3 sm:gap-4 p-4 rounded-xl bg-gray-50 hover:bg-rose-50 transition-colors ${soloProfesional?"":"cursor-pointer"}`}>
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-center w-12 sm:w-14">
                    <p className="text-sm font-semibold text-rose-500">{c.hora}</p>
                    <p className="text-xs text-gray-400">{c.duracion}min</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200 hidden sm:block"/>
                  <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-xs font-semibold text-rose-600 flex-shrink-0">
                    {c.cliente?.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.cliente}</p>
                    <p className="text-xs text-gray-400 truncate">{c.servicio} · {c.profesional||"Sin asignar"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-[3.75rem] sm:ml-0">
                  <EstadoBadge estado={c.estado}/>
                  <p className="text-sm font-semibold text-gray-800 flex-shrink-0">${c.precio}</p>
                  {c.estado!=="cobrada"&&c.estado!=="cancelada"&&(
                    <button onClick={(e)=>{e.stopPropagation();setCitaCobro(c);}}
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