'use client';

export default function ResultsPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="bg-[#0F1E19] h-[72px] flex items-center justify-between px-10">
        <h1 className="text-2xl font-semibold text-[#E5F5ED]">
          Resultados
        </h1>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-10 overflow-auto">
        <div className="bg-[#0F1E19] rounded-xl p-6 text-center">
          <p className="text-[#9CA8A3] text-lg mb-2">
            Resultados de Pruebas
          </p>
          <p className="text-[#6B7F77] text-sm">
            Aquí podrás ver los resultados y métricas de tus pruebas ejecutadas.
          </p>
        </div>
      </div>
    </div>
  );
}
