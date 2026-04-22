import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Functie om de afbeelding van Wikipedia op te halen
async function getWikipediaImage(plantName: string): Promise<string | null> {
  const fetchImageForTerm = async (term: string): Promise<string | null> => {
    if (!term) return null;
    try {
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
      
      return pages[pageId].thumbnail.source;
    } catch (error) {
      console.error(`Error fetching Wikipedia image for term "${term}":`, error);
      return null;
    }
  };

  // 1. Try with the base name
  const baseName = plantName.split('(')[0].trim();
  let imageUrl = await fetchImageForTerm(baseName);
  if (imageUrl) return imageUrl;

  // 2. If that fails, try with the name in parentheses (Latin name)
  const latinNameMatch = plantName.match(/\(([^)]+)\)/);
  if (latinNameMatch && latinNameMatch[1]) {
    const latinName = latinNameMatch[1].trim();
    console.log(`Base name search failed, trying Latin name: "${latinName}"`);
    imageUrl = await fetchImageForTerm(latinName);
    if (imageUrl) return imageUrl;
  }

  console.log(`Could not find any Wikipedia image for "${plantName}"`);
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

    // De afbeelding komt binnen als base64 (data:image/jpeg;base64,...)
    const base64Data = image.split(",")[1];

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Identificeer de plant, struik of boom op deze foto.
      Geef het resultaat terug in dit exacte JSON formaat (alleen de JSON):
      {
        "name": "De volledige naam van de plant (Latijnse naam tussen haakjes)",
        "maintenance": "Kies uit: Zeer makkelijk, Lekker makkelijk, Gemiddeld, Uitdagend",
        "category": "Kies uit: tuin, huis, natuur (tuin voor tuinplanten, huis voor kamerplanten, natuur voor wilde planten)",
        "tips": "Geef kort en krachtig 2 of 3 verzorgingstips in het Nederlands, specifiek over water geven, zonlicht en snoeien."
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const responseText = result.response.text();
    // Gemini geeft soms markdown terug, we willen alleen de JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const plantData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!plantData) {
      throw new Error("Geen geldige data ontvangen van AI");
    }

    // Haal de afbeelding op van Wikipedia
    const wikipediaImage = await getWikipediaImage(plantData.name);

    // Voeg de afbeelding toe aan de plantData, fallback naar placeholder
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
