import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { getCountryFlag } from "@/lib/country-flags";
import { COUNTRIES } from "@/lib/countries";
import { type Card } from "@shared/schema";

interface IDCardPreviewProps {
  card: Partial<Card> & { watermarkText?: string; watermarkOpacity?: number; watermarkFlagUrl?: string; topLogoFlagUrl?: string };
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
          "relative w-[130mm] h-[85mm] rounded-sm shadow-2xl overflow-hidden print:shadow-none flex flex-col font-sans",
          className
        )}
        style={{
          backgroundColor: colors.light,
          borderTop: `4px solid ${colors.primary}`,
          borderBottom: `4px solid ${colors.primary}`,
          borderLeft: `2px solid ${colors.border}`,
          borderRight: `2px solid ${colors.border}`,
          fontFamily: 'Arial, sans-serif'
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
        <div className="relative z-10 grid grid-cols-12 gap-1 px-2 py-1.5 items-center" style={{ 
          backgroundColor: `${colors.primary}20`,
          borderBottom: `1px solid ${colors.primary}40`
        }}>
          {/* Left: Seal */}
          <div className="col-span-2 flex justify-center">
            <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ 
              borderColor: colors.primary,
              backgroundColor: 'white',
              boxShadow: `0 1px 3px ${colors.primary}40`
            }}>
              {(card as any).topLogoFlagUrl ? (
                <img src={(card as any).topLogoFlagUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-3xl">{countryFlag}</span>
              )}
            </div>
          </div>
          
          {/* Center: Title and Country */}
          <div className="col-span-8">
            <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.primary, letterSpacing: '0.1em' }}>
              NATIONAL IDENTITY CARD
            </div>
            <div className="text-[13px] font-black uppercase" style={{ color: colors.secondary }}>
              {countryName}
            </div>
          </div>
          
          {/* Right: Flag */}
          <div className="col-span-2 text-right">
            {(card as any).topLogoFlagUrl ? (
              <img src={(card as any).topLogoFlagUrl} alt="Logo" className="h-8 w-auto" />
            ) : (
              <span className="text-2xl">{countryFlag}</span>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex-1 px-2 py-1.5 grid grid-cols-12 gap-1.5">
          {/* Left Column: Photo & Signature */}
          <div className="col-span-3 flex flex-col justify-between">
            {/* Photo */}
            <div className="rounded-sm overflow-hidden" style={{ 
              border: `2px solid ${colors.primary}`,
              backgroundColor: '#f5f5f5',
              aspectRatio: '2.5/3'
            }}>
              {card.photoUrl ? (
                <img 
                  src={card.photoUrl} 
                  alt="ID Photo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/60x80?text=Photo";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-gray-400">
                  PHOTO
                </div>
              )}
            </div>
            
            {/* Signature */}
            <div className="text-center border-t pt-0.5" style={{ borderColor: colors.primary }}>
              {(card as any).signatureUrl ? (
                <img 
                  src={(card as any).signatureUrl} 
                  alt="Signature" 
                  className="w-full h-auto"
                  style={{ maxHeight: '16px' }}
                />
              ) : (
                <div className="text-[6px] font-bold" style={{ color: colors.primary }}>SIGNATURE</div>
              )}
            </div>
          </div>

          {/* Right Column: Information */}
          <div className="col-span-9 flex flex-col justify-between text-black">
            {/* Top Section */}
            <div className="space-y-2">
              {/* Full Name */}
              <div>
                <div className="text-[8px] font-black uppercase tracking-wider" style={{ color: colors.primary }}>NAME</div>
                <div className="text-[14px] font-black leading-tight tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                  {card.fullName || "NOT SPECIFIED"}
                </div>
              </div>

              {/* 2-Column Grid: DOB and Sex */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: colors.primary }}>DOB</div>
                  <div className="text-[11px] font-bold">
                    {card.dob || "--/--/----"}
                  </div>
                </div>
                <div>
                  <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: colors.primary }}>SEX</div>
                  <div className="text-[11px] font-bold">
                    {(card as any).sex || "M"}
                  </div>
                </div>
              </div>

              {/* ID Number */}
              <div>
                <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: colors.primary }}>ID NO.</div>
                <div className="text-[11px] font-mono font-bold">
                  {card.idNumber || "--------"}
                </div>
              </div>

              {/* Address */}
              <div>
                <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: colors.primary }}>ADDRESS</div>
                <div className="text-[10px] font-bold leading-tight line-clamp-2">
                  {(card as any).address || "---"}
                </div>
              </div>

              {/* 2-Column Grid: Issue & Expiry Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: colors.primary }}>ISSUED</div>
                  <div className="text-[11px] font-bold">
                    {(card as any).issueDate || "--/--/----"}
                  </div>
                </div>
                <div>
                  <div className="text-[7px] font-black uppercase tracking-wider" style={{ color: colors.primary }}>EXPIRES</div>
                  <div className="text-[11px] font-bold">
                    {(card as any).expiryDate || "--/--/----"}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Status & QR */}
            <div className="flex items-end justify-between gap-1" style={{ borderTop: `1px solid ${colors.primary}40`, paddingTop: '2px' }}>
              <div className="flex items-center gap-1 flex-1">
                <div className={cn(
                  "px-1 py-0.5 rounded-sm text-[6px] font-black uppercase tracking-widest whitespace-nowrap",
                  card.status === "VALID" ? "bg-green-600/40 text-green-800" :
                  card.status === "REVOKED" ? "bg-red-600/40 text-red-800" :
                  "bg-blue-600/40 text-blue-800"
                )}>
                  {card.status || "VALID"}
                </div>
                <span className="text-sm">{countryFlag}</span>
              </div>
              
              {/* QR Code */}
              <div className="bg-white p-0.5 flex-shrink-0" style={{
                border: `1.5px solid ${colors.primary}`,
                boxShadow: `0 1px 3px ${colors.primary}40`,
                width: '32px',
                height: '32px'
              }}>
                <QRCodeSVG 
                  value={`https://${window.location.host}/verify/${card.idNumber}`} 
                  size={30}
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
