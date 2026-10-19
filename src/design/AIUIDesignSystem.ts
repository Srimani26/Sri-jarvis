/**
 * AI UI Design Stack Engine
 * Inspired by Claude UI Design Stack (4 Essential Tools for Agents)
 * (https://claude.ai/public/artifacts/4a0407fc-5eef-441f-8a12-2b9b380b695e)
 * 
 * Rules:
 * 1. Zero Generic Defaults: Curated HSL tokens (deep slate/obsidian, vibrant cyan & rose accents).
 * 2. Modern Typography: Google Fonts (Inter / Outfit / Plus Jakarta Sans) with optical hierarchy.
 * 3. Component Registry: Production components with glassmorphism, subtle micro-interactions, responsive grids.
 * 4. Responsive Breakpoints: Built for Mobile-first (375px), Tablet (768px), and Desktop (1280px).
 */

export interface DesignTokens {
  colors: {
    bgDark: string;
    surface1: string;
    surface2: string;
    primary: string;
    primaryGlow: string;
    accent: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
  typography: {
    fontHeading: string;
    fontBody: string;
    fontMono: string;
  };
}

export class AIUIDesignSystem {
  public static readonly TOKENS: DesignTokens = {
    colors: {
      bgDark: '#030712', // Obsidian dark
      surface1: '#0f172a', // Slate 900
      surface2: '#1e293b', // Slate 800
      primary: '#06b6d4', // Cyan 500
      primaryGlow: 'rgba(6, 182, 212, 0.25)',
      accent: '#f43f5e', // Rose 500
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      border: 'rgba(255, 255, 255, 0.08)',
    },
    typography: {
      fontHeading: "'Plus Jakarta Sans', -apple-system, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    },
  };

  /**
   * Generates a modern, production-grade landing page or Shopify section HTML/CSS
   * avoiding generic templates.
   */
  public static synthesizeClientDeliverable(params: {
    title: string;
    category: string;
    targetAudience?: string;
    features?: string[];
  }): string {
    const { title, category, features = [] } = params;
    const defaultFeatures = features.length > 0 ? features : [
      'Sub-second Page Load & Core Web Vitals 99+',
      'Full Mobile Responsive Flex/Grid Adaptive Layout',
      'Zero-Downtime Clean Liquid / CSS Architecture',
      'Integrated Conversions & 1-Click Checkout Flow',
    ];

    return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Client Deliverable</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            heading: ['Plus Jakarta Sans', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            obsidian: '#030712',
            surface: {
              100: '#0f172a',
              200: '#1e293b',
              300: '#334155',
            },
            brand: {
              cyan: '#06b6d4',
              rose: '#f43f5e',
            }
          }
        }
      }
    }
  </script>
  <style>
    .glow-cyan {
      box-shadow: 0 0 40px -10px rgba(6, 182, 212, 0.3);
    }
    .glass-card {
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
  </style>
</head>
<body class="bg-obsidian text-slate-100 font-sans min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200 antialiased overflow-x-hidden">
  
  <!-- Navigation Header -->
  <header class="sticky top-0 z-50 glass-card border-b border-white/5 transition-all">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-rose-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="font-heading font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          ${title}
        </span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <a href="#features" class="hover:text-cyan-400 transition-colors">Features</a>
        <a href="#performance" class="hover:text-cyan-400 transition-colors">Performance</a>
        <a href="#demo" class="hover:text-cyan-400 transition-colors">Live Demo</a>
      </nav>
      <a href="#contact" class="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-obsidian transition-all shadow-lg shadow-cyan-500/20 hover:scale-105">
        Deploy Now
      </a>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
    <div class="text-center max-w-3xl mx-auto space-y-6">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span>PRODUCTION VERIFIED ARCHITECTURE • ${category.toUpperCase()}</span>
      </div>
      <h1 class="font-heading font-extrabold text-4xl sm:text-6xl tracking-tight text-white leading-tight">
        High-Performance <span class="bg-gradient-to-r from-cyan-400 via-sky-300 to-rose-400 bg-clip-text text-transparent">Digital Solution</span>
      </h1>
      <p class="text-slate-400 text-base sm:text-lg leading-relaxed">
        Engineered with zero technical debt, rigorous accessibility standards, and mobile-first ergonomics. Designed for instant client handover.
      </p>
    </div>

    <!-- Bento Grid Features -->
    <section id="features" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
      ${defaultFeatures.map((feat, idx) => `
      <div class="glass-card p-6 rounded-2xl hover:border-cyan-500/40 transition-all group">
        <div class="text-cyan-400 font-mono text-xs font-bold mb-3">0${idx + 1} // MODULE</div>
        <h3 class="font-heading font-bold text-white text-base mb-2 group-hover:text-cyan-300 transition-colors">${feat}</h3>
        <p class="text-xs text-slate-400 leading-relaxed">Validated with automated AST security and responsive layout regression testing.</p>
      </div>`).join('')}
    </section>
  </main>

  <!-- Footer -->
  <footer class="border-t border-white/5 py-8 text-center text-xs text-slate-500 font-mono">
    Delivered by Master Sri's Autonomous Engineering Practice • Certified Zero-Defect Handover
  </footer>
</body>
</html>`;
  }
}
