import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, CreditCard,
  Scissors, Settings, Sparkles, LogOut, CalendarCheck, UserCog, X
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Sidebar({ user, onLogout, open, onClose }) {
  const [pendientes, setPendientes] = useState(0);
  const [nombreSalon, setNombreSalon] = useState("GlowSuite");
  const emailCorto = user?.email?.split("@")[0] || "Usuario";
  const iniciales = emailCorto.slice(0, 2).toUpperCase();

  async function cargarNombre() {
    const { data } = await supabase.from("configuracion").select("valor").eq("clave","salon_config").single();
    if (data?.valor?.nombre) setNombreSalon(data.valor.nombre);
  }

  useEffect(() => {
    cargarNombre();

    // Escuchar evento cuando se guarda la configuración
    window.addEventListener("salon_config_updated", cargarNombre);

    async function contarPendientes() {
      try {
        const { count } = await supabase
          .from("reservas_publicas")
          .select("*", { count: "exact", head: true })
          .eq("estado", "pendiente");
        setPendientes(count || 0);
      } catch (e) { setPendientes(0); }
    }
    contarPendientes();
    const interval = setInterval(contarPendientes, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("salon_config_updated", cargarNombre);
    };
  }, []);

  const nav = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/agenda", icon: Calendar, label: "Agenda" },
    { to: "/reservas-admin", icon: CalendarCheck, label: "Reservas", badge: pendientes },
    { to: "/clientes", icon: Users, label: "Clientes" },
    { to: "/cobros", icon: CreditCard, label: "Cobros" },
    { to: "/servicios", icon: Scissors, label: "Servicios" },
    { to: "/profesionales", icon: UserCog, label: "Profesionales" },
  ];

  return (
    <>
      {/* Fondo oscuro al abrir el menú en móvil */}
      {open && (
        <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40 lg:hidden"/>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto lg:w-56`}>
        <div className="px-5 py-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{nombreSalon}</p>
              <p className="text-xs text-gray-400">Panel de gestión</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X size={20}/>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-rose-50 text-rose-600 font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}>
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-semibold">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-2">
          <NavLink to="/configuracion" onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
            <Settings size={18} />
            Configuración
          </NavLink>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-xs font-semibold text-rose-600 flex-shrink-0">
              {iniciales}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{emailCorto}</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
            <button onClick={onLogout}
              className="p-1 hover:bg-red-50 rounded-lg transition-colors group" title="Cerrar sesión">
              <LogOut size={15} className="text-gray-400 group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}