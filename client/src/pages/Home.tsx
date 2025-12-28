import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCardSchema, type InsertCard } from "@shared/schema";
import { useCreateCard } from "@/hooks/use-cards";
import { useSettings } from "@/hooks/use-settings";
import { Navbar } from "@/components/Navbar";
import { IDCardPreview } from "@/components/IDCardPreview";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRef, useState } from "react";
import { Loader2, Download, Printer, RefreshCw, Upload } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { mutate: createCard, isPending } = useCreateCard();
  const { data: settings } = useSettings();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for live preview
  const [previewData, setPreviewData] = useState<Partial<InsertCard> & { status?: string }>({
    theme: "blue",
    status: "VALID",
    country: "USA"
  });
  const [uploading, setUploading] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);

  const form = useForm<InsertCard>({
    resolver: zodResolver(insertCardSchema),
    defaultValues: {
      fullName: "",
      dob: "",
      sex: "M",
      address: "",
      idNumber: Math.random().toString(36).substring(2, 10).toUpperCase(),
      country: "USA",
      theme: "blue",
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 10*365*24*60*60*1000).toISOString().split('T')[0],
      photoUrl: "",
      signatureUrl: "",
    },
  });

  // Update preview as user types
  const handleValuesChange = (changedValues: Partial<InsertCard>) => {
    setPreviewData(prev => ({ ...prev, ...changedValues }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to upload photo');
      }

      const { photoUrl } = await res.json();
      form.setValue('photoUrl', photoUrl);
      handleValuesChange({ photoUrl });
      
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: InsertCard) => {
    createCard(data, {
      onSuccess: () => {
        form.reset({
          fullName: "",
          dob: "",
          sex: "M",
          address: "",
          idNumber: Math.random().toString(36).substring(2, 10).toUpperCase(),
          country: "USA",
          theme: "blue",
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 10*365*24*60*60*1000).toISOString().split('T')[0],
          photoUrl: "",
          signatureUrl: "",
        });
        setPreviewData({ theme: "blue", country: "USA", status: "VALID" } as Partial<InsertCard> & { status?: string });
        setSignatureSaved(false);
      }
    });
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = `ID-${form.getValues().idNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [130, 85] // ID card size in mm (130x85mm)
      });
      
      pdf.addImage(imgData, "PNG", 0, 0, 130, 85);
      pdf.save(`ID-${form.getValues().idNumber}.pdf`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container py-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Form Section */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-serif font-bold text-primary">Generate Universal ID</h1>
              <p className="text-muted-foreground">
                Create secure, verifiable identification cards instantly. 
                Fill out the details below to generate a new ID card.
              </p>
            </div>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Card Details</CardTitle>
                <CardDescription>All fields are required for generation.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} onChange={() => handleValuesChange(form.getValues())} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sex"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sex</FormLabel>
                            <Select 
                              onValueChange={(val) => {
                                field.onChange(val);
                                handleValuesChange({ sex: val });
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="M">Male (M)</SelectItem>
                                <SelectItem value="F">Female (F)</SelectItem>
                                <SelectItem value="X">Other (X)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street, City, Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="idNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Number</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon"
                              onClick={() => {
                                const newId = Math.random().toString(36).substring(2, 10).toUpperCase();
                                field.onChange(newId);
                                handleValuesChange({ idNumber: newId });
                              }}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select 
                              onValueChange={(val) => {
                                field.onChange(val);
                                handleValuesChange({ country: val });
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                {COUNTRIES.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Theme</FormLabel>
                            <Select 
                              onValueChange={(val) => {
                                field.onChange(val);
                                handleValuesChange({ theme: val });
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="blue">Corporate Blue</SelectItem>
                                <SelectItem value="green">Secure Green</SelectItem>
                                <SelectItem value="gold">Premium Gold</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="photoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Photo</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <input 
                                ref={fileInputRef}
                                type="file" 
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                              />
                              <Button 
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading || isPending}
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                {uploading ? "Uploading..." : "Upload Photo"}
                              </Button>
                              {field.value && (
                                <div className="text-sm text-muted-foreground">
                                  ✓ Photo uploaded
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>Upload a square profile photo (JPG, PNG, GIF, WebP)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="signatureUrl"
                      render={({ field }) => (
                        <FormItem>
                          <SignaturePad
                            disabled={isPending}
                            onSignatureSave={(signatureDataUrl) => {
                              field.onChange(signatureDataUrl);
                              handleValuesChange({ signatureUrl: signatureDataUrl });
                              setSignatureSaved(true);
                            }}
                            onClear={() => {
                              field.onChange("");
                              handleValuesChange({ signatureUrl: "" });
                              setSignatureSaved(false);
                            }}
                          />
                          {signatureSaved && (
                            <div className="text-sm text-green-600">
                              ✓ Signature saved
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-11 text-lg font-semibold shadow-lg shadow-primary/20" disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate ID Card"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="sticky top-24 flex flex-col items-center justify-center p-8 bg-white/50 border border-white/40 rounded-3xl shadow-2xl backdrop-blur-xl">
             <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">
               Live Preview
             </div>
             
             <div className="transform scale-110 mb-8 transition-transform duration-500 hover:scale-[1.15]">
               <IDCardPreview 
                 ref={cardRef}
                 card={{
                   ...previewData,
                   watermarkText: settings?.watermarkText || undefined,
                   watermarkOpacity: settings?.watermarkOpacity || undefined,
                   watermarkFlagUrl: settings?.watermarkFlagUrl || undefined,
                   topLogoFlagUrl: settings?.topLogoFlagUrl || undefined,
                   backgroundImageUrl: settings?.backgroundImageUrl || undefined,
                   titleFontFamily: settings?.titleFontFamily || undefined,
                   titleColor: settings?.titleColor || undefined,
                   textFontFamily: settings?.textFontFamily || undefined,
                   textColor: settings?.textColor || undefined,
                 }} 
               />
             </div>

             <div className="flex gap-4 w-full max-w-xs">
                <Button variant="outline" className="flex-1" onClick={handleDownload} disabled={!form.formState.isValid}>
                  <Download className="mr-2 h-4 w-4" />
                  PNG
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleDownloadPDF} disabled={!form.formState.isValid}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
             </div>
             
             <div className="mt-8 text-xs text-center text-muted-foreground max-w-xs">
               <p>This preview includes your watermark settings configured in the admin dashboard.</p>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
