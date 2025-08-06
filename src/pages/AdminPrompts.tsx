import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageSquare, Plus, Search, Filter, Edit, Trash2, AlertTriangle, Copy, Check } from 'lucide-react';

const AdminPrompts = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  
  // Prompt form states
  const [promptFormOpen, setPromptFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [promptTitle, setPromptTitle] = useState('');
  const [promptContext, setPromptContext] = useState('');
  const [promptRole, setPromptRole] = useState('');
  const [promptInterview, setPromptInterview] = useState('');
  const [promptTask, setPromptTask] = useState('');
  const [promptBoundaries, setPromptBoundaries] = useState('');
  const [promptReasoning, setPromptReasoning] = useState('');
  const [promptKeyword, setPromptKeyword] = useState('');
  
  // Delete confirmation states
  const [deletePromptId, setDeletePromptId] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Copy state for visual feedback
  const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('Setting up real-time subscriptions for AdminPrompts');

    const promptsChannel = supabase
      .channel('admin-prompts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompts'
        },
        (payload) => {
          console.log('Real-time prompts change:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up AdminPrompts real-time subscriptions');
      supabase.removeChannel(promptsChannel);
    };
  }, [queryClient]);

  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ['admin-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const createPromptMutation = useMutation({
    mutationFn: async (promptData: any) => {
      const { error } = await supabase
        .from('prompts')
        .insert(promptData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Prompt created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      resetPromptForm();
      setPromptFormOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create prompt: ${error.message}`);
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, promptData }: { id: number; promptData: any }) => {
      const { error } = await supabase
        .from('prompts')
        .update(promptData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Prompt updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      resetPromptForm();
      setPromptFormOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update prompt: ${error.message}`);
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (promptId: number) => {
      // First, delete all favorites for this prompt
      const { error: favoritesError } = await supabase
        .from('favorites')
        .delete()
        .eq('prompt_id', promptId);

      if (favoritesError) throw favoritesError;

      // Then delete the prompt
      const { error: promptError } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId);

      if (promptError) throw promptError;
    },
    onSuccess: () => {
      toast.success('Prompt deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      setDeletePromptId(null);
      setDeleteConfirmText('');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete prompt: ${error.message}`);
    },
  });

  const resetPromptForm = () => {
    setPromptTitle('');
    setPromptContext('');
    setPromptRole('');
    setPromptInterview('');
    setPromptTask('');
    setPromptBoundaries('');
    setPromptReasoning('');
    setPromptKeyword('');
    setEditingPrompt(null);
  };

  const handleCreatePrompt = () => {
    resetPromptForm();
    setPromptFormOpen(true);
  };

  const handleEditPrompt = (prompt: any) => {
    setEditingPrompt(prompt);
    setPromptTitle(prompt.title || '');
    setPromptContext(prompt.context || '');
    setPromptRole(prompt.role || '');
    setPromptInterview(prompt.interview || '');
    setPromptTask(prompt.task || '');
    setPromptBoundaries(prompt.boundaries || '');
    setPromptReasoning(prompt.reasoning || '');
    setPromptKeyword(prompt.keyword || '');
    setPromptFormOpen(true);
  };

  const handleSubmitPrompt = () => {
    if (!promptTitle.trim()) {
      toast.error('Prompt title is required');
      return;
    }

    if (!promptContext.trim() && !promptRole.trim() && !promptInterview.trim() && 
        !promptTask.trim() && !promptBoundaries.trim() && !promptReasoning.trim()) {
      toast.error('At least one content field is required');
      return;
    }

    const promptData = {
      title: promptTitle.trim(),
      context: promptContext.trim(),
      role: promptRole.trim(),
      interview: promptInterview.trim() || null,
      task: promptTask.trim(),
      boundaries: promptBoundaries.trim() || null,
      reasoning: promptReasoning.trim() || null,
      keyword: promptKeyword.trim() || null
    };

    if (editingPrompt) {
      updatePromptMutation.mutate({ id: editingPrompt.id, promptData });
    } else {
      createPromptMutation.mutate(promptData);
    }
  };

  const handleDeletePrompt = (promptId: number) => {
    setDeletePromptId(promptId);
    setDeleteConfirmText('');
  };

  const confirmDeletePrompt = () => {
    const prompt = prompts?.find(p => p.id === deletePromptId);
    if (!prompt) return;

    if (deleteConfirmText !== prompt.title) {
      toast.error('Please type the prompt title to confirm deletion');
      return;
    }

    deletePromptMutation.mutate(deletePromptId!);
  };

  const copyPromptContent = (prompt: any) => {
    const sections = [];
    
    // Add title
    if (prompt.title) {
      sections.push(`TITLE: ${prompt.title}`);
    }
    
    // Add context
    if (prompt.context) {
      sections.push(`CONTEXT:\n${prompt.context}`);
    }
    
    // Add role
    if (prompt.role) {
      sections.push(`ROLE:\n${prompt.role}`);
    }
    
    // Add interview
    if (prompt.interview) {
      sections.push(`INTERVIEW:\n${prompt.interview}`);
    }
    
    // Add task
    if (prompt.task) {
      sections.push(`TASK:\n${prompt.task}`);
    }
    
    // Add boundaries
    if (prompt.boundaries) {
      sections.push(`BOUNDARIES:\n${prompt.boundaries}`);
    }
    
    // Add reasoning
    if (prompt.reasoning) {
      sections.push(`REASONING:\n${prompt.reasoning}`);
    }
    
    const content = sections.join('\n\n');
    navigator.clipboard.writeText(content);
    toast.success('Prompt content with headings copied to clipboard!');
    
    // Set copied state for visual feedback
    setCopiedPromptId(prompt.id);
    
    // Reset the icon back to copy after 2 seconds
    setTimeout(() => {
      setCopiedPromptId(null);
    }, 2000);
  };

  const filteredAndSortedPrompts = React.useMemo(() => {
    if (!prompts) return [];

    let filtered = prompts.filter((prompt) => {
      const matchesSearch = searchTerm === '' || 
        prompt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.context?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.interview?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.boundaries?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.reasoning?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.keyword?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'keyword-asc':
          return (a.keyword || '').localeCompare(b.keyword || '');
        case 'keyword-desc':
          return (b.keyword || '').localeCompare(a.keyword || '');
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [prompts, searchTerm, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('date-desc');
  };

  if (promptsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const promptToDelete = prompts?.find(p => p.id === deletePromptId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Prompts Management</h1>
          <p className="text-muted-foreground">Create and manage AI prompts for users</p>
        </div>
        <Button onClick={handleCreatePrompt} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Prompt
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search and Filter Prompts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Label>Search Prompts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, context, role, task, keywords, etc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="min-w-40">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  <SelectItem value="keyword-asc">Keywords (A-Z)</SelectItem>
                  <SelectItem value="keyword-desc">Keywords (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="h-10"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prompts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Prompts</CardTitle>
          <CardDescription>
            {filteredAndSortedPrompts.length} of {prompts?.length || 0} prompt{(prompts?.length || 0) !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Content Preview</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPrompts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {prompts?.length === 0 ? 'No prompts found' : 'No prompts match your filters'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedPrompts.map((prompt) => (
                    <TableRow key={prompt.id}>
                      <TableCell>
                        <div className="font-medium">{prompt.title}</div>
                      </TableCell>
                      <TableCell>
                        {prompt.role ? (
                          <Badge variant="outline" className="capitalize">
                            {prompt.role}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No role</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {prompt.keyword ? (
                          <div className="flex flex-wrap gap-1">
                            {prompt.keyword.split(',').map((keyword: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {keyword.trim()}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No keywords</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {[prompt.context, prompt.task, prompt.interview].filter(Boolean).join(' ').slice(0, 100)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(prompt.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyPromptContent(prompt)}
                            title={copiedPromptId === prompt.id ? "Copied!" : "Copy prompt content"}
                            className={copiedPromptId === prompt.id ? "text-green-600" : ""}
                          >
                            {copiedPromptId === prompt.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPrompt(prompt)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrompt(prompt.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Form Modal */}
      <Dialog open={promptFormOpen} onOpenChange={setPromptFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}</DialogTitle>
            <DialogDescription>
              {editingPrompt ? 'Update the prompt details below.' : 'Fill in the details to create a new AI prompt.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="promptTitle">Title *</Label>
              <Input
                id="promptTitle"
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                placeholder="Enter a descriptive title for the prompt"
              />
            </div>
            <div>
              <Label htmlFor="promptContext">Context *</Label>
              <Textarea
                id="promptContext"
                value={promptContext}
                onChange={(e) => setPromptContext(e.target.value)}
                placeholder="Provide context or background information for the prompt"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="promptRole">Role *</Label>
              <Textarea
                id="promptRole"
                value={promptRole}
                onChange={(e) => setPromptRole(e.target.value)}
                placeholder="Define the role or persona for the AI"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="promptInterview">Interview</Label>
              <Textarea
                id="promptInterview"
                value={promptInterview}
                onChange={(e) => setPromptInterview(e.target.value)}
                placeholder="Interview questions or dialogue structure"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="promptTask">Task *</Label>
              <Textarea
                id="promptTask"
                value={promptTask}
                onChange={(e) => setPromptTask(e.target.value)}
                placeholder="Describe the specific task or instruction"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="promptBoundaries">Boundaries</Label>
              <Textarea
                id="promptBoundaries"
                value={promptBoundaries}
                onChange={(e) => setPromptBoundaries(e.target.value)}
                placeholder="Define limitations, constraints, or boundaries"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="promptReasoning">Reasoning</Label>
              <Textarea
                id="promptReasoning"
                value={promptReasoning}
                onChange={(e) => setPromptReasoning(e.target.value)}
                placeholder="Explain the reasoning or thought process"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="promptKeyword">Keywords</Label>
              <Input
                id="promptKeyword"
                value={promptKeyword}
                onChange={(e) => setPromptKeyword(e.target.value)}
                placeholder="Enter keywords for sorting (e.g., AI, leadership, strategy)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromptFormOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPrompt}
              disabled={createPromptMutation.isPending || updatePromptMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {(createPromptMutation.isPending || updatePromptMutation.isPending) 
                ? (editingPrompt ? 'Updating...' : 'Creating...') 
                : (editingPrompt ? 'Update Prompt' : 'Create Prompt')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePromptId} onOpenChange={() => setDeletePromptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Delete Prompt</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete the prompt 
                "<strong>{promptToDelete?.title}</strong>" and remove it from all user favorites.
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive font-medium mb-2">
                  This will also delete:
                </p>
                <ul className="text-sm text-destructive/80 list-disc list-inside space-y-1">
                  <li>All user favorites for this prompt</li>
                  <li>Prompt history and usage data</li>
                </ul>
              </div>
              <div>
                <Label htmlFor="confirmDelete" className="text-sm font-medium">
                  Type <code className="bg-muted px-1 rounded">{promptToDelete?.title}</code> to confirm:
                </Label>
                <Input
                  id="confirmDelete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type the prompt title here"
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePrompt}
              disabled={deleteConfirmText !== promptToDelete?.title || deletePromptMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePromptMutation.isPending ? 'Deleting...' : 'Delete Prompt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPrompts; 