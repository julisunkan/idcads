import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { getCountryFlag } from "@/lib/country-flags";
import { COUNTRIES } from "@/lib/countries";
import { type Card } from "@shared/schema";

interface IDCardPreviewProps {
  card: Partial<Card> & { watermarkText?: string; watermarkOpacity?: number };
  className?: string;
}

export const IDCardPreview = forwardRef<HTMLDivElement, IDCardPreviewProps>(
  ({ card, className }, ref) => {
    const countryName = COUNTRIES.find(c => c.code === card.country)?.name || card.country || "Unknown Country";
    const countryFlag = getCountryFlag(card.country as string);
    
    const themeClasses = {
      blue: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-900",
      green: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 text-emerald-900",
      gold: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 text-amber-900",
    };

    const currentTheme = themeClasses[(card.theme as keyof typeof themeClasses) || "blue"];

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-[350px] h-[220px] rounded border-2 shadow-lg overflow-hidden print:shadow-none flex flex-col",
          currentTheme,
          className
        )}
      >
        {/* Watermark */}
        {card.watermarkText && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
            style={{ opacity: (card.watermarkOpacity || 15) / 100 }}
          >
            <span className="text-3xl font-bold uppercase rotate-[-25deg] whitespace-nowrap select-none">
              {card.watermarkText}
            </span>
          </div>
        )}

        {/* Header with Country Info */}
        <div className="relative z-10 px-3 py-2 border-b border-black/10 bg-white/40">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-[9px] font-bold uppercase tracking-widest opacity-75 leading-tight">National Identity Card</h3>
              <p className="text-[11px] font-bold uppercase leading-tight">{countryName}</p>
            </div>
            <div className="text-3xl flex-shrink-0 ml-2">
              {countryFlag}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="relative z-10 p-3 flex gap-3 flex-1 overflow-hidden">
          {/* Photo Area */}
          <div className="w-20 h-20 flex-shrink-0 overflow-hidden border border-black/20 rounded">
            {card.photoUrl ? (
              <img 
                src={card.photoUrl} 
                alt="ID Photo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/80x80?text=No+Photo";
                }}
              />
            ) : (
              <div className="w-full h-full bg-black/5 flex items-center justify-center text-[8px] text-center text-muted-foreground">
                No Photo
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="space-y-1">
              <div>
                <label className="text-[7px] uppercase font-bold opacity-60 block leading-tight">Full Name</label>
                <div className="font-bold text-sm leading-tight truncate">
                  {card.fullName || "Not Specified"}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <label className="text-[7px] uppercase font-bold opacity-60 block leading-tight">Date of Birth</label>
                  <div className="font-mono text-[11px] leading-tight">{card.dob || "--/--/----"}</div>
                </div>
                <div>
                  <label className="text-[7px] uppercase font-bold opacity-60 block leading-tight">ID #</label>
                  <div className="font-mono text-[11px] leading-tight truncate">{card.idNumber || "--------"}</div>
                </div>
              </div>
            </div>

            {/* Status & QR */}
            <div className="flex justify-between items-end gap-1 pt-1">
              <div className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide whitespace-nowrap",
                card.status === "VALID" ? "bg-green-500/30 text-green-800" :
                card.status === "REVOKED" ? "bg-red-500/30 text-red-800" :
                "bg-gray-500/30 text-gray-800"
              )}>
                {card.status || "DRAFT"}
              </div>
              
              {/* QR Code */}
              <div className="w-10 h-10 bg-white p-0.5 rounded border border-black/10 flex-shrink-0">
                <QRCodeSVG 
                  value={`https://${window.location.host}/verify/${card.idNumber}`} 
                  size={36}
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
