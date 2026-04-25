export default function AuthLayout({ children }) {
  return (
    <div className="app-bg min-h-screen w-full flex items-center justify-center px-4 relative">
      
      {/* Background overlay — click disabled */}
      <div className="absolute inset-0 bg-black/70 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>

    </div>
  );
}
