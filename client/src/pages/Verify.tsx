import { useVerifyCard } from "@/hooks/use-cards";
import { Navbar } from "@/components/Navbar";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Verify() {
  const [match, params] = useRoute("/verify/:idNumber");
  const [searchId, setSearchId] = useState(match ? params.idNumber : "");
  const { data: verification, isLoading, error, refetch } = useVerifyCard(searchId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="container flex flex-col items-center justify-center py-20 min-h-[80vh]">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-serif font-bold text-slate-900">Verify ID Card</h1>
            <p className="text-slate-500">Enter a unique ID number to check validity.</p>
          </div>

          <Card className="shadow-xl border-slate-200">
            <CardHeader>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input 
                  placeholder="Enter ID Number..." 
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="font-mono uppercase"
                />
                <Button type="submit">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <div className="animate-pulse flex space-x-2">
                     <div className="h-2 w-2 bg-slate-400 rounded-full"></div>
                     <div className="h-2 w-2 bg-slate-400 rounded-full"></div>
                     <div className="h-2 w-2 bg-slate-400 rounded-full"></div>
                  </div>
                  <p className="mt-4 text-sm">Verifying with secure database...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-red-500">
                  <AlertCircle className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-bold">Verification Failed</h3>
                  <p className="text-sm text-red-600/80 mt-1">ID Number not found in system.</p>
                </div>
              ) : verification ? (
                <div className="flex flex-col items-center text-center space-y-6 py-4">
                  {verification.status === "VALID" ? (
                    <div className="flex flex-col items-center text-green-600 animate-in zoom-in duration-300">
                      <CheckCircle2 className="h-20 w-20 mb-4" />
                      <h2 className="text-2xl font-bold uppercase tracking-wide">Valid ID</h2>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-red-600 animate-in zoom-in duration-300">
                      <XCircle className="h-20 w-20 mb-4" />
                      <h2 className="text-2xl font-bold uppercase tracking-wide">{verification.status}</h2>
                    </div>
                  )}

                  <div className="w-full space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Full Name</span>
                        <p className="font-medium text-slate-900">{verification.fullName}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">Country</span>
                        <p className="font-medium text-slate-900">{verification.country}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">ID Number</span>
                        <p className="font-mono font-medium text-slate-900">{verification.idNumber}</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-400">
                    Verified at {new Date().toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Enter an ID number above to verify.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
