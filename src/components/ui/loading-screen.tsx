interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Cargando" }: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen bg-[#0A1612] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Dual Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#2E4A3D] border-t-[#4ADE80] rounded-full animate-spin"></div>
          <div 
            className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-[#4ADE80] rounded-full animate-spin" 
            style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
          ></div>
        </div>
        
        {/* Text with animated dots */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[#E5F5ED] font-medium">{message}</p>
          <div className="flex gap-1">
            <span 
              className="w-2 h-2 bg-[#4ADE80] rounded-full animate-bounce" 
              style={{ animationDelay: "0ms" }}
            ></span>
            <span 
              className="w-2 h-2 bg-[#4ADE80] rounded-full animate-bounce" 
              style={{ animationDelay: "150ms" }}
            ></span>
            <span 
              className="w-2 h-2 bg-[#4ADE80] rounded-full animate-bounce" 
              style={{ animationDelay: "300ms" }}
            ></span>
          </div>
        </div>
      </div>
    </div>
  );
}
