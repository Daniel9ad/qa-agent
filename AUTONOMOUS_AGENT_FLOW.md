# 🔄 Diagrama de Flujo del Agente Autónomo

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENTE AUTÓNOMO                           │
│                                                              │
│  ┌────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   Google   │────▶│   LangChain  │────▶│   LangGraph  │ │
│  │   Gemini   │     │    Tools     │     │   Workflow   │ │
│  └────────────┘     └──────────────┘     └──────────────┘ │
│         ▲                   ▲                     ▲         │
│         │                   │                     │         │
│         └───────────────────┴─────────────────────┘         │
│                      Herramientas MCP                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Flujo Detallado del Agente

```
┌──────────────┐
│   USUARIO    │
│  (consulta)  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│              📥 INPUT PROCESSING                │
│  "Visita github.com y analiza su contenido"    │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│          🧠 NODO: REASONING                     │
│                                                 │
│  1. Analiza el input del usuario                │
│  2. Lista herramientas disponibles              │
│  3. Genera plan de acción con Gemini           │
│                                                 │
│  Prompt a Gemini:                               │
│  ┌───────────────────────────────────────────┐ │
│  │ "Dado el input: 'Visita github.com...'    │ │
│  │  y estas herramientas:                     │ │
│  │  - browser_navigate                        │ │
│  │  - browser_snapshot                        │ │
│  │  - analyze_context                         │ │
│  │  ¿Qué herramientas usar y con qué params?"│ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Respuesta (JSON):                              │
│  {                                              │
│    "reasoning": "URL detectada, necesito...",  │
│    "tools_to_use": [                           │
│      {                                          │
│        "name": "browser_navigate",             │
│        "params": {"url": "https://github.com"} │
│      },                                         │
│      {                                          │
│        "name": "browser_snapshot",             │
│        "params": {}                            │
│      }                                          │
│    ]                                            │
│  }                                              │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│        🔧 NODO: EXECUTE_TOOLS                   │
│                                                 │
│  1. Parsea el plan JSON                         │
│  2. Para cada herramienta en el plan:          │
│                                                 │
│     ┌─────────────────────────────────┐        │
│     │ Herramienta 1: browser_navigate │        │
│     │ Params: {url: "github.com"}     │        │
│     │ ✅ Ejecutado                     │        │
│     └─────────────────────────────────┘        │
│                                                 │
│     ┌─────────────────────────────────┐        │
│     │ Herramienta 2: browser_snapshot │        │
│     │ Params: {}                      │        │
│     │ ✅ Ejecutado                     │        │
│     └─────────────────────────────────┘        │
│                                                 │
│  3. Recolecta todos los resultados             │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│       🤔 NODO: SHOULD_CONTINUE (NUEVO)          │
│                                                 │
│  1. Revisa resultados obtenidos                 │
│  2. Consulta a Gemini si hay info suficiente   │
│                                                 │
│  Prompt a Gemini:                               │
│  ┌───────────────────────────────────────────┐ │
│  │ "Pregunta original: 'Visita github.com...'│ │
│  │  Resultados hasta ahora:                   │ │
│  │  - Navegué a github.com ✅                 │ │
│  │  - Capturé snapshot ✅                     │ │
│  │  ¿Tengo suficiente para responder?"       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Respuesta (JSON):                              │
│  {                                              │
│    "has_enough_info": true,                    │
│    "reason": "Ya tengo contenido de la página"│
│  }                                              │
│                                                 │
│  Decisión:                                      │
│  ┌───────────────────┬─────────────────────┐  │
│  │ ¿Suficiente info? │                     │  │
│  └────────┬──────────┴─────────────────────┘  │
│           │                                     │
│      ┌────┴────┐                               │
│      │   SÍ    │   NO                          │
└──────┼─────────┼───────────────────────────────┘
       │         │
       │         └──────────────┐
       │                        │
       │                        ▼
       │              ┌──────────────────────┐
       │              │   🔄 LOOP BACK TO    │
       │              │   EXECUTE_TOOLS      │
       │              │ (nueva iteración)    │
       │              └──────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│          🎯 NODO: SYNTHESIZE                    │
│                                                 │
│  1. Recolecta todos los mensajes y resultados  │
│  2. Envía a Gemini para síntesis               │
│                                                 │
│  Prompt a Gemini:                               │
│  ┌───────────────────────────────────────────┐ │
│  │ "Pregunta: 'Visita github.com...'         │ │
│  │  Resultados:                               │ │
│  │  - Navegué a https://github.com            │ │
│  │  - Snapshot capturado: [estructura HTML]  │ │
│  │  Genera respuesta clara y útil"           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Respuesta:                                     │
│  "He visitado GitHub.com y encontré...         │
│   La página principal muestra...               │
│   Características destacadas:...               │
│                                                 │
│   📊 Estadísticas: 2 iteraciones               │
│   🔧 Herramientas: browser_navigate, snapshot" │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│             📤 OUTPUT FINAL                     │
│       Respuesta completa al usuario             │
└─────────────────────────────────────────────────┘
```

## Comparación: Antes vs Ahora

### 🔴 FLUJO ANTERIOR (Fijo/Predefinido)

```
INPUT
  ↓
REASONING (genérico)
  ↓
EXECUTE_TOOLS
  ├─ analyze_context ✓ (siempre)
  ├─ search_information ✓ (siempre)
  ├─ browser_navigate ✓ (si disponible)
  └─ browser_snapshot ✓ (si disponible)
  ↓
SYNTHESIZE (concatenación simple)
  ↓
OUTPUT
```

**Problemas**:
- ❌ Ejecuta todo, incluso lo innecesario
- ❌ No adapta la estrategia al input
- ❌ Parámetros hardcodeados
- ❌ Una sola iteración fija
- ❌ Sin evaluación de completitud

### 🟢 FLUJO ACTUAL (Autónomo/Inteligente)

```
INPUT
  ↓
REASONING (análisis inteligente)
  ├─ Analiza intención
  ├─ Selecciona herramientas relevantes
  └─ Define parámetros apropiados
  ↓
EXECUTE_TOOLS (solo las planificadas)
  └─ Ejecuta plan dinámico
  ↓
SHOULD_CONTINUE (evaluación)
  ├─ ¿Suficiente info? → Sí → SYNTHESIZE
  └─ ¿Necesita más? → No → ↑ EXECUTE_TOOLS
  ↓
SYNTHESIZE (análisis contextual)
  └─ Respuesta coherente e inteligente
  ↓
OUTPUT
```

**Ventajas**:
- ✅ Solo ejecuta lo necesario
- ✅ Se adapta al input del usuario
- ✅ Parámetros inferidos del contexto
- ✅ Múltiples iteraciones si necesario
- ✅ Evaluación continua de progreso

## Ejemplos de Decisiones

### Ejemplo 1: Input Simple

```
INPUT: "¿Qué es machine learning?"

REASONING DECIDE:
├─ Herramientas: [analyze_context]
└─ Razón: "Consulta conceptual, no requiere navegación"

EXECUTE: analyze_context
SHOULD_CONTINUE: "Suficiente información" → SYNTHESIZE
OUTPUT: Explicación detallada de ML
```

### Ejemplo 2: Input con URL

```
INPUT: "Visita wikipedia.org y resume su contenido"

REASONING DECIDE:
├─ Herramientas: [browser_navigate, browser_snapshot]
└─ Razón: "URL detectada, necesito navegar y capturar"

EXECUTE: browser_navigate → browser_snapshot
SHOULD_CONTINUE: "Tengo contenido" → SYNTHESIZE
OUTPUT: Resumen del contenido de Wikipedia
```

### Ejemplo 3: Input Complejo (Multi-Paso)

```
INPUT: "Investiga sobre LangChain en su sitio oficial"

ITERACIÓN 1:
├─ REASONING: [browser_navigate, browser_snapshot]
├─ EXECUTE: Navega a langchain.com
└─ SHOULD_CONTINUE: "Necesito analizar contenido"

ITERACIÓN 2:
├─ REASONING: [analyze_context]
├─ EXECUTE: Analiza snapshot capturado
└─ SHOULD_CONTINUE: "Ahora tengo suficiente"

SYNTHESIZE: Genera resumen completo
OUTPUT: Análisis detallado de LangChain
```

## Herramientas MCP Disponibles

```
┌──────────────────────────────────────────────┐
│          SERVIDOR MCP (Playwright)           │
├──────────────────────────────────────────────┤
│                                              │
│  🌐 Navegación:                              │
│     • browser_navigate                       │
│     • browser_navigate_back                  │
│                                              │
│  👆 Interacción:                             │
│     • browser_click                          │
│     • browser_type                           │
│     • browser_hover                          │
│     • browser_drag                           │
│                                              │
│  📸 Captura:                                 │
│     • browser_snapshot                       │
│     • browser_take_screenshot                │
│                                              │
│  📋 Formularios:                             │
│     • browser_fill_form                      │
│     • browser_select_option                  │
│     • browser_file_upload                    │
│                                              │
│  🔍 Evaluación:                              │
│     • browser_evaluate                       │
│                                              │
│  ⏱️  Espera:                                 │
│     • browser_wait_for                       │
│                                              │
│  📊 Diagnóstico:                             │
│     • browser_console_messages               │
│     • browser_network_requests               │
│                                              │
└──────────────────────────────────────────────┘
```

## Integración con Google Gemini

```
┌─────────────────────────────────────────────┐
│         GOOGLE GEMINI 2.5 FLASH             │
├─────────────────────────────────────────────┤
│                                             │
│  Rol 1: PLANIFICADOR                        │
│  ├─ Analiza intención del usuario           │
│  ├─ Selecciona herramientas                 │
│  └─ Define parámetros                       │
│                                             │
│  Rol 2: EVALUADOR                           │
│  ├─ Revisa resultados obtenidos             │
│  ├─ Determina si falta información          │
│  └─ Decide siguiente paso                   │
│                                             │
│  Rol 3: SINTETIZADOR                        │
│  ├─ Organiza información recopilada         │
│  ├─ Genera respuesta coherente              │
│  └─ Adapta tono y formato                   │
│                                             │
└─────────────────────────────────────────────┘
```

## Límites y Controles

```
┌──────────────────────────────────────────┐
│         CONTROLES DE SEGURIDAD           │
├──────────────────────────────────────────┤
│                                          │
│  maxIterations: 10                       │
│  ├─ Previene loops infinitos             │
│  └─ Configurable por agente              │
│                                          │
│  timeout (MCP): 30s                      │
│  ├─ Evita bloqueos en herramientas       │
│  └─ Falla gracefully                     │
│                                          │
│  error handling:                         │
│  ├─ Try-catch en cada nodo               │
│  ├─ Fallback a estrategia simple         │
│  └─ Logs detallados de errores           │
│                                          │
└──────────────────────────────────────────┘
```

---

**Este diagrama muestra cómo el agente autónomo toma decisiones inteligentes en cada paso del proceso.**
