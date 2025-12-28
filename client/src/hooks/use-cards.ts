import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateCardInput, type UpdateStatusInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCards() {
  return useQuery({
    queryKey: [api.cards.list.path],
    queryFn: async () => {
      const res = await fetch(api.cards.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cards");
      return api.cards.list.responses[200].parse(await res.json());
    },
  });
}

export function useCard(id: number) {
  return useQuery({
    queryKey: [api.cards.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.cards.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch card");
      return api.cards.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useVerifyCard(idNumber: string) {
  return useQuery({
    queryKey: [api.cards.verify.path, idNumber],
    queryFn: async () => {
      if (!idNumber) return null;
      const url = buildUrl(api.cards.verify.path, { idNumber });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) throw new Error("Card not found");
      if (!res.ok) throw new Error("Failed to verify card");
      return api.cards.verify.responses[200].parse(await res.json());
    },
    enabled: !!idNumber,
    retry: false,
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCardInput) => {
      const res = await fetch(api.cards.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create card");
      }
      return api.cards.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cards.list.path] });
      toast({
        title: "Success",
        description: "ID Card generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCardStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number } & UpdateStatusInput) => {
      const url = buildUrl(api.cards.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update status");
      return api.cards.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cards.list.path] });
      toast({
        title: "Success",
        description: "Card status updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
