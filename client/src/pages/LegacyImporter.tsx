export default function LegacyImporter() {
  console.log("Legacy Importer Component Loading");
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">TerraFusion Legacy Data Importer</h1>
        <p className="mt-2 text-gray-600">Component is working correctly</p>
        
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Test Status</h2>
          <p className="text-green-600">✓ Component successfully mounted</p>
          <p className="text-green-600">✓ Routing working correctly</p>
          <p className="text-green-600">✓ Ready for full implementation</p>
        </div>
      </div>
    </div>
  );
}