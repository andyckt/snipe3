import { RateLimiter } from 'limiter';

// Create a rate limiter that allows 10 requests per minute
const textToSpeechLimiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute',
});

// Create a rate limiter that allows 20 requests per minute for S3 operations
const s3Limiter = new RateLimiter({
  tokensPerInterval: 20,
  interval: 'minute',
});

/**
 * Checks if a request should be rate limited for text-to-speech operations
 * @returns Promise<boolean> - true if the request is allowed, false if it should be rate limited
 */
export async function checkTextToSpeechRateLimit(): Promise<boolean> {
  const remainingRequests = await textToSpeechLimiter.removeTokens(1);
  return remainingRequests >= 0;
}

/**
 * Checks if a request should be rate limited for S3 operations
 * @returns Promise<boolean> - true if the request is allowed, false if it should be rate limited
 */
export async function checkS3RateLimit(): Promise<boolean> {
  const remainingRequests = await s3Limiter.removeTokens(1);
  return remainingRequests >= 0;
}
