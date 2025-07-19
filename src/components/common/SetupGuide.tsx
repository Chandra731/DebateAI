import React from 'react';
import { AlertTriangle, ExternalLink, Copy, CheckCircle } from 'lucide-react';

const SetupGuide: React.FC = () => {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const envTemplate = `# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Environment
VITE_ENVIRONMENT=development

# AI Services (Optional for now)
VITE_GROQ_API_KEY=your_groq_api_key_here

# Feature Flags
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_AI_JUDGING=true
VITE_ENABLE_ACHIEVEMENTS=true
VITE_ENABLE_SKILL_TREE=true`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Setup Required</h1>
            <p className="text-gray-600">Firebase configuration is missing</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Quick Setup Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-yellow-700">
              <li>Create a free Firebase project</li>
              <li>Enable Firestore Database and Authentication</li>
              <li>Copy your project configuration</li>
              <li>Update your .env file</li>
              <li>Run the seed script (see README)</li>
              <li>Restart the development server</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Step 1: Create Firebase Project</h3>
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>Go to Firebase Console</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Step 2: Update .env File</h3>
            <div className="relative">
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{envTemplate}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(envTemplate, 'env')}
                className="absolute top-2 right-2 p-2 bg-white rounded-md shadow-sm hover:bg-gray-50 transition-colors"
                title="Copy to clipboard"
              >
                {copied === 'env' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Where to find your credentials:</h4>
            <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
              <li>Go to your Firebase project dashboard</li>
              <li>Click on `&quot;`Project settings`&quot;` (gear icon)</li>
              <li>Under `&quot;`Your apps`&quot;`, select `&quot;`Web`&quot;` (or create a new web app)</li>
              <li>Copy the `firebaseConfig` object and paste values into your .env file</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">After setup:</h4>
            <p className="text-gray-600 text-sm">
              Once you've updated your .env file and run the seed script, restart the development server by stopping it (Ctrl+C) 
              and running <code className="bg-gray-200 px-1 rounded">npm run dev</code> again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupGuide;