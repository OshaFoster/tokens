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
      size = 200 + Math.random() * 400;
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
      className="absolute rounded-full border opacity-30"
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

  // Load stories from API
  useEffect(() => {
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => setStories(data))
      .catch(err => console.error('Failed to load stories:', err));
  }, []);

  const paginateStory = (story) => {
    if (!story) return [];

    const pages = [];
    const minCharsPerPage = 800;
    const maxCharsPerPage = 1200;

    story.chapters.forEach((chapter, chapterIndex) => {
      // Split content into paragraphs
      const paragraphs = chapter.content.split('\n\n');
      let currentPageParagraphs = [];
      let currentPageLength = 0;

      paragraphs.forEach((paragraph) => {
        const paragraphLength = paragraph.length;
        const newLength = currentPageLength + paragraphLength + 2;

        // Only start a new page if we're over min AND adding this would exceed max
        if (currentPageLength >= minCharsPerPage && newLength > maxCharsPerPage && currentPageParagraphs.length > 0) {
          pages.push({
            content: currentPageParagraphs.join('\n\n'),
            chapterTitle: chapter.title,
            chapterIndex: chapterIndex
          });
          currentPageParagraphs = [paragraph];
          currentPageLength = paragraphLength;
        } else {
          currentPageParagraphs.push(paragraph);
          currentPageLength = newLength;
        }
      });

      // Save remaining paragraphs
      if (currentPageParagraphs.length > 0) {
        pages.push({
          content: currentPageParagraphs.join('\n\n'),
          chapterTitle: chapter.title,
          chapterIndex: chapterIndex
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
    const story = stories.find(s => s.id === activeStory);
    const pages = paginateStory(story);
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

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
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-700 ${
      isTransitioning || activeStory ? 'bg-black' : 'bg-white'
    }`}>
      {/* Floating circles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <DriftingCircle
            key={i}
            index={i}
            total={5}
            onPositionUpdate={updateCirclePosition}
          />
        ))}
      </div>

      {/* Home view */}
      <div className={`transition-opacity duration-500 ${
        isTransitioning || activeStory ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        {/* Header with tokens branding */}
        <div className="absolute top-8 left-8">
          <div className="relative inline-block">
            <h1 className="text-[12rem] tracking-tight leading-none" style={{ fontFamily: 'Chillax' }}>tokens</h1>
            <button
              onMouseEnter={() => {
                setShowAbout(true);
                setTimeout(() => setAnimateAbout(true), 10);
              }}
              onMouseLeave={() => {
                setShowAbout(false);
                setAnimateAbout(false);
              }}
              className="absolute bottom-6 right-[-40px] w-[20px] h-[20px] rounded-full bg-black cursor-pointer hover:scale-150 transition-transform duration-500 hover:duration-300 flex items-center justify-center group"
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
              className="absolute bottom-[-115px] right-[-315px] bg-white w-72 rounded-lg overflow-hidden animate-slide-down"
              style={{ padding: '24px' }}
            >
              <div className={`absolute inset-0 bg-black rounded-lg ${animateAbout ? 'animate-fill-top-down' : 'opacity-0'}`}></div>
              <p className="text-base leading-relaxed relative z-10 text-white">
                short stories shaped from thought experiments, in my voice, with the help of AI
              </p>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="min-h-screen flex items-start justify-center p-8" style={{ paddingTop: '40vh' }}>
          <div className="bg-white border border-black rounded-lg relative z-10" style={{ padding: '45px' }}>
            <div className="grid grid-cols-3 gap-12">
              {/* Story cards */}
              {stories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => handleStoryClick(story.id)}
                  className="flex flex-row items-center gap-4 group cursor-pointer"
                >
                  <div className="w-[50px] h-[50px] rounded-full border border-black relative overflow-hidden flex items-center justify-center">
                    <div className="absolute bottom-0 left-0 right-0 h-0 bg-black rounded-full transition-all duration-500 ease-out group-hover:h-full"></div>
                    <svg className="relative z-10 w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className={`fixed inset-0 flex items-center justify-center p-4 transition-opacity duration-700 pointer-events-none ${
          activeStory ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* White floating circles for story view */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <DriftingCircle
                key={i}
                index={i}
                total={5}
                color="white"
                initialPosition={circlePositions.current[i]}
              />
            ))}
          </div>

          <div className="max-w-2xl w-full rounded-lg shadow-2xl relative z-10 overflow-hidden flex flex-col pointer-events-auto" style={{ backgroundColor: '#f5f5f5', height: '90vh', maxHeight: '90vh' }}>
            {(() => {
              const story = stories.find(s => s.id === activeStory);
              const pages = paginateStory(story);
              const currentPageData = pages[currentPage] || {};

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
                    {currentPage > 0 && pages[currentPage - 1]?.chapterIndex === currentPageData.chapterIndex && (
                      <p className="text-xs text-gray-400 pb-4" style={{ fontFamily: 'Chillax' }}>
                        {currentPageData.chapterTitle}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto relative" style={{ padding: '16px 24px 0 24px' }}>
                    {/* First page of chapter: Large chapter title */}
                    {(currentPage === 0 || pages[currentPage - 1]?.chapterIndex !== currentPageData.chapterIndex) && (
                      <h3 className="text-2xl text-gray-800" style={{ fontFamily: 'Chillax', marginBottom: '32px' }}>
                        {currentPageData.chapterTitle}
                      </h3>
                    )}

                    <p className="text-lg leading-normal text-gray-700 whitespace-pre-line" style={{ fontFamily: 'Inconsolata, monospace' }}>
                      {currentPageData.content}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-between" style={{ padding: '12px 24px' }}>
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                      className="text-gray-600 hover:text-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                      style={{ padding: '8px 12px' }}
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      {currentPage + 1} / {pages.length}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === pages.length - 1}
                      className="text-gray-600 hover:text-black transition-colors disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
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
      <div className="fixed bottom-8 right-8 group cursor-pointer z-50" onClick={() => {
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
    </div>
  );
}
