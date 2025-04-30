import React, { useState } from 'react';

// Sample property data for demonstration
const sampleProperties = [
  { id: 1, address: '123 Main St', city: 'Austin', state: 'TX', price: 450000, sqft: 2200, beds: 4, baths: 3 },
  { id: 2, address: '456 Oak Ave', city: 'Austin', state: 'TX', price: 520000, sqft: 2500, beds: 4, baths: 2.5 },
  { id: 3, address: '789 Pine Ln', city: 'Austin', state: 'TX', price: 380000, sqft: 1800, beds: 3, baths: 2 },
  { id: 4, address: '101 Cedar Rd', city: 'Austin', state: 'TX', price: 495000, sqft: 2300, beds: 4, baths: 3.5 },
  { id: 5, address: '202 Elm Blvd', city: 'Austin', state: 'TX', price: 405000, sqft: 2100, beds: 3, baths: 2.5 },
];

export default function CompsSearchPage() {
  console.log("Basic CompsSearchPage rendering");
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setProperties(sampleProperties);
      setSearching(false);
    }, 1000);
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Comparable Property Search
      </h1>
      <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
        Search and analyze comparable properties in your market area
      </p>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#f9fafb',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Location
            </label>
            <input
              type="text"
              placeholder="Address, City, or ZIP"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem'
              }}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end',
            marginTop: '1.5rem'
          }}>
            <button 
              type="submit"
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#4f46e5', 
                color: 'white', 
                border: 'none', 
                borderRadius: '0.25rem',
                cursor: searching ? 'not-allowed' : 'pointer',
                opacity: searching ? 0.7 : 1
              }}
              disabled={searching}
            >
              {searching ? 'Searching...' : 'Search Properties'}
            </button>
          </div>
        </div>
      </form>
      
      {/* Results Table */}
      {properties.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Address</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Sq Ft</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Beds</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Baths</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <div>{property.address}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{property.city}, {property.state}</div>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>${property.price.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>{property.sqft.toLocaleString()}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{property.beds}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{property.baths}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button style={{ 
                      padding: '0.375rem 0.75rem', 
                      backgroundColor: '#f3f4f6', 
                      color: '#4b5563', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Empty State */}
      {properties.length === 0 && !searching && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1rem',
          backgroundColor: '#f9fafb', 
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            No properties found
          </div>
          <p style={{ color: '#6b7280' }}>
            Enter an address, city, or ZIP code to search for comparable properties.
          </p>
        </div>
      )}
    </div>
  );
}