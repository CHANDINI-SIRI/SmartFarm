
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

// Internal decision-support values only.
// These are NOT shown to the farmer as measured percentages.
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

export default function Farm() {
  const { session, farm, setFarm } = useApp();

  const [f, setF] = useState({
    farm_name: '',
    location_name: '',
    farm_type: 'Open field',
    crop_type: 'Tomato',
    farm_size: 1,
    growth_stage: 'Vegetative',
    soil_status: 'Moist',
    planting_date: '',
    latitude: 17.385,
    longitude: 78.4867
  });

  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Load the existing farm into the form.
  useEffect(() => {
    if (!farm) return;

    setF({
      farm_name: farm.farm_name || '',
      location_name: farm.location_name || '',
      farm_type: farm.farm_type || 'Open field',
      crop_type: farm.crop_type || 'Tomato',
      farm_size: farm.farm_size_acres ?? 1,
      growth_stage: farm.growth_stage || 'Vegetative',
      soil_status: soilStatusFromValue(
        farm.soil_moisture ?? 55
      ),
      planting_date:
        farm.planting_date?.slice(0, 10) || '',
      latitude: farm.latitude ?? 17.385,
      longitude: farm.longitude ?? 78.4867
    });
  }, [farm]);

  const save = async (e) => {
    e.preventDefault();

    if (!session) {
      setMsg('Please login again.');
      return;
    }

    setBusy(true);
    setMsg('');

    try {
      const payload = {
        farm_name: f.farm_name,
        location_name: f.location_name,
        farm_type: f.farm_type,
        crop_type: f.crop_type,
        farm_size_acres: Number(f.farm_size),
        growth_stage: f.growth_stage,

        // Internal numeric value used by the current backend rules.
        // The farmer only sees the qualitative soil condition.
        soil_moisture: SOIL_VALUES[f.soil_status],

        planting_date: f.planting_date || null,
        latitude: Number(f.latitude),
        longitude: Number(f.longitude)
      };

      // Create or update the farm.
      if (farm?.id) {
        await api.updateFarm(farm.id, payload);
      } else {
        await api.createFarm(payload);
      }

      // Always reload the complete farm object.
      // This prevents farm state from becoming { farm_id, message }
      // after an update.
      const updatedFarm = await api.farm();

      if (!updatedFarm?.id) {
        throw new Error(
          'Farm was saved, but the complete farm record could not be loaded.'
        );
      }

      setFarm(updatedFarm);
      setMsg('Farm saved successfully.');
    } catch (error) {
      console.error('FARM SAVE ERROR:', error);

      setMsg(
        error?.message || 'Unable to save farm.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-page">

      <div className="section-title">
        <div>
          <span className="eyebrow">
            Farm context
          </span>

          <h2>
            Tell SmartFarm about your farm
          </h2>
        </div>
      </div>

      <form
        className="card form-grid"
        onSubmit={save}
      >

        {/* Farm name */}
        <label>
          Farm name

          <input
            required
            value={f.farm_name}
            onChange={(e) =>
              setF({
                ...f,
                farm_name: e.target.value
              })
            }
          />
        </label>

        {/* Location */}
        <label>
          Location name

          <input
            required
            value={f.location_name}
            onChange={(e) =>
              setF({
                ...f,
                location_name: e.target.value
              })
            }
          />
        </label>

        {/* Farm type */}
        <label>
          Farm type

          <select
            value={f.farm_type}
            onChange={(e) =>
              setF({
                ...f,
                farm_type: e.target.value
              })
            }
          >
            {[
              'Open field',
              'Greenhouse',
              'Orchard',
              'Vegetable farm',
              'Paddy field',
              'Irrigated',
              'Other'
            ].map((x) => (
              <option
                key={x}
                value={x}
              >
                {x}
              </option>
            ))}
          </select>
        </label>

        {/* Crop */}
        <label>
          Crop type

          <select
            value={f.crop_type}
            onChange={(e) =>
              setF({
                ...f,
                crop_type: e.target.value
              })
            }
          >
            {[
              'Rice',
              'Paddy',
              'Tomato',
              'Cotton',
              'Maize',
              'Chilli',
              'Wheat',
              'Other'
            ].map((x) => (
              <option
                key={x}
                value={x}
              >
                {x}
              </option>
            ))}
          </select>
        </label>

        {/* Farm size */}
        <label>
          Farm size (acres)

          <input
            type="number"
            min="0.1"
            step="0.1"
            value={f.farm_size}
            onChange={(e) =>
              setF({
                ...f,
                farm_size: e.target.value
              })
            }
          />
        </label>

        {/* Growth stage */}
        <label>
          Crop growth stage

          <select
            value={f.growth_stage}
            onChange={(e) =>
              setF({
                ...f,
                growth_stage: e.target.value
              })
            }
          >
            {[
              'Land preparation',
              'Sowing',
              'Germination',
              'Vegetative',
              'Flowering',
              'Fruiting',
              'Maturity',
              'Harvest'
            ].map((x) => (
              <option
                key={x}
                value={x}
              >
                {x}
              </option>
            ))}
          </select>
        </label>

        {/* Planting date */}
        <label>
          Planting date

          <small>
            {' '}(optional)
          </small>

          <input
            type="date"
            value={f.planting_date}
            onChange={(e) =>
              setF({
                ...f,
                planting_date: e.target.value
              })
            }
          />
        </label>

        {/* Soil moisture */}
        <div>
          <label>
            Soil moisture
          </label>

          <small>
            Farmer-assessed field condition, not a sensor reading.
          </small>

          <div
            style={{
              display: 'grid',
              gap: '10px',
              marginTop: '12px'
            }}
          >
            {SOIL_OPTIONS.map((option) => (
              <label
                key={option}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: busy
                    ? 'default'
                    : 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="soil_status"
                  value={option}
                  checked={
                    f.soil_status === option
                  }
                  disabled={busy}
                  onChange={(e) =>
                    setF({
                      ...f,
                      soil_status: e.target.value
                    })
                  }
                />

                <span>
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Latitude */}
        <label>
          Latitude

          <input
            type="number"
            step="any"
            value={f.latitude}
            onChange={(e) =>
              setF({
                ...f,
                latitude: e.target.value
              })
            }
          />
        </label>

        {/* Longitude */}
        <label>
          Longitude

          <input
            type="number"
            step="any"
            value={f.longitude}
            onChange={(e) =>
              setF({
                ...f,
                longitude: e.target.value
              })
            }
          />
        </label>

        {/* Actions */}
        <div className="form-actions">
          <button
            className="primary"
            disabled={busy}
            type="submit"
          >
            {busy
              ? 'Saving...'
              : 'Save farm'}
          </button>

          {msg && (
            <span
              className={
                msg.toLowerCase().includes('success')
                  ? 'muted'
                  : 'notice error'
              }
            >
              {msg}
            </span>
          )}
        </div>

      </form>
    </div>
  );
}

