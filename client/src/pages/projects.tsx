import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, FolderOpen, Search, Calendar } from "lucide-react";
import ProjectModal from "@/components/modals/project-modal";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Projects() {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "The project has been removed successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    },
  });

  const getClientName = (clientId: string) => {
    const client = clients?.find((c: any) => c.id === clientId);
    return client?.name || "No Client";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const filteredProjects = projects?.filter((project: any) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleAdd = () => {
    setEditingProject(null);
    setShowProjectModal(true);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Projects</h2>
              <p className="text-sm text-slate-500">Manage your projects and track progress</p>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredProjects.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hourly Rate</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project: any) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-slate-500 truncate max-w-xs">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.clientId ? getClientName(project.clientId) : "No Client"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(project.status)} className="capitalize">
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {project.hourlyRate ? `$${project.hourlyRate}` : "Not set"}
                        </TableCell>
                        <TableCell>
                          {project.deadline ? (
                            <div className="flex items-center text-sm">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(project.deadline).toLocaleDateString()}
                            </div>
                          ) : (
                            "No deadline"
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(project)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteProjectMutation.mutate(project.id)}
                              disabled={deleteProjectMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No projects found</p>
                  <p className="text-sm">Create your first project to get started</p>
                  <Button className="mt-4" onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <ProjectModal 
        open={showProjectModal} 
        onOpenChange={setShowProjectModal}
        project={editingProject}
      />
    </div>
  );
}
