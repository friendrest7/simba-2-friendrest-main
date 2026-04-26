/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_FACEBOOK_APP_ID?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_AUTH_PROVIDERS?: string;
  readonly VITE_ENABLE_PHONE_OTP?: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_FORCE_GOOGLE_IDENTITY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number | string;
              logo_alignment?: "left" | "center";
              locale?: string;
            },
          ) => void;
          prompt: () => void;
        };
      };
    };
    fbAsyncInit?: () => void;
    FB?: {
      init: (options: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string; userID: string } }) => void,
        options?: { scope?: string },
      ) => void;
      api: (
        path: string,
        params: { fields: string },
        callback: (response: { id?: string; name?: string; email?: string; error?: unknown }) => void,
      ) => void;
    };
  }
}

export {};
