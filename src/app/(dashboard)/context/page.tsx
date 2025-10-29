'use client';

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, Edit, RefreshCw } from 'lucide-react'
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

export default function ContextPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AgentResult | null>(null)
  const [metadata, setMetadata] = useState<AgentMetadata | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(true)
  const { selectedProject, selectedProjectId } = useAppSelector((state) => state.project);
  
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
  
  const handleScan = async () => {
    setIsOpen(true)
    setIsLoading(true)
    setResult(null)
    setMetadata(null)
    
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
          input: `Ve a ${selectedProject?.url} y explora a detalle este web, obten (5) rutas y guadarlas con tu herramienta para guardar rutas, este es el proyecto ID: ${selectedProjectId}${existingRoutesText}`,
          config: {
            verbose: true,
          },
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al ejecutar el agente');
      }

      setResult(data.result);
      setMetadata(data.metadata);
      
      // Recargar las rutas después de escanear
      await fetchRoutes()
    } catch (error) {
      console.error('Error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCloseDialog = () => {
    setIsOpen(false)
    setIsLoading(false)
    setResult(null)
    setMetadata(null)
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
        <h1 className="text-2xl font-semibold text-[#E5F5ED]">
          Contexto de Vistas - {selectedProject?.name || 'Sin proyecto'}
        </h1>
        <div className="flex gap-3">
          <Button
            onClick={handleScan}
            className="bg-[#4ADE80] hover:bg-[#3DBE6C] text-[#0A1612] font-semibold"
            disabled={!selectedProjectId}
          >
            Escanear
          </Button>
          <Button
            variant="outline"
            className="bg-[#1F3D32] hover:bg-[#2A4D3D] text-[#4ADE80] border-[#2E4A3D]"
            disabled
          >
            Guardar
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
                ESTADO
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
                  {/* <div className="w-32 flex justify-start">
                    {getStatusBadge(route.explored)}
                  </div> */}
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
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0F1E19] border-[#1A2E26]" onInteractOutside={(e) => e.preventDefault()}>
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
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#4ADE80]" />
              <p className="text-sm text-[#6B7F77]">
                Esto puede tomar algunos minutos...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
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

              {/* Mensajes del agente */}
              {result.messages && result.messages.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-[#E5F5ED]">Mensajes del Agente</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.messages.map((message: any, index: number) => (
                      <div 
                        key={index}
                        className="bg-[#1A2E26] rounded-lg p-3 text-sm"
                      >
                        <div className="font-medium text-[#4ADE80] mb-1">
                          {message.constructor?.name || 'Message'} #{index + 1}
                        </div>
                        <div className="text-[#9CA8A3] whitespace-pre-wrap">
                          {typeof message.content === 'string' 
                            ? message.content 
                            : JSON.stringify(message.content, null, 2)
                          }
                        </div>
                      </div>
                    ))}
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
          ) : null}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseDialog}
              className="bg-[#1F3D32] hover:bg-[#2A4D3D] text-[#4ADE80] border-[#2E4A3D]"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}