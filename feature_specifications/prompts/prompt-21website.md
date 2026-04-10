You are given a task to integrate an existing React component in the codebase

The codebase should support:
- React with TypeScript
- Tailwind CSS
- Modern build tools (Vite/Next.js)

If your project doesn't support these, provide instructions on how to set them up.

Copy-paste this component to your project:
App.tsx
```tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ChevronDown, Menu, X, BookOpen, Calculator, FileText, Folder, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  type: 'file' | 'folder';
  fileUrl?: string;
  content?: string;
}

interface Topic {
  id: string;
  name: string;
  lessons: Lesson[];
}

interface Class {
  id: string;
  name: string;
  description: string;
  topics: Topic[];
  bannerImage: string;
}

const sampleData: Class[] = [
  {
    id: "class-1",
    name: "כיתה י 571 תשפה",
    description: "מתמטיקה לכיתה י - רמה בסיסית",
    bannerImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=300&fit=crop",
    topics: [
      {
        id: "algebra",
        name: "אלגברה",
        lessons: [
          { id: "1", title: "1. נוסחת השורשים - הוכחה של הנוסחה המלאה", type: "file", fileUrl: "#" },
          { id: "2", title: "2. פתרון משוואות ריבועיות", type: "file", fileUrl: "#" },
          { id: "3", title: "3. תרגילים על נוסחאות כפל מקוצר", type: "folder" },
          { id: "4", title: "4. בוחן לדוגמא משוואות נוסחאות כפל מקוצר", type: "file", fileUrl: "#" },
          { id: "5", title: "5. פירוק לגורמים - שיטות מתקדמות", type: "file", fileUrl: "#" },
        ]
      },
      {
        id: "geometry",
        name: "גאומטריה",
        lessons: [
          { id: "6", title: "6. משפט פיתגורס והוכחותיו", type: "file", fileUrl: "#" },
          { id: "7", title: "7. בוחן לדוגמא משוואות נוסחאות כפל מקוצר", type: "file", fileUrl: "#" },
          { id: "8", title: "8. זוויות במעגל", type: "folder" },
          { id: "9", title: "9. שטחים ונפחים", type: "file", fileUrl: "#" },
        ]
      },
      {
        id: "analytic-geometry",
        name: "גיאומטריה אנליטית",
        lessons: [
          { id: "10", title: "10. משוואת הישר", type: "file", fileUrl: "#" },
          { id: "11", title: "11. מרחק בין נקודות", type: "file", fileUrl: "#" },
          { id: "12", title: "12. משוואת המעגל", type: "folder" },
        ]
      }
    ]
  },
  {
    id: "class-2",
    name: "כיתה ט מצוינות תשפה",
    description: "מתמטיקה לכיתה ט - רמת מצוינות",
    bannerImage: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&h=300&fit=crop",
    topics: [
      {
        id: "advanced-algebra",
        name: "אלגברה מתקדמת",
        lessons: [
          { id: "13", title: "13. פונקציות ריבועיות", type: "file", fileUrl: "#" },
          { id: "14", title: "14. גרפים של פונקציות", type: "folder" },
          { id: "15", title: "15. מערכות משוואות", type: "file", fileUrl: "#" },
        ]
      },
      {
        id: "trigonometry",
        name: "טריגונומטריה",
        lessons: [
          { id: "16", title: "16. יחסים טריגונומטריים", type: "file", fileUrl: "#" },
          { id: "17", title: "17. פתרון משולשים", type: "file", fileUrl: "#" },
        ]
      },
      {
        id: "statistics",
        name: "סטטיסטיקה",
        lessons: [
          { id: "18", title: "18. ממוצע וחציון", type: "file", fileUrl: "#" },
          { id: "19", title: "19. הסתברות בסיסית", type: "folder" },
        ]
      }
    ]
  }
];

interface MathWebsiteProps {
  classes?: Class[];
}

const MathWebsite: React.FC<MathWebsiteProps> = ({ classes = sampleData }) => {
  const [currentPage, setCurrentPage] = useState<'home' | 'class'>('home');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleClassSelect = (classItem: Class) => {
    setSelectedClass(classItem);
    setCurrentPage('class');
    setSelectedTopic(null);
  };

  const handleHomeClick = () => {
    setCurrentPage('home');
    setSelectedClass(null);
    setSelectedTopic(null);
  };

  const scrollToTopic = (topicId: string) => {
    setSelectedTopic(topicId);
    const element = document.getElementById(`topic-${topicId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getLessonIcon = (lesson: Lesson) => {
    return lesson.type === 'folder' ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
  };

  const getTotalLessonsCount = (classItem: Class) => {
    return classItem.topics.reduce((total, topic) => total + topic.lessons.length, 0);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant={currentPage === 'home' ? 'default' : 'ghost'}
              size="sm"
              onClick={handleHomeClick}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">בית</span>
            </Button>

            {/* Class Dropdown - Desktop */}
            <div className="hidden md:block relative group">
              <Button
                variant={currentPage === 'class' ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-2"
              >
                <span>{selectedClass ? selectedClass.name : 'בחר כיתה'}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              <div className="absolute top-full right-0 mt-1 w-64 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {classes.map((classItem) => (
                  <button
                    key={classItem.id}
                    onClick={() => handleClassSelect(classItem)}
                    className="w-full text-right px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors first:rounded-t-md last:rounded-b-md"
                  >
                    {classItem.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>תפריט ניווט</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <Button
                    variant={currentPage === 'home' ? 'default' : 'ghost'}
                    onClick={() => {
                      handleHomeClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <Home className="w-4 h-4 ml-2" />
                    בית
                  </Button>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground">כיתות</h3>
                    {classes.map((classItem) => (
                      <Button
                        key={classItem.id}
                        variant={selectedClass?.id === classItem.id ? 'default' : 'ghost'}
                        onClick={() => {
                          handleClassSelect(classItem);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start text-sm"
                      >
                        {classItem.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentPage === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Welcome Banner */}
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  ברוכים הבאים לשיעורי המתמטיקה
                </h2>
                <p className="text-lg text-muted-foreground">
                  כאן תוכלו למצוא את כל החומרים והשיעורים למתמטיקה תיכונית
                </p>
              </div>

              {/* Classes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map((classItem) => (
                  <motion.div
                    key={classItem.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Card 
                      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 group"
                      onClick={() => handleClassSelect(classItem)}
                    >
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={classItem.bannerImage} 
                          alt={classItem.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 right-4 text-white">
                          <h3 className="text-xl font-bold">{classItem.name}</h3>
                          <p className="text-sm opacity-90">{classItem.description}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {classItem.topics.slice(0, 3).map((topic) => (
                            <span 
                              key={topic.id}
                              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            >
                              {topic.name}
                            </span>
                          ))}
                          {classItem.topics.length > 3 && (
                            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                              +{classItem.topics.length - 3} נוספים
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{classItem.topics.length} נושאים</span>
                          <span>{getTotalLessonsCount(classItem)} שיעורים</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : selectedClass && (
            <motion.div
              key="class"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Class Banner */}
              <div className="relative h-64 mb-8 rounded-lg overflow-hidden">
                <img 
                  src={selectedClass.bannerImage} 
                  alt={selectedClass.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-6 right-6 text-white">
                  <h2 className="text-3xl font-bold mb-2">{selectedClass.name}</h2>
                  <p className="text-lg opacity-90">{selectedClass.description}</p>
                </div>
              </div>

              {/* Topics Navigation */}
              <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-y border-border py-4 mb-8">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedClass.topics.map((topic) => (
                    <Button
                      key={topic.id}
                      variant={selectedTopic === topic.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => scrollToTopic(topic.id)}
                      className="whitespace-nowrap flex-shrink-0"
                    >
                      {topic.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Topics and Lessons */}
              <div className="space-y-8">
                {selectedClass.topics.map((topic) => (
                  <div key={topic.id} id={`topic-${topic.id}`} className="scroll-mt-32">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-primary" />
                      {topic.name}
                    </h3>
                    
                    <Accordion type="single" collapsible className="space-y-2">
                      {topic.lessons.map((lesson) => (
                        <AccordionItem 
                          key={lesson.id} 
                          value={lesson.id}
                          className="border border-border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50 rounded-lg">
                            <div className="flex items-center gap-3 text-right">
                              {getLessonIcon(lesson)}
                              <span className="font-medium">{lesson.title}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="bg-muted/30 rounded-lg p-4">
                              <p className="text-muted-foreground mb-3">
                                {lesson.description || "תיאור השיעור יופיע כאן"}
                              </p>
                              <div className="flex gap-2">
                                {lesson.type === 'file' && lesson.fileUrl && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="w-4 h-4 ml-1" />
                                      הורד קובץ
                                    </a>
                                  </Button>
                                )}
                                <Button size="sm" variant="outline">
                                  <BookOpen className="w-4 h-4 ml-1" />
                                  פתח שיעור
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MathWebsite;

```

Install NPM dependencies:
```bash
npm install framer-motion @remixicon/react
```


Additional setup:
1. Make sure you have Tailwind CSS configured in your project
2. Update your main App component or create a new component file
3. Import and use the component in your application

The component is designed to work standalone and includes all necessary styling and functionality.