
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Heart, MessageSquare, Copy, Search, Tag, ChevronDown, ChevronRight, BookOpen, Lightbulb, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Prompts = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrompts();
      fetchFavorites();
      fetchCategories();
    }
  }, [user]);

  const fetchPrompts = async () => {
    try {
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
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('prompt_id')
        .eq('user_id', user?.id);

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('prompt_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const toggleFavorite = async (promptId: number) => {
    const isFavorited = favorites.some(fav => fav.prompt_id === promptId);

    try {
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user?.id)
          .eq('prompt_id', promptId);
        
        setFavorites(favorites.filter(fav => fav.prompt_id !== promptId));
        toast.success('Removed from favorites');
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user?.id,
            prompt_id: promptId
          });
        
        setFavorites([...favorites, { prompt_id: promptId }]);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const copyPrompt = async (prompt: any) => {
    const sections = [];
    
    // Add title
    if (prompt.title) {
      sections.push(`TITLE: ${prompt.title}`);
    }
    
    // Add description
    if (prompt.description) {
      sections.push(`DESCRIPTION:\n${prompt.description}`);
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
    
    // Add interview
    if (prompt.interview) {
      sections.push(`INTERVIEW:\n${prompt.interview}`);
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
    
    const content = sections.join('\n\n');
    
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Prompt copied to clipboard');
    } catch (error) {
      console.error('Error copying prompt:', error);
      toast.error('Failed to copy prompt');
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = searchTerm === '' || 
      prompt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.persona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.context?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.interview?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.task?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.boundaries?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.reasoning?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.keyword?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.prompt_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'uncategorized' && !prompt.prompt_categories) ||
      (prompt.prompt_categories && prompt.prompt_categories.id.toString() === selectedCategory);
    
    const matchesFavorites = showFavoritesOnly 
      ? favorites.some(fav => fav.prompt_id === prompt.id)
      : true;
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const isFavorited = (promptId: number) => {
    return favorites.some(fav => fav.prompt_id === promptId);
  };

  if (loading) {
    return <div className="p-6">Loading prompts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Writing Prompts</h1>
        <div className="flex space-x-2">
          <Button
            variant={showFavoritesOnly ? "outline" : "default"}
            onClick={() => setShowFavoritesOnly(false)}
          >
            All Prompts
          </Button>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            onClick={() => setShowFavoritesOnly(true)}
          >
            <Heart className="h-4 w-4 mr-2" />
            My Favorites
          </Button>
        </div>
      </div>

      {/* Prompt Writing Guide */}
      <Card className="border-primary/20 bg-primary/5">
        <Collapsible open={isGuideOpen} onOpenChange={setIsGuideOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl text-primary">How to Write an Effective Prompt</CardTitle>
                    <p className="text-sm text-primary/70 mt-1">Learn the PTCF framework and best practices</p>
                  </div>
                </div>
                {isGuideOpen ? (
                  <ChevronDown className="h-5 w-5 text-primary" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6 pt-0">
              {/* Why This Matters */}
              <div className="bg-white rounded-lg p-4 border border-primary/20">
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900">Why This Matters</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Well-crafted prompts improve AI output quality by <strong>60-80%</strong> and save hours of revision time. 
                  Spending 2 extra minutes on prompt structure typically saves <strong>30+ minutes</strong> of editing.
                </p>
              </div>

              {/* PTCF Framework */}
              <div className="bg-white rounded-lg p-4 border border-primary/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">The PTCF Framework</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">1</Badge>
                    <div>
                      <h4 className="font-medium text-gray-900">Persona</h4>
                      <p className="text-sm text-gray-600">Assign the AI a specific role or expertise</p>
                      <p className="text-xs text-gray-500 mt-1 italic">"You are a senior marketing director..." or "Act as a financial analyst..."</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">2</Badge>
                    <div>
                      <h4 className="font-medium text-gray-900">Task</h4>
                      <p className="text-sm text-gray-600">Use strong action verbs and describe the exact outcome</p>
                      <p className="text-xs text-gray-500 mt-1 italic">Create, analyze, optimize, evaluate + specific deliverable</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">3</Badge>
                    <div>
                      <h4 className="font-medium text-gray-900">Context</h4>
                      <p className="text-sm text-gray-600">Include background info the AI can't guess</p>
                      <p className="text-xs text-gray-500 mt-1 italic">Your industry, audience, constraints, relevant details</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">4</Badge>
                    <div>
                      <h4 className="font-medium text-gray-900">Format</h4>
                      <p className="text-sm text-gray-600">Specify output structure, style, and length</p>
                      <p className="text-xs text-gray-500 mt-1 italic">"Bullet points, 250 words max" or "Professional tone, table format"</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">5</Badge>
                    <div>
                      <h4 className="font-medium text-gray-900">Boundaries</h4>
                      <p className="text-sm text-gray-600">State what to avoid or exclude</p>
                      <p className="text-xs text-gray-500 mt-1 italic">"No competitor mentions" or "Focus only on Q1 data"</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">6</Badge>
                    <div>
                      <h4 className="font-medium text-gray-900">Reasoning</h4>
                      <p className="text-sm text-gray-600">Ask for explanation of the "why"</p>
                      <p className="text-xs text-gray-500 mt-1 italic">"Include rationale for your recommendations"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Pitfalls */}
              <div className="bg-white rounded-lg p-4 border border-primary/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Pitfalls</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Be specific:</strong> "Improve engagement with metrics and CTAs" not "make it better"</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Provide context:</strong> Don't assume AI knows your company or industry</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Test and iterate:</strong> Refine prompts based on results</span>
                  </li>
                </ul>
              </div>

              {/* Example Prompts */}
              <div className="bg-white rounded-lg p-4 border border-primary/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Prompts</h3>
                <p className="text-sm text-gray-600 mb-3">Same Task: Summarize a weekly sales meeting into a report</p>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-gray-300 pl-4">
                    <h4 className="font-medium text-gray-900 mb-2">Basic – (Quick, minimal instruction)</h4>
                    <p className="text-sm text-gray-700 italic">"Summarize this weekly sales meeting into a short report."</p>
                  </div>
                  
                  <div className="border-l-4 border-primary/60 pl-4">
                    <h4 className="font-medium text-gray-900 mb-2">Focused – (PTCF applied lightly)</h4>
                    <p className="text-sm text-gray-700 italic">
                      "Persona: Act as a business analyst. Task: Summarize the key points from the attached weekly sales meeting transcript. 
                      Context: Report is for the sales director who needs highlights for a Monday briefing. Format: Bullet points, max 8 items."
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium text-gray-900 mb-2">Comprehensive – (Full PTCF + boundaries + reasoning)</h4>
                    <p className="text-sm text-gray-700 italic">
                      "Persona: You are a senior business analyst with experience preparing executive-level summaries. 
                      Task: Create a weekly sales meeting summary report. Context: The meeting transcript covers sales team performance, 
                      pipeline updates, and challenges. Audience is the executive team; they have 5 minutes to review. 
                      Format: Return as a markdown report with sections: 'Highlights,' 'Challenges,' 'Opportunities,' 'Action Items.' 
                      Limit total length to 250 words. Boundaries: Do not include confidential client names, internal disagreements, 
                      or unverified figures. Focus on actionable, factual information only. Reasoning: After the report, include a short 
                      paragraph explaining why these points are most critical for the executive team this week."
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Reference */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Reference</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span><strong>Persona:</strong> Who should the AI be?</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span><strong>Task:</strong> What specific action + outcome?</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span><strong>Context:</strong> What background does AI need?</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span><strong>Format:</strong> How should output look?</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span><strong>Boundaries:</strong> What to avoid/exclude?</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span><strong>Reasoning:</strong> Ask for explanation?</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {/* Search Bar - Half Size */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search prompts by title, description, persona, role, context, interview, task, boundaries, reasoning, keywords, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Dropdown - Half Size */}
            <div className="w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredPrompts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showFavoritesOnly ? 'No favorite prompts found' : 'No prompts found'}
            </h3>
            <p className="text-gray-600">
              {showFavoritesOnly 
                ? 'Start adding prompts to your favorites by clicking the heart icon.'
                : searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search terms or category filter.'
                  : 'Check back later for new writing prompts.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-6">{prompt.title}</CardTitle>
                    {prompt.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{prompt.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyPrompt(prompt)}
                      className="flex-shrink-0"
                    >
                      <Copy className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(prompt.id)}
                      className="flex-shrink-0"
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          isFavorited(prompt.id) 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-400 hover:text-red-500'
                        }`} 
                      />
                    </Button>
                  </div>
                </div>
                
                {/* Category and Keyword Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {prompt.prompt_categories && (
                    <Badge 
                      variant="secondary" 
                      style={{ backgroundColor: prompt.prompt_categories.color || '#3B82F6' }}
                      className="text-white"
                    >
                      {prompt.prompt_categories.name}
                    </Badge>
                  )}
                  {prompt.keyword && prompt.keyword.split(',').map((keyword: string, index: number) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {keyword.trim()}
                    </Badge>
                  ))}
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
    </div>
  );
};

export default Prompts;
