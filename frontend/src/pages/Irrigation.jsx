import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
export default function Irrigation() {
  const { farm } = useApp();
  const [w, setW] = useState(null);
  const [r, setR] = useState(null);
  const [e, setE] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!farm) return;
    api.weather(farm.latitude, farm.longitude)
      .then(setW)
      .catch((x) => setE(x.message));
  }, [farm]);
  const run = async () => {
    if (!farm || !w) return;
    setBusy(true);
    setE('');
    setR(null);
    try {
      const result = await api.irrigation({
        crop_type: farm.crop_type,
        growth_stage: farm.growth_stage,
        farm_size: Number(farm.farm_size_acres ?? farm.farm_size),
        soil_moisture: Number(farm.soil_moisture),
        temperature: w.current?.temperature_2m,
        humidity: w.current?.relative_humidity_2m,
        rain_probability:
          w.daily?.precipitation_probability_max?.[0] || 0
      });
      console.log('IRRIGATION RESULT:', result);
      setR(result?.data || result);
    } catch (x) {
      console.error('IRRIGATION ERROR:', x);
      setE(x.message);
    } finally {
      setBusy(false);
    }
  };
  if (!farm) {
    return (
      <div className="empty">
        <h2>Create your farm first</h2>
      </div>
    );
  }
  return (
    <>
      <div className="section-title">
        <div>
          <span className="eyebrow">Water decision</span>
          <h2>Irrigation check</h2>
          <p className="muted">
            Soil moisture is farmer-entered, not a sensor reading.
          </p>
        </div>
        <button
          className="primary"
          disabled={!w || busy}
          onClick={run}
        >
          {busy ? 'Checking...' : 'Check irrigation'}
        </button>
      </div>
      {e && (
        <div className="notice error">
          {e}
        </div>
      )}
      {r && (
        <div className="card">
          <div className="grid four">
            <div className="metric">
              <span>Required?</span>
              <b>{r.required ? 'Yes' : 'No'}</b>
            </div>
            <div className="metric">
              <span>Priority</span>
              <b>{r.priority || 'Normal'}</b>
            </div>
            <div className="metric">
              <span>Score</span>
              <b>{r.score ?? 0}/100</b>
            </div>
            <div className="metric">
              <span>Timing</span>
              <b>
                {r.timing ||
                  'Monitor and reassess'}
              </b>
            </div>
          </div>
          <div className="why">
            <h3>Why?</h3>
            {(Array.isArray(r.factors)
              ? r.factors
              : []
            ).map((x, i) => (
              <div key={i}>
                <b>{x.factor}</b>
                <span>{x.detail}</span>
              </div>
            ))}
          </div>
          <div className="notice">
            ?? {r.water_saving_tip ||
              'Use water efficiently and reassess soil moisture before irrigation.'}
          </div>
        </div>
      )}
      {!r && !e && (
        <div className="empty">
          <h3>Ready to check irrigation</h3>
          <p>
            SmartFarm combines crop stage, farmer-entered
            soil moisture and current weather conditions.
          </p>
        </div>
      )}
    </>
  );
}
