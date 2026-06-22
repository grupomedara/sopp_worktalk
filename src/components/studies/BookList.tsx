"use client";

import { useState } from "react";
import { BookOpen, CheckCircle, Plus, Trash, Edit } from "lucide-react";
import { updateBookProgress, deleteBook } from "@/app/actions/books";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookDialog } from "./BookDialog";

export interface Book {
  id: string;
  title: string;
  author: string;
  totalChapters: number;
  currentChapter: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BookListProps {
  initialBooks: Book[];
}

export function BookList({ initialBooks }: BookListProps) {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>(initialBooks);

  // Trigger modal after creation to inject into local state
  const handleBookCreated = (newBook: Book) => {
     setBooks([newBook, ...books]);
  };

  const handleIncrement = async (book: Book) => {
     if (book.currentChapter >= book.totalChapters) return;
     const next = book.currentChapter + 1;
     const res = await updateBookProgress(book.id, next);
     if (res.success) {
        setBooks(books.map(b => b.id === book.id ? { ...b, currentChapter: next, status: next === book.totalChapters ? "COMPLETED" : "READING" } : b));
     }
  };

  const handleDelete = async (bookId: string) => {
     const res = await deleteBook(bookId);
     if (res.success) {
        setBooks(books.filter(b => b.id !== bookId));
        toast({ title: "Livro deletado!", description: "Removido da sua estante." });
     }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-border/20 backdrop-blur-md">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Meus Livros
        </h2>
        
        {/* BookDialog on trigger */}
        <BookDialog onCreated={handleBookCreated} />
      </div>

      {books.length === 0 && (
         <p className="text-center text-xs text-muted-foreground py-10">Nenhum livro cadastrado. Adicione um para começar!</p>
      )}

      <div className="flex flex-col gap-3">
        {books.map((book) => {
          const progress = Math.min((book.currentChapter / book.totalChapters) * 100, 100);
          const isCompleted = book.status === "COMPLETED" || progress >= 100;

          return (
            <Card key={book.id} className={`border ${isCompleted ? 'border-primary/20 bg-primary/5' : 'border-border/20 bg-card/60'} hover:bg-muted/5 transition-all w-full flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4 shadow-none`}>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                   <CardTitle className="text-md font-bold text-foreground">
                      {book.title}
                   </CardTitle>
                   {isCompleted && <CheckCircle className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">Autor: <span className="text-foreground/80">{book.author}</span></p>
                
                <div className="flex items-center gap-3 mt-2">
                   <div className="flex-1 max-w-xs h-2 bg-muted/30 border border-border/10 rounded-full overflow-hidden shadow-inner">
                     <div 
                        className={cn(
                          "h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.3)]",
                          progress <= 50 ? "bg-red-500" : progress <= 90 ? "bg-yellow-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${progress}%` }}
                     />
                   </div>
                   <span className={cn(
                      "text-xs font-black uppercase tracking-tighter",
                      progress <= 50 ? "text-red-500" : progress <= 90 ? "text-yellow-500" : "text-emerald-500"
                   )}>
                      {Math.round(progress)}%
                   </span>
                </div>
              </div>

              <div className="flex justify-between w-full md:w-auto items-center gap-4">
                 <div className="text-xs text-muted-foreground">
                    Capítulo <span className="font-bold text-foreground">{book.currentChapter}</span> de {book.totalChapters}
                 </div>

                 <div className="flex items-center gap-2">
                    <Button 
                       size="sm" 
                       variant="default"
                       className="h-8 w-8 p-0 font-bold bg-white text-black hover:bg-white/90" 
                       disabled={isCompleted}
                       onClick={() => handleIncrement(book)}
                    >
                       +1
                    </Button>
                    <Button 
                       size="sm" 
                       variant="outline" 
                       className="h-8 w-8 p-0 border-destructive/30 hover:bg-destructive/10 text-destructive"
                       onClick={() => handleDelete(book.id)}
                    >
                       <Trash className="h-3.5 w-3.5" />
                    </Button>
                 </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
