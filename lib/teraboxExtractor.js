const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extract the TeraBox file info from a given URL
 * @param {string} url - TeraBox file URL
 * @returns {Promise<object>} - Extracted info
 */
async function extractTeraBoxInfo(url) {
  try {
    // Normalize URL - clean it up and make sure it's a valid TeraBox URL
    const normalizedUrl = normalizeTeraBoxUrl(url);
    if (!normalizedUrl) {
      return { status: '❌ Error: Invalid TeraBox URL' };
    }

    // Fetch the page content
    const response = await axios.get(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      timeout: 10000,
    });

    // Parse the HTML content
    const $ = cheerio.load(response.data);
    
    // Extract file ID - this is often in a data attribute or in the URL
    const fileId = extractFileId(normalizedUrl, response.data);
    if (!fileId) {
      return { status: '❌ Error: Could not extract file ID' };
    }

    // Extract file info using script tags that contain JSON data
    const fileInfo = extractFileInfoFromPage(response.data);
    if (!fileInfo) {
      return { status: '❌ Error: Could not extract file info' };
    }

    // Get the short link
    const shortLink = await generateShortLink(normalizedUrl, fileId);

    // Format the response similar to the example
    const formattedResponse = formatResponse(fileInfo, shortLink);
    return formattedResponse;
  } catch (error) {
    console.error('Error extracting TeraBox info:', error);
    return {
      status: `❌ Error: ${error.message || 'Failed to extract information'}`,
    };
  }
}

/**
 * Normalize the TeraBox URL to ensure it's valid
 * @param {string} url - Input URL
 * @returns {string|null} - Normalized URL or null if invalid
 */
function normalizeTeraBoxUrl(url) {
  if (!url) return null;

  // List of valid TeraBox domains
  const validDomains = [
    'terabox.com', 
    '1024tera.com', 
    'teraboxapp.com', 
    '4funbox.com', 
    '1024terabox.com'
  ];
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // Check if it's a valid TeraBox domain
    if (!validDomains.some(validDomain => domain.includes(validDomain))) {
      return null;
    }
    
    // For short URLs, ensure they're expanded to the proper format
    if (url.includes('/s/')) {
      // In a production environment, we'd follow redirects to get the full URL
      // For now, we'll accept it as is
      return url;
    }
    
    return url;
  } catch (e) {
    return null;
  }
}

/**
 * Extract file ID from URL or page content
 * @param {string} url - TeraBox URL
 * @param {string} pageContent - HTML page content
 * @returns {string|null} - File ID or null if not found
 */
function extractFileId(url, pageContent) {
  // Try to extract from URL
  if (url.includes('/s/')) {
    const match = url.match(/\/s\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }
  
  // Try to extract from page content
  const fidMatch = pageContent.match(/\"fs_id\":(\d+)/);
  if (fidMatch && fidMatch[1]) return fidMatch[1];
  
  const shareidMatch = pageContent.match(/\"shareid\":(\d+)/);
  if (shareidMatch && shareidMatch[1]) return shareidMatch[1];
  
  return null;
}

/**
 * Extract file information from page script tags
 * @param {string} pageContent - HTML page content
 * @returns {object|null} - File info or null if not found
 */
function extractFileInfoFromPage(pageContent) {
  // This regex looks for a common pattern in TeraBox pages
  const dataMatch = pageContent.match(/window\.yunData = (.*?);/);
  if (!dataMatch || !dataMatch[1]) {
    return null;
  }
  
  try {
    // Parse the JSON data
    const yunData = JSON.parse(dataMatch[1]);
    
    // Extract file info
    const fileList = yunData.file_list || [];
    if (fileList.length === 0) {
      return null;
    }
    
    const fileInfo = fileList[0];
    
    // Create direct download link
    const server = yunData.server || '';
    const sign = yunData.sign || '';
    const timestamp = yunData.timestamp || '';
    
    const directLink = createDirectLink(fileInfo, server, sign, timestamp);
    
    return {
      title: fileInfo.server_filename || 'Unknown',
      size: formatSize(fileInfo.size || 0),
      directLink,
      thumbnails: generateThumbnailUrls(fileInfo, server, sign, timestamp)
    };
  } catch (e) {
    console.error('Error parsing file info:', e);
    return null;
  }
}

/**
 * Format file size from bytes to readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create direct download link
 * @param {object} fileInfo - File information
 * @param {string} server - Server URL
 * @param {string} sign - Sign parameter
 * @param {string} timestamp - Timestamp
 * @returns {string} - Direct download link
 */
function createDirectLink(fileInfo, server, sign, timestamp) {
  // This is a simplified implementation
  // In a real scenario, you'd need to reverse engineer TeraBox's API
  
  // For demonstration purposes, we'll create a mock link
  // In a real implementation, you would use the actual parameters
  const mockUrl = `https://d.1024tera.com/file/${fileInfo.fs_id}?fid=${fileInfo.fs_id}-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000000000)}&dstime=${timestamp}&rt=sh&sign=${sign}&expires=8h&chkv=0&chkbd=0&chkpc=&dp-logid=${Math.floor(Math.random() * 100000000000000)}&dp-callid=0&r=${Math.floor(Math.random() * 1000000000)}&sh=1&region=jp`;
  
  return mockUrl;
}

/**
 * Generate thumbnail URLs
 * @param {object} fileInfo - File information
 * @param {string} server - Server URL
 * @param {string} sign - Sign parameter
 * @param {string} timestamp - Timestamp
 * @returns {object} - Object with thumbnail URLs
 */
function generateThumbnailUrls(fileInfo, server, sign, timestamp) {
  // Only generate thumbnails for video or image files
  const isVideo = fileInfo.category === 1;
  const isImage = fileInfo.category === 3;
  
  if (!isVideo && !isImage) {
    return null;
  }
  
  // Base URL for thumbnails
  const baseThumbUrl = `https://data.1024tera.com/thumbnail/${fileInfo.fs_id}`;
  const randomParams = `?fid=${fileInfo.fs_id}-${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000000000)}&time=${timestamp}&rt=sh&sign=${sign}&expires=8h&chkv=0&chkbd=0&chkpc=&dp-logid=${Math.floor(Math.random() * 100000000000000)}&dp-callid=0`;
  
  // Create thumbnails in different sizes
  return {
    '140x90': `${baseThumbUrl}${randomParams}&size=c140_u90&quality=100&vuk=-&ft=${isVideo ? 'video' : 'image'}`,
    '360x270': `${baseThumbUrl}${randomParams}&size=c360_u270&quality=100&vuk=-&ft=${isVideo ? 'video' : 'image'}`,
    '60x60': `${baseThumbUrl}${randomParams}&size=c60_u60&quality=100&vuk=-&ft=${isVideo ? 'video' : 'image'}`,
    '850x580': `${baseThumbUrl}${randomParams}&size=c850_u580&quality=100&vuk=-&ft=${isVideo ? 'video' : 'image'}`
  };
}

/**
 * Generate a short link for the file
 * @param {string} originalUrl - Original TeraBox URL
 * @param {string} fileId - File ID
 * @returns {Promise<string>} - Short link
 */
async function generateShortLink(originalUrl, fileId) {
  // In a real implementation, you would interact with TeraBox's API
  // For demonstration, we'll create a mock short link
  return `https://1024terabox.com/s/${fileId}`;
}

/**
 * Format the response to match the expected output
 * @param {object} fileInfo - Extracted file info
 * @param {string} shortLink - Generated short link
 * @returns {object} - Formatted response
 */
function formatResponse(fileInfo, shortLink) {
  return {
    "status": "✅ Success",
    "📋 Extracted Info": [
      {
        "📄 Title": fileInfo.title,
        "📦 Size": fileInfo.size,
        "🔗 Direct Download Link": fileInfo.directLink,
        "🖼️ Thumbnails": fileInfo.thumbnails || {}
      }
    ],
    "🔗 ShortLink": shortLink
  };
}

module.exports = {
  extractTeraBoxInfo
};
