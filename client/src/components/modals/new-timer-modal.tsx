import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NewTimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewTimerModal({ open, onOpenChange }: NewTimerModalProps) {
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: open,
  });

  const startTimerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/time-entries", {
        projectId,
        description,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({
        title: "Timer started",
        description: "Time tracking has begun for this task.",
      });
      setProjectId("");
      setDescription("");
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start timer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast({
        title: "Project required",
        description: "Please select a project before starting the timer.",
        variant: "destructive",
      });
      return;
    }
    startTimerMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Timer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project">Project</Label>
            <Select value={projectId} onValueChange={setProjectId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Task Description</Label>
            <Input
              id="description"
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={startTimerMutation.isPending || !projectId}
            >
              {startTimerMutation.isPending ? "Starting..." : "Start Timer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
