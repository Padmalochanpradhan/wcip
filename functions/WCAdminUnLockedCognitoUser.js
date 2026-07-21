/**
 * Lambda: WCAdminUnLockedCognitoUser-prod
 *
 * Re-enables a Cognito user after an admin unlocks them from the Manage Users page.
 * Counterpart to WCLockedCognitoUser. After this call, WCLoginSuccessReset clears
 * the DB lockout flag so both enforcement layers are cleared together.
 *
 * Input:  { username }  — cognito_username (sub UUID from staff_roster)
 *   Note: takes the sub UUID directly, NOT the email, because the caller
 *   (admin-users.ts → unlockUser dialog) already has cognito_username on hand.
 *
 * Output: { statusCode, message }
 *
 * Env vars required:
 *   USER_POOL_ID — Cognito User Pool ID (e.g. us-east-1_XXXXXXXX)
 *   AWS_REGION   — defaults to us-east-1 if not set
 */

const { CognitoIdentityProviderClient, AdminEnableUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  // Support both proxy (body string) and non-proxy (direct object) API Gateway
  let body;
  try {
    if (typeof event.body === 'string')                    body = JSON.parse(event.body);
    else if (event.body && typeof event.body === 'object') body = event.body;
    else                                                   body = event;
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { username } = body;
  if (!username) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'username is required' }) };
  }

  try {
    await cognitoClient.send(new AdminEnableUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username:   username
    }));

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ message: 'User unlocked in Cognito' })
    };
  } catch (err) {
    console.error('WCAdminUnLockedCognitoUser error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
