
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/integrations/api/client';

const OCRUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [parsed, setParsed] = useState<Record<string, any> | null>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictResult, setPredictResult] = useState<any>(null);
  const [model, setModel] = useState<'diabetes' | 'heart' | 'kidney' | 'stroke'>('diabetes');
  const navigate = useNavigate();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPredictResult(null);
    setParsed(null);
    setOcrText('');
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const uploadAndParse = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post('/ocr/parse', form);

      setOcrText(res.data.ocr_text || '');
      setParsed(res.data.parsed || {});
    } catch (err: any) {
      console.error('OCR upload failed', err);
      alert(err?.response?.data?.error || err.message || 'OCR failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToAssessment = () => {
    if (!parsed) return;

    // Map parsed values to form fields based on selected model
    let initialData: Record<string, string> = {};

    if (model === 'diabetes') {
      initialData = {
        age: parsed.age || '',
        glucose: parsed.glucose || '',
        bmi: parsed.bmi || '',
        blood_pressure: parsed.blood_pressure || '',
        insulin: parsed.insulin || '',
        // Add other fields if OCR extracts them
      };
    } else if (model === 'heart') {
      initialData = {
        age: parsed.age || '',
        cholesterol: parsed.cholesterol || '',
        resting_bp: parsed.trestbps || '',
        sex: parsed.sex || '',
      };
    } else if (model === 'kidney') {
      initialData = {
        age: parsed.age || '',
        blood_pressure: parsed.bp || '',
        specific_gravity: parsed.sg || '',
        albumin: parsed.al || '',
        sugar: parsed.su || '',
        blood_glucose_random: parsed.bgr || '',
        blood_urea: parsed.bu || '',
        serum_creatinine: parsed.sc || '',
        sodium: parsed.sod || '',
        potassium: parsed.pot || '',
        haemoglobin: parsed.hemo || '',
      };
    }

    // Clean up values (remove units, non-numeric chars if needed, though form handles some)
    Object.keys(initialData).forEach(key => {
      if (typeof initialData[key] === 'string') {
        // Keep only numbers and decimals for numeric fields roughly
        // initialData[key] = initialData[key].replace(/[^0-9.]/g, ''); 
      }
    });

    navigate(`/assessments?type=${model}`, { state: { initialData, autoSubmit: true } });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Upload Lab Report (OCR)</h1>
        <p className="text-sm text-muted-foreground">Upload an image or PDF of lab results. The app will extract values to pre-fill the assessment form.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input type="file" accept="image/*,.pdf" onChange={handleFile} />
            <div className="flex gap-2">
              <Button onClick={uploadAndParse} disabled={!file || loading} className="gradient-primary text-white">
                {loading ? 'Parsing...' : 'Upload & Parse'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {ocrText && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>OCR Text</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm max-h-64 overflow-auto">{ocrText}</pre>
          </CardContent>
        </Card>
      )}

      {parsed && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Parsed Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Model:</label>
                <select value={model} onChange={(e) => setModel(e.target.value as any)} className="px-2 py-1 border rounded">
                  <option value="diabetes">Diabetes</option>
                  <option value="heart">Heart</option>
                  <option value="kidney">Kidney</option>
                  <option value="stroke">Stroke</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(parsed).map(([k, v]) => (
                  <div key={k} className="p-2 border rounded">
                    <div className="text-xs text-muted-foreground">{k}</div>
                    <div className="font-medium">{String(v)}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleProceedToAssessment} className="gradient-primary text-white">
                  Proceed to Assessment Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OCRUpload;
