import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, BookOpen, Filter } from "lucide-react";
import BookCard from "./BookCard";
import AddBookForm from "./AddBookForm";
import { Badge } from "@/components/ui/badge";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  total_pages?: number;
  genre?: string;
  published_year?: number;
}

interface Progress {
  book_id: string;
  current_page: number;
  status: string;
  rating?: number;
}

const BookLibrary = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchBooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user found");
        return;
      }

      console.log("Fetching books for user:", user.id);
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (booksError) {
        console.error("Books fetch error:", booksError);
        throw booksError;
      }

      const { data: progressData, error: progressError } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) {
        console.error("Progress fetch error:", progressError);
        throw progressError;
      }

      console.log("Fetched books:", booksData);
      console.log("Fetched progress:", progressData);
      setBooks(booksData || []);
      setProgress(progressData || []);
      
      if (booksData && booksData.length > 0) {
        toast({
          title: "Library loaded",
          description: `Found ${booksData.length} books in your library`,
        });
      }
    } catch (error: any) {
      console.error("Error fetching books:", error);
      toast({
        title: "Error",
        description: "Failed to load books: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Add real-time listener for new books
  useEffect(() => {
    const channel = supabase
      .channel('books-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'books'
        },
        (payload) => {
          console.log('New book added:', payload);
          // Refetch books when a new one is added
          fetchBooks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleBookAdded = () => {
    setShowAddForm(false);
    fetchBooks();
  };

  const getBookProgress = (bookId: string) => {
    return progress.find(p => p.book_id === bookId);
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    
    const bookProgress = getBookProgress(book.id);
    const status = bookProgress?.status || 'not_started';
    
    return status === statusFilter;
  });

  const statusCounts = {
    all: books.length,
    reading: progress.filter(p => p.status === 'reading').length,
    completed: progress.filter(p => p.status === 'completed').length,
    not_started: books.length - progress.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading your library...</p>
        </div>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="py-6">
        <AddBookForm 
          onBookAdded={handleBookAdded} 
          onCancel={() => setShowAddForm(false)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Library</h1>
          <p className="text-muted-foreground">Manage your reading collection</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Book
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search books or authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input border-border/50"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('all')}
          >
            <Filter className="w-3 h-3 mr-1" />
            All ({statusCounts.all})
          </Badge>
          <Badge 
            variant={statusFilter === 'reading' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('reading')}
          >
            Reading ({statusCounts.reading})
          </Badge>
          <Badge 
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('completed')}
          >
            Completed ({statusCounts.completed})
          </Badge>
          <Badge 
            variant={statusFilter === 'not_started' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('not_started')}
          >
            To Read ({statusCounts.not_started})
          </Badge>
        </div>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {books.length === 0 ? 'Start Your Library' : 'No books found'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {books.length === 0 
              ? 'Add your first book to begin tracking your reading journey'
              : 'Try adjusting your search or filters'
            }
          </p>
          {books.length === 0 && (
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Book
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              progress={getBookProgress(book.id)}
              onViewProgress={() => {
                // TODO: Implement progress view
                toast({ title: "Coming soon", description: "Progress details view" });
              }}
              onEdit={() => {
                // TODO: Implement edit
                toast({ title: "Coming soon", description: "Edit book functionality" });
              }}
              onDelete={() => {
                // TODO: Implement delete
                toast({ title: "Coming soon", description: "Delete book functionality" });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookLibrary;