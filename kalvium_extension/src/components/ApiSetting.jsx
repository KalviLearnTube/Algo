import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';

const APISettings = ({ onValidated }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
   
    chrome.storage.sync.get(['userAPIKey'], (result) => {
      if (result.userAPIKey) {
        setApiKey(result.userAPIKey);
        onValidated(true);
      } else {
        setShowSettings(true);
      }
    });
  }, []);

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    try {
      await chrome.storage.sync.set({ userAPIKey: apiKey.trim() });
      onValidated(true);
      setShowSettings(false);
      setError('');
    } catch (err) {
      setError('Failed to save API key. Please try again.');
    }
  };

  if (!showSettings) {
    return (
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <Settings className="w-5 h-5 text-gray-700" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">
              API Settings
            </h2>
            {apiKey && (
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your API key"
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="space-y-4">
            <button
              onClick={saveApiKey}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Save API Key
            </button>
            
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-3 text-center bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Get Gemini API Key →
            </a>
            
            <p className="text-xs text-gray-500 text-center">
              Your API key is stored locally and never shared
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APISettings;