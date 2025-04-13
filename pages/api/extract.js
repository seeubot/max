import { extractTeraBoxInfo } from '../../lib/teraboxExtractor';
import Cors from 'cors';

// Initialize the CORS middleware
const cors = Cors({
  methods: ['GET', 'HEAD'],
  origin: '*', // This allows all origins
});

// Helper function to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  // Run the CORS middleware
  await runMiddleware(req, res, cors);

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ status: '❌ Error: Method not allowed' });
  }

  // Get the URL from the query parameters
  const { url } = req.query;

  // Check if URL is provided
  if (!url) {
    return res.status(400).json({ status: '❌ Error: Missing URL parameter' });
  }

  try {
    // Extract TeraBox information
    const result = await extractTeraBoxInfo(url);
    
    // Return the result
    return res.status(result.status.includes('Success') ? 200 : 400).json(result);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      status: `❌ Error: ${error.message || 'Internal server error'}`,
    });
  }
}
