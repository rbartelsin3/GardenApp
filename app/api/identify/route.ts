import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

    // Voeg databaseImage toe aan plantData na parsing
    plantData.databaseImage = "https://via.placeholder.com/300x200.png?text=Plant+" + encodeURIComponent(plantData.name || 'Onbekend');

    return NextResponse.json(plantData);
  } catch (error) {
    console.error("Fout bij identificatie:", error);
    return NextResponse.json(
      { error: "Kon de plant niet identificeren. Probeer het opnieuw met een duidelijkere foto." },
      { status: 500 }
    );
  }
}
