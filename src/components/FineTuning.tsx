import { useState, useEffect } from 'react';
import { Settings, Upload, Sliders, AlertCircle, Info, Loader2, CheckCircle } from 'lucide-react';

export default function FineTuning() {
  const [selectedModel, setSelectedModel] = useState('ClinicalBERT');
  const [learningRate, setLearningRate] = useState(0.00002);
  const [batchSize, setBatchSize] = useState(16);
  const [epochs, setEpochs] = useState(3);
  const [dataset, setDataset] = useState<File | null>(null);

  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trainingComplete, setTrainingComplete] = useState(false);

  const startTraining = () => {
    setIsTraining(true);
    setProgress(0);
    setTrainingComplete(false);
  };

  useEffect(() => {
    if (isTraining) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsTraining(false);
            setTrainingComplete(true);
            return 100;
          }
          return prev + 1;
        });
      }, 100); // 10 seconds total duration
      return () => clearInterval(interval);
    }
  }, [isTraining]);

  const handleDatasetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDataset(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-sm border border-indigo-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Info className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">Fine-Tuning Panel</h2>
        </div>
        <div className="bg-white rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-gray-700 leading-relaxed">
            This is a UI scaffold for potential model fine-tuning functionality. In a production environment,
            this would integrate with model training infrastructure to customize BERT models on domain-specific
            breast cancer datasets. Fine-tuning allows models to learn specialized terminology and patterns
            from your clinical data.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>Model Configuration</span>
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Model Selection
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="BioBERT">BioBERT (Biomedical Domain)</option>
              <option value="ClinicalBERT">ClinicalBERT (Clinical Notes)</option>
              <option value="PubMedBERT">PubMedBERT (Research Papers)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the pre-trained model to use as a starting point
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Rate
              </label>
              <input
                type="number"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                step="0.00001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Typical: 2e-5 to 5e-5</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Size
              </label>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                min="1"
                max="64"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Common: 8, 16, 32</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Epochs
              </label>
              <input
                type="number"
                value={epochs}
                onChange={(e) => setEpochs(parseInt(e.target.value))}
                min="1"
                max="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Typical: 2-4 epochs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Upload className="w-5 h-5 text-indigo-600" />
          <span>Training Dataset</span>
        </h3>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Upload training dataset</p>
          <p className="text-xs text-gray-500 mb-4">
            Expected format: JSONL with text and labels
          </p>
          <input
            type="file"
            accept=".jsonl,.json"
            onChange={handleDatasetUpload}
            className="hidden"
            id="dataset-upload"
          />
          <label
            htmlFor="dataset-upload"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
          >
            Select Dataset
          </label>
          {dataset && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-indigo-800 font-medium">{dataset.name}</p>
              <p className="text-xs text-indigo-600 mt-1">
                {(dataset.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Dataset Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Annotated clinical texts with entity labels</li>
              <li>Minimum 500 examples for effective fine-tuning</li>
              <li>Balanced distribution across entity types</li>
              <li>JSONL format: {`{"text": "...", "entities": [...]}`}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <span>Advanced Parameters</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warmup Steps
            </label>
            <input
              type="number"
              defaultValue={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight Decay
            </label>
            <input
              type="number"
              defaultValue={0.01}
              step="0.001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Sequence Length
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="128">128 tokens</option>
              <option value="256">256 tokens</option>
              <option value="512" selected>512 tokens</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Validation Split
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option value="0.1">10%</option>
              <option value="0.15" selected>15%</option>
              <option value="0.2">20%</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {!isTraining && !trainingComplete && (
          <button
            onClick={startTraining}
            disabled={!dataset}
            className={`w-full px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-all transform active:scale-95 ${dataset
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            {dataset ? (
              <>
                <Settings className="w-5 h-5" />
                <span>Start Fine-Tuning Job</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload Dataset to Start</span>
              </>
            )}
          </button>
        )}

        {isTraining && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between text-sm font-medium text-gray-700">
              <span className="flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-600" /> Training in progress...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="text-xs text-center text-gray-500 font-mono">
              Epoch {Math.min(epochs, Math.ceil((progress / 100) * epochs))}/{epochs} • Loss: {(0.5 - (progress / 200)).toFixed(4)} • Accuracy: {(0.7 + (progress / 400)).toFixed(4)}
            </div>
          </div>
        )}

        {trainingComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center animate-in zoom-in duration-300">
            <div className="flex justify-center mb-2">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h4 className="text-lg font-bold text-green-800 mb-1">Training Complete!</h4>
            <p className="text-green-700 mb-4">Model <span className="font-mono font-bold">{selectedModel}-ft-v1</span> is ready for deployment.</p>
            <button
              onClick={() => { setTrainingComplete(false); setProgress(0); }}
              className="text-sm text-green-700 underline hover:text-green-900"
            >
              Start New Job
            </button>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-3">
          This checks your configuration and simulates the training workflow.
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Implementation Notes:</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start space-x-2">
            <span className="font-bold">•</span>
            <span>Production fine-tuning would use GPU infrastructure (AWS SageMaker, Google Cloud AI Platform, etc.)</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">•</span>
            <span>Training jobs would be queued and processed asynchronously</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">•</span>
            <span>Real-time progress tracking with loss curves and validation metrics</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">•</span>
            <span>Model versioning and A/B testing before production deployment</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="font-bold">•</span>
            <span>Integration with Hugging Face Transformers or similar frameworks</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
