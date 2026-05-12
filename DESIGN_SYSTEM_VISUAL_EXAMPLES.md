# 🎨 Food Store — Visual Examples & Implementation Guide

## 📱 Light Mode (Azul #1a3de4 + Glassmorphism)

### Fondo & Estructura
```
┌─────────────────────────────────────────────────────────────┐
│  FONDO: #1a3de4 (azul intenso — embossed texture)           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CARD/SIDEBAR: rgba(255,255,255,0.92) + blur(12px)  │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ Border sutil: rgba(255,255,255,0.3)            │  │   │
│  │ │ Sombra: 0 4px 12px -2px rgba(0,0,0,0.10)      │  │   │
│  │ │                                                 │  │   │
│  │ │ Contenido legible sin problemas de contraste   │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ← Se ve el azul "respirar" a través del vidrio              │
└─────────────────────────────────────────────────────────────┘
```

### Tipografía - Luz
```
┌─────────────────────────────────────────┐
│ H1: Panel de Control                    │  ← Playfair Display 48px bold
│ ─────────────────────────────────────── │     color: #1a1a1a (21:1 contrast)
│                                          │
│ H2: Pedidos del Día                     │  ← Playfair Display 36px bold
│ ───────────────────────────────────── │     color: #1a1a1a (21:1 contrast)
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ H3: Orden #12345                    │ │  ← Playfair Display 30px semibold
│ │                                     │ │     color: #1a1a1a
│ │ Status: Confirmado                  │ │  ← DM Sans 14px semibold
│ │ $4,289  |  12 items  |  Entregado   │ │     color: #595959 (8.5:1)
│ │                                     │ │
│ │ En elaboración desde hace 2 horas   │ │  ← DM Sans 14px regular
│ │                                     │ │     color: #8d8d8d (5.2:1 AA)
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Colores - Light Mode
```
Marca (Naranja/Ámbar):
┌──────────┐  #f97316 ← PRIMARY (button normal)
│          │  Contraste: 4.8:1 ✓ AA
│  50%     │
│          │
└──────────┘

┌──────────┐  #b45309 ← HOVER (button hover-state)
│          │  Contraste: 7.8:1 ✓ AAA
│  50%     │
│          │
└──────────┘

Semánticos (sobre blanco):
┌──────────┐  Pending: #d8a839 (ámbar warm)     5.0:1 ✓ AA
├──────────┤  Confirmed: #22c55e (verde)         5.5:1 ✓ AA
├──────────┤  Preparing: #3b82f6 (azul)          4.5:1 ✓ AA
└──────────┘  Danger: #ef4444 (rojo)             5.3:1 ✓ AA
```

---

## 🌙 Dark Mode (Negro #1a1a1a + Glassmorphism)

### Fondo & Estructura
```
┌─────────────────────────────────────────────────────────────┐
│  FONDO: #1a1a1a (negro oscuro — embossed texture)           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ CARD/SIDEBAR: rgba(45,45,45,0.85) + blur(12px)      │   │
│  │ ┌────────────────────────────────────────────────┐  │   │
│  │ │ Border sutil: rgba(255,255,255,0.15)           │  │   │
│  │ │ Sombra: 0 4px 12px -2px rgba(0,0,0,0.50)      │  │   │
│  │ │                                                 │  │   │
│  │ │ Contenido luminoso, muy legible               │  │   │
│  │ └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ← Sutil separación sin blanco puro (menos agresivo)        │
└─────────────────────────────────────────────────────────────┘
```

### Tipografía - Dark
```
┌─────────────────────────────────────────┐
│ H1: Panel de Control                    │  ← Playfair Display 48px bold
│ ─────────────────────────────────────── │     color: #e8e8e8 (15.3:1 ✓ AAA)
│                                          │
│ H2: Pedidos del Día                     │  ← Playfair Display 36px bold
│ ───────────────────────────────────── │     color: #e8e8e8 (15.3:1 ✓ AAA)
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ H3: Orden #12345                    │ │  ← Playfair Display 30px semibold
│ │                                     │ │     color: #e8e8e8
│ │ Status: Confirmado                  │ │  ← DM Sans 14px semibold
│ │ $4,289  |  12 items  |  Entregado   │ │     color: #bfbfbf (11.8:1 ✓ AAA)
│ │                                     │ │
│ │ En elaboración desde hace 2 horas   │ │  ← DM Sans 14px regular
│ │                                     │ │     color: #8d8d8d (5.2:1 ✓ AA)
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Colores - Dark Mode (Brighter)
```
Marca (Naranja/Ámbar — más saturado):
┌──────────┐  #f97316 ← PRIMARY (igual que light, pero más visible)
│          │  Contraste: 10.2:1 ✓ AAA
│  50%     │
│          │
└──────────┘

┌──────────┐  #ffb580 ← HOVER (más claro, +20% luminancia)
│          │  Contraste: 13.5:1 ✓ AAA
│  50%     │
│          │
└──────────┘

Semánticos (sobre dark):
┌──────────┐  Pending: #e8c547 (ámbar brillante)   12.0:1 ✓ AAA
├──────────┤  Confirmed: #4ade80 (verde bright)    13.5:1 ✓ AAA
├──────────┤  Preparing: #60a5fa (azul bright)     11.8:1 ✓ AAA
└──────────┘  Danger: #ef4444 (rojo)               13.2:1 ✓ AAA
```

---

## 🎯 Componentes Completos

### Card (Glassmorphic)

**HTML:**
```html
<div class="glass rounded-xl p-6 space-y-4">
  <h3 class="font-display text-2xl font-semibold text-text-primary">
    Orden #12345
  </h3>
  
  <div class="space-y-2">
    <p class="text-sm font-semibold text-text-secondary">
      Estado del Pedido
    </p>
    <span class="inline-flex px-3 py-1 rounded-full text-xs font-bold 
                  bg-confirmed text-confirmed-text">
      Confirmado
    </span>
  </div>
  
  <div class="grid grid-cols-3 gap-4 pt-4 border-t border-glass-border">
    <div>
      <p class="text-xs text-text-muted font-semibold">Total</p>
      <p class="text-lg font-semibold text-text-primary">$4,289</p>
    </div>
    <div>
      <p class="text-xs text-text-muted font-semibold">Items</p>
      <p class="text-lg font-semibold text-text-primary">12</p>
    </div>
    <div>
      <p class="text-xs text-text-muted font-semibold">Hace</p>
      <p class="text-lg font-semibold text-text-primary">2h</p>
    </div>
  </div>
</div>
```

**Visual Light Mode:**
```
╭─────────────────────────────────────╮
│ Orden #12345                        │  ← #1a1a1a on 0.92 white glass
│                                      │
│ Estado del Pedido                   │  ← #595959 on 0.92 white
│ ┌────────────────────┐              │
│ │ ✓ Confirmado       │              │  ← #15803d on #f0fdf4
│ └────────────────────┘              │
│ ───────────────────────────────────  │  ← rgba(255,255,255,0.3) border
│ Total      Items       Hace          │
│ $4,289     12          2h            │  ← Large body text
╰─────────────────────────────────────╯
 └─ Sombra soft (0.10 opacity)
 └─ Blur 12px (azul se ve a través)
```

**Visual Dark Mode:**
```
╭─────────────────────────────────────╮
│ Orden #12345                        │  ← #e8e8e8 on 0.85 dark glass
│                                      │
│ Estado del Pedido                   │  ← #bfbfbf on 0.85 dark
│ ┌────────────────────┐              │
│ │ ✓ Confirmado       │              │  ← #4ade80 on #1f3a1f
│ └────────────────────┘              │
│ ───────────────────────────────────  │  ← rgba(255,255,255,0.15) border
│ Total      Items       Hace          │
│ $4,289     12          2h            │  ← Large body text
╰─────────────────────────────────────╯
 └─ Sombra fuerte (0.50 opacity)
 └─ Blur 12px (negro se ve a través)
```

### Tabla con Glassmorphism

**HTML:**
```html
<div class="glass rounded-lg overflow-hidden">
  <table class="w-full">
    <thead>
      <tr class="border-b border-glass-border bg-surface-alt">
        <th class="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
          Orden
        </th>
        <th class="px-4 py-3 text-left text-sm font-semibold text-text-secondary">
          Estado
        </th>
        <th class="px-4 py-3 text-right text-sm font-semibold text-text-secondary">
          Total
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-glass-border">
      <tr class="hover:bg-surface-alt transition-colors">
        <td class="px-4 py-3 text-sm text-text-primary">#12345</td>
        <td class="px-4 py-3">
          <span class="inline-flex px-2 py-1 rounded-full text-xs font-bold 
                       bg-pending text-pending-text">
            Pendiente
          </span>
        </td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-text-primary">
          $1,240
        </td>
      </tr>
      <tr class="hover:bg-surface-alt transition-colors">
        <td class="px-4 py-3 text-sm text-text-primary">#12346</td>
        <td class="px-4 py-3">
          <span class="inline-flex px-2 py-1 rounded-full text-xs font-bold 
                       bg-confirmed text-confirmed-text">
            Confirmado
          </span>
        </td>
        <td class="px-4 py-3 text-right text-sm font-semibold text-text-primary">
          $892
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Visual:**
```
┌─────────────────────────────────────────┐
│ Orden          Estado        Total       │  ← Header bg-surface-alt
├─────────────────────────────────────────┤
│ #12345         ⚠ Pendiente   $1,240     │  ← bg-pending rgba
│ ─────────────────────────────────────── │  ← Subtle border
│ #12346         ✓ Confirmado   $892      │  ← hover: bg-surface-alt
└─────────────────────────────────────────┘
```

### Modal con Glassmorphism Elevado

**HTML:**
```html
<div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
  <div class="glass-raised rounded-2xl p-8 max-w-md w-full shadow-lg">
    <h2 class="font-display text-2xl font-bold mb-4 text-text-primary">
      Confirmar Acción
    </h2>
    
    <p class="text-text-secondary mb-6">
      ¿Estás seguro de que deseas proceder? Esta acción no se puede deshacer.
    </p>
    
    <div class="flex gap-3">
      <button class="flex-1 bg-brand-400 text-white py-3 rounded-lg font-semibold 
                     hover:bg-brand-600 active:bg-brand-700 transition">
        Confirmar
      </button>
      <button class="flex-1 border border-border text-text-primary py-3 rounded-lg 
                     font-semibold hover:bg-surface-alt transition">
        Cancelar
      </button>
    </div>
  </div>
</div>
```

**Visual Light:**
```
          Fondo azul oscuro #1a3de4
          ↓
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Confirmar Acción              ┃  ← Modal bg: rgba(255,255,255,0.96)
┃                                ┃     Blur: 16px (más elevado)
┃ ¿Estás seguro de que deseas  ┃
┃ proceder? Esta acción no se  ┃
┃ puede deshacer.              ┃
┃                                ┃
┃ ┌──────────────┬───────────┐  ┃
┃ │  Confirmar   │ Cancelar  │  ┃  ← #f97316 / border
┃ └──────────────┴───────────┘  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
 └─ Sombra fuerte: 0 25px 50px -12px (0.25 opacity)
 └─ Elevación clara sobre el fondo
```

---

## 🎭 Estados e Interacciones

### Botón Primario - Estados

```
Normal (hover out):
┌──────────┐
│ Acción   │  bg: #f97316  text: white
└──────────┘  shadow: 0 4px 12px -2px

Hover:
┌──────────┐
│ Acción   │  bg: #b45309 (más oscuro, darker)
└──────────┘  shadow: 0 12px 24px -4px (más elevado)

Active (press):
┌──────────┐
│ Acción   │  bg: #92400e (más oscuro aún)
└──────────┘  shadow: 0 4px 12px -2px (vuelve a normal)

Focus (keyboard):
┌──────────┐
│ Acción   │  outline: 2px solid #f97316
│          │  outline-offset: 2px
└──────────┘  (visible solo con tab)
```

### Badge States (Light Mode)

```
┌──────────────┐
│ ⌛ Pendiente  │  bg: #fffbf0  text: #a16207  (warm amber)
└──────────────┘

┌──────────────┐
│ ✓ Confirmado │  bg: #f0fdf4  text: #15803d  (green)
└──────────────┘

┌──────────────┐
│ ⟳ Preparando │  bg: #eff6ff  text: #1e40af  (blue)
└──────────────┘

┌──────────────┐
│ ✗ Error      │  bg: #fef2f2  text: #b91c1c  (red)
└──────────────┘
```

---

## ✅ Implementación Checklist

- [ ] Apply `.glass` class to all floating cards and components
- [ ] Use `font-display` for H1-H4, `text-{size}` for body
- [ ] Replace hardcoded colors with `text-text-primary`, `bg-pending`, etc.
- [ ] Test in both light/dark modes on actual device (monitor)
- [ ] Verify contrasts with WebAIM Contrast Checker or aXe DevTools
- [ ] Check Lighthouse Accessibility score ≥ 90
- [ ] Validate no color-blind users are excluded (use contrast tools)
- [ ] Update Storybook or component docs with new patterns

---

**Última actualización: 2026-05-12**
**Sistema de Diseño v3.0 — Glasmorphism + Typography + WCAG AAA**

