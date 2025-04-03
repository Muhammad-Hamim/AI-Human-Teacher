/**
 * Server configuration utility
 * Handles server-specific settings like URLs and endpoints
 */

import * as os from 'os';

/**
 * Get all network interfaces with IP addresses
 */
function getNetworkIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  Object.keys(interfaces).forEach(name => {
    const networkInterface = interfaces[name];
    if (networkInterface) {
      networkInterface.forEach(iface => {
        // Skip internal and non-IPv4 addresses
        if (!iface.internal && iface.family === 'IPv4') {
          addresses.push(iface.address);
        }
      });
    }
  });

  return addresses;
}

/**
 * Get the base URL for the server based on environment or defaults
 */
function getServerBaseUrl(port: number = 3000): string {
  // First check environment variables
  if (process.env.SERVER_URL) {
    return process.env.SERVER_URL;
  }

  // For development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:${port}`;
  }

  // For production without an explicit SERVER_URL, try to find a suitable IP
  const ips = getNetworkIPs();
  if (ips.length > 0) {
    return `http://${ips[0]}:${port}`;
  }

  // Fallback to localhost if no network interfaces found
  return `http://localhost:${port}`;
}

/**
 * Generate a full URL for an audio file
 */
function getAudioUrl(messageId: string, baseUrl: string = ''): string {
  const relativePath = `/dist/tts-${messageId}.wav`;
  return baseUrl ? `${baseUrl}${relativePath}` : relativePath;
}

export const ServerConfig = {
  getNetworkIPs,
  getServerBaseUrl,
  getAudioUrl
};

export default ServerConfig; 