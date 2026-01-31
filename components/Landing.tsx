
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
                <span className="text-indigo-500 font-black uppercase tracking-[0.4em] text-xs mb-6 block">
                  AI-Powered Knowledge Synthesis
                </span>
                <h1 className="text-white font-black text-5xl md:text-8xl mb-6 tracking-tighter leading-none">
                  Learn Smarter with <span className="text-indigo-400">ExamPro</span>
                </h1>
                <p className="mt-8 text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
                  Upload photos, PDFs, or paste notes. Our neural engine generates instant summaries, key insights, and practice questions to master any subject.
                </p>
                <div className="mt-16 flex flex-col md:flex-row gap-6 justify-center">
                  <button
                    onClick={onGetStarted}
                    className="bg-indigo-600 text-white active:bg-indigo-700 text-xl font-black px-12 py-6 rounded-3xl shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all hover:-translate-y-2 active:scale-95"
                  >
                    Start Studying Free
                  </button>
                  <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 text-xl font-black px-12 py-6 rounded-3xl hover:bg-white/20 transition-all">
                    Learn Protocol
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="pb-24 bg-slate-50 -mt-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap">
            {[
              {
                title: "Neural Summarization",
                desc: "Distill complex lecture notes and heavy textbooks into high-impact Executive Briefings.",
                icon: "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.25c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25",
                color: "indigo"
              },
              {
                title: "Practice questions",
                desc: "Validate your knowledge with AI-generated questions designed to test deep comprehension.",
                icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .415.162.791.425 1.077m3.276-1.741a7.963 7.963 0 0 1 3.276 1.741m0 0a2.25 2.25 0 0 1-.223 3.146l-4.22 3.99a2.25 2.25 0 0 1-3.085 0l-4.22-3.99a2.25 2.25 0 0 1-.223-3.146 7.963 7.963 0 0 1 3.276-1.741",
                color: "indigo"
              },
              {
                title: "Smart OCR Scan",
                desc: "Instant text extraction from handwriting or printed notes using specialized scanning algorithms.",
                icon: "M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z",
                color: "indigo"
              }
            ].map((f, i) => (
              <div key={i} className="lg:pt-12 pt-6 w-full md:w-4/12 px-4 text-center">
                <div className="relative flex flex-col min-w-0 break-words liquid-glass w-full mb-8 shadow-2xl ios-squircle p-10 hover:-translate-y-2 transition-transform border-white/60">
                  <div className={`text-white p-5 text-center inline-flex items-center justify-center w-20 h-20 mb-8 shadow-2xl rounded-3xl bg-${f.color}-600 mx-auto shadow-indigo-200`}>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
                      <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                    </svg>
                  </div>
                  <h6 className="text-2xl font-black text-slate-900 tracking-tight">{f.title}</h6>
                  <p className="mt-4 mb-4 text-slate-500 font-bold leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <div className="py-20 text-center bg-white border-t border-slate-100">
         <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Developed by Ayoola Damisile • Powered by Damitechs</p>
      </div>
    </div>
  );
};
