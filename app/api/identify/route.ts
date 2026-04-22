import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Functie om de afbeelding van Wikipedia op te halen
async function getWikipediaImage(commonName: string, scientificName: string): Promise<string | null> {
  const fetchImageForTerm = async (term: string): Promise<string | null> => {
    if (!term) return null;
    try {
      console.log(`Wikipedia: Searching for term: "${term}"`);
      const searchUrl = `https://nl.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&format=json&utf8=1`;
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) return null;

      const searchData = await searchResponse.json();
      if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
        console.log(`Wikipedia: No search results for "${term}"`);
        return null;
      }

      const pageTitle = searchData.query.search[0].title;
      const imageUrlApi = `https://nl.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=300&format=json&utf8=1`;

      const imageResponse = await fetch(imageUrlApi);
      if (!imageResponse.ok) return null;

      const imageData = await imageResponse.json();
      const pages = imageData.query.pages;
      const pageId = Object.keys(pages)[0];
      
      if (pageId === '-1' || !pages[pageId].thumbnail) {
        console.log(`Wikipedia: No image found for page "${pageTitle}"`);
        return null;
      }
      
      console.log(`Wikipedia: Found image for "${term}": ${pages[pageId].thumbnail.source}`);
      return pages[pageId].thumbnail.source;
    } catch (error) {
      console.error(`Error fetching Wikipedia image for term "${term}":`, error);
      return null;
    }
  };

  // 1. Try with the scientific name (more specific)
  let imageUrl = await fetchImageForTerm(scientificName);
  if (imageUrl) return imageUrl;

  // 2. If that fails, fall back to the common name
  console.log(`Scientific name search failed, trying common name: "${commonName}"`);
  imageUrl = await fetchImageForTerm(commonName);
  if (imageUrl) return imageUrl;
  
  console.log(`Could not find any Wikipedia image for "${commonName}" or "${scientificName}"`);
  return null;
}

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API Key niet geconfigureerd" },
        { status: 500 }
      );
    }

    const base64Data = image.split(",")[1];
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Identificeer de plant, struik of boom op deze foto.
      Geef het resultaat terug in dit exacte JSON formaat (alleen de JSON).
      Gebruik de volgende veldnamen: commonName, scientificName, maintenance, category, tips.
      - commonName: De meest gebruikte Nederlandse naam.
      - scientificName: De wetenschappelijke (Latijnse) naam.
      - maintenance: Kies uit: Zeer makkelijk, Lekker makkelijk, Gemiddeld, Uitdagend.
      - category: Kies uit: tuin, huis, natuur.
      - tips: Geef kort en krachtig 2 of 3 verzorgingstips in het Nederlands.

      Voorbeeld:
      {
        "commonName": "Goudiep",
        "scientificName": "Ulmus glabra 'Lutescens'",
        "maintenance": "Lekker makkelijk",
        "category": "tuin",
        "tips": "Houd de grond licht vochtig. Prefereert een zonnige standplaats. Snoei in de late herfst om de vorm te behouden."
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const plantData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!plantData) {
      throw new Error("Geen geldige data ontvangen van AI");
    }

    // For backward compatibility with the frontend, create the 'name' field
    plantData.name = `${plantData.commonName} (${plantData.scientificName})`;

    const wikipediaImage = await getWikipediaImage(plantData.commonName, plantData.scientificName);
    plantData.databaseImage = wikipediaImage || "https://via.placeholder.com/300x200.png?text=Geen+afbeelding+gevonden";

    return NextResponse.json(plantData);
  } catch (error) {
    console.error("Fout bij identificatie:", error);
    return NextResponse.json(
      { error: "Kon de plant niet identificeren. Probeer het opnieuw met een duidelijkere foto." },
      { status: 500 }
    );
  }
}
