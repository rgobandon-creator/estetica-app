export const clientes = [
  { id: 1, nombre: "María Torres", telefono: "0987654321", email: "maria@gmail.com", servicios: 12, ultimaVisita: "2024-06-10", gasto: 340, alergias: "Ninguna", notas: "Prefiere tinte sin amoniaco" },
  { id: 2, nombre: "Ana Guzmán", telefono: "0912345678", email: "ana@gmail.com", servicios: 8, ultimaVisita: "2024-06-08", gasto: 210, alergias: "Látex", notas: "Cliente VIP" },
  { id: 3, nombre: "Lucía Pérez", telefono: "0998765432", email: "lucia@gmail.com", servicios: 5, ultimaVisita: "2024-05-30", gasto: 150, alergias: "Ninguna", notas: "" },
  { id: 4, nombre: "Carmen Ruiz", telefono: "0976543210", email: "carmen@gmail.com", servicios: 20, ultimaVisita: "2024-06-11", gasto: 580, alergias: "Ninguna", notas: "Cumpleaños 15 de julio" },
  { id: 5, nombre: "Sofía Mendez", telefono: "0965432109", email: "sofia@gmail.com", servicios: 3, ultimaVisita: "2024-05-20", gasto: 90, alergias: "Sulfatos", notas: "Primera vez con color" },
];

export const citas = [
  { id: 1, clienteId: 1, cliente: "María Torres", servicio: "Tinte + corte", profesional: "Valeria", fecha: "2024-06-12", hora: "09:00", duracion: 120, precio: 45, estado: "confirmada" },
  { id: 2, clienteId: 2, cliente: "Ana Guzmán", servicio: "Manicure gel", profesional: "Daniela", fecha: "2024-06-12", hora: "10:30", duracion: 60, precio: 18, estado: "confirmada" },
  { id: 3, clienteId: 3, cliente: "Lucía Pérez", servicio: "Tratamiento capilar", profesional: "Valeria", fecha: "2024-06-12", hora: "14:00", duracion: 90, precio: 35, estado: "pendiente" },
  { id: 4, clienteId: 4, cliente: "Carmen Ruiz", servicio: "Peinado evento", profesional: "Valeria", fecha: "2024-06-13", hora: "08:00", duracion: 60, precio: 30, estado: "confirmada" },
  { id: 5, clienteId: 5, cliente: "Sofía Mendez", servicio: "Corte + peinado", profesional: "Daniela", fecha: "2024-06-13", hora: "11:00", duracion: 75, precio: 25, estado: "pendiente" },
  { id: 6, clienteId: 1, cliente: "María Torres", servicio: "Depilación", profesional: "Daniela", fecha: "2024-06-14", hora: "15:00", duracion: 45, precio: 20, estado: "confirmada" },
];

export const pagos = [
  { id: 1, cliente: "María Torres", servicio: "Tinte + corte", monto: 45, metodo: "Efectivo", fecha: "2024-06-10", estado: "pagado" },
  { id: 2, cliente: "Ana Guzmán", servicio: "Manicure gel", monto: 18, metodo: "Transferencia", fecha: "2024-06-10", estado: "pagado" },
  { id: 3, cliente: "Carmen Ruiz", servicio: "Peinado evento", monto: 30, metodo: "Tarjeta", fecha: "2024-06-09", estado: "pagado" },
  { id: 4, cliente: "Lucía Pérez", servicio: "Tratamiento capilar", monto: 35, metodo: "Efectivo", fecha: "2024-06-08", estado: "pendiente" },
  { id: 5, cliente: "Sofía Mendez", servicio: "Corte + peinado", monto: 25, metodo: "Transferencia", fecha: "2024-06-07", estado: "pagado" },
];

export const servicios = [
  { id: 1, nombre: "Corte de cabello", duracion: 45, precio: 15, categoria: "Cabello" },
  { id: 2, nombre: "Tinte completo", duracion: 120, precio: 40, categoria: "Cabello" },
  { id: 3, nombre: "Manicure clásico", duracion: 45, precio: 12, categoria: "Uñas" },
  { id: 4, nombre: "Manicure gel", duracion: 60, precio: 18, categoria: "Uñas" },
  { id: 5, nombre: "Tratamiento capilar", duracion: 90, precio: 35, categoria: "Cabello" },
  { id: 6, nombre: "Peinado evento", duracion: 60, precio: 30, categoria: "Cabello" },
  { id: 7, nombre: "Depilación facial", duracion: 30, precio: 12, categoria: "Depilación" },
  { id: 8, nombre: "Masaje relajante", duracion: 60, precio: 30, categoria: "Spa" },
];

export const profesionales = [
  { id: 1, nombre: "Valeria Suárez", especialidad: "Colorimetría y cortes", citas: 48, ingresos: 1240 },
  { id: 2, nombre: "Daniela Mora", especialidad: "Uñas y manicure", citas: 62, ingresos: 980 },
];
