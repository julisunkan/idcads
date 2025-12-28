import { useAuth } from "@/hooks/use-auth";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { Navbar } from "@/components/Navbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema, type InsertSettings } from "@shared/schema";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
import { useEffect } from "react";
import { redirectToLogin } from "@/lib/auth-utils";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings();
  const { toast } = useToast();

  const form = useForm<InsertSettings>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      watermarkText: "UNITED STATES",
      watermarkColor: "#000000",
      watermarkOpacity: 50,
      watermarkEnabled: true,
      watermarkPosition: "center",
      watermarkFlagUrl: undefined,
      topLogoFlagUrl: undefined,
      backgroundImageUrl: undefined,
      titleFontFamily: "Georgia, serif",
      titleColor: "#000000",
      textFontFamily: "Arial, sans-serif",
      textColor: "#000000",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        watermarkText: settings.watermarkText || "",
        watermarkColor: settings.watermarkColor || "#000000",
        watermarkOpacity: settings.watermarkOpacity || 50,
        watermarkEnabled: settings.watermarkEnabled ?? true,
        watermarkPosition: settings.watermarkPosition || "center",
        watermarkFlagUrl: settings.watermarkFlagUrl || undefined,
        topLogoFlagUrl: settings.topLogoFlagUrl || undefined,
        backgroundImageUrl: settings.backgroundImageUrl || undefined,
        titleFontFamily: settings.titleFontFamily || "Georgia, serif",
        titleColor: settings.titleColor || "#000000",
        textFontFamily: settings.textFontFamily || "Arial, sans-serif",
        textColor: settings.textColor || "#000000",
      });
    }
  }, [settings, form]);

  const handleFlagUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'watermarkFlagUrl' | 'topLogoFlagUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.photoUrl) {
        form.setValue(field, data.photoUrl);
        toast({
          title: "Success",
          description: "Flag image uploaded successfully",
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Error",
        description: "Failed to upload flag image",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: InsertSettings) => {
    updateSettings(data);
  };

  if (authLoading || settingsLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!user) {
    redirectToLogin(toast);
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-10 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary">Global Settings</h1>
          <p className="text-muted-foreground">Configure the default appearance and security features for ID cards.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Watermark Configuration</CardTitle>
                <CardDescription>
                  This watermark is applied to all generated ID cards to prevent unauthorized replication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="watermarkEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Watermark</FormLabel>
                        <FormDescription>
                          Overlay text on ID cards for security.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="watermarkText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Watermark Text</FormLabel>
                        <FormControl>
                          <Input placeholder="OFFICIAL" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="watermarkColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Hex Code</FormLabel>
                        <div className="flex gap-2">
                           <div 
                             className="w-10 h-10 rounded border"
                             style={{ backgroundColor: field.value || "#000" }}
                           />
                           <FormControl>
                             <Input placeholder="#000000" {...field} value={field.value || ""} />
                           </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="watermarkOpacity"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                         <FormLabel>Opacity ({field.value}%)</FormLabel>
                      </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          defaultValue={[field.value || 50]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Adjust the transparency of the watermark text.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <FormLabel>Watermark Flag Image</FormLabel>
                    <FormDescription>Upload a custom flag image to use as watermark</FormDescription>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFlagUpload(e, 'watermarkFlagUrl')}
                      className="mt-2"
                    />
                    {form.watch('watermarkFlagUrl') && (
                      <img src={form.watch('watermarkFlagUrl') || ''} alt="Watermark flag" className="mt-2 h-12 w-auto rounded" />
                    )}
                  </div>

                  <div>
                    <FormLabel>Top Logo Flag Image</FormLabel>
                    <FormDescription>Upload a custom flag image for the top logo area</FormDescription>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFlagUpload(e, 'topLogoFlagUrl')}
                      className="mt-2"
                    />
                    {form.watch('topLogoFlagUrl') && (
                      <img src={form.watch('topLogoFlagUrl') || ''} alt="Top logo flag" className="mt-2 h-12 w-auto rounded" />
                    )}
                  </div>
                </div>

                <div>
                  <FormLabel>Background Image</FormLabel>
                  <FormDescription>Upload a background image for the ID card</FormDescription>
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFlagUpload(e, 'backgroundImageUrl')}
                    className="mt-2"
                  />
                  {form.watch('backgroundImageUrl') && (
                    <img src={form.watch('backgroundImageUrl') || ''} alt="Background" className="mt-2 h-24 w-auto rounded border" />
                  )}
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Font & Color Configuration</CardTitle>
                <CardDescription>
                  Customize the fonts and colors for titles and body text on ID cards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="titleFontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title Font Family</FormLabel>
                        <FormControl>
                          <Input placeholder="Georgia, serif" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>e.g., Georgia, serif or Arial, sans-serif</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="titleColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title Color</FormLabel>
                        <div className="flex gap-2">
                          <div 
                            className="w-10 h-10 rounded border"
                            style={{ backgroundColor: field.value || "#000" }}
                          />
                          <FormControl>
                            <Input placeholder="#000000" {...field} value={field.value || ""} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="textFontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Text Font Family</FormLabel>
                        <FormControl>
                          <Input placeholder="Arial, sans-serif" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>e.g., Arial, sans-serif or Courier, monospace</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="textColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Text Color</FormLabel>
                        <div className="flex gap-2">
                          <div 
                            className="w-10 h-10 rounded border"
                            style={{ backgroundColor: field.value || "#000" }}
                          />
                          <FormControl>
                            <Input placeholder="#000000" {...field} value={field.value || ""} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
