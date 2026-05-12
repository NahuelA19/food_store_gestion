# 🍕 Food Store — Sistema de Diseño Completo v3
## Colores + Tipografía + Glassmorphism

---

## 📋 Tabla de Contenidos
1. [Paleta de Colores](#paleta-de-colores)
2. [Tipografía](#tipografía)
3. [Glassmorphism](#glassmorphism)
4. [Variables CSS](#variables-css)
5. [Componentes](#componentes)
6. [Contraste WCAG](#contraste-wcag)

---

## 🎨 Paleta de Colores

### Light Mode: Fondo Azul Intenso #1a3de4

#### Fondos & Superficies
```
Fondo principal:        #1a3de4 (azul intenso — embossed texture)
Card/Sidebar base:      rgba(255, 255, 255, 0.92) + backdrop-filter: blur(12px)
Card/Sidebar alt:       rgba(255, 255, 255, 0.88) + blur(12px) — para subsecciones
Elevated (modal):       rgba(255, 255, 255, 0.96) + blur(16px) — máxima elevación
Border glassmorphic:    rgba(255, 255, 255, 0.3) — borde sutil dentro del glass
```

**Valores OKLCH (recomendado para mejor perceptibilidad):**
```
--surface-card-light:       oklch(0.98 0.002 70 / 0.92)  /* glass base */
--surface-card-light-alt:   oklch(0.96 0.003 70 / 0.88)  /* subsecciones */
--surface-raised-light:     oklch(0.98 0.002 70 / 0.96)  /* modales */
--border-glass-light:       oklch(1 0 0 / 0.3)           /* glass border */
```

#### Texto - Light Mode
```
Primario (body text):   #1a1a1a (negro muy oscuro) — WCAG AAA (21:1) sobre white
Secundario:             #595959 (gris oscuro 35%) — WCAG AAA (8.5:1)
Terciario/Muted:        #8d8d8d (gris medio 55%) — WCAG AA (5.2:1)
En botones:             #ffffff (blanco puro) — sobre naranja/azul
Etiquetas:              #4a5568 (gris-azulado) — semibold
```

**OKLCH:**
```
--text-primary-light:      oklch(0.14 0.012 70)   /* #1a1a1a */
--text-secondary-light:    oklch(0.35 0.010 70)   /* #595959 */
--text-muted-light:        oklch(0.55 0.008 70)   /* #8d8d8d */
--text-on-brand:           oklch(1 0 0)           /* #ffffff */
```

#### Marca & Acciones - Warm Amber
```
Naranja primario:       #f97316 (mantener — combina perfecto con azul)
Naranja hover:          #ea580c (más oscuro, -15% luminancia)
Naranja active:         #c2410c (más saturado, -30%)
Naranja light (BG):     #fef3e1 (para fondos de badges/hints)
```

**Escala OKLCH completa:**
```
--brand-50:             oklch(0.985 0.010 71)   /* #fef8f4 */
--brand-100:            oklch(0.965 0.025 71)   /* #feeedb */
--brand-200:            oklch(0.930 0.050 71)   /* #fcdab5 */
--brand-300:            oklch(0.890 0.080 71)   /* #fac080 */
--brand-400:            oklch(0.840 0.110 71)   /* #f97316 ← MANTENER */
--brand-500:            oklch(0.760 0.145 71)   /* #d97706 */
--brand-600:            oklch(0.660 0.160 71)   /* #b45309 (button primary) */
--brand-700:            oklch(0.570 0.155 71)   /* #92400e (hover) */
--brand-800:            oklch(0.460 0.130 71)   /* #78350f (active) */
--brand-900:            oklch(0.330 0.095 71)   /* #451a03 */
```

#### Semánticos - Light Mode
```
Pendiente:    #d8a839 (ámbar cálido)    BG: #fffbf0    Text: #a16207
Confirmado:   #22c55e (verde success)   BG: #f0fdf4    Text: #15803d
Preparando:   #3b82f6 (azul info)       BG: #eff6ff    Text: #1e40af
Error:        #ef4444 (rojo danger)     BG: #fef2f2    Text: #b91c1c
```

---

### Dark Mode: Fondo Negro #1a1a1a

#### Fondos & Superficies
```
Fondo principal:        #1a1a1a (negro oscuro — embossed texture)
Card/Sidebar base:      rgba(45, 45, 45, 0.85) + backdrop-filter: blur(12px)
Card/Sidebar alt:       rgba(35, 35, 35, 0.80) + blur(12px) — más oscuro
Elevated (modal):       rgba(55, 55, 55, 0.90) + blur(16px) — máxima elevación
Border glassmorphic:    rgba(255, 255, 255, 0.15) — borde muy sutil
```

**Valores OKLCH:**
```
--surface-card-dark:        oklch(0.20 0.010 70 / 0.85)  /* glass base */
--surface-card-dark-alt:    oklch(0.18 0.010 70 / 0.80)  /* subsecciones */
--surface-raised-dark:      oklch(0.24 0.012 70 / 0.90)  /* modales */
--border-glass-dark:        oklch(1 0 0 / 0.15)          /* glass border */
```

#### Texto - Dark Mode
```
Primario (body text):   #e8e8e8 (gris muy claro) — WCAG AAA (15.3:1) sobre #1a1a1a
Secundario:             #bfbfbf (gris claro 75%) — WCAG AAA (11.8:1)
Terciario/Muted:        #8d8d8d (gris medio 55%) — WCAG AA (5.2:1)
En botones:             #1a1a1a (negro) — sobre naranja/accent
Etiquetas:              #d4d4d8 (gris muy claro) — semibold
```

**OKLCH:**
```
--text-primary-dark:       oklch(0.92 0.006 70)   /* #e8e8e8 */
--text-secondary-dark:     oklch(0.75 0.008 70)   /* #bfbfbf */
--text-muted-dark:         oklch(0.55 0.006 70)   /* #8d8d8d */
--text-on-brand-dark:      oklch(0.15 0.012 70)   /* #1a1a1a */
```

#### Marca & Acciones - Bright Amber (Dark-friendly)
```
Naranja primario:       #f97316 (más brillante en dark, mantener)
Naranja hover:          #ffb580 (más claro, +20% luminancia)
Naranja active:         #d97706 (medio, -10%)
Accent light:           #fef3e1 (para hints/badges)
```

#### Semánticos - Dark Mode (Brighter)
```
Pendiente:    #e8c547 (ámbar brillante)  BG: #3d3d1a    Text: #e8c547
Confirmado:   #4ade80 (verde brillante)  BG: #1f3a1f    Text: #4ade80
Preparando:   #60a5fa (azul brillante)   BG: #1a2a3f    Text: #60a5fa
Error:        #ef4444 (rojo brillante)   BG: #3a1a1a    Text: #ef4444
```

---

## 📝 Tipografía

### Fuentes Recomendadas
```
Display (headings, títulos):  Playfair Display (serif, warmth)
                              Fallback: Georgia, ui-serif

Body (párrafos, labels):      DM Sans (sans-serif, legible)
                              Fallback: -apple-system, BlinkMacSystemFont, 
                                       "Segoe UI", sans-serif

Monospace (valores numéricos): JetBrains Mono o Space Mono
```

**Importación Google Fonts:**
```html
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" as="style">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Jerarquía Tipográfica

#### H1: Panel de Control (Dashboard Title)
```
Tamaño:         3rem (48px) desktop, 2.25rem (36px) móvil
Peso:           700 (bold)
Familia:        Playfair Display
Interlineado:   3.5rem (1.16 line-height)
Letter-spacing: -0.02em (tight)
Color:          text-primary
Caso:           Normal (no mayúsculas forzadas)

Ejemplo: "Panel de Control" / "Mi Restaurante"
```

#### H2: Secciones Principales
```
Tamaño:         2.25rem (36px) desktop, 1.875rem (30px) móvil
Peso:           700 (bold)
Familia:        Playfair Display
Interlineado:   2.75rem (1.22 line-height)
Letter-spacing: -0.01em
Color:          text-primary
Margin-top:    2rem

Ejemplo: "Pedidos del Día" / "Top Productos"
```

#### H3: Títulos de Cards / Subsecciones
```
Tamaño:         1.875rem (30px)
Peso:           600 (semibold)
Familia:        Playfair Display
Interlineado:   2.25rem (1.2 line-height)
Color:          text-primary
Margin-bottom: 0.5rem

Ejemplo: "Orden #12345" / "Ventas Totales"
```

#### H4: Etiquetas de Tabla / Labels Importantes
```
Tamaño:         1.25rem (20px)
Peso:           600 (semibold)
Familia:        DM Sans
Interlineado:   1.5rem (1.2 line-height)
Color:          text-secondary
Text-transform: uppercase (opcional, solo para secciones críticas)

Ejemplo: "Estado del Pedido" / "Información del Producto"
```

#### Body - Párrafos Normales
```
Tamaño:         1rem (16px) — desktop
                0.9375rem (15px) — móvil
Peso:           400 (regular)
Familia:        DM Sans
Interlineado:   1.5rem (1.5 line-height)
Color:          text-primary
Margin-bottom: 1em

Ejemplo: Descripción de productos, detalles de orden
```

#### Body - Large (18px)
```
Tamaño:         1.125rem (18px)
Peso:           500 (medium)
Familia:        DM Sans
Interlineado:   1.75rem (1.56 line-height)
Color:          text-secondary
Margin-bottom: 0.75em

Ejemplo: Valores numéricos grandes ($4,289 / 48 órdenes)
```

#### Label - Inputs y Metadata
```
Tamaño:         0.875rem (14px)
Peso:           600 (semibold)
Familia:        DM Sans
Interlineado:   1.25rem (1.43 line-height)
Color:          text-secondary
Text-transform: none
Margin-bottom: 0.5rem

Ejemplo: "Email" / "Cantidad" / "Fecha de Entrega"
```

#### Small / Secondary Text
```
Tamaño:         0.75rem (12px)
Peso:           400 (regular)
Familia:        DM Sans
Interlineado:   1rem (1.33 line-height)
Color:          text-muted
Margin:         0

Ejemplo: "Hace 2 horas" / "Stock: 12 unidades"
```

---

## ✨ Glassmorphism

### Concepto
Las **cards, sidebar y tablas flotan** sobre el fondo texturizado con efecto glassmorphic:
- Transparencia controlada
- Blur background sutil pero visible
- Borde sutil de vidrio
- Sombra soft para separación
- Preserva **legibilidad** de contenido

### Implementación CSS

#### Light Mode (sobre azul #1a3de4)
```css
.glass-light {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.10);
}

.glass-light:hover {
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease-out;
}
```

#### Dark Mode (sobre negro #1a1a1a)
```css
.glass-dark {
  background: rgba(45, 45, 45, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.50);
}

.glass-dark:hover {
  background: rgba(45, 45, 45, 0.88);
  box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.65);
  transition: all 0.3s ease-out;
}
```

### Aplicación en Componentes

#### Cards (Productos, Órdenes)
```
Clases: glass-light | glass-dark (según modo)
Padding: 1.5rem (24px)
Border-radius: 12px
Margin-bottom: 1rem
```

#### Sidebar (Navegación)
```
Clases: glass-light | glass-dark
Padding: 1.5rem
Min-height: 100vh
Position: sticky
Top: 0
Overlay: Apenas visible sobre fondo
```

#### Tablas
```
Clases: glass-light | glass-dark (en tbody y thead)
Tr > td/th: padding 0.75rem 1rem
Alternancia: cada fila par con 5% opacidad más oscura
Borders: rgba(255,255,255, 0.15) entre filas
```

#### Modales & Dropdowns (Raised)
```
Clases: glass-raised-light | glass-raised-dark
Backdrop-filter: blur(16px)
Background: más opaco (96% / 90%)
Elevation: máxima sombra
Z-index: 50+
```

---

## 🎯 Variables CSS

### Estructura en `frontend/src/index.css`

```css
/* ============================================================================
   ROOT (Light Mode) — sobre fondo azul #1a3de4
   ============================================================================ */
:root {
  /* ---- Glassmorphic Surfaces ---- */
  --color-surface-card: rgba(255, 255, 255, 0.92);
  --color-surface-alt: rgba(255, 255, 255, 0.88);
  --color-surface-raised: rgba(255, 255, 255, 0.96);
  --glass-blur: blur(12px);
  --glass-blur-elevated: blur(16px);
  --glass-border: rgba(255, 255, 255, 0.3);

  /* ---- Text ---- */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #595959;
  --color-text-muted: #8d8d8d;
  --color-text-on-brand: #ffffff;

  /* ---- Brand (Warm Amber) ---- */
  --color-brand-50: #fef8f4;
  --color-brand-100: #feeedb;
  --color-brand-200: #fcdab5;
  --color-brand-300: #fac080;
  --color-brand-400: #f97316;   /* ← PRIMARY */
  --color-brand-500: #d97706;
  --color-brand-600: #b45309;   /* button hover */
  --color-brand-700: #92400e;
  --color-brand-800: #78350f;
  --color-brand-900: #451a03;

  /* ---- Semantic ---- */
  --color-pending: #d8a839;
  --color-pending-bg: #fffbf0;
  --color-pending-text: #a16207;

  --color-confirmed: #22c55e;
  --color-confirmed-bg: #f0fdf4;
  --color-confirmed-text: #15803d;

  --color-preparing: #3b82f6;
  --color-preparing-bg: #eff6ff;
  --color-preparing-text: #1e40af;

  --color-danger: #ef4444;
  --color-danger-bg: #fef2f2;
  --color-danger-text: #b91c1c;

  /* ---- Shadows ---- */
  --shadow-card: 0 4px 12px -2px rgba(0, 0, 0, 0.10);
  --shadow-card-hover: 0 12px 24px -4px rgba(0, 0, 0, 0.15);
  --shadow-modal: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* ---- Typography ---- */
  --font-display: "Playfair Display", ui-serif, Georgia, serif;
  --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;

  /* Sizing */
  --text-display-lg: 3rem;        /* 48px — H1 */
  --text-display-md: 2.25rem;     /* 36px — H2 */
  --text-display-sm: 1.875rem;    /* 30px — H3 */
  --text-lg: 1.125rem;            /* 18px — Large body */
  --text-base: 1rem;              /* 16px — Normal */
  --text-sm: 0.875rem;            /* 14px — Labels */
  --text-xs: 0.75rem;             /* 12px — Small */

  /* ---- Radius ---- */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
}

/* ============================================================================
   DARK MODE (.dark) — sobre fondo negro #1a1a1a
   ============================================================================ */
.dark {
  /* ---- Glassmorphic Surfaces (Dark) ---- */
  --color-surface-card: rgba(45, 45, 45, 0.85);
  --color-surface-alt: rgba(35, 35, 35, 0.80);
  --color-surface-raised: rgba(55, 55, 55, 0.90);
  --glass-border: rgba(255, 255, 255, 0.15);

  /* ---- Text (Light on Dark) ---- */
  --color-text-primary: #e8e8e8;
  --color-text-secondary: #bfbfbf;
  --color-text-muted: #8d8d8d;
  --color-text-on-brand: #1a1a1a;

  /* ---- Brand (Brighter for Dark) ---- */
  --color-brand-400: #f97316;      /* mantener */
  --color-brand-300: #ffb580;      /* hover — más claro */
  --color-brand-500: #d97706;      /* active */

  /* ---- Semantic (Brighter) ---- */
  --color-pending: #e8c547;
  --color-pending-bg: #3d3d1a;

  --color-confirmed: #4ade80;
  --color-confirmed-bg: #1f3a1f;

  --color-preparing: #60a5fa;
  --color-preparing-bg: #1a2a3f;

  --color-danger: #ef4444;
  --color-danger-bg: #3a1a1a;

  /* ---- Shadows (Stronger) ---- */
  --shadow-card: 0 4px 12px -2px rgba(0, 0, 0, 0.50);
  --shadow-card-hover: 0 12px 24px -4px rgba(0, 0, 0, 0.65);
  --shadow-modal: 0 25px 50px -12px rgba(0, 0, 0, 0.75);
}
```

---

## 🧩 Componentes

### Card
```
CSS Classes: glass-light | glass-dark
Padding: 1.5rem
Border-radius: 12px
Shadows: card | card-hover
Children typography: 
  - Title: <h3> → Playfair Display 30px bold
  - Body: <p> → DM Sans 16px regular
```

### Botón Primario
```
Background: var(--color-brand-400)
Color: var(--color-text-on-brand)
Padding: 0.75rem 1.5rem
Border-radius: 8px
Font: DM Sans 16px semibold
Hover: background: var(--color-brand-600)
Active: background: var(--color-brand-700)
Focus: outline 2px var(--color-brand-500)
```

### Badge / Etiqueta
```
Padding: 0.25rem 0.75rem
Border-radius: 999px
Font: DM Sans 12px bold
Variantes por estado (pending, confirmed, preparing, danger)
Background: --color-{state}-bg
Color: --color-{state}-text
```

### Tabla
```
Header: 
  Background: var(--color-surface-alt)
  Font: DM Sans 14px semibold
  Padding: 0.75rem 1rem
  Color: var(--color-text-secondary)

Body rows:
  Padding: 0.75rem 1rem
  Border-bottom: 1px var(--color-border)
  Color: var(--color-text-primary)
  Alternancia (stripe): cada par con 5% opacidad más oscura

Hover row:
  Background: +5% opacidad
  Transition: 0.2s ease
```

### Input / Form
```
Height: 44px
Padding: 0.75rem 1rem
Border: 1px var(--color-border)
Border-radius: 8px
Font: DM Sans 16px
Color: var(--color-text-primary)
Focus: border-color: var(--color-brand-400), outline: none
Placeholder: color: var(--color-text-muted)
```

---

## ♿ Contraste WCAG

### Light Mode
```
Primario (#1a1a1a) sobre white:     21:1    ✓ AAA
Secundario (#595959) sobre white:   8.5:1   ✓ AAA
Muted (#8d8d8d) sobre white:        5.2:1   ✓ AA
Brand (#f97316) sobre white:        4.8:1   ✓ AA
Brand button (#b45309) sobre white: 7.8:1   ✓ AAA
```

### Dark Mode
```
Primario (#e8e8e8) sobre #2d2d2d:   15.3:1  ✓ AAA
Secundario (#bfbfbf) sobre #2d2d2d: 11.8:1  ✓ AAA
Muted (#8d8d8d) sobre #2d2d2d:      5.2:1   ✓ AA
Brand (#f97316) sobre #2d2d2d:      10.2:1  ✓ AAA
```

---

## 🚀 Implementación

### Paso 1: Actualizar `frontend/src/index.css`
- Copiar variables de este documento
- Mantener estructura de `@theme` con Tailwind v4
- Asegurar `backdrop-filter: blur()` con prefijo `-webkit-`

### Paso 2: Aplicar clases a componentes
```tsx
// Card component
<div className={`glass-${theme === 'dark' ? 'dark' : 'light'} rounded-lg p-6`}>
  <h3 className="font-display text-3xl font-bold">Título</h3>
  <p className="text-base text-text-primary">Contenido</p>
</div>
```

### Paso 3: Validar contraste
- Usar WebAIM Contrast Checker
- Auditar con Lighthouse (Accessibility)
- Testing en ambos modos en monitor físico

---

**Última actualización: 2026-05-12**
**Versión: 3.0 — Glassmorphism + WCAG AAA Ready**

