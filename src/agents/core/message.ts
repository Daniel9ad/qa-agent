import { BaseMessage } from "@langchain/core/messages";


/**
 * Limita el historial de mensajes manteniendo solo los últimos N mensajes de cada tipo.
 * Esto evita que el contexto crezca indefinidamente y se envíe todo el historial en cada iteración.
 * 
 * Tipos de mensajes soportados por LangChain:
 * - SystemMessage: Mensajes del sistema (instrucciones)
 * - HumanMessage: Mensajes del usuario
 * - AIMessage: Respuestas del asistente/LLM
 * - ToolMessage: Resultados de ejecución de herramientas
 * - FunctionMessage: (legacy) Mensajes de funciones
 * 
 * @param left - Mensajes existentes
 * @param right - Nuevos mensajes a agregar
 * @param limit - Número máximo de mensajes de cada tipo a mantener
 * @returns Array de mensajes limitado
 */
export function limitedMessageReducer(
  left: BaseMessage[],
  right: BaseMessage[],
  limit: number = 10
): BaseMessage[] {
  // Concatenar mensajes existentes con nuevos
  const allMessages = left.concat(right);
  console.log("allMessages.length: ", allMessages.length);
  
  // Separar mensajes por tipo
  const systemMessages: BaseMessage[] = [];
  const humanMessages: BaseMessage[] = [];
  const aiMessages: BaseMessage[] = [];
  const toolMessages: BaseMessage[] = [];
  const otherMessages: BaseMessage[] = [];
  
  for (const msg of allMessages) {
    if (msg._getType() === 'system') {
      systemMessages.push(msg);
    } else if (msg._getType() === 'human') {
      humanMessages.push(msg);
    } else if (msg._getType() === 'ai') {
      aiMessages.push(msg);
    } else if (msg._getType() === 'tool') {
      toolMessages.push(msg);
    } else {
      otherMessages.push(msg);
    }
  }
  
  // Mantener solo los últimos N mensajes de cada tipo
  const limitedSystemMessages = systemMessages.slice(-limit);
  const limitedHumanMessages = humanMessages.slice(-limit);
  const limitedAIMessages = aiMessages.slice(-limit);
  const limitedToolMessages = toolMessages.slice(-limit);
  const limitedOtherMessages = otherMessages.slice(-limit);

  console.log("systemMessages.length: ", systemMessages.length);
  console.log("humanMessages.length: ", humanMessages.length);
  console.log("aiMessages.length: ", aiMessages.length);
  console.log("toolMessages.length: ", toolMessages.length);
  console.log("otherMessages.length: ", otherMessages.length);
  console.log("------------------------------------------")
  
  // Reconstruir el array manteniendo el orden cronológico aproximado
  // Intercalamos los mensajes manteniendo una secuencia lógica
  const result: BaseMessage[] = [];
  
  // Primero agregamos los system messages (suelen ir al inicio)
  result.push(...limitedSystemMessages);
  
  // Luego intercalamos human, ai y tool messages
  const maxLength = Math.max(
    limitedHumanMessages.length,
    limitedAIMessages.length,
    limitedToolMessages.length
  );
  
  for (let i = 0; i < maxLength; i++) {
    if (i < limitedHumanMessages.length) {
      result.push(limitedHumanMessages[i]);
    }
    if (i < limitedToolMessages.length) {
      result.push(limitedToolMessages[i]);
    }
    if (i < limitedAIMessages.length) {
      result.push(limitedAIMessages[i]);
    }
  }
  
  // Finalmente otros mensajes
  result.push(...limitedOtherMessages);
  
  return result;
}