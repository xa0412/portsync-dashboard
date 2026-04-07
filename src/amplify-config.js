import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-southeast-1_289ahZRq6',
      userPoolClientId: 'h72u43jcos808i3mjbjqu9rnk',
      region: 'ap-southeast-1',
    },
  },
});
