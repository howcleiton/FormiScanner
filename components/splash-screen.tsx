"use client"

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#003366] animate-fade-in">
      <div className="text-center">
        <img src="/logo.png" alt="FormiRotas Logo" className="w-64 h-auto mx-auto animate-pulse" />
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-2 h-2 bg-[#00FFFF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-[#00FFFF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-[#00FFFF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  )
}
