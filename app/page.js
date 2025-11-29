'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';

function DriftingCircle({ index, total, color = 'black', onPositionUpdate, initialPosition }) {
  const [mounted, setMounted] = useState(false);
  const [init, setInit] = useState(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const velocity = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let size, posX, posY;

    if (initialPosition) {
      size = initialPosition.size;
      posX = initialPosition.x;
      posY = initialPosition.y;
    } else {
      size = 300 + Math.random() * 350;
      const sectionWidth = window.innerWidth / total;
      const sectionX = sectionWidth * index;
      posX = sectionX + Math.random() * (sectionWidth - size);
      posY = Math.random() * (window.innerHeight - size);
    }

    const velX = (Math.random() - 0.5) * 0.15;
    const velY = (Math.random() - 0.5) * 0.15;

    setInit({ size, posX, posY });
    velocity.current = { x: velX, y: velY };
    x.set(posX);
    y.set(posY);
    setMounted(true);
  }, [index, total, initialPosition]);

  useAnimationFrame(() => {
    if (!init) return;

    const maxX = window.innerWidth - init.size;
    const maxY = window.innerHeight - init.size;

    let newX = x.get() + velocity.current.x;
    let newY = y.get() + velocity.current.y;

    if (newX <= 0 || newX >= maxX) {
      velocity.current.x *= -1;
      newX = Math.max(0, Math.min(maxX, newX));
    }

    if (newY <= 0 || newY >= maxY) {
      velocity.current.y *= -1;
      newY = Math.max(0, Math.min(maxY, newY));
    }

    x.set(newX);
    y.set(newY);

    if (onPositionUpdate) {
      onPositionUpdate(index, { x: newX, y: newY, size: init.size });
    }
  });

  if (!mounted || !init) return null;

  return (
    <motion.div
      className={`absolute rounded-full border ${color === 'white' ? 'opacity-50' : 'opacity-30'}`}
      initial={{ borderColor: '#000000' }}
      animate={{ borderColor: color === 'white' ? '#ffffff' : '#000000' }}
      transition={{ duration: 0.5 }}
      style={{
        width: init.size,
        height: init.size,
        x,
        y,
      }}
    />
  );
}

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [stories, setStories] = useState([]);
  const [activeStory, setActiveStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [animateAbout, setAnimateAbout] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [animateDonate, setAnimateDonate] = useState(false);
  const circlePositions = useRef({});
  const [paginatedPages, setPaginatedPages] = useState([]);
  const measureRef = useRef(null);
  const contentRef = useRef(null);

  // Load stories from API
  useEffect(() => {
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => setStories(data))
      .catch(err => console.error('Failed to load stories:', err));
  }, []);

  // Paginate story based on actual rendered height
  const paginateStoryByHeight = (story) => {
    if (!story || !measureRef.current || !contentRef.current) return [];

    const pages = [];
    // Use the actual content area height
    const containerHeight = contentRef.current.clientHeight;

    story.chapters.forEach((chapter, chapterIndex) => {
      const paragraphs = chapter.content.split('\n\n');
      let currentPageParagraphs = [];
      let isFirstPageOfChapter = pages.length === 0 || pages[pages.length - 1].chapterIndex !== chapterIndex;

      paragraphs.forEach((paragraph, pIndex) => {
        // Add paragraph to test
        currentPageParagraphs.push(paragraph);

        // Build test content with chapter title if needed
        let testContent = '';
        if (isFirstPageOfChapter) {
          testContent = `<h3 style="font-family: Chillax; font-size: 1.5rem; line-height: 1.2; margin-bottom: 32px; color: #1f2937;">${chapter.title}</h3>`;
        }

        // Build paragraphs with proper spacing, but no margin on the last one
        const paragraphsHtml = currentPageParagraphs
          .map((p, i) => {
            const isLast = i === currentPageParagraphs.length - 1;
            const marginBottom = isLast ? '0' : '1.5rem';
            return `<p style="font-family: Inconsolata, monospace; font-size: 1.125rem; line-height: 1.5; color: #374151; margin-bottom: ${marginBottom};">${p}</p>`;
          })
          .join('');

        measureRef.current.innerHTML = testContent + paragraphsHtml;
        const height = measureRef.current.scrollHeight;

        // If it exceeds container height and we have more than one paragraph, start new page
        if (height > containerHeight && currentPageParagraphs.length > 1) {
          // Remove the last paragraph that caused overflow
          currentPageParagraphs.pop();

          // Save current page
          pages.push({
            content: currentPageParagraphs.join('\n\n'),
            chapterTitle: chapter.title,
            chapterIndex: chapterIndex,
            isFirstPageOfChapter: isFirstPageOfChapter
          });

          // Start new page with the paragraph that didn't fit
          currentPageParagraphs = [paragraph];
          isFirstPageOfChapter = false;
        }
      });

      // Save remaining content
      if (currentPageParagraphs.length > 0) {
        pages.push({
          content: currentPageParagraphs.join('\n\n'),
          chapterTitle: chapter.title,
          chapterIndex: chapterIndex,
          isFirstPageOfChapter: isFirstPageOfChapter
        });
      }
    });

    return pages;
  };

  const handleStoryClick = (storyId) => {
    setIsTransitioning(true);
    const story = stories.find(s => s.id === storyId);
    const urlTitle = story.title.replace(/\s+/g, '-');
    window.history.pushState({}, '', `/${urlTitle}`);
    setTimeout(() => {
      setActiveStory(storyId);
      setCurrentPage(0);
    }, 500);
  };

  const handleClose = () => {
    window.history.pushState({}, '', '/');
    setActiveStory(null);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const handleNextPage = () => {
    if (currentPage < paginatedPages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Paginate story when it's opened or window resizes
  useEffect(() => {
    if (!activeStory || !measureRef.current || !contentRef.current) return;

    // Small delay to ensure the modal is fully rendered
    const timeoutId = setTimeout(() => {
      const story = stories.find(s => s.id === activeStory);
      if (story) {
        const pages = paginateStoryByHeight(story);
        setPaginatedPages(pages);
      }
    }, 100);

    // Re-paginate on window resize
    const handleResize = () => {
      if (activeStory && contentRef.current) {
        const story = stories.find(s => s.id === activeStory);
        if (story) {
          const pages = paginateStoryByHeight(story);
          setPaginatedPages(pages);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeStory, stories]);

  const updateCirclePosition = (index, position) => {
    circlePositions.current[index] = position;
  };

  // Read URL on mount to open the right story
  useEffect(() => {
    const path = pathname.replace('/', '');
    if (path) {
      const story = stories.find(s => s.title.replace(/\s+/g, '-') === path);
      if (story) {
        setIsTransitioning(true);
        setTimeout(() => {
          setActiveStory(story.id);
          setCurrentPage(0);
        }, 500);
      }
    }
  }, []);

  // Keyboard navigation for story pages
  useEffect(() => {
    if (!activeStory) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStory, currentPage, stories]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      if (!path) {
        // User navigated back to home
        setActiveStory(null);
        setIsTransitioning(false);
      } else {
        // User navigated to a story URL
        const story = stories.find(s => s.title.replace(/\s+/g, '-') === path);
        if (story) {
          setIsTransitioning(true);
          setTimeout(() => {
            setActiveStory(story.id);
            setCurrentPage(0);
          }, 500);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [stories]);

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-700 overflow-hidden ${
      isTransitioning || activeStory ? 'bg-black' : 'bg-white'
    }`}>
      {/* Floating circles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <DriftingCircle
            key={i}
            index={i}
            total={3}
            onPositionUpdate={updateCirclePosition}
          />
        ))}
      </div>

      {/* Home view */}
      <div className={`transition-opacity duration-500 ${
        isTransitioning || activeStory ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        {/* Header with tokens branding */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8">
          <div className="relative inline-block">
            <h1 className="text-[4rem] sm:text-[5rem] md:text-[7rem] lg:text-[9rem] xl:text-[12rem] tracking-tight leading-none" style={{ fontFamily: 'Chillax' }}>tokens</h1>
            <button
              onMouseEnter={() => {
                setShowAbout(true);
                setTimeout(() => setAnimateAbout(true), 10);
              }}
              onMouseLeave={() => {
                setShowAbout(false);
                setAnimateAbout(false);
              }}
              className="absolute bottom-2 right-[-28px] sm:bottom-4 sm:right-[-32px] md:bottom-6 md:right-[-40px] w-[18px] h-[18px] md:w-[20px] md:h-[20px] rounded-full bg-black cursor-pointer hover:scale-150 transition-transform duration-500 hover:duration-300 flex items-center justify-center group"
            >
              <span className="text-white text-xs font-medium group-hover:scale-[0.667] transition-transform duration-500 group-hover:duration-300">i</span>
            </button>
          </div>

          {/* About text box */}
          {showAbout && (
            <div
              onMouseEnter={() => setShowAbout(true)}
              onMouseLeave={() => {
                setShowAbout(false);
                setAnimateAbout(false);
              }}
              className="absolute bottom-[-115px] right-[-205px] lg:right-[-315px] bg-white w-48 lg:w-72 rounded-lg overflow-hidden animate-slide-down"
              style={{ padding: '16px' }}
            >
              <div className={`absolute inset-0 bg-black rounded-lg ${animateAbout ? 'animate-fill-top-down' : 'opacity-0'}`}></div>
              <p className="text-base leading-relaxed relative z-10 text-white">
                small stories shaped from thought experiments, in my voice, generated by AI
              </p>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="min-h-screen flex items-start lg:items-center justify-center p-8" style={{ paddingTop: '20vh' }}>
          <div className="bg-white border border-black rounded-lg relative z-10" style={{ padding: '45px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-12">
              {/* Story cards */}
              {stories.map((story, index) => (
                <button
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
                  className="flex flex-row items-center gap-4 group cursor-pointer opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-[50px] h-[50px] rounded-full border border-black relative overflow-hidden flex items-center justify-center">
                    <div className="absolute bottom-0 left-0 right-0 h-0 bg-black rounded-full transition-all duration-500 ease-out group-hover:h-full"></div>
                    {/* Arrow for desktop */}
                    <svg className="relative z-10 w-5 h-5 text-white hidden lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <p className="text-base" style={{ fontFamily: 'Chillax' }}>{story.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Story view */}
      {activeStory && (
        <div className={`fixed inset-0 flex items-center justify-center px-8 py-4 transition-opacity duration-700 pointer-events-none ${
          activeStory ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* White floating circles for story view */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <DriftingCircle
                key={i}
                index={i}
                total={3}
                color="white"
                initialPosition={circlePositions.current[i]}
              />
            ))}
          </div>

          <div className="max-w-2xl w-full rounded-lg shadow-2xl relative z-10 overflow-hidden flex flex-col pointer-events-auto" style={{ backgroundColor: '#f5f5f5', height: '90vh', maxHeight: '90vh' }}>
            {(() => {
              const story = stories.find(s => s.id === activeStory);
              const currentPageData = paginatedPages[currentPage] || {};

              return (
                <>
                  <div className="flex-shrink-0" style={{ padding: '24px 24px 0 24px' }}>
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-black transition-colors"
                      >
                        ← Back
                      </button>
                      <h2 className="text-base text-gray-600" style={{ fontFamily: 'Chillax' }}>
                        {story?.title}
                      </h2>
                    </div>

                    {/* Subtle chapter title for pages 2+ */}
                    {currentPage > 0 && paginatedPages[currentPage - 1]?.chapterIndex === currentPageData.chapterIndex && (
                      <p className="text-xs text-gray-400 pb-4" style={{ fontFamily: 'Chillax' }}>
                        {currentPageData.chapterTitle}
                      </p>
                    )}
                  </div>

                  <div
                    ref={contentRef}
                    className="flex-1 overflow-hidden relative"
                    style={{ padding: '16px 24px 0 24px' }}
                  >
                    {/* First page of chapter: Large chapter title */}
                    {currentPageData.isFirstPageOfChapter && (
                      <h3 className="text-2xl text-gray-800" style={{ fontFamily: 'Chillax', marginBottom: '32px', lineHeight: '1.2' }}>
                        {currentPageData.chapterTitle}
                      </h3>
                    )}

                    {/* Render paragraphs with proper spacing */}
                    {currentPageData.content && currentPageData.content.split('\n\n').map((paragraph, idx, arr) => {
                      const isLast = idx === arr.length - 1;
                      return (
                        <p key={idx} className="text-lg text-gray-700" style={{ fontFamily: 'Inconsolata, monospace', lineHeight: '1.5', marginBottom: isLast ? '0' : '1.5rem' }}>
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-between" style={{ padding: '12px 24px' }}>
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                      className="text-gray-600 hover:text-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400"
                      style={{ padding: '8px 12px' }}
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      {currentPage + 1} / {paginatedPages.length}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === paginatedPages.length - 1}
                      className="text-gray-600 hover:text-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400"
                      style={{ padding: '8px 12px' }}
                    >
                      Next →
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Donate button */}
      <div className="fixed bottom-6 md:bottom-8 right-4 md:right-8 group cursor-pointer z-50" onClick={() => {
        if (!showDonate) {
          setShowDonate(true);
          setTimeout(() => setAnimateDonate(true), 10);
        }
      }}>
        <div className="relative w-[140px] h-[60px]">
          {/* Oval donate button (shows on hover when popup is closed) */}
          <div className={`absolute right-0 top-0 w-full h-full bg-white border border-black rounded-full flex items-center justify-center transition-all ${
            !showDonate
              ? 'opacity-0 duration-200 delay-0 group-hover:opacity-100 group-hover:duration-500 group-hover:delay-200 pointer-events-none group-hover:pointer-events-auto'
              : 'opacity-0 duration-500 delay-0 pointer-events-none'
          }`}>
            <span className="text-black font-medium text-lg whitespace-nowrap">donate</span>
          </div>

          {/* Dollar circle (shows when popup is closed) */}
          <div className={`absolute right-0 top-0 w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all ${
            showDonate
              ? 'opacity-0 duration-300 pointer-events-none'
              : 'opacity-100 duration-300 group-hover:opacity-0'
          }`} style={{
            backgroundColor: activeStory ? 'white' : 'black',
            border: activeStory ? '1px solid white' : '1px solid black'
          }}>
            <span className={`text-xl leading-none font-normal ${activeStory ? 'text-black' : 'text-white'}`}>$</span>
          </div>

          {/* X circle (shows when popup is open) */}
          <div
            className={`absolute right-0 top-0 w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer transition-all ${
              showDonate
                ? 'opacity-100 duration-500 delay-200'
                : 'opacity-0 duration-300 pointer-events-none'
            }`}
            style={{
              backgroundColor: activeStory ? 'white' : 'black',
              border: activeStory ? '1px solid white' : '1px solid black'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowDonate(false);
              setAnimateDonate(false);
            }}
          >
            <span className={`text-xl leading-none font-normal ${activeStory ? 'text-black' : 'text-white'}`}>✕</span>
          </div>
        </div>
      </div>

      {/* Donate popup */}
      {showDonate && (
        <div className="fixed bottom-24 right-8 bg-white rounded-lg shadow-lg w-[320px] animate-slide-up overflow-hidden border border-white z-50" style={{ padding: '24px' }}>
          <div className={`absolute inset-0 bg-black rounded-lg ${animateDonate ? 'animate-fill-bottom-up' : 'opacity-0'}`}></div>
          <p className="text-base text-white mb-8 leading-relaxed relative z-10">
            donations are really appreciated
          </p>
          <p className="text-sm font-medium mb-4 text-gray-300 relative z-10">Venmo</p>
          <p className="text-lg text-white relative z-10">@Osha-Foster</p>
        </div>
      )}

      {/* Hidden measurement div - matches content area dimensions */}
      <div
        ref={measureRef}
        className="fixed pointer-events-none"
        style={{
          visibility: 'hidden',
          position: 'fixed',
          top: '-9999px',
          left: '0',
          width: 'calc(min(42rem, 100vw - 2rem) - 48px)', // max-w-2xl minus padding
          padding: '16px 0 0 0',
          overflow: 'hidden'
        }}
      />
    </div>
  );
}
