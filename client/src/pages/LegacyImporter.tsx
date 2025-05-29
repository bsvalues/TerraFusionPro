function LegacyImporter() {
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
        Universal Legacy Appraisal Importer
      </h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Import and convert legacy appraisal data from TOTAL, ClickForms, ACI, DataMaster, and Alamode systems
      </p>
      
      <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Upload Legacy Files
        </h2>
        
        <div style={{ 
          border: '2px dashed #ccc', 
          borderRadius: '8px', 
          padding: '32px', 
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            Drop your legacy files here
          </p>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Supports ZIP, SQLite, XML, CSV, PDF, and XLSX files
          </p>
          <button style={{ 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer'
          }}>
            Browse Files
          </button>
        </div>
        
        <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '12px' }}>
          Supported Legacy Systems
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontWeight: '500' }}>TOTAL</div>
            <div style={{ fontSize: '12px', color: '#666' }}>by a la mode</div>
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontWeight: '500' }}>ClickForms</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Forms Platform</div>
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontWeight: '500' }}>ACI</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Appraisal System</div>
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontWeight: '500' }}>DataMaster</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Legacy Data</div>
          </div>
          <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ fontWeight: '500' }}>Alamode</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Classic System</div>
          </div>
        </div>
        
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#eff6ff', 
          borderRadius: '4px',
          border: '1px solid #bfdbfe'
        }}>
          <p style={{ fontSize: '14px', color: '#1e40af' }}>
            <strong>Your CompsImporter SQLite file:</strong> Perfect for import! This system can extract comparable property data, sales information, and adjustment details from your backup file.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LegacyImporter;