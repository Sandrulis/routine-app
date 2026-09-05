export type GoogleOAuthIntegrationStatus = {
  integrationKey: "google_oauth";
  clientId: string;
  hasClientSecret: boolean;
  configured: boolean;
  enabled: boolean;
  configuredAccountEmail: string;
  callbackUrl: string;
  googleDriveCallbackUrl: string;
  redirectUrls: string[];
};

export type GoogleOAuthCredentialsInput = {
  clientId: string;
  clientSecret: string;
};

export type GooglePluginIntegrationStatus = {
  integrationKey: "google_plugin";
  clientId: string;
  hasClientSecret: boolean;
  configured: boolean;
  enabled: boolean;
  configuredAccountEmail: string;
  callbackUrl: string;
  redirectUrls: string[];
  scopes: string[];
};

export type GooglePluginCredentialsInput = {
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
  integrationKey: "resend" | "umami" | "sentry" | "turnstile" | "stripe";
  clientId: string;
  hasClientSecret: boolean;
  configured: boolean;
  enabled: boolean;
  replyToEmail: string;
  hasWebhookSecret?: boolean;
};

export type SimpleIntegrationCredentialsInput = {
  clientId: string;
  clientSecret: string;
  replyToEmail?: string;
};
