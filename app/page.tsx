"use client";

import { useState, useEffect } from "react";
import Camera from "@/components/Camera";

interface SavedPlant {
  id: string;
  name: string;
  maintenance: string;
  tips: string;
  image?: string;
  date: string;
  rating: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"ontdekken" | "mijn-tuin">("ontdekken");
  const [showCamera, setShowCamera] = useState(false);
  const [savedPlants, setSavedPlants] = useState<SavedPlant[]>([]);
  const [scanResult, setScanResult] = useState<SavedPlant | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<SavedPlant | null>(null);

  // Simuleer laden uit localstorage
  useEffect(() => {
    const saved = localStorage.getItem("mijn-tuin");
    if (saved) setSavedPlants(JSON.parse(saved));

    const tutorialDone = localStorage.getItem("tutorial-done");
    if (!tutorialDone) {
      setShowTutorial(true);
    }
  }, []);

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("tutorial-done", "true");
  };

  const tutorialSteps = [
    {
      title: "Welkom bij TuinHulp! 🌿",
      text: "Hoi! Ik help je graag om je tuin nog mooier te maken. Zullen we even kort kijken hoe het werkt?",
      button: "Vertel me meer!",
    },
    {
      title: "Scan je planten 📸",
      text: "Zie je een plant, struik of boom die je niet kent? Klik op de grote bruine knop om een foto te maken. Wij vertellen je direct wat het is!",
      button: "Handig!",
    },
    {
      title: "Je eigen paradijsje 🏡",
      text: "Sla je favoriete vondsten op in 'Mijn Tuin'. Geef ze een rating en krijg persoonlijk advies om ze vrolijk te houden.",
      button: "Aan de slag!",
    }
  ];

  const handleCapture = async (imageSrc: string) => {
    setIsScanning(true);
    setShowCamera(false);
    setScanResult(null);

    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API Fout");
      }

      const data = await response.json();
      
      const newPlant: SavedPlant = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        maintenance: data.maintenance,
        tips: data.tips,
        image: imageSrc,
        date: new Date().toLocaleDateString("nl-NL"),
        rating: 0,
      };
      setScanResult(newPlant);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Oeps! Er ging iets mis bij het herkennen van de plant.");
    } finally {
      setIsScanning(false);
    }
  };

  const updateResultRating = (rating: number) => {
    if (scanResult) {
      setScanResult({ ...scanResult, rating });
    }
  };

  const savePlant = () => {
    if (scanResult) {
      const updated = [scanResult, ...savedPlants];
      setSavedPlants(updated);
      localStorage.setItem("mijn-tuin", JSON.stringify(updated));
      setScanResult(null);
      setActiveTab("mijn-tuin");
    }
  };

  const deletePlant = (id: string) => {
    const updated = savedPlants.filter(p => p.id !== id);
    setSavedPlants(updated);
    localStorage.setItem("mijn-tuin", JSON.stringify(updated));
  };

  const StarRating = ({ rating, onRate, interactive = false }: { rating: number, onRate?: (r: number) => void, interactive?: boolean }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate && onRate(star)}
            className={`${interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}`}
            disabled={!interactive}
          >
            <svg
              className={`w-6 h-6 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-stone-300 fill-transparent"}`}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  const DecorativePlants = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
      {/* Bloem linksboven */}
      <svg className="absolute -top-10 -left-10 w-48 h-48 text-emerald-800 rotate-12" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 50c0-15 10-25 20-25s20 10 20 25-10 25-20 25-20-10-20-25zM50 50c15 0 25 10 25 20s-10 20-25 20-25-10-25-20 10-20 25-20zM50 50c0 15-10 25-20 25s-20-10-20-25 10-25 20-25 20 10 20 25zM50 50c-15 0-25-10-25-20s10-20 25-20 25 10 25 20-10 20-25 20z" />
        <circle cx="50" cy="50" r="10" fill="#8b5e34" />
      </svg>
      {/* Blaadje rechtsmidden */}
      <svg className="absolute top-1/2 -right-12 w-40 h-40 text-emerald-900 -rotate-45" viewBox="0 0 100 100" fill="currentColor">
        <path d="M10 90 Q 50 10 90 10 Q 50 90 10 90" />
        <path d="M10 90 L 90 10" stroke="#fdfaf5" strokeWidth="2" fill="none" />
      </svg>
      {/* Tulpje linksonder */}
      <svg className="absolute -bottom-10 left-1/4 w-32 h-32 text-[#8b5e34]" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 80 L 50 40 M30 40 Q 50 10 70 40 L 65 60 L 35 60 Z" />
        <path d="M50 80 Q 20 70 20 50 M50 80 Q 80 70 80 50" stroke="currentColor" strokeWidth="4" fill="none" />
      </svg>
    </div>
  );

  return (
    <main className="flex-1 flex flex-col bg-[#fdfaf5] relative overflow-hidden">
      <DecorativePlants />
      {/* Navigatie Tabs */}
      <nav className="flex justify-center gap-8 border-b border-stone-200 bg-[#fdfaf5]/80 backdrop-blur-md sticky top-0 z-50 pt-6">
        <button
          onClick={() => setActiveTab("ontdekken")}
          className={`pb-4 px-2 font-bold transition-colors ${
            activeTab === "ontdekken"
              ? "text-emerald-800 border-b-4 border-emerald-800"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Ontdekken
        </button>
        <button
          onClick={() => setActiveTab("mijn-tuin")}
          className={`pb-4 px-2 font-bold transition-colors ${
            activeTab === "mijn-tuin"
              ? "text-emerald-800 border-b-4 border-emerald-800"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Mijn Tuin
        </button>
      </nav>

      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab === "ontdekken" ? (
          <section className="px-6 py-12 flex flex-col items-center max-w-2xl mx-auto">
            <div className="bg-emerald-800 text-emerald-50 px-4 py-1 rounded-full text-sm font-bold mb-6 shadow-sm">
              Hoi daar, plantenliefhebber! 🌱
            </div>
            <h1 className="text-4xl font-extrabold text-stone-900 mb-4 text-center leading-tight">
              Wat groeit er in jouw tuin?
            </h1>
            <p className="text-stone-600 text-lg text-center mb-10 leading-relaxed">
              Maak een fotootje van een plant die je niet kent, dan vertellen wij je precies wat het is en hoe je hem vrolijk houdt.
            </p>
            
            <button
              onClick={() => setShowCamera(true)}
              disabled={isScanning}
              className="bg-[#8b5e34] hover:bg-[#724a29] text-white font-bold py-5 px-10 rounded-2xl shadow-xl shadow-stone-200 transform transition active:scale-95 text-xl flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Bezig met herkennen...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Plant Scannen
                </>
              )}
            </button>

            {/* Scan Resultaat Card */}
            {scanResult && (
              <div className="mt-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative h-64">
                  {scanResult.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={scanResult.image} alt="Je scan" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-4 right-4 bg-emerald-800 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg">
                    MATCH GEVONDEN
                  </div>
                </div>
                <div className="p-8 bg-[#fdfaf5]">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-black text-stone-900">{scanResult.name}</h2>
                    <StarRating rating={scanResult.rating} onRate={updateResultRating} interactive />
                  </div>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-md text-sm font-bold border border-emerald-200">
                      {scanResult.maintenance}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                      <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2 italic">Onze Tip</h3>
                      <p className="text-stone-800 leading-relaxed text-lg font-medium">&quot;{scanResult.tips}&quot;</p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={savePlant}
                      className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-emerald-100"
                    >
                      Opslaan in Mijn Tuin
                    </button>
                    <button
                      onClick={() => setScanResult(null)}
                      className="px-6 py-4 text-stone-400 hover:text-stone-600 font-bold"
                    >
                      Wissen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="px-6 py-12 max-w-4xl mx-auto">
            <h1 className="text-3xl font-black text-stone-900 mb-8 flex items-center gap-3">
              Mijn Groene Paradijsje
              <span className="text-sm font-normal text-stone-400 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
                {savedPlants.length} planten
              </span>
            </h1>

            {savedPlants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedPlants.map((plant) => (
                  <div 
                    key={plant.id} 
                    onClick={() => setSelectedPlant(plant)}
                    className="bg-white p-5 rounded-[2rem] shadow-sm border border-stone-100 flex gap-5 items-center hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-[#fdfaf5]">
                      <img src={plant.image} alt={plant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-stone-900 text-lg leading-tight">{plant.name}</h3>
                          <StarRating rating={plant.rating} />
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePlant(plant.id);
                          }}
                          className="text-stone-300 hover:text-red-400 transition-colors p-1"
                          title="Verwijder plant"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-stone-400 mb-2 uppercase tracking-tight font-bold">Gescand op {plant.date}</p>
                      <span className="text-xs bg-emerald-800 text-emerald-50 px-3 py-1 rounded-full font-bold">
                        {plant.maintenance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-stone-200 shadow-inner">
                <div className="text-5xl mb-6 opacity-50">🌿</div>
                <p className="text-stone-500 text-lg mb-8 max-w-xs mx-auto">Je tuin is nog even leeg... Tijd om op ontdekkingstocht te gaan!</p>
                <button
                  onClick={() => setActiveTab("ontdekken")}
                  className="bg-[#8b5e34] hover:bg-[#724a29] text-white font-bold py-3 px-8 rounded-full shadow-lg transition"
                >
                  Ga direct scannen
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {showCamera && (
        <Camera
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-4 border-emerald-800 animate-in zoom-in-95 duration-300 text-left">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-1">
                {tutorialSteps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all ${i === tutorialStep ? "w-6 bg-emerald-800" : "w-2 bg-stone-200"}`}
                  />
                ))}
              </div>
              <button onClick={finishTutorial} className="text-stone-300 hover:text-stone-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <h2 className="text-2xl font-black text-stone-900 mb-3">{tutorialSteps[tutorialStep].title}</h2>
            <p className="text-stone-600 leading-relaxed mb-8">{tutorialSteps[tutorialStep].text}</p>
            
            <button
              onClick={() => {
                if (tutorialStep < tutorialSteps.length - 1) {
                  setTutorialStep(tutorialStep + 1);
                } else {
                  finishTutorial();
                }
              }}
              className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg transition transform active:scale-95"
            >
              {tutorialSteps[tutorialStep].button}
            </button>
          </div>
        </div>
      )}

      {/* Selected Plant Detail Overlay */}
      {selectedPlant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] overflow-hidden max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 relative">
            <button 
              onClick={() => setSelectedPlant(null)}
              className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full text-stone-900 hover:text-emerald-800 transition-colors shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="h-64 relative">
              <img src={selectedPlant.image} alt={selectedPlant.name} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-stone-900/80 to-transparent p-8">
                <h2 className="text-3xl font-black text-white">{selectedPlant.name}</h2>
              </div>
            </div>

            <div className="p-8 bg-[#fdfaf5]">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-emerald-100 text-emerald-800 px-4 py-1 rounded-full text-sm font-bold border border-emerald-200">
                  {selectedPlant.maintenance}
                </span>
                <div className="flex flex-col items-end">
                  <StarRating rating={selectedPlant.rating} />
                  <span className="text-[10px] text-stone-400 uppercase font-black mt-1 tracking-widest">Je Rating</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-3 italic">Verzorgingsadvies</h3>
                  <p className="text-stone-800 leading-relaxed text-lg font-medium">{selectedPlant.tips}</p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-stone-400 font-bold">Gescand op {selectedPlant.date}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlant(null)}
                className="w-full mt-8 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg transition transform active:scale-95"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
    </main>
  );
}
