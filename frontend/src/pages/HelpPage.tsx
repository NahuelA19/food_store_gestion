/**
 * HelpPage — FAQ, quick guide, and support info
 */

import { useState } from "react";
import { Icon } from "../components/ui/Icon";
import { Card, CardContent } from "../components/ui/Card";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MessageSquare,
  BookOpen,
  ShoppingCart,
  Package,
  Building2,
  Users,
  Settings,
  BarChart3,
} from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "¿Cómo creo un pedido nuevo?",
    a: "Desde la sección 'Productos', agregá ítems al carrito y luego confirmá el pedido desde la sección 'Carrito'. Podés elegir la sucursal y el método de pago.",
  },
  {
    q: "¿Cómo cambio el estado de un pedido?",
    a: "Ingresá al detalle del pedido desde la sección 'Pedidos', hacé clic en el botón de cambio de estado y seleccioná el nuevo estado. Los cambios quedan registrados en el historial.",
  },
  {
    q: "¿Cómo agrego un producto nuevo?",
    a: "Desde el menú lateral, navegá a 'Nuevo Producto' (requiere rol Admin). Completá el nombre, precio, categoría e imagen. El stock se gestiona por separado desde el detalle del producto.",
  },
  {
    q: "¿Cómo gestiono el stock de un producto?",
    a: "Entrá al detalle del producto y en la sección 'Inventario' podés actualizar el stock total y definir el umbral de stock bajo. Al llegar al umbral, el sistema genera una alerta.",
  },
  {
    q: "¿Puedo subir imágenes de productos desde mi PC?",
    a: "Sí, en el formulario de producto podés subir una imagen local. También podés pegar una URL externa. El sistema es compatible con JPG, PNG y WebP.",
  },
  {
    q: "¿Qué pasa si elimino una categoría con productos?",
    a: "No podés eliminar una categoría que tiene productos activos. Primero debés mover o eliminar todos sus productos, y luego podrás eliminar la categoría.",
  },
  {
    q: "¿Cómo filtro pedidos por sucursal?",
    a: "En la sección 'Pedidos', si tenés rol Admin, aparece un selector de sucursal. Elegí la sucursal deseada para ver solo sus pedidos. También podés buscar por número de pedido o cliente.",
  },
  {
    q: "¿Cómo cambio entre modo claro y oscuro?",
    a: "Usá el ícono de sol/luna en la barra superior, o configuralo desde 'Configuración → Apariencia'. Podés elegir entre Claro, Oscuro, o Automático (según tu sistema operativo).",
  },
  {
    q: "¿Cómo agrego una sucursal nueva?",
    a: "Desde la sección 'Sucursales', hacé clic en 'Nueva sucursal' (requiere rol Admin). Completá el nombre, dirección, teléfono y horarios de atención.",
  },
  {
    q: "¿Cómo exporto los datos del dashboard?",
    a: "Por ahora el dashboard muestra estadísticas en tiempo real. La funcionalidad de exportación está en desarrollo. Por el momento podés capturar pantalla o copiar los datos manualmente.",
  },
];

const QUICK_GUIDE = [
  { icon: BarChart3, title: "Dashboard", desc: "Resumen general: ventas, pedidos recientes y estado de sucursales." },
  { icon: Package, title: "Productos", desc: "Listado completo, búsqueda con filtros y gestión de inventario." },
  { icon: ShoppingCart, title: "Pedidos", desc: "Seguimiento de pedidos con filtros por estado, búsqueda y detalle." },
  { icon: Building2, title: "Sucursales", desc: "Gestión de sucursales: datos, estado y activación/desactivación." },
  { icon: Users, title: "Empleados / Clientes", desc: "Listado de usuarios con filtros por rol y estado de cuenta." },
  { icon: Settings, title: "Configuración", desc: "Ajustes de perfil, apariencia y preferencias de notificaciones." },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-alt/50"
      >
        <span className="text-sm font-semibold text-text-primary">{item.q}</span>
        <Icon
          icon={open ? ChevronUp : ChevronDown}
          size={16}
          className="shrink-0 text-text-muted transition-transform duration-200"
        />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export function HelpPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Icon icon={HelpCircle} size={28} className="text-brand-500" />
          <h1 className="font-display text-2xl font-bold text-text-primary">Centro de Ayuda</h1>
        </div>
        <p className="text-sm text-text-muted">
          Encontrá respuestas a las preguntas más frecuentes y una guía rápida del sistema.
        </p>
      </div>

      {/* Quick guide */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={BookOpen} size={18} className="text-brand-500" />
          <h2 className="text-base font-bold text-text-primary">Guía rápida del sistema</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_GUIDE.map(({ icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
                    <Icon icon={icon} size={18} className="text-brand-600 dark:text-brand-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{title}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={MessageSquare} size={18} className="text-brand-500" />
          <h2 className="text-base font-bold text-text-primary">Preguntas frecuentes</h2>
        </div>
        <Card>
          <CardContent className="p-0">
            {FAQ_ITEMS.map((item, i) => (
              <FAQAccordion key={i} item={item} />
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Contact / Support */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Icon icon={Phone} size={18} className="text-brand-500" />
          <h2 className="text-base font-bold text-text-primary">Soporte técnico</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Icon icon={Mail} size={18} className="text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Correo electrónico</p>
                <p className="text-xs text-text-muted mt-0.5">soporte@foodstore.com</p>
                <p className="text-xs text-text-muted">Respuesta en menos de 24 hs hábiles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <Icon icon={Phone} size={18} className="text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Teléfono</p>
                <p className="text-xs text-text-muted mt-0.5">+54 (011) 4000-1234</p>
                <p className="text-xs text-text-muted">Lun–Vie de 9 a 18 hs</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
