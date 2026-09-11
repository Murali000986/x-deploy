import crypto from 'crypto';

export const twitterAuthHeaders = () => {
    return {
        'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`
    };
}

export function generateOAuth1Header(method: string, url: string) {
    const consumerKey = process.env.X_API_KEY!;
    const consumerSecret = process.env.X_API_SECRET!;
    const token = process.env.X_ACCESS_TOKEN!;
    const tokenSecret = process.env.X_ACCESS_SECRET!;

    const oauthNonce = crypto.randomBytes(32).toString('hex');
    const oauthTimestamp = Math.floor(Date.now() / 1000).toString();

    const parameters: Record<string, string> = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: oauthNonce,
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: oauthTimestamp,
        oauth_token: token,
        oauth_version: '1.0'
    };

    const parsedUrl = new URL(url);
    parsedUrl.searchParams.forEach((value, key) => {
        parameters[key] = value;
    });

    const parameterString = Object.keys(parameters)
        .sort()
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`)
        .join('&');

    const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(parsedUrl.origin + parsedUrl.pathname)}&${encodeURIComponent(parameterString)}`;

    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
    
    const signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
    parameters['oauth_signature'] = signature;

    const authHeaders = Object.keys(parameters)
        .filter(key => key.startsWith('oauth_'))
        .sort()
        .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(parameters[key])}"`)
        .join(', ');

    return `OAuth ${authHeaders}`;
}
