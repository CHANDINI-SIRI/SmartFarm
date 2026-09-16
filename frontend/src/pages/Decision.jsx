import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import Loading from '../components/Loading';
export default function Decision() {
  const { farm } = useApp();
  const [w, setW] = useState(null);
  const [r, setR] = useState(null);
  const [e, setE] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!farm?.latitude || !farm?.longitude) return;
    api.weather(farm.latitude, farm.longitude)
      .then(setW)
      .catch((x) => setE(x.message));
  }, [farm]);
  const run = async () => {
    if (!farm) return;
    setBusy(true);
    setE('');
    setR(null);
    try {
      const result = await api.recommendation({
        crop_type: farm.crop_type,
        growth_stage: farm.growth_stage,
        farm_size: Number(farm.farm_size_acres ?? farm.farm_size),
        soil_moisture: Number(farm.soil_moisture),
        temperature: w?.current?.temperature_2m,
        rain_probability:
          w?.daily?.precipitation_probability_max?.[0],
        humidity: w?.current?.relative_humidity_2m
      });
      console.log('AI RECOMMENDATION:', result);
      const data = result?.data || result;
      setR(data);
    } catch (x) {
      console.error('AI RECOMMENDATION ERROR:', x);
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
          <span className="eyebrow">Decision support</span>
          <h2>What should I pay attention to today?</h2>
        </div>
        <button
          className="primary"
          onClick={run}
          disabled={busy}
        >
          {busy ? 'Generating...' : 'Generate AI recommendation'}
        </button>
      </div>
      {e && <div className="notice error">{e}</div>}
      {!w && !e ? (
        <Loading />
      ) : r ? (
        <div className="card recommendation">
          <div className="rec-top">
            <span
              className={`priority ${String(
                r.priority || 'normal'
              ).toLowerCase()}`}
            >
              {r.priority || 'Normal'}
            </span>
            <span>
              AI confidence: {r.confidence ?? 0}%
            </span>
          </div>
          <h2>
            {r.recommendation || 'No recommendation available'}
          </h2>
          <p>
            {r.reason || 'No explanation was returned.'}
          </p>
          <div className="why">
            <h3>Why am I seeing this recommendation?</h3>
            {(Array.isArray(r.factors) ? r.factors : []).map(
              (x, i) => (
                <div key={i}>
                  <b>{x.factor}</b>
                  <span>{x.detail}</span>
                </div>
              )
            )}
          </div>
          <div className="grid two">
            <div>
              <h4>Expected benefit</h4>
              <p>
                {r.expected_benefit || 'Not available'}
              </p>
            </div>
            <div>
              <h4>Risk</h4>
              <p>
                {r.risk || 'Not available'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty">
          <h3>Ready to combine your farm context</h3>
          <p>
            Crop + stage + farmer-entered soil moisture +
            live weather are used. The recommendation explains
            the factors instead of hiding them.
          </p>
        </div>
      )}
    </>
  );
}
