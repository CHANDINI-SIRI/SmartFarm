import { useEffect, useState } from 'react';
import { pipeline } from '@huggingface/transformers';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
let classifierPromise = null;
const MODEL =
  'onnx-community/mobilenet_v2_1.0_224-plant-disease-identification-ONNX';
function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = pipeline(
      'image-classification',
      MODEL,
      { dtype: 'q4' }
    );
  }
  return classifierPromise;
}
function actionFor(label) {
  const x = label.toLowerCase();
  if (x.includes('healthy')) {
    return 'The model found a healthy-class result. Continue regular crop monitoring and good irrigation/nutrition practices.';
  }
  if (x.includes('blight')) {
    return 'Inspect affected plants, remove severely affected leaves, improve airflow and avoid overhead irrigation. Confirm treatment with an agricultural expert.';
  }
  if (x.includes('spot')) {
    return 'Inspect nearby plants, improve airflow and monitor whether symptoms are spreading. Confirm treatment before applying chemicals.';
  }
  if (x.includes('rust')) {
    return 'Inspect the crop for rust symptoms and seek local agricultural guidance before treatment.';
  }
  if (x.includes('mildew')) {
    return 'Inspect affected leaves and improve airflow. Confirm the diagnosis before treatment.';
  }
  return 'Treat this as a screening result. Inspect the crop closely and confirm the condition with an agricultural expert before treatment.';
}
export default function Disease() {
  const { session, farm } = useApp();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(selectedFile);
    setResult(null);
    setMsg('');
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setPreview(null);
    }
  };
  const analyze = async () => {
    if (!file || !farm) return;
    setBusy(true);
    setMsg(
      'Loading the plant-disease model. The first run may take a little longer...'
    );
    try {
      const classifier = await getClassifier();
      const output = await classifier(file, {
        top_k: 3
      });
      const best = output[0];
      const confidence = Math.round(best.score * 100);
      const severity =
        confidence >= 85
          ? 'High'
          : confidence >= 65
          ? 'Medium'
          : 'Low';
      const r = {
        disease: best.label,
        severity,
        confidence,
        action: actionFor(best.label),
        alternatives: output.slice(1).map((x) => ({
          label: x.label,
          score: Math.round(x.score * 100)
        })),
        note:
          'AI-assisted screening only. The model was trained on PlantVillage-style classes; real field conditions can differ. Confirm with an agricultural expert if confidence is low or symptoms are unclear.'
      };
      setResult(r);
      setMsg('');
      if (session) {
        try {
          await api.saveDisease({
            farm_id: farm.id,
            disease_name: r.disease,
            severity: r.severity,
            confidence: r.confidence,
            action: r.action,
            model_name: MODEL
          });
        } catch (saveError) {
          console.error('DISEASE SAVE ERROR:', saveError);
        }
      }
    } catch (e) {
      console.error('DISEASE MODEL ERROR:', e);
      setMsg(`Disease model could not run: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="section-title">
        <div>
          <span className="eyebrow">
            Real ONNX model • runs in browser
          </span>
          <h2>Check a crop leaf</h2>
          <p className="muted">
            Model: MobileNetV2 fine-tuned for plant-disease identification.
          </p>
        </div>
      </div>
      <div className="grid two">
        <div className="card upload">
          <label className="drop">
            <span>??</span>
            <b>Upload a clear leaf image</b>
            <small>
              JPG, PNG • good lighting works best
            </small>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>
          {file && (
            <p className="muted">
              Selected image: <b>{file.name}</b>
            </p>
          )}
          {preview && (
            <div
              style={{
                marginTop: '16px',
                width: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#f5f5f5',
                border: '1px solid #ddd'
              }}
            >
              <img
                src={preview}
                alt="Uploaded crop leaf"
                style={{
                  display: 'block',
                  width: '100%',
                  height: '320px',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}
          <button
            className="primary full"
            disabled={!file || busy || !farm}
            onClick={analyze}
          >
            {busy ? 'Analyzing...' : 'Analyze leaf'}
          </button>
          {!farm && (
            <div className="notice">
              Create or load your farm profile before saving disease results.
            </div>
          )}
          {msg && (
            <div
              className={
                msg.startsWith('Disease model')
                  ? 'notice error'
                  : 'notice'
              }
            >
              {msg}
            </div>
          )}
        </div>
        {result ? (
          <div className="card result">
            <span className="pill">
              AI screening
            </span>
            <h2>{result.disease}</h2>
            <div className="grid three">
              <div className="metric">
                <small>Confidence</small>
                <b>{result.confidence}%</b>
              </div>
              <div className="metric">
                <small>Severity</small>
                <b>{result.severity}</b>
              </div>
              <div className="metric">
                <small>Model</small>
                <b>ONNX</b>
              </div>
            </div>
            <h4>Suggested action</h4>
            <p>{result.action}</p>
            {result.alternatives.length > 0 && (
              <>
                <h4>Other model candidates</h4>
                {result.alternatives.map((x) => (
                  <div
                    className="list-row"
                    key={x.label}
                  >
                    <span>{x.label}</span>
                    <b>{x.score}%</b>
                  </div>
                ))}
              </>
            )}
            <div className="notice">
              {result.note}
            </div>
          </div>
        ) : (
          <div className="card">
            <h3>How this works</h3>
            <ol>
              <li>
                Image stays in the browser for model inference.
              </li>
              <li>
                Transformers.js downloads the ONNX model on first use.
              </li>
              <li>
                MobileNetV2 returns ranked plant-disease classes.
              </li>
              <li>
                The result is stored in MySQL when you are logged in.
              </li>
            </ol>
            <p className="muted">
              Model reference: {MODEL}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
