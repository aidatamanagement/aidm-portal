
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Heart, MessageSquare, Copy, Search } from 'lucide-react';
import { toast } from 'sonner';

const Prompts = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPrompts();
      fetchFavorites();
    }
  }, [user]);

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
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
    const promptText = `Role: ${prompt.role}\n\nContext: ${prompt.context}\n\nTask: ${prompt.task}${prompt.boundaries ? `\n\nBoundaries: ${prompt.boundaries}` : ''}${prompt.reasoning ? `\n\nReasoning: ${prompt.reasoning}` : ''}`;
    
    try {
      await navigator.clipboard.writeText(promptText);
      toast.success('Prompt copied to clipboard');
    } catch (error) {
      console.error('Error copying prompt:', error);
      toast.error('Failed to copy prompt');
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = searchTerm === '' || 
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.task.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFavorites = showFavoritesOnly 
      ? favorites.some(fav => fav.prompt_id === prompt.id)
      : true;
    
    return matchesSearch && matchesFavorites;
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

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search prompts by title, role, context, or task..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                : searchTerm 
                  ? 'Try adjusting your search terms.'
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
                  <CardTitle className="text-lg leading-6">{prompt.title}</CardTitle>
                  <div className="flex items-center space-x-1">
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Role</h4>
                  <p className="text-sm text-gray-600">{prompt.role}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Context</h4>
                  <p className="text-sm text-gray-600">{prompt.context}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Task</h4>
                  <p className="text-sm text-gray-600">{prompt.task}</p>
                </div>

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
