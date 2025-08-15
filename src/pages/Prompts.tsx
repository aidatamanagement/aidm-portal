
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      {/* Navigation Card */}
      <div 
        className="bg-[#F9F9F9] rounded-[10px] p-8 border border-[#D9D9D9]"
        style={{ fontFamily: '"SF Pro Text", sans-serif' }}
      >
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link 
              to="/dashboard" 
              className="text-[14px] text-slate-600 tracking-[-0.084px] hover:text-slate-800 transition-colors"
              style={{ fontFamily: '"SF Pro Text", sans-serif', lineHeight: '20px' }}
            >
              Dashboard
            </Link>
            <ChevronRight className="h-5 w-5 text-slate-600" />
            <Link 
              to="/prompts-intro" 
              className="text-[14px] text-slate-600 tracking-[-0.084px] hover:text-slate-800 transition-colors"
              style={{ fontFamily: '"SF Pro Text", sans-serif', lineHeight: '20px' }}
            >
              AIDM Prompt Builder
            </Link>
            <ChevronRight className="h-5 w-5 text-slate-600" />
            <span 
              className="text-[14px] text-[#026242] font-semibold tracking-[-0.084px]"
              style={{ fontFamily: '"SF Pro Text", sans-serif', lineHeight: '20px' }}
            >
              Prompts
            </span>
          </div>
        </div>

        {/* Title and Controls */}
        <div className="flex items-center justify-between">
          <h1 
            className="text-[30px] font-bold text-slate-800 tracking-[-0.39px] leading-[38px]"
            style={{ fontFamily: 'Helvetica, sans-serif' }}
          >
            Writing Prompts
          </h1>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant={showFavoritesOnly ? "outline" : "default"}
              onClick={() => setShowFavoritesOnly(false)}
              className="bg-[#026242] hover:bg-[#026242]/90 text-white"
            >
              All Prompts
            </Button>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(true)}
              className={showFavoritesOnly ? "bg-[#026242] hover:bg-[#026242]/90 text-white" : ""}
            >
              <Heart className="h-4 w-4 mr-2" />
              My Favorites
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mt-6 flex gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search prompts by title, description, persona, role, context, interview, task, boundaries, reasoning, keywords, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category Dropdown */}
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
      </div>

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
                        style={{ backgroundColor: prompt.prompt_categories.color || '#026242' }}
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
