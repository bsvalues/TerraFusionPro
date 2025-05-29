import React from 'react';

export default function LegacyImporter() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Universal Legacy Appraisal Importer</h1>
      <p className="text-gray-600 mb-6">
        Import and convert legacy appraisal data from TOTAL, ClickForms, ACI, DataMaster, and Alamode systems
      </p>
      
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Legacy Files</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium">Drop your legacy files here</p>
              <p className="text-sm text-gray-500">
                Supports ZIP, SQLite, XML, CSV, PDF, and XLSX files
              </p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Browse Files
            </button>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Supported Legacy Systems</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="font-medium">TOTAL</div>
              <div className="text-sm text-gray-500">by a la mode</div>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="font-medium">ClickForms</div>
              <div className="text-sm text-gray-500">Forms Platform</div>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="font-medium">ACI</div>
              <div className="text-sm text-gray-500">Appraisal System</div>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="font-medium">DataMaster</div>
              <div className="text-sm text-gray-500">Legacy Data</div>
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <div className="font-medium">Alamode</div>
              <div className="text-sm text-gray-500">Classic System</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            <strong>Your CompsImporter SQLite file:</strong> Perfect for import! This system can extract comparable property data, sales information, and adjustment details from your backup file.
          </p>
        </div>
      </div>
    </div>
  );
}