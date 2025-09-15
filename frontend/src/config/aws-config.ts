// AWS Cognito Configuration for Amplify v6
export const awsConfig = {
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_AWS_REGION || 'eu-central-1',
      userPoolId: process.env.REACT_APP_USER_POOL_ID || 'eu-central-1_i66pYQHZR',
      userPoolClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID || '7s5edv23i1rihuh83uvsif4ss1',
      loginWith: {
        email: true,
        username: false,
        phone: false,
      },
    },
  },
};

console.log('AWS Config:', awsConfig);
console.log('Environment variables:', {
  region: process.env.REACT_APP_AWS_REGION,
  userPoolId: process.env.REACT_APP_USER_POOL_ID,
  userPoolClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
});

// Validate configuration
if (!process.env.REACT_APP_USER_POOL_ID) {
  console.error('REACT_APP_USER_POOL_ID is not set!');
}
if (!process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID) {
  console.error('REACT_APP_USER_POOL_WEB_CLIENT_ID is not set!');
}

export default awsConfig;
