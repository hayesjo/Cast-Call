import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize GoogleGenAI server-side with User-Agent header for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Proxy endpoint for AI Tactical Advisory
app.post('/api/advisor', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      mode, // 'fishing' | 'hunting'
      locationName,
      coordinates,
      conditions,
      customQuery,
    } = req.body;

    if (!locationName) {
      res.status(400).json({ error: 'Location name is required' });
      return;
    }

    const systemPrompt = `You are an elite, tournament-winning professional bass fishing guide and veteran North American master hunting outfitter.
Your goal is to provide deep, actionable, precision tactical advice based on realistic outdoor sciences:
- For hunting: analyze the exact date/season, whitetail rut phase (seeking, chasing, peak breeding lockdown, post-rut recovery, or secondary rut), moon phase, solunar feeding windows, barometric pressure trend (rapid drop before front vs rising post-front bluebird sky), wind direction and thermal scent dispersion.
- For bass fishing: analyze water temperature, seasonal thermocline, water clarity (clear, stained, muddy), light penetration (overcast vs bright midday sun), barometric trends, windward mudlines and plankton concentration, forage match (shad spawn, bluegill, crawfish molt), depth zones (shallows, transition drops, offshore humps/ledges), and exact lure selections with color, weight, trailer, line type, and retrieve cadence.
Provide structured, highly practical, punchy tactical recommendations formatted cleanly with markdown sections.`;

    const userPrompt = `Generate a tactical advisory briefing for:
Mode: ${mode === 'hunting' ? 'WHITETAIL / BIG GAME HUNTING' : 'LARGEMOUTH & SMALLMOUTH BASS FISHING'}
Location: ${locationName} ${coordinates ? `(Lat: ${coordinates.lat}, Lon: ${coordinates.lon})` : ''}
Current Conditions:
${JSON.stringify(conditions, null, 2)}

Specific Angler/Hunter Inquiry:
${customQuery || 'Provide the ultimate tactical game plan for maximizing success right now.'}

Please structure your briefing into:
1. **Conditions Impact & Strategic Overview** (How pressure, wind, temp, and solunar/rut align)
2. **Key Hotspots & Structure to Target** (Exact parts of the lake or terrain funnels/pinch points to focus on)
3. **Primary Tactical Arsenal** (Exact lures with colors/retrieves OR stand/blind setups with scent cone management)
4. **Hourly Action Window** (When the highest percentage bite or buck movement will occur)
5. **Pro Insider Edge** (A tournament/outfitter secret for these exact conditions)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const adviceText = response.text || 'Unable to generate tactical advisory at this time.';

    res.json({
      success: true,
      advice: adviceText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gemini Advisor Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate advisory',
      details: 'Check GEMINI_API_KEY settings if this persists.',
    });
  }
});

// Proxy endpoint for live weather data via Open-Meteo
app.get('/api/weather', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = req.query.lat as string;
    const lon = req.query.lon as string;

    if (!lat || !lon) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;

    const weatherRes = await fetch(openMeteoUrl);
    if (!weatherRes.ok) {
      throw new Error(`Open-Meteo returned status ${weatherRes.status}`);
    }

    const weatherData = await weatherRes.json();
    res.json(weatherData);
  } catch (error: any) {
    console.error('Weather Fetch Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch weather' });
  }
});

// Geocoding lookup proxy
app.get('/api/geocode', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      res.json({ results: [] });
      return;
    }

    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q.trim()
    )}&count=6&language=en&format=json`;

    const geoRes = await fetch(geocodeUrl);
    if (!geoRes.ok) {
      throw new Error(`Geocoding API error: ${geoRes.status}`);
    }

    const geoData = await geoRes.json();
    res.json(geoData);
  } catch (error: any) {
    console.error('Geocode Fetch Error:', error);
    res.status(500).json({ error: error.message || 'Failed to geocode query' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ApexCast & RutTrack server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
