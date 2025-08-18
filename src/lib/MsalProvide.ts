import { PublicClientApplication } from "@azure/msal-browser";

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "d198ae0d-0ee1-439c-a826-88636beaea47",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "https://clencyfront-ehd3eyfheudxa0ap.canadacentral-01.azurewebsites.net",
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
});
