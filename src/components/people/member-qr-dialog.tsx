"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function MemberQrDialog({
  trigger,
  qrToken,
  displayName,
}: {
  trigger: React.ReactNode;
  qrToken: string;
  displayName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, qrToken, {
      width: 220,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff00" },
    });
  }, [open, qrToken]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm text-center">
        <DialogTitle>Member QR Code</DialogTitle>
        <p className="text-sm text-muted-foreground">{displayName}</p>
        <div className="mx-auto flex justify-center rounded-2xl glass p-4">
          <canvas ref={canvasRef} aria-label={`QR code for ${displayName}`} />
        </div>
        <p className="break-all font-mono text-xs text-muted-foreground">
          {qrToken}
        </p>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(qrToken);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy token"}
          </Button>
          <Button
            variant="glass"
            size="sm"
            onClick={() => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const link = document.createElement("a");
              link.download = `${displayName.replace(/\s+/g, "-")}-qr.png`;
              link.href = canvas.toDataURL("image/png");
              link.click();
            }}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
