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

// Function to generate Machine-Readable Zone (MRZ)
const generateMRZ = (card: Partial<Card>) => {
  const countryCode = card.country || "XXX";
  
  // Format: Last name, First name
  const fullName = (card.fullName || "").toUpperCase();
  const nameParts = fullName.split(" ");
  const lastName = nameParts[nameParts.length - 1] || "LASTNAME";
  const firstName = nameParts.slice(0, -1).join(" ") || "FIRSTNAME";
  
  // Parse DOB (assuming format DD/MM/YYYY)
  const dob = card.dob || "01011990";
  const dobFormatted = dob.replace(/\//g, "").slice(-6); // YYMMDD
  
  // Line 1: Type, Country, Name
  const line1 = `IDID${countryCode}${lastName.padEnd(30, "<")}<<${firstName.padEnd(15, "<")}`.slice(0, 44);
  
  // Line 2: ID Number, DOB, Sex, Expiry, Nationality
  const idNum = (card.idNumber || "").padEnd(12, "0").slice(0, 12);
  const status = card.status === "VALID" ? "0" : (card.status === "REVOKED" ? "2" : "1");
  const expiryDate = (new Date().getFullYear() + 10).toString().slice(-2) + "1231"; // 10 years from now
  
  const line2 = `${idNum}0${dobFormatted}M${expiryDate}${countryCode}${status}<<<<<<<<<0`;
  
  return { line1, line2 };
};

export const IDCardPreview = forwardRef<HTMLDivElement, IDCardPreviewProps>(
  ({ card, className }, ref) => {
    const countryName = COUNTRIES.find(c => c.code === card.country)?.name || card.country || "Unknown Country";
    const countryFlag = getCountryFlag(card.country as string);
    const mrz = generateMRZ(card);
    
    const getThemeColors = (theme: string) => {
      switch(theme) {
        case 'blue':
          return {
            primary: '#003366',
            secondary: '#0066CC',
            accent: '#1E90FF',
            light: '#E6F2FF',
            border: '#004499'
          };
        case 'green':
          return {
            primary: '#1B4D2D',
            secondary: '#2D7F4F',
            accent: '#3FA569',
            light: '#E6F4ED',
            border: '#2D6B45'
          };
        case 'gold':
          return {
            primary: '#8B6914',
            secondary: '#B8860B',
            accent: '#DAA520',
            light: '#FFF8DC',
            border: '#A0752D'
          };
        default:
          return {
            primary: '#003366',
            secondary: '#0066CC',
            accent: '#1E90FF',
            light: '#E6F2FF',
            border: '#004499'
          };
      }
    };

    const colors = getThemeColors(card.theme as string);

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-[350px] h-[240px] rounded-sm shadow-2xl overflow-hidden print:shadow-none flex flex-col font-sans",
          className
        )}
        style={{
          backgroundColor: colors.light,
          borderTop: `3px solid ${colors.primary}`,
          borderBottom: `3px solid ${colors.primary}`,
          borderLeft: `1px solid ${colors.border}`,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        {/* Security Background Pattern */}
        <div className="absolute inset-0 opacity-[3%] pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${colors.primary}, ${colors.primary}2px, transparent 2px, transparent 4px)`,
        }}></div>

        {/* Watermark */}
        {card.watermarkText && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: (card.watermarkOpacity || 10) / 100 }}
          >
            <span className="text-2xl font-black uppercase rotate-[-25deg] whitespace-nowrap select-none" style={{ color: colors.primary }}>
              {card.watermarkText}
            </span>
          </div>
        )}

        {/* Top Header with Seal */}
        <div className="relative z-10 flex items-center justify-between px-3 py-2" style={{ backgroundColor: `${colors.primary}15` }}>
          <div className="flex items-center gap-2 flex-1">
            {/* Official Seal - Large Flag */}
            <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ 
              borderColor: colors.primary,
              backgroundColor: 'white',
              boxShadow: `0 2px 4px ${colors.primary}30`
            }}>
              <span className="text-4xl">{countryFlag}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] font-black uppercase tracking-widest" style={{ color: colors.primary }}>
                NATIONAL IDENTITY CARD
              </div>
              <div className="text-[10px] font-bold uppercase leading-none" style={{ color: colors.secondary }}>
                {countryName}
              </div>
            </div>
          </div>
          {/* Flag decoration on right */}
          <div className="text-2xl flex-shrink-0 ml-2 opacity-80">
            {countryFlag}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex-1 px-3 py-2.5 flex gap-2.5">
          {/* Left: Photo */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-20 h-24 rounded-sm overflow-hidden" style={{ 
              border: `2px solid ${colors.primary}`,
              backgroundColor: '#f0f0f0'
            }}>
              {card.photoUrl ? (
                <img 
                  src={card.photoUrl} 
                  alt="ID Photo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/80x96?text=Photo";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-center text-gray-400">
                  PHOTO
                </div>
              )}
            </div>
            {/* Signature Area */}
            <div className="text-center w-20">
              {(card as any).signatureUrl ? (
                <img 
                  src={(card as any).signatureUrl} 
                  alt="Signature" 
                  className="w-full h-auto"
                  style={{ maxHeight: '24px' }}
                />
              ) : (
                <div className="border-t border-black/40 pt-0.5">
                  <div className="text-[7px] font-semibold" style={{ color: colors.primary }}>Signature</div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Information */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Personal Info */}
            <div className="space-y-1.5">
              {/* Name */}
              <div>
                <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: colors.primary, opacity: 0.7 }}>
                  Full Name
                </div>
                <div className="text-sm font-bold leading-tight tracking-wide text-black truncate" style={{ fontFamily: 'Georgia, serif' }}>
                  {card.fullName || "NOT SPECIFIED"}
                </div>
              </div>

              {/* Grid: DOB and ID Number */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: colors.primary, opacity: 0.7 }}>
                    Date of Birth
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-black">
                    {card.dob || "--/--/----"}
                  </div>
                </div>
                <div>
                  <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: colors.primary, opacity: 0.7 }}>
                    ID Number
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-black">
                    {card.idNumber || "--------"}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Status and QR */}
            <div className="flex items-end justify-between gap-1 pt-1 border-t" style={{ borderColor: `${colors.primary}40` }}>
              <div className="flex items-center gap-1">
                <div className={cn(
                  "px-1.5 py-0.5 rounded-sm text-[7px] font-black uppercase tracking-widest whitespace-nowrap",
                  card.status === "VALID" ? "bg-green-600/20 text-green-800" :
                  card.status === "REVOKED" ? "bg-red-600/20 text-red-800" :
                  "bg-blue-600/20 text-blue-800"
                )}>
                  {card.status || "VALID"}
                </div>
                {/* Mini flag next to status */}
                <span className="text-xs opacity-60">{countryFlag}</span>
              </div>
              
              {/* QR Code */}
              <div className="w-11 h-11 bg-white p-0.5 rounded-sm flex-shrink-0" style={{
                border: `1.5px solid ${colors.primary}`,
                boxShadow: `0 1px 3px ${colors.primary}30`
              }}>
                <QRCodeSVG 
                  value={`https://${window.location.host}/verify/${card.idNumber}`} 
                  size={38}
                  level="L"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Machine-Readable Zone (MRZ) */}
        <div className="relative z-10 mt-auto px-2 py-1.5" style={{
          backgroundColor: 'white',
          borderTop: `1px solid ${colors.primary}40`,
        }}>
          <div className="text-[9px] leading-tight font-mono tracking-tighter" style={{
            letterSpacing: '0.05em',
            fontFamily: 'Courier New, monospace',
            fontWeight: '700',
            color: colors.primary,
          }}>
            <div className="break-all text-center">{mrz.line1}</div>
            <div className="break-all text-center">{mrz.line2}</div>
          </div>
        </div>

        {/* Security Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{
          background: `linear-gradient(90deg, ${colors.secondary}, ${colors.accent}, ${colors.secondary})`,
        }}></div>
      </div>
    );
  }
);

IDCardPreview.displayName = "IDCardPreview";
