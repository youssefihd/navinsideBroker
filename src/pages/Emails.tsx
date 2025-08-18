import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useMsal } from "@azure/msal-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';


interface Email {
  subject: string;
  bodyPreview: string;
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
}

interface ExtractionResult {
  origin: string | null;
  destination: string | null;
  equipment: string | null;
}

export default function Emails() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [extractions, setExtractions] = useState<Record<number, ExtractionResult>>({});
  const { instance } = useMsal();
  const { t } = useTranslation();


  const handleLogin2 = () => {
    instance.loginRedirect({ scopes: ["User.Read", "Mail.Read"] });
  };

 useEffect(() => {
  const fetchEmails = async () => {
    try {
      const account = instance.getAllAccounts()[0];
      const response = await instance.acquireTokenSilent({
        scopes: ["User.Read", "Mail.Read"],
        account,
      });

      const accessToken = response.accessToken;

     const res = await fetch("https://graph.microsoft.com/v1.0/me/messages?$top=10", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const data = await res.json();
setEmails(data.value);
    } catch (err) {
      console.error("Error fetching emails:", err);
    }
  };

  fetchEmails();
}, [instance]);

  const handleExtract = async (email: Email, index: number) => {
    const body = email.bodyPreview;
    const res = await api.post<ExtractionResult>("/api/load/extract", {
      emailBody: body,
    });
    console.log("Résultat NLP :", res.data);

    // Ajoute le résultat à l'index de l'email dans l'état
    setExtractions(prev => ({ ...prev, [index]: res.data }));
  };

  return (
    <div className="p-4 space-y-4">
    <Label className="cursor-pointer text-blue-600 hover:underline font-semibold">
  {t("connect_microsoft")}
</Label>

<Button
  onClick={handleLogin2}
  className="w-full bg-blue-600 text-white rounded"
>
  {t("login_with_microsoft")}
</Button>

<h1 className="text-2xl font-bold mb-4">{t("received_emails")}</h1>
      <ul className="space-y-4">
        {emails.map((email, index) => (
          <li key={index} className="border p-4 rounded shadow">
            <strong>{email.subject}</strong><br />
            <span className="text-sm text-gray-600">From: {email.from.emailAddress.address}</span><br />
            <p className="my-2">{email.bodyPreview}</p>

            <button
  onClick={() => handleExtract(email, index)}
  className="px-3 py-1 bg-blue-600 text-white rounded"
>
  {t("extract_info")}
</button>

{extractions[index] && (
  <div className="mt-2 text-sm bg-gray-100 p-2 rounded">
    <p><strong>{t("origin")}:</strong> {extractions[index].origin ?? t("not_detected")}</p>
    <p><strong>{t("destination")}:</strong> {extractions[index].destination ?? t("not_detected")}</p>
    <p><strong>{t("equipment")}:</strong> {extractions[index].equipment ?? t("unknown")}</p>
  </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
