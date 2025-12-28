import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";

interface SignaturePadProps {
  onSignatureSave: (signatureDataUrl: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export const SignaturePad = ({ onSignatureSave, onClear, disabled }: SignaturePadProps) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      onClear();
    }
  };

  const handleSave = () => {
    if (sigCanvas.current && !isEmpty) {
      const signatureDataUrl = sigCanvas.current.toDataURL("image/png");
      onSignatureSave(signatureDataUrl);
    }
  };

  return (
    <div className="space-y-3 border rounded-lg p-4 bg-white/50">
      <div className="text-sm font-semibold">Draw Your Signature</div>
      
      <div className="border-2 border-dashed border-gray-300 rounded bg-white p-2">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: 400,
            height: 120,
            className: "w-full border border-gray-200 rounded cursor-crosshair bg-white",
          }}
          onEnd={() => {
            if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
              setIsEmpty(false);
            }
          }}
          throttle={16}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={disabled || isEmpty}
          className="flex-1"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={disabled || isEmpty}
          className="flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Save Signature
        </Button>
      </div>
    </div>
  );
};
