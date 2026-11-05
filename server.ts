import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());



// Proxy endpoint for live weather data via Open-Meteo
app.get('/api/weather', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = req.query.lat as string;
    const lon = req.query.lon as string;

    if (!lat || !lon) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&forecast_days=16&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m&hourly=temperature_2m,apparent_temperature,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;

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

// Favicon route serving prbuck.png
app.get(['/favicon.ico', '/favicon.png'], (_req: Request, res: Response): void => {
  res.sendFile(path.resolve(__dirname, 'public/assets/aistudio/prbuck_6f2dde9d.png'));
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
