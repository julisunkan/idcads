import { useAuth } from "@/hooks/use-auth";
import { useCards, useUpdateCardStatus } from "@/hooks/use-cards";
import { Navbar } from "@/components/Navbar";
import { Loader2, AlertCircle, Eye, Download, Ban, CheckCircle } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IDCardPreview } from "@/components/IDCardPreview";
import { useSettings } from "@/hooks/use-settings";
import { format } from "date-fns";
import { useState } from "react";
import { redirectToLogin } from "@/lib/auth-utils";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: cards, isLoading: cardsLoading } = useCards();
  const { mutate: updateStatus } = useUpdateCardStatus();
  const { data: settings } = useSettings();
  const { toast } = useToast();

  const [selectedCard, setSelectedCard] = useState<any>(null);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  
  if (!user) {
    redirectToLogin(toast);
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage generated ID cards and validation status.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline">Export CSV</Button>
          </div>
        </div>

        {cardsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border rounded-xl shadow-sm bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards?.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-mono">{card.idNumber}</TableCell>
                    <TableCell className="font-medium">{card.fullName}</TableCell>
                    <TableCell>{card.country}</TableCell>
                    <TableCell>{card.createdAt ? format(new Date(card.createdAt), "MMM d, yyyy") : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={card.status === "VALID" ? "default" : card.status === "REVOKED" ? "destructive" : "secondary"}>
                        {card.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedCard(card)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Card Preview</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center p-4">
                              <IDCardPreview 
                                card={{
                                  ...card,
                                  watermarkText: settings?.watermarkText,
                                  watermarkOpacity: settings?.watermarkOpacity,
                                }} 
                              />
                            </div>
                            <div className="flex justify-between gap-4 mt-4">
                               {card.status === "VALID" ? (
                                 <Button 
                                   variant="destructive" 
                                   className="w-full"
                                   onClick={() => updateStatus({ id: card.id, status: "REVOKED" })}
                                 >
                                   <Ban className="mr-2 h-4 w-4" />
                                   Revoke ID
                                 </Button>
                               ) : (
                                 <Button 
                                   variant="default" 
                                   className="w-full"
                                   onClick={() => updateStatus({ id: card.id, status: "VALID" })}
                                 >
                                   <CheckCircle className="mr-2 h-4 w-4" />
                                   Reactivate ID
                                 </Button>
                               )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!cards || cards.length === 0) && (
                   <TableRow>
                     <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                       No ID cards generated yet.
                     </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
