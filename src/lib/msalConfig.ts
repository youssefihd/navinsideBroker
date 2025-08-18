// src/lib/msalConfig.ts
import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "d198ae0d-0ee1-439c-a826-88636beaea47",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin, // or your prod URI in production
  },
  cache: {
    cacheLocation: "localStorage", // or sessionStorage
    storeAuthStateInCookie: false, // useful for IE11
  },
};
