# SmartFarm AI
## AI-Based Smart Farming Dashboard for Decision Support

A software-only, smartphone-friendly college IPD prototype that combines farm context, live weather, plant-disease screening, irrigation rules, explainable AI recommendations, alerts, market/scheme information, mapped procurement-related locations, timeline history, multilingual UI and an AI chatbot.

## Stack
- Frontend: React + Vite + JavaScript + responsive CSS
- Backend: FastAPI + Python
- Database/Auth: Supabase PostgreSQL + Supabase Authentication + RLS
- Weather: Open-Meteo
- Disease AI: Transformers.js + ONNX MobileNetV2 plant-disease model running in the browser
- Reasoning/chat: Gemini API through FastAPI backend
- Maps/procurement discovery: OpenStreetMap Overpass + Google Maps directions links

No ESP32, Arduino, physical sensors, drones, satellite hardware, RFID or camera hardware is required. Soil moisture is explicitly farmer-entered.

## 1. Supabase setup
1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. In Authentication > Providers, enable Email/Password.
5. For a college demo, you may disable email confirmation temporarily in Auth settings, or keep it enabled and confirm the registration email.
6. Copy the project URL and publishable/anon key.

## 2. Frontend
```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```
Set in `frontend/.env`:
```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_API_BASE_URL=http://localhost:8000
```
Open http://localhost:5173.

## 3. Backend
Open a second terminal:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```
Set:
```env
GEMINI_API_KEY=YOUR_GEMINI_KEY
ALLOWED_ORIGINS=http://localhost:5173
```
If Gemini is not configured, the chatbot clearly says so and the rule-based irrigation/recommendation features still work.

## 4. Demo flow
1. Register with email/password.
2. Login.
3. Create a farm and enter crop, stage, location and farmer-entered soil moisture.
4. Open Weather for live Open-Meteo data.
5. Open Disease AI and upload a leaf image. The first inference downloads the ONNX model.
6. Generate AI recommendation; review the explanation factors.
7. Check irrigation.
8. Review schemes, procurement map results, market state and timeline.
9. Ask the chatbot.
10. Switch English/Telugu/Hindi.

## Disease model
The frontend uses `onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX` with Transformers.js. The model card reports 38 PlantVillage-style classes and a self-reported evaluation accuracy of 0.9541. Treat it as AI-assisted screening, not expert diagnosis.

## Data transparency
- Weather: Open-Meteo
- Disease: Hugging Face ONNX model, AI-assisted screening
- Maps: OpenStreetMap / Overpass
- Schemes: official government portals linked in the application
- Market: no fabricated live prices; a provider can be configured later

## Security
- Supabase publishable/anon key belongs in the frontend environment; never put a service-role key in frontend code.
- Gemini key stays in backend `.env`.
- Private tables use Row Level Security so users access only their own farm records.

## Troubleshooting
### `streamlit` command not found
This project is React/Vite, not Streamlit. Do not run `streamlit run app.py`. Use `npm run dev` in `frontend`.

### PowerShell blocks venv activation
Run:
```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\venv\Scripts\Activate.ps1
```

### Frontend says Supabase is not configured
Create `frontend/.env` from `.env.example`, fill the two Supabase values, then restart Vite.

### Weather fails
Confirm the backend is running on port 8000 and try again. The dashboard shows an error state instead of a blank screen.

### Disease model is slow the first time
Expected: the ONNX model must download once. Later inference is much faster. A stable internet connection is needed for the first model download.

## Build for deployment
Frontend:
```powershell
npm run build
```
Backend:
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Deploy frontend to Vercel/Netlify and backend to a Python-compatible host. Set the same environment variables in the deployment dashboard. Configure `ALLOWED_ORIGINS` to your deployed frontend origin.
