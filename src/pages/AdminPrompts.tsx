import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  const [promptDescription, setPromptDescription] = useState('');
  const [promptContext, setPromptContext] = useState('');
  const [promptPersona, setPromptPersona] = useState('');
  const [promptRole, setPromptRole] = useState('');
  const [promptInterview, setPromptInterview] = useState('');
  const [promptTask, setPromptTask] = useState('');
  const [promptBoundaries, setPromptBoundaries] = useState('');
  const [promptReasoning, setPromptReasoning] = useState('');
  const [promptKeyword, setPromptKeyword] = useState('');
  const [promptCategoryId, setPromptCategoryId] = useState<number | null>(null);
  
  // Category management states
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  
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
        .select(`
          *,
          prompt_categories (
            id,
            name,
            description,
            color
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['prompt-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Update categories state when data is loaded
  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
    }
  }, [categoriesData]);

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

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string; description: string }) => {
      const { data, error } = await supabase
        .from('prompt_categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newCategory) => {
      toast.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['prompt-categories'] });
      setCategories([...categories, newCategory]);
      setPromptCategoryId(newCategory.id);
      setShowAddCategory(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
    },
    onError: (error: any) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });

  const resetPromptForm = () => {
    setPromptTitle('');
    setPromptDescription('');
    setPromptContext('');
    setPromptPersona('');
    setPromptRole('');
    setPromptInterview('');
    setPromptTask('');
    setPromptBoundaries('');
    setPromptReasoning('');
    setPromptKeyword('');
    setPromptCategoryId(null);
    setEditingPrompt(null);
  };

  const handleCreatePrompt = () => {
    resetPromptForm();
    setPromptFormOpen(true);
  };

  const handleEditPrompt = (prompt: any) => {
    setEditingPrompt(prompt);
    setPromptTitle(prompt.title || '');
    setPromptDescription(prompt.description || '');
    setPromptContext(prompt.context || '');
    setPromptPersona(prompt.persona || '');
    setPromptRole(prompt.role || '');
    setPromptInterview(prompt.interview || '');
    setPromptTask(prompt.task || '');
    setPromptBoundaries(prompt.boundaries || '');
    setPromptReasoning(prompt.reasoning || '');
    setPromptKeyword(prompt.keyword || '');
    setPromptCategoryId(prompt.category_id || null);
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
      description: promptDescription.trim() || null,
      context: promptContext.trim(),
      persona: promptPersona.trim() || null,
      role: promptRole.trim(),
      interview: promptInterview.trim() || null,
      task: promptTask.trim(),
      boundaries: promptBoundaries.trim() || null,
      reasoning: promptReasoning.trim() || null,
      keyword: promptKeyword.trim() || null,
      category_id: promptCategoryId
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
    
    // Add persona
    if (prompt.persona) {
      sections.push(`PERSONA:\n${prompt.persona}`);
    }
    
    // Add task
    if (prompt.task) {
      sections.push(`TASK:\n${prompt.task}`);
    }
    
    // Add context
    if (prompt.context) {
      sections.push(`CONTEXT:\n${prompt.context}`);
    }
    
    // Add format (role)
    if (prompt.role) {
      sections.push(`FORMAT:\n${prompt.role}`);
    }
    
    // Add boundaries
    if (prompt.boundaries) {
      sections.push(`BOUNDARIES:\n${prompt.boundaries}`);
    }
    
    // Add reasoning
    if (prompt.reasoning) {
      sections.push(`REASONING:\n${prompt.reasoning}`);
    }
    
    // Add tags (keywords)
    if (prompt.keyword) {
      sections.push(`TAGS:\n${prompt.keyword}`);
    }
    
    // Add interview (additional field)
    if (prompt.interview) {
      sections.push(`INTERVIEW:\n${prompt.interview}`);
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

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim() || null
    });
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

      {/* Prompts Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Prompts</CardTitle>
          <CardDescription>
            {filteredAndSortedPrompts.length} of {prompts?.length || 0} prompt{(prompts?.length || 0) !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAndSortedPrompts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {prompts?.length === 0 ? 'No prompts found' : 'No prompts match your filters'}
              </h3>
              <p className="text-gray-600">
                {prompts?.length === 0 
                  ? 'Create your first prompt using the Create Prompt button above.'
                  : 'Try adjusting your search terms or filters.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAndSortedPrompts.map((prompt) => (
                <Card key={prompt.id} className="hover:shadow-md transition-shadow border-2 border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-6 mb-2">{prompt.title}</CardTitle>
                        {prompt.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{prompt.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            Admin View
                          </Badge>
                          {prompt.prompt_categories && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{ backgroundColor: prompt.prompt_categories.color + '20', color: prompt.prompt_categories.color, borderColor: prompt.prompt_categories.color + '40' }}
                            >
                              {prompt.prompt_categories.name}
                            </Badge>
                          )}
                          {prompt.keyword && prompt.keyword.split(',').map((keyword: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword.trim()}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(prompt.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
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
                          className="text-blue-600 hover:text-blue-700"
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
                    </div>
                  </CardHeader>
                                     <CardContent className="space-y-4">
                     {prompt.persona && (
                       <div>
                         <h4 className="font-medium text-gray-900 mb-1">Persona</h4>
                         <p className="text-sm text-gray-600">{prompt.persona}</p>
                       </div>
                     )}
                     
                     <div>
                       <h4 className="font-medium text-gray-900 mb-1">Task</h4>
                       <p className="text-sm text-gray-600">{prompt.task}</p>
                     </div>
                     
                     <div>
                       <h4 className="font-medium text-gray-900 mb-1">Context</h4>
                       <p className="text-sm text-gray-600">{prompt.context}</p>
                     </div>
                     
                     <div>
                       <h4 className="font-medium text-gray-900 mb-1">Format</h4>
                       <p className="text-sm text-gray-600">{prompt.role}</p>
                     </div>

                    {prompt.interview && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Interview</h4>
                        <p className="text-sm text-gray-600">{prompt.interview}</p>
                      </div>
                    )}

                    {prompt.boundaries && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Boundaries</h4>
                        <p className="text-sm text-gray-600">{prompt.boundaries}</p>
                      </div>
                    )}

                    {prompt.reasoning && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Reasoning</h4>
                        <p className="text-sm text-gray-600">{prompt.reasoning}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
              <Label htmlFor="promptDescription">Description</Label>
              <Textarea
                id="promptDescription"
                value={promptDescription}
                onChange={(e) => setPromptDescription(e.target.value)}
                placeholder="Brief description of the prompt purpose and usage"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="promptCategory">Category</Label>
              <div className="flex gap-2">
                <Select value={promptCategoryId?.toString() || ''} onValueChange={(value) => setPromptCategoryId(value ? parseInt(value) : null)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCategory(true)}
                  className="px-3"
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Main Prompt Fields in Specified Order */}
            <div>
              <Label htmlFor="promptPersona">Persona</Label>
              <Textarea
                id="promptPersona"
                value={promptPersona}
                onChange={(e) => setPromptPersona(e.target.value)}
                placeholder="Specific persona or character for the AI to adopt"
                rows={2}
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
              <Label htmlFor="promptFormat">Format</Label>
              <Textarea
                id="promptFormat"
                value={promptRole}
                onChange={(e) => setPromptRole(e.target.value)}
                placeholder="Define the format, structure, or role for the AI"
                rows={2}
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
              <Label htmlFor="promptKeyword">Tags</Label>
              <Input
                id="promptKeyword"
                value={promptKeyword}
                onChange={(e) => setPromptKeyword(e.target.value)}
                placeholder="Enter tags for categorizing (e.g., AI, leadership, strategy)"
              />
                        </div>
            
            {/* Additional Fields */}
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

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing prompts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newCategoryName">Category Name *</Label>
              <Input
                id="newCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="newCategoryDescription">Description</Label>
              <Textarea
                id="newCategoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Optional description for the category"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCategory}
              disabled={createCategoryMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPrompts; 