import React from 'react';

export default function CompsSearchPage() {
  console.log("Basic CompsSearchPage rendering");
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Comparable Property Search</h1>
      <p>Search and analyze comparable properties in your market area</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Search Properties
        </button>
      </div>
    </div>
  );
}