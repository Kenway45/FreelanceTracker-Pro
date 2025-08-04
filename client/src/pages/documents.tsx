import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { File, Search, Download, FileText, Image, Archive } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const { toast } = useToast();
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

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents", { type: typeFilter, clientId: clientFilter }],
    retry: false,
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const getClientName = (clientId: string) => {
    const client = clients?.find((c: any) => c.id === clientId);
    return client?.name || "No Client";
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'invoice':
      case 'quote':
        return <FileText className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'archive':
        return <Archive className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'default';
      case 'quote':
        return 'secondary';
      case 'report':
        return 'outline';
      case 'contract':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredDocuments = documents?.filter((document: any) => {
    const matchesSearch = document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

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
              <h2 className="text-2xl font-semibold text-slate-900">Documents</h2>
              <p className="text-sm text-slate-500">All your invoices, quotes, and reports in one place</p>
            </div>
            <Button onClick={() => {
              toast({
                title: "Upload Document",
                description: "Document upload functionality coming soon!",
              });
            }}>
              <File className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All clients</SelectItem>
                    {clients?.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredDocuments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((document: any) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getFileIcon(document.type)}
                            <span className="font-medium text-slate-900">
                              {document.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeColor(document.type)} className="capitalize">
                            {document.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {document.clientId ? getClientName(document.clientId) : "No Client"}
                        </TableCell>
                        <TableCell>
                          {formatFileSize(document.fileSize)}
                        </TableCell>
                        <TableCell>
                          {new Date(document.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                toast({
                                  title: "Download Document",
                                  description: "Document download functionality coming soon!",
                                });
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <File className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No documents found</p>
                  <p className="text-sm">Documents will appear here as you create invoices and quotes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
