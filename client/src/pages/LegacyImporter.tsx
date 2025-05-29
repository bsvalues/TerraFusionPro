export default function LegacyImporter() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Universal Legacy Appraisal Importer</h1>
        <p className="text-gray-600">
          Import and convert legacy appraisal data from TOTAL, ClickForms, ACI, DataMaster, and Alamode systems
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 bg-blue-500 rounded"></div>
          <h2 className="text-xl font-semibold">Import Legacy Data</h2>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-sm font-medium">Upload</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm text-gray-500">Extract</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">Map Fields</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <span className="ml-2 text-sm text-gray-500">Preview</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                5
              </div>
              <span className="ml-2 text-sm text-gray-500">Import</span>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="space-y-6">
          <div>
            <label htmlFor="jobName" className="block text-sm font-medium text-gray-700 mb-2">
              Import Job Name
            </label>
            <input
              type="text"
              id="jobName"
              placeholder="e.g., Q4 2024 Legacy Data Import"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-gray-400 rounded mx-auto mb-4"></div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Upload Legacy Files</h3>
              <p className="text-sm text-gray-500">
                Supports ZIP, XML, ENV, SQL, CSV, PDF, XLSX files up to 100MB
              </p>
              <input
                type="file"
                multiple
                accept=".zip,.xml,.env,.sql,.csv,.pdf,.xlsx,.xls"
                className="block w-full max-w-md mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
            Upload & Analyze Files
          </button>
        </div>

        {/* System Detection Preview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Supported Legacy Systems</h4>
            <div className="space-y-1">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2">TOTAL</span>
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">ClickForms</span>
              <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mr-2">ACI</span>
              <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded mr-2">DataMaster</span>
              <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Alamode</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">Import Capabilities</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Automatic system detection</li>
              <li>• Field mapping & validation</li>
              <li>• Data transformation</li>
              <li>• Error handling & logging</li>
            </ul>
          </div>
        </div>

        {/* Recent Import Jobs */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Recent Import Jobs</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Q4 2024 TOTAL Legacy Import</p>
                <p className="text-sm text-gray-500">
                  1,250/1,250 records • Dec 15, 2024 • Systems: TOTAL, ClickForms
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">COMPLETED</span>
                <button className="text-blue-500 text-sm hover:underline">View Details</button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">ACI Data Migration</p>
                <p className="text-sm text-gray-500">
                  420/875 records • Dec 20, 2024 • Systems: ACI
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">PROCESSING</span>
                <button className="text-blue-500 text-sm hover:underline">View Details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}