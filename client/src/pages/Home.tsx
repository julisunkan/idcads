import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCardSchema, type InsertCard } from "@shared/schema";
import { useCreateCard } from "@/hooks/use-cards";
import { useSettings } from "@/hooks/use-settings";
import { Navbar } from "@/components/Navbar";
import { IDCardPreview } from "@/components/IDCardPreview";
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
import { Loader2, Download, Printer, RefreshCw } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Home() {
  const { mutate: createCard, isPending } = useCreateCard();
  const { data: settings } = useSettings();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // State for live preview
  const [previewData, setPreviewData] = useState<Partial<InsertCard>>({
    theme: "blue",
    status: "VALID",
    country: "USA"
  });

  const form = useForm<InsertCard>({
    resolver: zodResolver(insertCardSchema),
    defaultValues: {
      fullName: "",
      dob: "",
      idNumber: Math.random().toString(36).substring(2, 10).toUpperCase(),
      country: "USA",
      theme: "blue",
      photoUrl: "",
    },
  });

  // Update preview as user types
  const handleValuesChange = (changedValues: Partial<InsertCard>) => {
    setPreviewData(prev => ({ ...prev, ...changedValues }));
  };

  const onSubmit = (data: InsertCard) => {
    createCard(data, {
      onSuccess: () => {
        form.reset({
          fullName: "",
          dob: "",
          idNumber: Math.random().toString(36).substring(2, 10).toUpperCase(),
          country: "USA",
          theme: "blue",
          photoUrl: "",
        });
        setPreviewData({ theme: "blue", country: "USA", status: "VALID" });
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
                              <SelectContent>
                                <SelectItem value="USA">United States</SelectItem>
                                <SelectItem value="CAN">Canada</SelectItem>
                                <SelectItem value="GBR">United Kingdom</SelectItem>
                                <SelectItem value="FRA">France</SelectItem>
                                <SelectItem value="DEU">Germany</SelectItem>
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
                          <FormLabel>Photo URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormDescription>Link to a square profile photo (or leave empty)</FormDescription>
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
                   watermarkText: settings?.watermarkText,
                   watermarkOpacity: settings?.watermarkOpacity,
                 }} 
               />
             </div>

             <div className="flex gap-4 w-full max-w-xs">
                <Button variant="outline" className="flex-1" onClick={handleDownload} disabled={!form.formState.isValid}>
                  <Download className="mr-2 h-4 w-4" />
                  PNG
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
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
