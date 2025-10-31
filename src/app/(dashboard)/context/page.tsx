'use client';

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, Edit, RefreshCw, Database } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAppSelector } from "@/hooks/use-store";

interface Route {
  _id: string;
  url: string;
  description: string;
  id_vdb?: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  messages?: any[];
}

interface AgentMetadata {
  agentName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  iterationCount?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}

interface ProgressEvent {
  step: string;
  message: string;
  details?: any;
  timestamp?: string;
}

export default function ContextPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AgentResult | null>(null)
  const [metadata, setMetadata] = useState<AgentMetadata | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([])
  const [currentIteration, setCurrentIteration] = useState(0)
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false)
  const [embeddingsDialogOpen, setEmbeddingsDialogOpen] = useState(false)
  const [embeddingsResult, setEmbeddingsResult] = useState<any | null>(null)
  const [embeddingsProgress, setEmbeddingsProgress] = useState<ProgressEvent[]>([])
  const progressContainerRef = useRef<HTMLDivElement>(null)
  const embeddingsProgressRef = useRef<HTMLDivElement>(null)
  const { selectedProject, selectedProjectId } = useAppSelector((state) => state.project);
  
  // Auto-scroll al último evento
  useEffect(() => {
    if (progressContainerRef.current) {
      progressContainerRef.current.scrollTop = progressContainerRef.current.scrollHeight;
    }
  }, [progressEvents]);
  
  // Auto-scroll para embeddings
  useEffect(() => {
    if (embeddingsProgressRef.current) {
      embeddingsProgressRef.current.scrollTop = embeddingsProgressRef.current.scrollHeight;
    }
  }, [embeddingsProgress]);
  
  // Cargar rutas al montar el componente
  useEffect(() => {
    if (selectedProjectId) {
      fetchRoutes()
    }
  }, [selectedProjectId])

  const fetchRoutes = async () => {
    if (!selectedProjectId) return;
    
    setLoadingRoutes(true)
    try {
      const response = await fetch(`/api/routes?projectId=${selectedProjectId}`)
      if (response.ok) {
        const data = await response.json()
        setRoutes(data.routes || [])
      }
    } catch (error) {
      console.error('Error al cargar rutas:', error)
    } finally {
      setLoadingRoutes(false)
    }
  }

  const handleGenerateEmbeddings = async () => {
    if (!selectedProjectId) return;

    setEmbeddingsDialogOpen(true);
    setGeneratingEmbeddings(true);
    setEmbeddingsResult(null);
    setEmbeddingsProgress([]);

    try {
      const response = await fetch('/api/routes/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });

      if (!response.ok) {
        throw new Error('Error al generar embeddings');
      }

      // Leer el stream de SSE
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No se pudo obtener el stream de respuesta');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const eventData = JSON.parse(dataMatch[1]);

            switch (eventType) {
              case 'start':
                setEmbeddingsProgress(prev => [...prev, {
                  step: 'start',
                  message: eventData.message,
                  timestamp: eventData.timestamp,
                }]);
                break;

              case 'progress':
                setEmbeddingsProgress(prev => [...prev, {
                  step: eventData.step,
                  message: eventData.message,
                  details: eventData.details,
                  timestamp: new Date().toISOString(),
                }]);
                break;

              case 'complete':
                setEmbeddingsResult(eventData.result);
                setGeneratingEmbeddings(false);
                setEmbeddingsProgress(prev => [...prev, {
                  step: 'complete',
                  message: eventData.message,
                  timestamp: eventData.timestamp,
                }]);
                // Recargar las rutas después de completar
                await fetchRoutes();
                break;

              case 'error':
                setEmbeddingsResult({
                  success: false,
                  error: eventData.details,
                });
                setGeneratingEmbeddings(false);
                setEmbeddingsProgress(prev => [...prev, {
                  step: 'error',
                  message: eventData.error,
                  details: eventData.details,
                  timestamp: eventData.timestamp,
                }]);
                break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al generar embeddings:', error);
      setEmbeddingsResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
      setGeneratingEmbeddings(false);
      setEmbeddingsProgress(prev => [...prev, {
        step: 'error',
        message: 'Error en la conexión',
        details: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
      }]);
    }
  }

  const handleCloseEmbeddingsDialog = () => {
    setEmbeddingsDialogOpen(false);
    setGeneratingEmbeddings(false);
    setEmbeddingsResult(null);
    setEmbeddingsProgress([]);
  }
  
  const handleScan = async () => {
    setIsOpen(true)
    setIsLoading(true)
    setResult(null)
    setMetadata(null)
    setProgressEvents([])
    setCurrentIteration(0)
    
    try {
      // Construir el listado de rutas existentes
      const existingRoutesText = routes.length > 0 
        ? `\n\nRutas ya almacenadas (NO vuelvas a guardar estas):\n${routes.map(r => `- ${r.url}`).join('\n')}`
        : '';
      
      const response = await fetch('/api/agents/route-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: `Ve a ${selectedProject?.url} y explora a detalle este web, obten (2) rutas y guadarlas con tu herramienta para guardar rutas, este es el proyecto ID: ${selectedProjectId}${existingRoutesText}`,
          config: {
            verbose: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error al ejecutar el agente');
      }

      // Leer el stream de SSE
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No se pudo obtener el stream de respuesta');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            const eventData = JSON.parse(dataMatch[1]);

            switch (eventType) {
              case 'start':
                setProgressEvents(prev => [...prev, {
                  step: 'start',
                  message: eventData.message,
                  timestamp: eventData.timestamp,
                }]);
                break;

              case 'progress':
                setProgressEvents(prev => [...prev, {
                  step: eventData.step,
                  message: eventData.message,
                  details: eventData.details,
                  timestamp: new Date().toISOString(),
                }]);
                
                // Actualizar contador de iteraciones
                if (eventData.details?.iteration) {
                  setCurrentIteration(eventData.details.iteration);
                }
                break;

              case 'complete':
                setResult(eventData.result);
                setMetadata(eventData.metadata);
                setIsLoading(false);
                setProgressEvents(prev => [...prev, {
                  step: 'complete',
                  message: 'Proceso completado exitosamente',
                  timestamp: eventData.timestamp,
                }]);
                // Recargar las rutas después de completar
                await fetchRoutes();
                break;

              case 'error':
                setResult({
                  success: false,
                  error: eventData.details,
                });
                setIsLoading(false);
                setProgressEvents(prev => [...prev, {
                  step: 'error',
                  message: eventData.error,
                  details: eventData.details,
                  timestamp: eventData.timestamp,
                }]);
                break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
      setIsLoading(false);
      setProgressEvents(prev => [...prev, {
        step: 'error',
        message: 'Error en la conexión',
        details: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
      }]);
    }
  }

  const handleCloseDialog = () => {
    setIsOpen(false)
    setIsLoading(false)
    setResult(null)
    setMetadata(null)
    setProgressEvents([])
  }

  // const getStatusBadge = (explored: boolean) => {
  //   if (explored) {
  //     return (
  //       <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1F3D32] rounded-full">
  //         <CheckCircle2 className="h-3 w-3 text-[#4ADE80]" />
  //         <span className="text-xs text-[#4ADE80]">Escaneado</span>
  //       </div>
  //     )
  //   }
  //   return (
  //     <div className="flex items-center gap-1.5 px-3 py-1 bg-[#3D2E1F] rounded-full">
  //       <RefreshCw className="h-3 w-3 text-[#DEA154]" />
  //       <span className="text-xs text-[#DEA154]">Pendiente</span>
  //     </div>
  //   )
  // }

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="bg-[#0F1E19] border-b border-[#1A2E26] px-10 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#E5F5ED]">
            Contexto de Vistas - {selectedProject?.name || 'Sin proyecto'}
          </h1>
          {routes.length > 0 && (
            <p className="text-sm text-[#6B7F77] mt-1">
              {routes.filter(r => r.id_vdb).length} de {routes.length} rutas con embeddings generados
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleGenerateEmbeddings}
            className="bg-[#DEA154] hover:bg-[#C88D44] text-[#0A1612] font-semibold flex items-center gap-2"
            disabled={!selectedProjectId || generatingEmbeddings || routes.length === 0}
          >
            {generatingEmbeddings ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Generar Embeddings
              </>
            )}
          </Button>
          <Button
            onClick={handleScan}
            className="bg-[#4ADE80] hover:bg-[#3DBE6C] text-[#0A1612] font-semibold"
            disabled={!selectedProjectId}
          >
            Escanear
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="bg-[#0F1E19] rounded-xl p-5">
          {/* Table Header */}
          <div className="bg-[#1A2E26] rounded-lg px-5 py-3 flex items-center mb-3">
            <div className="flex-1">
              <span className="text-xs font-semibold text-[#9CA8A3] tracking-wider">
                RUTA
              </span>
            </div>
            <div className="w-32">
              <span className="text-xs font-semibold text-[#9CA8A3] tracking-wider">
                EMBEDDINGS
              </span>
            </div>
            <div className="w-24"></div>
          </div>

          {/* Routes List */}
          {loadingRoutes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#4ADE80]" />
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6B7F77] text-sm">
                No hay rutas registradas. Haz clic en "Escanear" para comenzar.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {routes.map((route) => (
                <div
                  key={route._id}
                  className="bg-[#1A2E26] rounded-lg px-5 py-5 flex items-center"
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#E5F5ED] mb-2">
                      {route.url}
                    </h3>
                    <p className="text-xs text-[#6B7F77] leading-relaxed">
                      {route.description || 'Sin descripción disponible.'}
                    </p>
                  </div>
                  <div className="w-32 flex justify-start">
                    {route.id_vdb ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1F3D32] rounded-full">
                        <Database className="h-3 w-3 text-[#4ADE80]" />
                        <span className="text-xs text-[#4ADE80]">Generado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#3D2E1F] rounded-full">
                        <Database className="h-3 w-3 text-[#DEA154]" />
                        <span className="text-xs text-[#DEA154]">Pendiente</span>
                      </div>
                    )}
                  </div>
                  <div className="w-24 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent h-7 px-4 border-[#2E4A3D] text-[#4ADE80] hover:bg-[#1F3D32]"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))}

              {/* Indicador de más rutas */}
              {routes.length > 3 && (
                <button className="w-full py-4 border-2 border-dashed border-[#2E4A3D] rounded-lg text-[#4ADE80] text-sm hover:bg-[#1A2E26] transition-colors">
                  + {routes.length - 3} vistas más
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scanning Dialog */}
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0F1E19] border-[#1A2E26]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-[#E5F5ED]">
              {isLoading ? 'Escaneando Rutas...' : result?.success ? 'Escaneo Completado' : 'Error en el Escaneo'}
            </DialogTitle>
            <DialogDescription className="text-[#9CA8A3]">
              {isLoading 
                ? 'El agente está explorando y analizando las rutas del proyecto...'
                : result?.success 
                ? 'El escaneo se completó exitosamente.'
                : 'Ocurrió un error durante el escaneo.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {/* Progress Events Stream */}
          {progressEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[#E5F5ED] flex items-center gap-2">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''} text-[#4ADE80]`} />
                  Proceso en tiempo real
                </h3>
                {isLoading && currentIteration > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#1F3D32] rounded-full">
                    <div className="h-2 w-2 bg-[#4ADE80] rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-[#4ADE80]">
                      Iteración {currentIteration}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-[#0A1612] rounded-lg p-4 max-h-96 overflow-y-auto space-y-2" ref={progressContainerRef}>
                {progressEvents.map((event, index) => (
                  <div 
                    key={index}
                    className={`text-sm border-l-2 pl-3 py-2 ${
                      event.step === 'error' || event.step === 'mcp_error' || event.step === 'agent_error'
                        ? 'border-red-500 bg-red-950/20' 
                        : event.step === 'complete' || event.step === 'agent_complete' || event.step === 'mcp_complete'
                        ? 'border-[#4ADE80] bg-[#1F3D32]/30'
                        : event.step === 'tool_call' || event.step === 'mcp_connecting' || event.step === 'mcp_connected'
                        ? 'border-[#DEA154] bg-[#3D2E1F]/30'
                        : event.step === 'agent_iteration' || event.step === 'agent_thinking'
                        ? 'border-blue-500 bg-blue-950/20'
                        : event.step === 'mcp_warning'
                        ? 'border-yellow-500 bg-yellow-950/20'
                        : 'border-[#2E4A3D] bg-[#1A2E26]/30'
                    } rounded`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {event.details?.iteration && (
                            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-[#1F3D32] rounded text-xs font-bold text-[#4ADE80]">
                              #{event.details.iteration}
                            </span>
                          )}
                          <div className={`font-medium ${
                            event.step === 'error' || event.step === 'mcp_error' || event.step === 'agent_error'
                              ? 'text-red-400' 
                              : event.step === 'complete' || event.step === 'agent_complete' || event.step === 'mcp_complete'
                              ? 'text-[#4ADE80]'
                              : event.step === 'tool_call' || event.step === 'mcp_connecting' || event.step === 'mcp_connected'
                              ? 'text-[#DEA154]'
                              : event.step === 'agent_iteration' || event.step === 'agent_thinking'
                              ? 'text-blue-400'
                              : event.step === 'mcp_warning'
                              ? 'text-yellow-400'
                              : 'text-[#9CA8A3]'
                          }`}>
                            {event.message}
                          </div>
                        </div>
                        {event.details && (
                          <div className="text-xs text-[#6B7F77] space-y-1">
                            {event.details.messageType && (
                              <div>Tipo: <span className="font-mono text-[#9CA8A3]">{event.details.messageType}</span></div>
                            )}
                            {event.details.totalMessages && (
                              <div>Mensajes totales: {event.details.totalMessages}</div>
                            )}
                            {event.details.toolName && (
                              <div>Herramienta: <span className="text-[#DEA154] font-mono">{event.details.toolName}</span></div>
                            )}
                            {event.details.toolCalls && event.details.toolCalls.length > 0 && (
                              <div>Herramientas: <span className="font-mono">{event.details.toolCalls.join(', ')}</span></div>
                            )}
                            {event.details.preview && (
                              <div className="mt-1 p-2 bg-[#0F1E19] rounded text-xs italic text-[#9CA8A3]">
                                "{event.details.preview}..."
                              </div>
                            )}
                            {event.details.duration && (
                              <div>Duración: {(event.details.duration / 1000).toFixed(2)}s</div>
                            )}
                            {event.details.serverCount && (
                              <div>Servidores MCP: {event.details.serverCount}</div>
                            )}
                            {event.details.toolCount && (
                              <div>Herramientas agregadas: {event.details.toolCount}</div>
                            )}
                            {event.details.tools && event.details.tools.length > 0 && (
                              <div className="mt-1">
                                <div className="font-medium text-[#9CA8A3] mb-1">Herramientas MCP:</div>
                                <div className="pl-2 space-y-0.5">
                                  {event.details.tools.map((tool: string, i: number) => (
                                    <div key={i} className="text-[#4ADE80] font-mono">• {tool}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {event.details.identifier && (
                              <div>Servidor: <span className="font-mono text-[#9CA8A3]">{event.details.identifier}</span></div>
                            )}
                            {event.details.content && (
                              <div className="mt-1 p-2 bg-[#0F1E19] rounded text-xs font-mono">
                                {event.details.content}
                              </div>
                            )}
                            {event.details.args && (
                              <div className="mt-1 p-2 bg-[#0F1E19] rounded text-xs font-mono overflow-x-auto">
                                {JSON.stringify(event.details.args, null, 2)}
                              </div>
                            )}
                            {event.details.error && (
                              <div className="mt-1 p-2 bg-red-950/50 rounded text-xs text-red-300">
                                {event.details.error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {event.timestamp && (
                        <div className="text-xs text-[#6B7F77] whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center justify-center py-4 gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#4ADE80]" />
                    <span className="text-sm text-[#9CA8A3]">Procesando...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoading && result && (
            <div className="space-y-4 mt-4">
              {/* Estado del resultado */}
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-[#4ADE80]" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium text-[#E5F5ED]">
                  {result.success ? 'Éxito' : 'Error'}
                </span>
              </div>

              {/* Metadatos */}
              {metadata && (
                <div className="bg-[#1A2E26] rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-[#E5F5ED]">Información de Ejecución</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[#6B7F77]">Agente:</span>
                      <span className="ml-2 font-medium text-[#9CA8A3]">{metadata.agentName}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7F77]">Estado:</span>
                      <span className="ml-2 font-medium text-[#9CA8A3]">{metadata.status}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7F77]">Iteraciones:</span>
                      <span className="ml-2 font-medium text-[#9CA8A3]">{metadata.iterationCount}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7F77]">Duración:</span>
                      <span className="ml-2 font-medium text-[#9CA8A3]">
                        {metadata.duration ? `${(metadata.duration / 1000).toFixed(2)}s` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {result.error && (
                <div className="bg-red-950 rounded-lg p-4 border border-red-800">
                  <h3 className="font-semibold text-sm text-red-200 mb-2">
                    Error
                  </h3>
                  <p className="text-sm text-red-300">
                    {result.error}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseDialog}
              disabled={isLoading}
              className="bg-[#1F3D32] hover:bg-[#2A4D3D] text-[#4ADE80] border-[#2E4A3D]"
            >
              {isLoading ? 'Procesando...' : 'Cerrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embeddings Generation Dialog */}
      <Dialog open={embeddingsDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0F1E19] border-[#1A2E26]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-[#E5F5ED]">
              {generatingEmbeddings ? 'Generando Embeddings...' : embeddingsResult?.success ? 'Embeddings Generados' : 'Error al Generar Embeddings'}
            </DialogTitle>
            <DialogDescription className="text-[#9CA8A3]">
              {generatingEmbeddings 
                ? 'Procesando las rutas y generando embeddings vectoriales...'
                : embeddingsResult?.success 
                ? 'La generación de embeddings se completó exitosamente.'
                : 'Ocurrió un error durante la generación de embeddings.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {/* Progress Events Stream */}
          {embeddingsProgress.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[#E5F5ED] flex items-center gap-2">
                  <Database className={`h-4 w-4 ${generatingEmbeddings ? 'animate-pulse' : ''} text-[#4ADE80]`} />
                  Proceso en tiempo real
                </h3>
                {generatingEmbeddings && embeddingsProgress.some(e => e.details?.current) && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#1F3D32] rounded-full">
                    <div className="h-2 w-2 bg-[#4ADE80] rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-[#4ADE80]">
                      {embeddingsProgress.filter(e => e.details?.current).slice(-1)[0]?.details?.current || 0} / {embeddingsProgress.filter(e => e.details?.total).slice(-1)[0]?.details?.total || 0}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-[#0A1612] rounded-lg p-4 max-h-96 overflow-y-auto space-y-2" ref={embeddingsProgressRef}>
                {embeddingsProgress.map((event, index) => (
                  <div 
                    key={index}
                    className={`text-sm border-l-2 pl-3 py-2 ${
                      event.step === 'error' || event.step === 'route_error'
                        ? 'border-red-500 bg-red-950/20' 
                        : event.step === 'complete' || event.step === 'route_completed'
                        ? 'border-[#4ADE80] bg-[#1F3D32]/30'
                        : event.step === 'processing_route' || event.step === 'generating_embedding' || event.step === 'saving_to_qdrant'
                        ? 'border-[#DEA154] bg-[#3D2E1F]/30'
                        : event.step === 'database_connect' || event.step === 'fetch_routes' || event.step === 'qdrant_setup' || event.step === 'embedding_model'
                        ? 'border-blue-500 bg-blue-950/20'
                        : event.step === 'route_skipped'
                        ? 'border-yellow-500 bg-yellow-950/20'
                        : 'border-[#2E4A3D] bg-[#1A2E26]/30'
                    } rounded`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {event.details?.current && event.details?.total && (
                            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-[#1F3D32] rounded text-xs font-bold text-[#4ADE80]">
                              {event.details.current}/{event.details.total}
                            </span>
                          )}
                          <div className={`font-medium ${
                            event.step === 'error' || event.step === 'route_error'
                              ? 'text-red-400' 
                              : event.step === 'complete' || event.step === 'route_completed'
                              ? 'text-[#4ADE80]'
                              : event.step === 'processing_route' || event.step === 'generating_embedding' || event.step === 'saving_to_qdrant'
                              ? 'text-[#DEA154]'
                              : event.step === 'database_connect' || event.step === 'fetch_routes' || event.step === 'qdrant_setup' || event.step === 'embedding_model'
                              ? 'text-blue-400'
                              : event.step === 'route_skipped'
                              ? 'text-yellow-400'
                              : 'text-[#9CA8A3]'
                          }`}>
                            {event.message}
                          </div>
                        </div>
                        {event.details && (
                          <div className="text-xs text-[#6B7F77] space-y-1">
                            {event.details.url && (
                              <div className="font-mono text-[#9CA8A3] break-all">{event.details.url}</div>
                            )}
                            {event.details.total && !event.details.current && (
                              <div>Total de rutas: {event.details.total}</div>
                            )}
                            {event.details.error && (
                              <div className="mt-1 p-2 bg-red-950/50 rounded text-xs text-red-300">
                                {event.details.error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {event.timestamp && (
                        <div className="text-xs text-[#6B7F77] whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {generatingEmbeddings && (
                  <div className="flex items-center justify-center py-4 gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#4ADE80]" />
                    <span className="text-sm text-[#9CA8A3]">Procesando...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!generatingEmbeddings && embeddingsResult && (
            <div className="space-y-4 mt-4">
              {/* Estado del resultado */}
              <div className="flex items-center gap-2">
                {embeddingsResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-[#4ADE80]" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium text-[#E5F5ED]">
                  {embeddingsResult.success ? 'Éxito' : 'Error'}
                </span>
              </div>

              {/* Resumen */}
              {embeddingsResult.success && (
                <div className="bg-[#1A2E26] rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm text-[#E5F5ED]">Resumen de Procesamiento</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[#6B7F77]">Procesadas:</span>
                      <span className="ml-2 font-medium text-[#4ADE80]">{embeddingsResult.processed}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7F77]">Total:</span>
                      <span className="ml-2 font-medium text-[#9CA8A3]">{embeddingsResult.total}</span>
                    </div>
                    {embeddingsResult.errors && embeddingsResult.errors.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-[#6B7F77]">Errores:</span>
                        <span className="ml-2 font-medium text-red-400">{embeddingsResult.errors.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {embeddingsResult.error && (
                <div className="bg-red-950 rounded-lg p-4 border border-red-800">
                  <h3 className="font-semibold text-sm text-red-200 mb-2">
                    Error
                  </h3>
                  <p className="text-sm text-red-300">
                    {embeddingsResult.error}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseEmbeddingsDialog}
              disabled={generatingEmbeddings}
              className="bg-[#1F3D32] hover:bg-[#2A4D3D] text-[#4ADE80] border-[#2E4A3D]"
            >
              {generatingEmbeddings ? 'Procesando...' : 'Cerrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}