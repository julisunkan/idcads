import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { type Card } from "@shared/schema";

interface IDCardPreviewProps {
  card: Partial<Card> & { watermarkText?: string; watermarkOpacity?: number };
  className?: string;
}

export const IDCardPreview = forwardRef<HTMLDivElement, IDCardPreviewProps>(
  ({ card, className }, ref) => {
    const themeClasses = {
      blue: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-900",
      green: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900",
      gold: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-900",
    };

    const currentTheme = themeClasses[(card.theme as keyof typeof themeClasses) || "blue"];

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-[350px] h-[220px] rounded-xl border-2 shadow-xl overflow-hidden print:shadow-none flex flex-col",
          currentTheme,
          className
        )}
      >
        {/* Watermark */}
        {card.watermarkText && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
            style={{ opacity: (card.watermarkOpacity || 20) / 100 }}
          >
            <span className="text-4xl font-bold uppercase rotate-[-25deg] whitespace-nowrap select-none">
              {card.watermarkText}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="relative z-10 px-4 py-3 flex justify-between items-center border-b border-black/5 bg-white/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 opacity-70"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">Official Identification</h3>
              <p className="text-[10px] font-medium uppercase">{card.country || "Unknown Country"}</p>
            </div>
          </div>
          <div className="text-[10px] font-mono opacity-60">
             #{card.idNumber?.slice(-6) || "000000"}
          </div>
        </div>

        {/* Body */}
        <div className="relative z-10 p-4 flex gap-4 h-full">
          {/* Photo Area */}
          <div className="w-24 h-24 rounded-lg bg-black/10 flex-shrink-0 overflow-hidden border border-black/10">
            {card.photoUrl ? (
              <img 
                src={card.photoUrl} 
                alt="ID Photo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=No+Photo";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-center text-muted-foreground p-1">
                No Photo
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <label className="text-[9px] uppercase font-bold opacity-60 block mb-0.5">Full Name</label>
              <div className="font-serif font-bold text-lg leading-tight mb-2 truncate">
                {card.fullName || "Not Specified"}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] uppercase font-bold opacity-60 block mb-0.5">Date of Birth</label>
                  <div className="font-mono text-sm font-medium">{card.dob || "--/--/----"}</div>
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold opacity-60 block mb-0.5">ID Number</label>
                  <div className="font-mono text-sm font-medium truncate">{card.idNumber || "--------"}</div>
                </div>
              </div>
            </div>

            {/* Status & QR */}
            <div className="flex justify-between items-end mt-2">
              <div className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                card.status === "VALID" ? "bg-green-500/20 text-green-800" :
                card.status === "REVOKED" ? "bg-red-500/20 text-red-800" :
                "bg-gray-500/20 text-gray-800"
              )}>
                {card.status || "DRAFT"}
              </div>
              
              {/* QR Code */}
              <div className="w-12 h-12 bg-white p-1 rounded border border-black/5">
                <QRCodeSVG 
                  value={`https://${window.location.host}/verify/${card.idNumber}`} 
                  size={40}
                  level="L"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

IDCardPreview.displayName = "IDCardPreview";
