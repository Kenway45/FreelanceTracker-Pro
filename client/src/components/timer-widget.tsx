import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import NewTimerModal from "./modals/new-timer-modal";

interface TimerWidgetProps {
  activeTimer?: any;
}

export default function TimerWidget({ activeTimer }: TimerWidgetProps) {
  const [showNewTimerModal, setShowNewTimerModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const stopTimerMutation = useMutation({
    mutationFn: async (timerId: string) => {
      await apiRequest("PUT", `/api/time-entries/${timerId}/stop`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({
        title: "Timer stopped",
        description: "Time entry has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop timer.",
        variant: "destructive",
      });
    },
  });

  const formatElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const elapsed = now.getTime() - start.getTime();
    
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (activeTimer) {
    return (
      <div className="flex items-center space-x-2 bg-slate-100 rounded-lg px-3 py-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-slate-700">
          {activeTimer.description || "Active Timer"}
        </span>
        <span className="text-sm text-slate-500 font-mono">
          {formatElapsedTime(activeTimer.startTime)}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={() => stopTimerMutation.mutate(activeTimer.id)}
          disabled={stopTimerMutation.isPending}
        >
          <Square className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowNewTimerModal(true)}
        className="flex items-center space-x-2"
      >
        <Play className="h-4 w-4" />
        <span>Start Timer</span>
      </Button>
      
      <NewTimerModal 
        open={showNewTimerModal} 
        onOpenChange={setShowNewTimerModal}
      />
    </>
  );
}
