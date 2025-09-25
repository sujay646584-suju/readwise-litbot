import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Book, Calendar, User, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import bookCover1 from "@/assets/book-cover-1.jpg";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    cover_url?: string;
    total_pages?: number;
    genre?: string;
    published_year?: number;
  };
  progress?: {
    current_page: number;
    status: string;
    rating?: number;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onViewProgress?: () => void;
}

const BookCard = ({ book, progress, onEdit, onDelete, onViewProgress }: BookCardProps) => {
  const progressPercentage = book.total_pages && progress?.current_page 
    ? Math.round((progress.current_page / book.total_pages) * 100) 
    : 0;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-completed text-completed-foreground';
      case 'reading': return 'bg-reading-progress text-accent-foreground';
      case 'on_hold': return 'bg-muted text-muted-foreground';
      case 'abandoned': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Card className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-card border-border/50">
      <CardHeader className="relative pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight text-foreground line-clamp-2 mb-1">
              {book.title}
            </h3>
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              <User className="w-3 h-3" />
              {book.author}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewProgress}>
                View Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                Edit Book
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Delete Book
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-book-page border border-border/30">
          <img 
            src={book.cover_url || bookCover1} 
            alt={`${book.title} cover`}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {book.genre && (
              <Badge variant="outline" className="text-xs">
                {book.genre}
              </Badge>
            )}
            {book.published_year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {book.published_year}
              </span>
            )}
          </div>

          {progress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <Badge className={getStatusColor(progress.status)} variant="secondary">
                  {progress.status.replace('_', ' ')}
                </Badge>
              </div>
              <Progress 
                value={progressPercentage} 
                className="h-2 bg-book-page"
              />
              <p className="text-xs text-muted-foreground">
                {progress.current_page} / {book.total_pages} pages ({progressPercentage}%)
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={onViewProgress}
        >
          <Book className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookCard;