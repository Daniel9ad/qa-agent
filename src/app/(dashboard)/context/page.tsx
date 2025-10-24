'use client';

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

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

  const handleAnalyze = async () => {
    setIsOpen(true)
    setIsLoading(true)
    setResult(null)
    setMetadata(null)
    
    try {
      const response = await fetch('/api/agents/context-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: 've a google.com',
          // Configuración opcional del agente
          config: {
            verbose: true,
            // Puedes sobrescribir otras configuraciones aquí si es necesario
            // model: 'gemini-1.5-pro',
            // temperature: 0.9,
          },
          // La API key se puede pasar aquí o usar variable de entorno
          // googleApiKey: 'tu-api-key-aqui',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al ejecutar el agente');
      }

      setResult(data.result);
      setMetadata(data.metadata);
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

  const handleCancel = () => {
    setIsOpen(false)
    setIsLoading(false)
    setResult(null)
    setMetadata(null)
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Button onClick={handleAnalyze}>
        Realizar Análisis
      </Button>

      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {isLoading ? 'Analizando con Agente IA...' : result?.success ? 'Análisis Completado' : 'Error en el Análisis'}
            </DialogTitle>
            <DialogDescription>
              {isLoading 
                ? 'El agente está procesando la información utilizando LangGraph...'
                : result?.success 
                ? 'El análisis se completó exitosamente.'
                : 'Ocurrió un error durante el análisis.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Estado del resultado */}
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.success ? 'Éxito' : 'Error'}
                </span>
              </div>

              {/* Metadatos */}
              {metadata && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-sm">Información de Ejecución</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Agente:</span>
                      <span className="ml-2 font-medium">{metadata.agentName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <span className="ml-2 font-medium">{metadata.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Iteraciones:</span>
                      <span className="ml-2 font-medium">{metadata.iterationCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duración:</span>
                      <span className="ml-2 font-medium">
                        {metadata.duration ? `${(metadata.duration / 1000).toFixed(2)}s` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensajes del agente */}
              {result.messages && result.messages.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Mensajes del Agente</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.messages.map((message: any, index: number) => (
                      <div 
                        key={index}
                        className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm"
                      >
                        <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          {message.constructor?.name || 'Message'} #{index + 1}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
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
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-red-900 dark:text-red-100 mb-2">
                    Error
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {result.error}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancel}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}