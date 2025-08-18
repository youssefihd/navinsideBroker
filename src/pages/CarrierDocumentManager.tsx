import { useState } from "react";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface Props {
  carrierId: number;
  filename?: string;
  onUploadComplete?: (fileName: string) => void;
}

export default function CarrierDocumentManager({ carrierId, filename, onUploadComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);

    try {
      const res = await api.post(`/pdf/carriers/${carrierId}/upload`, formData);
      toast({ title: "✅ Upload successful" });
      onUploadComplete?.(res.data); // Pass back filename to parent
      setFile(null);
    } catch (err) {
      toast({ title: "❌ Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

const handleDownload = async () => {
  if (!filename) {
    toast({ title: "⚠️ No filename provided for download" });
    return;
  }

  try {
    const response = await api.get(
  `/pdf/carriers/${carrierId}/download/${encodeURIComponent(filename)}`,
  { responseType: "blob" }
);


    const blob = new Blob([response.data], { type: response.headers["content-type"] });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    toast({ title: "❌ Download failed" });
  }
};

  return (
    <div className="border p-4 rounded shadow space-y-3">
      <h4 className="font-semibold text-md">Carrier Documents</h4>

      <div className="flex items-center space-x-2">
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={isUploading}
        />
        <Button onClick={handleUpload} disabled={!file || isUploading}>
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      {filename && (
        <div className="pt-2">
          <Button variant="outline" onClick={handleDownload}>
            Download {filename}
          </Button>
        </div>
      )}
    </div>
  );
}
