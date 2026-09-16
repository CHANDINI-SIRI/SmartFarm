import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const SOIL_OPTIONS = [
  'Dry',
  'Slightly dry',
  'Moist',
  'Wet',
  'Waterlogged'
];

const SOIL_VALUES = {
  Dry: 20,
  'Slightly dry': 37,
  Moist: 55,
  Wet: 75,
  Waterlogged: 90
};

function soilStatusFromValue(value) {
  const n = Number(value);

  if (n <= 25) return 'Dry';
  if (n <= 45) return 'Slightly dry';
  if (n <= 65) return 'Moist';
  if (n <= 82) return 'Wet';

  return 'Waterlogged';
}

/* -------------------------------------------------------
   SMART ALERTS
------------------------------------------------------- */

export function Alerts() {
  const { farm } = useApp();

  const [weather, setWeather] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!farm) return;

    setLoading(true);

    api.weather(farm.latitude, farm.longitude)
      .then((w) => {
        setWeather(w);

        const generated = [];

        const rain =
          w?.daily?.precipitation_probability_max?.[0] ?? 0;

        const temperature =
          w?.current?.temperature_2m ?? null;

        const soilStatus = soilStatusFromValue(
          farm.soil_moisture ?? 55
        );

        if (rain >= 70) {
          generated.push({
            type: 'warning',
            title: 'Rain expected',
            text:
              `${rain}% rain probability today. ` +
              `Consider avoiding unnecessary irrigation.`
          });
        }

        if (
          (soilStatus === 'Dry' ||
            soilStatus === 'Slightly dry') &&
          rain < 50
        ) {
          generated.push({
            type: 'warning',
            title: 'Dry field condition',
            text:
              `The farmer assessed the field as ${soilStatus.toLowerCase()}. ` +
              `Check irrigation needs against crop stage and weather.`
          });
        }

        if (
          temperature !== null &&
          temperature >= 35
        ) {
          generated.push({
            type: 'warning',
            title: 'High temperature',
            text:
              `Current temperature is ${temperature} °C. ` +
              `Monitor crop stress and field condition closely.`
          });
        }

        generated.push({
          type: 'info',
          title: 'AI screening reminder',
          text:
            'If disease symptoms appear, upload a clear leaf image in Disease AI.'
        });

        setAlerts(generated);
      })
      .catch(() => {
        setAlerts([
          {
            type: 'info',
            title: 'AI screening reminder',
            text:
              'If disease symptoms appear, upload a clear leaf image in Disease AI.'
          }
        ]);
      })
      .finally(() => setLoading(false));
  }, [farm]);

  if (!farm) {
    return (
      <div className="card">
        <h2>Smart alerts</h2>
        <p>Create a farm first.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Smart alerts</h2>

      <p className="muted">
        Alerts are generated from your farm information and current weather.
      </p>

      {loading && (
        <div className="notice">
          Checking today's conditions...
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <div className="notice">
          No immediate alerts detected.
        </div>
      )}

      {!loading && (
        <div className="alerts">
          {alerts.map((alert, i) => (
            <div
              className={`alert ${alert.type}`}
              key={i}
            >
              <b>{alert.title}</b>
              <span>{alert.text}</span>
            </div>
          ))}
        </div>
      )}

      {weather && (
        <p
          className="muted"
          style={{ marginTop: '16px' }}
        >
          Current weather checked successfully.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   MARKET
------------------------------------------------------- */

export function Market() {
  const { farm } = useApp();

  const [d, setD] = useState(null);

  useEffect(() => {
    if (!farm?.crop_type) return;

    api.market(farm.crop_type)
      .then(setD)
      .catch(() =>
        setD({
          fallback: true,
          items: []
        })
      );
  }, [farm]);

  return (
    <div className="card">
      <h2>Market prices</h2>

      <p className="muted">
        Source: AGMARKNET 2.0 · Public market data
      </p>

      {d?.source && (
        <div className="notice">
          Source: {d.source}
          {d.state ? ` · ${d.state}` : ''}
          {d.commodity ? ` · ${d.commodity}` : ''}
        </div>
      )}

      {d?.fallback && (
        <div className="notice">
          Live market data unavailable — no fabricated prices are shown.
        </div>
      )}

      {d?.items?.map((x, i) => (
        <div
          className="list-row"
          key={i}
        >
          <b>{x.market}</b>

          <span>
            {x.price} {x.unit}
          </span>

          <small>
            {x.date}
          </small>
        </div>
      ))}

      {d &&
        !d.fallback &&
        d.items?.length === 0 && (
          <div className="notice">
            No market prices were returned for this crop.
          </div>
        )}
    </div>
  );
}

/* -------------------------------------------------------
   GOVERNMENT SCHEMES
------------------------------------------------------- */

export function Schemes() {
  const [d, setD] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.schemes()
      .then(setD)
      .catch(() => setD([]));
  }, []);

  return (
    <div>
      <div className="section-title">
        <div>
          <span className="eyebrow">
            Official information
          </span>

          <h2>Government schemes</h2>
        </div>
      </div>

      <div className="grid two">
        {d.map((x, i) => (
          <div
            className="card"
            key={i}
          >
            <span className="pill">
              Information
            </span>

            <h3>{x.name}</h3>

            <p>
              {x.description}
            </p>

            <p>
              <b>Eligibility:</b>{' '}
              {x.eligibility}
            </p>

            <button
              className="secondary"
              onClick={() => setSelected(x)}
            >
              Select scheme
            </button>

            {selected?.name === x.name && (
              <div
                className="notice"
                style={{ marginTop: '12px' }}
              >
                <b>Selected:</b>{' '}
                {x.name}

                <br />

                <a
                  className="button-link"
                  href={
                    x.apply_url ||
                    x.official_source
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Register / Apply
                </a>

                <br />

                <a
                  className="button-link"
                  href={x.official_source}
                  target="_blank"
                  rel="noreferrer"
                >
                  Official information
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {d.length === 0 && (
        <div className="notice">
          Government scheme information is currently unavailable.
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   PROCUREMENT
------------------------------------------------------- */

export function Procurement() {
  const { farm } = useApp();

  const [d, setD] = useState(null);

  useEffect(() => {
    if (!farm) return;

    api.procurement(
      farm.latitude,
      farm.longitude
    )
      .then(setD)
      .catch((e) =>
        setD({
          error: e.message,
          items: []
        })
      );
  }, [farm]);

  return (
    <div className="card">
      <h2>
        Nearby procurement / collection locations
      </h2>

      <p className="muted">
        Mapped locations are not automatically verified
        government procurement centres.
      </p>

      {d?.error && (
        <div className="notice error">
          Unable to load mapped locations: {d.error}
        </div>
      )}

      {d?.items?.map((x, i) => (
        <div
          className="list-row"
          key={i}
        >
          <div>
            <b>{x.name}</b>

            <small>
              {x.address ||
                'Location from OpenStreetMap'}
            </small>
          </div>

          <a
            className="button-link"
            href={x.directions_url}
            target="_blank"
            rel="noreferrer"
          >
            Directions
          </a>
        </div>
      ))}

      {d?.items?.length === 0 && (
        <div className="notice">
          No mapped procurement-related locations were found.
          Try again later.
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   CROP CALENDAR
------------------------------------------------------- */

export function Calendar() {
  const { farm } = useApp();

  const stages = [
    'Land preparation',
    'Sowing',
    'Germination',
    'Vegetative',
    'Flowering',
    'Fruiting',
    'Maturity',
    'Harvest'
  ];

  return (
    <div className="card">
      <h2>Crop calendar</h2>

      <p>
        Stage guidance is configurable and should be validated
        for the selected crop and region.
      </p>

      <div className="timeline">
        {stages.map((s, i) => (
          <div
            className={
              farm?.growth_stage === s
                ? 'current'
                : ''
            }
            key={s}
          >
            <span>{i + 1}</span>

            <b>{s}</b>

            <small>
              {farm?.growth_stage === s
                ? 'Current stage'
                : 'Stage activity'}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   COST SAVING
------------------------------------------------------- */

export function Cost() {
  const [v, setV] = useState({
    water: 0,
    fertilizer: 0,
    pesticide: 0,
    other: 0
  });

  const total = Object.values(v)
    .reduce(
      (a, b) => a + Number(b),
      0
    );

  const save = total * 0.12;

  return (
    <div className="card">
      <h2>Cost-saving estimator</h2>

      <p className="muted">
        Estimates only — not a financial guarantee.
      </p>

      <div className="form-grid">
        {Object.entries(v).map(([k, x]) => (
          <label key={k}>
            {k[0].toUpperCase() + k.slice(1)} cost

            <input
              type="number"
              min="0"
              value={x}
              onChange={(e) =>
                setV({
                  ...v,
                  [k]: e.target.value
                })
              }
            />
          </label>
        ))}
      </div>

      <div className="grid three">
        <div className="metric">
          <span>Current cost</span>

          <b>
            ₹{total.toFixed(0)}
          </b>
        </div>

        <div className="metric">
          <span>Potential saving*</span>

          <b>
            ₹{save.toFixed(0)}
          </b>
        </div>

        <div className="metric">
          <span>Estimated rate*</span>

          <b>12%</b>
        </div>
      </div>

      <small>
        *Demo estimate based on configurable assumptions;
        actual savings vary.
      </small>
    </div>
  );
}

/* -------------------------------------------------------
   FARM TIMELINE
------------------------------------------------------- */

export function Timeline() {
  const { farm } = useApp();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!farm?.id) return;

    setLoading(true);

    api.events(farm.id)
      .then((data) => {
        setEvents(
          Array.isArray(data)
            ? data
            : data?.events || []
        );
      })
      .catch((e) => {
        console.error(
          'TIMELINE ERROR:',
          e
        );

        setEvents([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [farm]);

  return (
    <div className="card">
      <h2>Farm timeline</h2>

      {loading && (
        <div className="notice">
          Loading farm history...
        </div>
      )}

      {!loading &&
        events.length > 0 ? (
        events.map((x) => (
          <div
            className="list-row"
            key={x.id}
          >
            <div>
              <b>
                {x.title ||
                  x.event_type ||
                  'Farm event'}
              </b>

              <small>
                {x.description || ''}
              </small>
            </div>

            <small>
              {x.event_date
                ? new Date(
                    x.event_date
                  ).toLocaleString()
                : ''}
            </small>
          </div>
        ))
      ) : (
        !loading && (
          <div className="empty">
            <p>
              No events yet. Saving farm details
              and AI actions will add history.
            </p>
          </div>
        )
      )}
    </div>
  );
}

/* -------------------------------------------------------
   AI CHAT
------------------------------------------------------- */

export function Chat() {
  const { farm } = useApp();

  const [q, setQ] = useState('');
  const [a, setA] = useState([]);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    if (!q.trim()) return;

    setBusy(true);

    try {
      const r = await api.chat({
        message: q,

        farm_context: farm
          ? {
              crop: farm.crop_type,

              stage:
                farm.growth_stage ||
                farm.crop_growth_stage ||
                'Vegetative',

              soil_condition:
                soilStatusFromValue(
                  farm.soil_moisture ?? 55
                ),

              location:
                farm.location_name
            }
          : null
      });

      setA((x) => [
        ...x,
        {
          q,
          a:
            r?.answer ||
            'No answer returned.'
        }
      ]);

      setQ('');
    } catch (e) {
      setA((x) => [
        ...x,
        {
          q,
          a:
            `Unable to reach AI: ${e.message}`
        }
      ]);
    } finally {
      setBusy(false);
    }
  };

  const speakLastAnswer = () => {
    if (
      !('speechSynthesis' in window)
    ) {
      return;
    }

    const last = a.at(-1);

    if (last) {
      const u =
        new SpeechSynthesisUtterance(
          last.a
        );

      speechSynthesis.speak(u);
    }
  };

  return (
    <div className="chat card">
      <h2>Ask SmartFarm AI</h2>

      <p className="muted">
        Ask about irrigation, crops, weather,
        disease or farm management.
      </p>

      <div className="messages">
        {a.map((x, i) => (
          <div key={i}>
            <div className="user-msg">
              {x.q}
            </div>

            <div className="ai-msg">
              {x.a}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-box">
        <input
          value={q}
          onChange={(e) =>
            setQ(e.target.value)
          }
          onKeyDown={(e) =>
            e.key === 'Enter' && ask()
          }
          placeholder="Example: Should I irrigate after tomorrow's rain?"
        />

        <button
          className="primary"
          onClick={ask}
          disabled={busy}
        >
          {busy
            ? 'Thinking...'
            : 'Ask'}
        </button>

        <button
          className="secondary"
          onClick={speakLastAnswer}
          title="Read the latest AI answer aloud"
          aria-label="Read the latest AI answer aloud"
        >
          🔊
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   SETTINGS
------------------------------------------------------- */

export function Settings() {
  const {
    profile,
    lang,
    setLang
  } = useApp();

  return (
    <div className="card">
      <h2>Profile & settings</h2>

      <div className="list-row">
        <b>Name</b>

        <span>
          {profile?.full_name || '—'}
        </span>
      </div>

      <div className="list-row">
        <b>Email</b>

        <span>
          {profile?.email ||
            'Use your login email'}
        </span>
      </div>

      <label>
        Preferred language

        <select
          value={lang}
          onChange={(e) =>
            setLang(e.target.value)
          }
        >
          <option value="en">
            English
          </option>

          <option value="te">
            Telugu
          </option>

          <option value="hi">
            Hindi
          </option>
        </select>
      </label>

      <div className="notice">
        Voice input depends on browser
        speech-recognition support.
        Voice output uses your browser's
        text-to-speech.
      </div>
    </div>
  );
}