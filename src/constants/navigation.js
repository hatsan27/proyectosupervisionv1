import {
  LayoutDashboard,
  Megaphone,
  ClipboardList,
  FolderOpen,
  FileSpreadsheet,
} from 'lucide-react';
import { ROLES } from './roles';

const TODOS = [ROLES.SUPERVISORA, ROLES.ADMINISTRATIVA, ROLES.DIRECTORA];

// Opciones del menú lateral. "pronto" marca los módulos de actividades posteriores.
// Clave de pantalla según el inventario del Anexo 3.
export const NAV_ITEMS = [
  { to: '/panel', label: 'Panel principal', icon: LayoutDashboard, roles: TODOS, clave: 'P-02' },
  { to: '/avisos', label: 'Avisos', icon: Megaphone, roles: TODOS, clave: 'P-03' },
  { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList, roles: TODOS, clave: 'P-05', pronto: 9 },
  { to: '/formatos', label: 'Banco de formatos', icon: FolderOpen, roles: TODOS, clave: 'P-08', pronto: 10 },
  { to: '/formularios', label: 'Formularios', icon: FileSpreadsheet, roles: TODOS, clave: 'P-09', pronto: 11 },
];

export const navParaRol = (rol) => NAV_ITEMS.filter((item) => item.roles.includes(rol));

// Descripción de los módulos pendientes (para la pantalla "Próximamente").
export const MODULOS_PENDIENTES = {
  solicitudes: {
    titulo: 'Solicitudes y evidencias',
    actividad: 9,
    descripcion:
      'Creación de solicitudes con fecha límite y recepción de archivos, con estados de pendiente, entregado, corrección y aceptado.',
  },
  formatos: {
    titulo: 'Banco de formatos',
    actividad: 10,
    descripcion: 'Organización, carga y descarga de los formatos vigentes de la zona escolar.',
  },
  formularios: {
    titulo: 'Formularios',
    actividad: 11,
    descripcion:
      'Constructor de formularios con campos de texto, número, fecha, opciones y tablas; sus concentrados se exportarán en la actividad 12.',
  },
};
