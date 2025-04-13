import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/extract?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.status.includes('Success')) {
        setResult(data);
      } else {
        setError(data.status || 'Failed to extract information');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Head>
        <title>TeraBox Extractor API</title>
        <meta name="description" content="Extract information from TeraBox links" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>TeraBox Extractor API</h1>
        
        <div style={{ marginBottom: '30px' }}>
          <h2>How to Use</h2>
          <p>Make a GET request to <code>/api/extract?url=YOUR_TERABOX_URL</code></p>
          <p>Replace YOUR_TERABOX_URL with the URL of the TeraBox file you want to extract information from.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter TeraBox URL"
              style={{ flex: 1, padding: '10px' }}
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#0070f3', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Extracting...' : 'Extract'}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ backgroundColor: '#ffebee', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <p style={{ color: '#c62828', margin: 0 }}>{error}</p>
          </div>
        )}

        {result && (
          <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
            <h3>Result:</h3>
            <pre style={{ overflowX: 'auto', padding: '10px', backgroundColor: '#fff', border: '1px solid #ddd' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
            
            {result['📋 Extracted Info']?.[0]?.['🖼️ Thumbnails']?.['360x270'] && (
              <div style={{ marginTop: '20px' }}>
                <h4>Thumbnail Preview:</h4>
                <img 
                  src={result['📋 Extracted Info'][0]['🖼️ Thumbnails']['360x270']} 
                  alt="Thumbnail" 
                  style={{ maxWidth: '100%', borderRadius: '5px' }} 
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
