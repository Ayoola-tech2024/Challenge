
import React from 'react';

interface LandingProps {
  onGetStarted: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  return (
    <div className="bg-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative pt-16 pb-32 flex content-center items-center justify-center min-h-[85vh]">
        <div className="absolute top-0 w-full h-full bg-center bg-cover bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop')] brightness-[0.15]">
        </div>
        <div className="container relative mx-auto px-4">
          <div className="items-center flex flex-wrap">
            <div className="w-full lg:w-8/12 px-4 ml-auto mr-auto text-center">
              <div className="animate-in fade-in zoom-in duration-700">
                <span className="text-indigo-500 font-bold uppercase tracking-widest text-sm mb-4 block">
                  AI-Powered Excellence
                </span>
                <h1 className="text-white font-black text-5xl md:text-7xl mb-6 leading-tight">
                  Master Your Exams with <span className="text-indigo-400">Precision</span>
                </h1>
                <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  The world's most advanced AI study partner. Upload notes, extract insights with OCR, 
                  and simulate real Computer-Based Tests (CBT) tailored specifically to your materials.
                </p>
                <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center">
                  <button
                    onClick={onGetStarted}
                    className="bg-indigo-600 text-white active:bg-indigo-700 text-lg font-bold px-10 py-5 rounded-2xl shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:-translate-y-1"
                  >
                    Get Started for Free
                  </button>
                  <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 text-lg font-bold px-10 py-5 rounded-2xl hover:bg-white/20 transition-all">
                    View Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="pb-20 bg-slate-50 -mt-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap">
            {[
              {
                title: "Intelligent Summaries",
                desc: "Turn 100-page PDFs into 5-minute briefings using Gemini's advanced reasoning.",
                icon: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.25c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25",
                color: "indigo"
              },
              {
                title: "Real CBT Simulation",
                desc: "Experience exam pressure with timed tests, marking schemes, and detailed analytics.",
                icon: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
                color: "emerald"
              },
              {
                title: "Smart OCR Scanning",
                desc: "Upload photos of handwritten notes or textbooks. Our AI extracts and analyzes every word.",
                icon: "M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z",
                color: "amber"
              }
            ].map((f, i) => (
              <div key={i} className="lg:pt-12 pt-6 w-full md:w-4/12 px-4 text-center">
                <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-3xl border border-slate-100 p-8 hover:-translate-y-2 transition-transform">
                  <div className={`text-white p-4 text-center inline-flex items-center justify-center w-16 h-16 mb-5 shadow-lg rounded-2xl bg-${f.color}-600 mx-auto`}>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                    </svg>
                  </div>
                  <h6 className="text-xl font-bold text-slate-800">{f.title}</h6>
                  <p className="mt-2 mb-4 text-slate-500 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
