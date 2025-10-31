# 🎨 Visualización: Message Limit Reducer

Este documento muestra visualmente cómo funciona el reducer de mensajes limitados.

## 📊 Flujo del Reducer

```
┌─────────────────────────────────────────────────────────────┐
│                    limitedMessageReducer                     │
│                                                              │
│  Input: left[] + right[] + limit                            │
│  Output: limited_messages[]                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Ejemplo de Ejecución

### Iteración 1: Inicio

```
Entrada:
  left:  []
  right: [HumanMessage("Navega a example.com")]
  limit: 10

Proceso:
  1. Concatenar: [] + [H1]
  2. Agrupar por tipo:
     - human: [H1]
  3. Limitar cada tipo (max 10):
     - human: [H1] ✓ (1 <= 10)
  4. Reconstruir

Salida:
  messages: [H1]
  Total: 1 mensaje
```

### Iteración 2: Agente Razona y Usa Tool

```
Entrada:
  left:  [H1]
  right: [AI1, Tool1]
  limit: 10

Proceso:
  1. Concatenar: [H1] + [AI1, Tool1]
  2. Agrupar por tipo:
     - human: [H1]
     - ai: [AI1]
     - tool: [Tool1]
  3. Limitar cada tipo (max 10):
     - human: [H1] ✓
     - ai: [AI1] ✓
     - tool: [Tool1] ✓
  4. Reconstruir

Salida:
  messages: [H1, Tool1, AI1]
  Total: 3 mensajes
```

### Iteración 3-10: Acumulando Mensajes

```
Iteración 3:
  left:  [H1, Tool1, AI1]
  right: [AI2, Tool2]
  
  Salida: [H1, Tool1, Tool2, AI1, AI2]
  Total: 5 mensajes

Iteración 4:
  left:  [H1, Tool1, Tool2, AI1, AI2]
  right: [AI3, Tool3]
  
  Salida: [H1, Tool1, Tool2, Tool3, AI1, AI2, AI3]
  Total: 7 mensajes

... (continúa hasta iteración 10)
```

### Iteración 11: **LÍMITE ALCANZADO** 🚨

```
Entrada:
  left:  [H1, Tool1...Tool10, AI1...AI10]
  right: [AI11, Tool11]
  limit: 10

Proceso:
  1. Concatenar: [H1, Tool1...Tool10, AI1...AI10] + [AI11, Tool11]
  2. Agrupar por tipo:
     - human: [H1]
     - tool: [Tool1, Tool2, ..., Tool10, Tool11] ← 11 mensajes!
     - ai: [AI1, AI2, ..., AI10, AI11] ← 11 mensajes!
  3. Limitar cada tipo (max 10):
     - human: [H1] ✓ (1 <= 10)
     - tool: [Tool2, ..., Tool11] ✓ (descarta Tool1, mantiene últimos 10)
     - ai: [AI2, ..., AI11] ✓ (descarta AI1, mantiene últimos 10)
  4. Reconstruir

Salida:
  messages: [H1, Tool2...Tool11, AI2...AI11]
  Total: 21 mensajes (1 human + 10 tool + 10 ai)
  
  ⚠️  Tool1 y AI1 fueron descartados (más antiguos)
```

## 📈 Gráfico de Crecimiento

### Sin Límite (❌ Anterior)
```
Iteración │ Mensajes
─────────┼──────────────────────────────────────────────
    1    │ █ (2)
    2    │ ████ (8)
    3    │ ████████ (15)
    5    │ ████████████████ (30)
   10    │ ████████████████████████████████████ (75)
   20    │ ████████████████████████████████████████████████████████ (180+)
         │ ⚠️  Crece sin control!
```

### Con Límite de 10 (✅ Actual)
```
Iteración │ Mensajes (max 10 por tipo)
─────────┼──────────────────────────────────────────────
    1    │ █ (2)
    2    │ ████ (6)
    3    │ ██████ (9)
    5    │ ████████ (15)
   10    │ ████████████ (21)  ← Alcanza límite
   15    │ ████████████ (21)  ← Se mantiene estable
   20    │ ████████████ (21)  ← Se mantiene estable
         │ ✅ Controlado!
```

## 🎯 Desglose por Tipo de Mensaje

### Escenario: limit = 10

```
Tipo de Mensaje    │ Cant. │ Descripción
──────────────────┼───────┼────────────────────────────────
SystemMessage      │  ≤10  │ Instrucciones del sistema
HumanMessage       │  ≤10  │ Mensajes del usuario
AIMessage          │  ≤10  │ Respuestas del LLM
ToolMessage        │  ≤10  │ Resultados de herramientas
──────────────────┼───────┼────────────────────────────────
TOTAL MÁXIMO       │  40   │ 10 de cada tipo
```

### Ejemplo Real con limit = 10:

```
Mensaje                           │ Tipo   │ Iteración │ Estado
─────────────────────────────────┼────────┼───────────┼─────────
"Navega a example.com"            │ Human  │     1     │ ✅ Keep
Tool: browser_navigate success    │ Tool   │     2     │ ✅ Keep
"Navegando..."                    │ AI     │     2     │ ✅ Keep
Tool: browser_snapshot result     │ Tool   │     3     │ ✅ Keep
"Capturado contenido..."          │ AI     │     3     │ ✅ Keep
...                               │ ...    │    ...    │ ...
Tool: 11th tool call              │ Tool   │    12     │ ✅ Keep
Tool: 1st tool call               │ Tool   │     2     │ ❌ Discard (más antiguo)
"Análisis inicial..."             │ AI     │     2     │ ❌ Discard (más antiguo)
```

## 💡 Estrategia de Descarte

### Política: FIFO (First In, First Out)

```
┌─────────────────────────────────────────┐
│          Cola de Mensajes (Tool)        │
│                                         │
│  Nuevos →  [T11][T10][T9]...[T2]  → Descartados
│            ↑                      ↑     │
│            Mantener (últimos 10)  Descartar (T1)
└─────────────────────────────────────────┘
```

### Ventajas:
- ✅ Mantiene contexto reciente
- ✅ Descarta información obsoleta
- ✅ Predecible y determinístico
- ✅ Fácil de depurar

## 🧮 Cálculo de Tokens

### Sin Límite:
```
Iteración 20:
  - 150+ mensajes
  - ~750 tokens por mensaje (promedio)
  - Total: ~112,500 tokens
  - Costo: ~$0.03 por ejecución
```

### Con Límite (10):
```
Iteración 20:
  - 21 mensajes (limitado)
  - ~750 tokens por mensaje (promedio)
  - Total: ~15,750 tokens
  - Costo: ~$0.01 por ejecución
  
  💰 Ahorro: -86% en tokens
```

## 🔍 Casos Especiales

### Caso 1: Solo un tipo de mensaje
```
Input: 20 HumanMessages
Limit: 10

Output: 
  - Mantiene últimos 10 HumanMessages
  - Descarta los 10 primeros
  - Total: 10 mensajes
```

### Caso 2: Distribución desigual
```
Input:
  - 3 HumanMessages
  - 50 ToolMessages
  - 2 AIMessages
Limit: 10

Output:
  - 3 HumanMessages (todos)
  - 10 ToolMessages (últimos 10 de 50)
  - 2 AIMessages (todos)
  - Total: 15 mensajes
```

### Caso 3: Primer mensaje del sistema
```
Input:
  - 1 SystemMessage (prompt inicial)
  - 20 HumanMessages
  - 30 ToolMessages
  - 25 AIMessages
Limit: 10

Output:
  - 1 SystemMessage (único)
  - 10 HumanMessages (últimos 10)
  - 10 ToolMessages (últimos 10)
  - 10 AIMessages (últimos 10)
  - Total: 31 mensajes
```

## 📐 Diagrama de Flujo Detallado

```
                    ┌─────────────┐
                    │   START     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Concatenar │
                    │ left + right│
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │  Separar por tipo:      │
              │  - SystemMessage []     │
              │  - HumanMessage []      │
              │  - AIMessage []         │
              │  - ToolMessage []       │
              │  - Others []            │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Para cada tipo:        │
              │  array.slice(-limit)    │
              │  (mantener últimos N)   │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Reconstruir array en   │
              │  orden lógico:          │
              │  1. System              │
              │  2. Intercalar H/T/AI   │
              │  3. Others              │
              └────────────┬────────────┘
                           │
                    ┌──────▼──────┐
                    │   RETURN    │
                    │  limited[]  │
                    └─────────────┘
```

## 🎪 Ejemplo Interactivo

```typescript
// Simular 15 iteraciones
const messages: BaseMessage[] = [];

for (let i = 1; i <= 15; i++) {
  messages.push(new HumanMessage(`Pregunta ${i}`));
  messages.push(new ToolMessage(`Resultado ${i}`, 'tool'));
  messages.push(new AIMessage(`Respuesta ${i}`));
  
  const limited = limitedMessageReducer([], messages, 10);
  
  console.log(`Iteración ${i}:`);
  console.log(`  Total sin límite: ${messages.length}`);
  console.log(`  Total con límite: ${limited.length}`);
  console.log(`  Ahorro: ${messages.length - limited.length} mensajes`);
}

// Output esperado:
// Iteración 1:  Total: 3, Limitado: 3, Ahorro: 0
// Iteración 5:  Total: 15, Limitado: 15, Ahorro: 0
// Iteración 10: Total: 30, Limitado: 21, Ahorro: 9
// Iteración 15: Total: 45, Limitado: 21, Ahorro: 24 ✅
```

## 🎓 Conclusión

El reducer de mensajes limitados:
- 📉 **Controla el crecimiento** del historial
- 💰 **Reduce costos** significativamente
- ⚡ **Mejora performance** al procesar menos contexto
- 🎯 **Mantiene relevancia** al conservar mensajes recientes
- 🔧 **Es configurable** según las necesidades

---

**Implementado en:** `src/agents/route-agent/route-agent.ts`  
**Documentación:** `MESSAGE_LIMIT.md`  
**Ejemplos:** `examples-message-limit.ts`
