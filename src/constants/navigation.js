import {
  LayoutDashboard,
  Megaphone,
  ClipboardList,
  FolderOpen,
  FileSpreadsheet,
} from 'lucide-react';
import { ROLES } from './roles';

const TODOS = [ROLES.SUPERVISORA, ROLES.ADMINISTRATIVA, ROLES.DIRECTORA];

// Opciones del menú lateral.
// Clave de pantalla según el inventario del Anexo 3.
export const NAV_ITEMS = [
  { to: '/panel', label: 'Panel principal', icon: LayoutDashboard, roles: TODOS, clave: 'P-02' },
  { to: '/avisos', label: 'Avisos', icon: Megaphone, roles: TODOS, clave: 'P-03' },
  { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardList, roles: TODOS, clave: 'P-05' },
  { to: '/formatos', label: 'Banco de formatos', icon: FolderOpen, roles: TODOS, clave: 'P-08' },
  { to: '/formularios', label: 'Formularios', icon: FileSpreadsheet, roles: TODOS, clave: 'P-09' },
];

export const navParaRol = (rol) => NAV_ITEMS.filter((item) => item.roles.includes(rol));

