import { useState, useRef, useEffect } from "react";

export default function LegacyImporter() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("Legacy Importer Component Successfully Mounted");
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
    setUploadStatus("");
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadStatus("Please select files first");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Uploading files...");

    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/legacy-import/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setSelectedFiles(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setUploadStatus("Files uploaded successfully!");
      } else {
        setUploadStatus("Upload failed - please try again");
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus("Upload failed - network error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">TerraFusion Legacy Data Importer</h1>
          <p className="mt-2 text-gray-600">
            Import data from legacy appraisal systems including SQLite databases, XML files, and various formats
          </p>
        </div>

        {/* Main Upload Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Upload Legacy Files</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Select files from your legacy appraisal system. Supported formats include SQLite databases (.sqlite, .db), 
            XML files, CSV files, and compressed archives (.zip).
          </p>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".sqlite,.db,.sqlite3,.xml,.csv,.zip,.sql,.xlsx,.xls,.pdf"
            />
            
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors mb-2"
            >
              Select Files
            </button>
            
            <p className="text-sm text-gray-500">
              Or drag and drop files here
            </p>
          </div>

          {/* Selected Files Display */}
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Selected Files ({selectedFiles.length}):</h3>
              <div className="space-y-2">
                {Array.from(selectedFiles).map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`mt-4 w-full py-2 px-4 rounded-md text-white font-medium ${
                  isUploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } transition-colors`}
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus && (
            <div className={`mt-4 p-3 rounded-md ${
              uploadStatus.includes('successfully') 
                ? 'bg-green-100 text-green-800' 
                : uploadStatus.includes('failed') || uploadStatus.includes('error')
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {uploadStatus}
            </div>
          )}

          {/* Support Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0-2.21-1.79-4-4-4H8c-2.21 0-4-1.79-4-4zm16 0c0-2.21-1.79-4-4-4H8c0 2.21 1.79 4 4 4h8c2.21 0 4 1.79 4 4z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Supported Systems</h3>
                <p className="text-sm text-blue-800">
                  TOTAL by a la mode, ClickForms, ACI DataMaster, CompsImporter backups, 
                  and other legacy appraisal software databases.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Import History Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Import History</h2>
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p>No import jobs yet. Upload some files to get started.</p>
          </div>
        </div>
      </div>
    </div>
  );
}