export type GoogleOAuthIntegrationStatus = {
  integrationKey: "google_oauth";
  clientId: string;
  hasClientSecret: boolean;
  configured: boolean;
  enabled: boolean;
  configuredAccountEmail: string;
  callbackUrl: string;
  googleDriveCallbackUrl: string;
  gmailPluginCallbackUrl: string;
  redirectUrls: string[];
};

export type GoogleOAuthCredentialsInput = {
  clientId: string;
  clientSecret: string;
};

export type MicrosoftOAuthIntegrationStatus = {
  integrationKey: "microsoft_oauth";
  clientId: string;
  hasClientSecret: boolean;
  configured: boolean;
  enabled: boolean;
  configuredAccountEmail: string;
  callbackUrl: string;
  onedriveCallbackUrl: string;
};

export type MicrosoftOAuthCredentialsInput = {
  clientId: string;
  clientSecret: string;
};

export type SimpleIntegrationStatus = {
  integrationKey: "resend" | "umami" | "sentry" | "turnstile";
  clientId: string;
  hasClientSecret: boolean;
  configured: boolean;
  enabled: boolean;
  replyToEmail: string;
};

export type SimpleIntegrationCredentialsInput = {
  clientId: string;
  clientSecret: string;
  replyToEmail?: string;
};
