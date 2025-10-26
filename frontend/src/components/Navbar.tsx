import Link from "next/link";

export default function Navbar() {
    return (
      <div className="md:ml-[20%] ml-[5%] w-full">
        {/* Navbar */}
        <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6">
          <div className=" backdrop-blur-sm bg-white/5 border border-white/10 rounded-full shadow-2xl px-10 py-4">
            {/* Neomorphic inner glow */}
            <div className="absolute inset-0 rounded-full pointer-events-none" />
            
            <div className="relative flex items-center justify-center space-x-12">
              <Link href="/" className="text-white/70 hover:text-white transition-all duration-300 font-medium text-sm">
                Home
              </Link>
              <Link href="/intent" className="text-white/70 hover:text-white transition-all duration-300 font-medium text-sm">
                Submit Intent
              </Link>
              <Link href="/claims" className="text-white/70 hover:text-white transition-all duration-300 font-medium text-sm">
                View Claims
              </Link>
              <Link href="/pool" className="text-white/70 hover:text-white transition-all duration-300 font-medium text-sm">
                Pool
              </Link>
              <Link href="/simulation" className="text-white/70 hover:text-white transition-all duration-300 font-medium text-sm">
                Simulation
              </Link>
              <Link href="/working" className="text-white/70 hover:text-white transition-all duration-300 font-medium text-sm">
                How It Works?
              </Link>
            </div>
          </div>
        </nav>
      </div>
    );
  }