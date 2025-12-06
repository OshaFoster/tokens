'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [pressedButton, setPressedButton] = useState(null);
  const circlePositions = useRef({});
  const [paginatedPages, setPaginatedPages] = useState([]);
  const [fontsReady, setFontsReady] = useState(false);
  const measureRef = useRef(null);
  const contentRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const mobileSafeArea = 'env(safe-area-inset-bottom, 0px)';
  const mobileDonateButtonBottom = `calc(1rem + ${mobileSafeArea})`;
  const mobileDonateSheetBottom = mobileSafeArea;

  // Load stories from API
  useEffect(() => {
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => setStories(data))
      .catch(err => console.error('Failed to load stories:', err));
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      setFontsReady(true);
      return;
    }

    let isMounted = true;

    if ('fonts' in document && document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          if (isMounted) {
            setFontsReady(true);
          }
        })
        .catch(() => {
          if (isMounted) {
            setFontsReady(true);
          }
        });
    } else {
      setFontsReady(true);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const syncMeasurementContainer = useCallback(() => {
    if (
      typeof window === 'undefined' ||
      !measureRef.current ||
      !contentRef.current
    ) {
      return;
    }

    const measureEl = measureRef.current;
    const contentEl = contentRef.current;
    const computed = window.getComputedStyle(contentEl);

    measureEl.style.width = `${contentEl.clientWidth}px`;
    measureEl.style.paddingTop = computed.paddingTop;
    measureEl.style.paddingBottom = computed.paddingBottom;
    measureEl.style.paddingLeft = computed.paddingLeft;
    measureEl.style.paddingRight = computed.paddingRight;
    measureEl.style.fontFamily = computed.fontFamily;
    measureEl.style.fontSize = computed.fontSize;
    measureEl.style.lineHeight = computed.lineHeight;
  }, []);

  // Paginate story based on actual rendered height
  const paginateStoryByHeight = useCallback((story) => {
    if (!story || !measureRef.current || !contentRef.current) return [];

    syncMeasurementContainer();

    const pages = [];
    const contentEl = contentRef.current;
    const computed = typeof window !== 'undefined'
      ? window.getComputedStyle(contentEl)
      : { paddingTop: '0', paddingBottom: '0' };
    const paddingTop = parseFloat(computed.paddingTop) || 0;
    const paddingBottom = parseFloat(computed.paddingBottom) || 0;
    const containerHeight = Math.max(
      contentEl.clientHeight - paddingTop - paddingBottom,
      0
    );

    const createParagraphHtml = (text, isLast = false) => {
      const marginBottom = isLast ? '0' : '1.25rem';
      return `<p style="font-family: Inconsolata, monospace; font-size: 1.125rem; line-height: 1.5; color: #374151; margin-bottom: ${marginBottom};">${text}</p>`;
    };

    const buildParagraphsHtml = (paragraphs) =>
      paragraphs
        .map((p, idx) => createParagraphHtml(p, idx === paragraphs.length - 1))
        .join('');

    const fitParagraphIntoPage = (baseHtml, paragraph) => {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (!words.length) {
        return { fittingText: '', remainingText: '' };
      }

      let bestCount = 0;
      let low = 1;
      let high = words.length;

      while (low <= high) {
        const mid = Math.ceil((low + high) / 2);
        const candidate = words.slice(0, mid).join(' ');
        measureRef.current.innerHTML = baseHtml + createParagraphHtml(candidate, true);

        if (measureRef.current.scrollHeight <= containerHeight) {
          bestCount = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      if (bestCount === 0) {
        return { fittingText: '', remainingText: paragraph };
      }

      const fittingText = words.slice(0, bestCount).join(' ');
      const remainingText = words.slice(bestCount).join(' ').trim();

      return { fittingText, remainingText };
    };

    story.chapters.forEach((chapter, chapterIndex) => {
      const paragraphsQueue = [...chapter.content.split('\n\n')];
      let currentPageParagraphs = [];
      let isFirstPageOfChapter = true;

      const recordPage = (paragraphsForPage, firstPageFlag) => {
        if (!paragraphsForPage.length) return;
        const isFirstPageOfStory = pages.length === 0;
        pages.push({
          content: paragraphsForPage.join('\n\n'),
          chapterTitle: chapter.title,
          chapterIndex,
          isFirstPageOfChapter: firstPageFlag,
          isFirstPageOfStory,
          storyTitle: story.storyTitle || story.title
        });
      };

      while (paragraphsQueue.length > 0) {
        const paragraph = paragraphsQueue.shift();
        if (typeof paragraph !== 'string') {
          continue;
        }

        currentPageParagraphs.push(paragraph);

        let testContent = '';
        const isFirstPageOfStory = pages.length === 0;
        if (isFirstPageOfStory) {
          testContent = `<h2 style="font-family: Chillax; font-size: 2rem; line-height: 1.2; margin-bottom: 40px; color: #1f2937; text-align: center;">${story.storyTitle || story.title}</h2>`;
        }
        if (isFirstPageOfChapter) {
          testContent += `<h3 style="font-family: Chillax; font-size: 1.5rem; line-height: 1.2; margin-bottom: 32px; color: #1f2937;">${chapter.title}</h3>`;
        }

        measureRef.current.innerHTML = testContent + buildParagraphsHtml(currentPageParagraphs);

        if (measureRef.current.scrollHeight <= containerHeight) {
          continue;
        }

        const overflowParagraph = currentPageParagraphs.pop();
        const baseHtml = testContent + buildParagraphsHtml(currentPageParagraphs);
        const { fittingText, remainingText } = fitParagraphIntoPage(baseHtml, overflowParagraph);

        if (fittingText) {
          currentPageParagraphs.push(fittingText);
          recordPage([...currentPageParagraphs], isFirstPageOfChapter);
          isFirstPageOfChapter = false;
          currentPageParagraphs = [];

          if (remainingText) {
            paragraphsQueue.unshift(remainingText);
          }
          continue;
        }

        if (currentPageParagraphs.length > 0) {
          recordPage([...currentPageParagraphs], isFirstPageOfChapter);
          isFirstPageOfChapter = false;
          currentPageParagraphs = [];
          paragraphsQueue.unshift(overflowParagraph);
        } else {
          recordPage([overflowParagraph], isFirstPageOfChapter);
          isFirstPageOfChapter = false;
        }
      }

      if (currentPageParagraphs.length > 0) {
        recordPage([...currentPageParagraphs], isFirstPageOfChapter);
        isFirstPageOfChapter = false;
        currentPageParagraphs = [];
      }
    });

    return pages;
  }, [syncMeasurementContainer]);

  const handleStoryClick = (storyId) => {
    setPressedButton(storyId);
    setPaginatedPages([]);
    const story = stories.find(s => s.id === storyId);
    const urlTitle = story.title.replace(/\s+/g, '-');
    window.history.pushState({}, '', `/${urlTitle}`);

    // Let button fill complete, then start transition
    setTimeout(() => {
      setIsTransitioning(true);
    }, 350);

    // Show modal after button fill + transition
    setTimeout(() => {
      setActiveStory(storyId);
      setCurrentPage(0);
      setPressedButton(null);
    }, 900);
  };

  const handleClose = () => {
    window.history.pushState({}, '', '/');
    setActiveStory(null);
    setPaginatedPages([]);
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

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped left - go to next page
      if (currentPage < paginatedPages.length - 1) {
        handleNextPage();
      } else {
        setCurrentPage(0); // Loop back to start on last page
      }
    } else if (distance < -minSwipeDistance) {
      // Swiped right - go to previous page
      handlePrevPage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Paginate story when it's opened or layout changes
  useEffect(() => {
    if (!activeStory || !measureRef.current || !contentRef.current || !fontsReady) {
      return;
    }

    let animationFrameId = null;

    const queuePagination = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationFrameId = requestAnimationFrame(() => {
        const story = stories.find(s => s.id === activeStory);
        if (story) {
          const pages = paginateStoryByHeight(story);
          setPaginatedPages(pages);
        }
      });
    };

    const timeoutId = setTimeout(() => {
      queuePagination();
    }, 150);

    const cleanupFrame = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const contentEl = contentRef.current;
    let resizeObserver;

    if (typeof ResizeObserver !== 'undefined' && contentEl) {
      resizeObserver = new ResizeObserver(() => {
        queuePagination();
      });
      resizeObserver.observe(contentEl);
    } else {
      const handleResize = () => queuePagination();
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timeoutId);
        cleanupFrame();
        window.removeEventListener('resize', handleResize);
      };
    }

    return () => {
      clearTimeout(timeoutId);
      cleanupFrame();
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [activeStory, stories, fontsReady, paginateStoryByHeight]);

  const updateCirclePosition = (index, position) => {
    circlePositions.current[index] = position;
  };

  const renderDonateContent = (variant) => {
    const isMobile = variant === 'mobile';
    const mobileClasses = ['mx-4', 'rounded-t-3xl', 'shadow-lg'].join(' ');

    return (
      <div
        className={`relative ${
          isMobile
            ? mobileClasses
            : 'w-[320px] rounded-lg shadow-lg border-[0.5px] border-white/60'
        } bg-white overflow-hidden animate-slide-up`}
        style={{
          padding: '24px',
          paddingBottom: isMobile
            ? 'calc(24px + env(safe-area-inset-bottom, 16px))'
            : '24px'
        }}
      >
        <div
          className={`absolute inset-0 bg-black ${
            isMobile ? 'rounded-t-3xl' : 'rounded-lg'
          } ${animateDonate ? 'animate-fill-bottom-up' : 'opacity-0'}`}
        ></div>
        {isMobile && (
          <button
            type="button"
            className="absolute top-4 right-4 text-white z-10"
            onClick={() => {
              setShowDonate(false);
              setAnimateDonate(false);
            }}
            aria-label="Close donate panel"
          >
            ✕
          </button>
        )}
        <p className="text-base text-white mb-8 leading-relaxed relative z-10">
          donations are really appreciated
        </p>
        <p className="text-sm font-medium mb-4 text-gray-300 relative z-10">Venmo</p>
        <p className="text-lg text-white relative z-10">@Osha-Foster</p>
      </div>
    );
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
  }, [pathname, stories]);

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
            <h1 className="text-[4rem] sm:text-[5rem] md:text-[7rem] lg:text-[9rem] xl:text-[12rem] tracking-tight leading-none" style={{ fontFamily: 'Chillax' }}>
              {"tokens".split("").map((letter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: (5 - index) * 0.08, ease: "easeOut" }}
                  style={{ display: 'inline-block' }}
                >
                  {letter}
                </motion.span>
              ))}
            </h1>
            <motion.button
              onClick={() => {
                if (!showAbout) {
                  setShowAbout(true);
                  setTimeout(() => setAnimateAbout(true), 10);
                } else {
                  setShowAbout(false);
                  setAnimateAbout(false);
                }
              }}
              onMouseEnter={() => {
                setShowAbout(true);
                setTimeout(() => setAnimateAbout(true), 10);
              }}
              onMouseLeave={() => {
                setShowAbout(false);
                setAnimateAbout(false);
              }}
              className="absolute bottom-2 right-[-28px] sm:bottom-4 sm:right-[-32px] md:bottom-6 md:right-[-40px] w-[18px] h-[18px] md:w-[20px] md:h-[20px] rounded-full bg-black cursor-pointer hover:scale-150 transition-transform duration-500 hover:duration-300 flex items-center justify-center group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.65, ease: "easeOut" }}
            >
              <span className="text-white text-xs font-medium group-hover:scale-[0.667] transition-transform duration-500 group-hover:duration-300">i</span>
            </motion.button>
          </div>

          {/* About text box */}
          {showAbout && (
            <div
              onMouseEnter={() => setShowAbout(true)}
              onMouseLeave={() => {
                setShowAbout(false);
                setAnimateAbout(false);
              }}
              className="fixed top-[85px] left-1/2 -translate-x-1/2 lg:absolute lg:top-auto lg:left-auto lg:translate-x-0 lg:bottom-[-115px] lg:right-[-315px] bg-white w-64 lg:w-72 rounded-lg overflow-hidden animate-slide-down z-50"
              style={{ padding: '24px' }}
            >
              <div className={`absolute inset-0 bg-black rounded-lg ${animateAbout ? 'animate-fill-top-down' : 'opacity-0'}`}></div>
              <p className="text-base leading-relaxed relative z-10 text-white">
                small stories shaped from thought experiments, in my voice, generated by AI
              </p>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="min-h-screen flex items-center justify-center p-8">
          {stories.length > 0 && (
            <div className="main-grid-container">
              <motion.div
                className="bg-white border border-black rounded-lg relative z-10 story-grid-box"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.0, ease: "easeOut" }}
              >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-12">
                {/* Story cards */}
                {stories.map((story, index) => (
                  <motion.button
                    key={story.id}
                    onClick={() => handleStoryClick(story.id)}
                    className="flex flex-row items-center gap-4 group cursor-pointer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 1.2 + (index * 0.1), ease: "easeOut" }}
                  >
                    <div className="w-[50px] h-[50px] rounded-full border border-black relative overflow-hidden flex items-center justify-center">
                      <div className={`absolute bottom-0 left-0 right-0 bg-black rounded-full transition-all ease-out group-hover:h-full ${
                        pressedButton === story.id ? 'h-full duration-[400ms]' : 'h-0 duration-500'
                      }`}></div>
                      {/* Arrow for desktop */}
                      <svg className="relative z-10 w-5 h-5 text-white hidden lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <p className="text-base" style={{ fontFamily: 'Chillax' }}>{story.title}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Story view */}
      {activeStory && (
        <div className={`fixed inset-0 flex items-center justify-center px-6 py-6 md:px-8 md:py-4 transition-opacity duration-700 pointer-events-none ${
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
                onPositionUpdate={updateCirclePosition}
              />
            ))}
          </div>

          <div
            className="max-w-2xl w-[calc(100%-2rem)] md:w-full rounded-lg shadow-2xl relative z-10 overflow-hidden flex flex-col pointer-events-auto"
            style={{ backgroundColor: '#f5f5f5', height: '85vh', maxHeight: '85vh' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {(() => {
              const story = stories.find(s => s.id === activeStory);
              const currentPageData = paginatedPages[currentPage] || {};

              return (
                <>
                  <div className="flex-shrink-0" style={{ padding: '24px 24px 0 24px' }}>
                    {/* Subtle chapter title for pages 2+ */}
                    {currentPage > 0 && paginatedPages[currentPage - 1]?.chapterIndex === currentPageData.chapterIndex ? (
                      <p className="text-xs text-gray-400 pb-4" style={{ fontFamily: 'Chillax' }}>
                        {currentPageData.chapterTitle}
                      </p>
                    ) : (
                      <div style={{ height: '16px', paddingBottom: '16px' }}></div>
                    )}
                  </div>

                  <div
                    ref={contentRef}
                    className="flex-1 overflow-hidden relative"
                    style={{ padding: '16px 24px 0 24px' }}
                  >
                    {/* First page of story: Book title */}
                    {currentPageData.isFirstPageOfStory && (
                      <h2 className="text-3xl text-gray-800 text-center" style={{ fontFamily: 'Chillax', marginBottom: '40px', lineHeight: '1.2' }}>
                        {currentPageData.storyTitle}
                      </h2>
                    )}

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
                        <p key={idx} className="text-lg text-gray-700" style={{ fontFamily: 'Inconsolata, monospace', lineHeight: '1.5', marginBottom: isLast ? '0' : '1.25rem' }}>
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                  <div className="flex-shrink-0" style={{ padding: '12px 24px 24px' }}>
                    <div className="flex items-center justify-between">
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
                        onClick={() => {
                          if (currentPage === paginatedPages.length - 1) {
                            setCurrentPage(0);
                          } else {
                            handleNextPage();
                          }
                        }}
                        className="text-gray-600 hover:text-black transition-colors cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-400"
                        style={{ padding: '8px 12px' }}
                      >
                        {currentPage === paginatedPages.length - 1 ? '↻ Start' : 'Next →'}
                      </button>
                    </div>
                    <div className="mt-4 md:hidden">
                      <button
                        type="button"
                        className={`w-full rounded-full py-3 px-6 shadow-lg transition-colors ${
                          activeStory
                            ? 'bg-white text-black border border-white/60'
                            : 'bg-black text-white border border-black'
                        } flex items-center justify-center gap-2`}
                        style={{ fontFamily: 'Chillax' }}
                        onClick={() => {
                          if (!showDonate) {
                            setShowDonate(true);
                            setTimeout(() => setAnimateDonate(true), 10);
                          }
                        }}
                      >
                        <span className="text-base font-medium">donate</span>
                        <span className="text-sm font-medium" aria-hidden="true">$</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Donate button - desktop */}
      <motion.div
        className="hidden md:block fixed bottom-8 right-8 group cursor-pointer z-50"
        onClick={() => {
        if (!showDonate) {
          setShowDonate(true);
          setTimeout(() => setAnimateDonate(true), 10);
        }
      }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.8, ease: "easeOut" }}
      >
        <div className="relative w-[140px] h-[50px] md:h-[60px]">
          {/* Oval donate button (shows on hover when popup is closed) */}
          <div className={`absolute right-0 top-0 w-full h-full bg-white border border-black rounded-full flex items-center justify-center transition-all ${
            !showDonate
              ? 'opacity-0 duration-200 delay-0 group-hover:opacity-100 group-hover:duration-500 group-hover:delay-200 pointer-events-none group-hover:pointer-events-auto'
              : 'opacity-0 duration-500 delay-0 pointer-events-none'
          }`}>
            <span className="text-black font-medium text-lg whitespace-nowrap">donate</span>
          </div>

          {/* Dollar circle (shows when popup is closed) */}
          <div className={`absolute right-0 top-0 w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center transition-all ${
            showDonate
              ? 'opacity-0 duration-300 pointer-events-none'
              : 'opacity-100 duration-300 group-hover:opacity-0'
          }`} style={{
            backgroundColor: activeStory ? 'white' : 'black',
            border: activeStory ? '1px solid white' : '1px solid black'
          }}>
            <span className={`text-lg md:text-xl leading-none font-normal ${activeStory ? 'text-black' : 'text-white'}`}>$</span>
          </div>

          {/* X circle (shows when popup is open) */}
          <div
            className={`absolute right-0 top-0 w-[50px] h-[50px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center cursor-pointer transition-all ${
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
            <span className={`text-lg md:text-xl leading-none font-normal ${activeStory ? 'text-black' : 'text-white'}`}>✕</span>
          </div>
        </div>
      </motion.div>

      {/* Donate button - mobile (home view) */}
      {!activeStory && (
        <motion.button
          type="button"
          className={`md:hidden fixed inset-x-4 z-50 ${
            showDonate ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
          style={{
            bottom: mobileDonateButtonBottom
          }}
          onClick={() => {
            if (!showDonate) {
              setShowDonate(true);
              setTimeout(() => setAnimateDonate(true), 10);
            }
          }}
          initial={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: showDonate ? 0 : 1, translateY: showDonate ? 16 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div
            className="relative flex items-center justify-center gap-2 rounded-full py-3 px-6 shadow-lg transition-colors bg-black text-white border border-black"
            style={{ fontFamily: 'Chillax' }}
          >
            <span className="text-base font-medium">donate</span>
            <span className="text-sm font-medium" aria-hidden="true">$</span>
          </div>
        </motion.button>
      )}

      {/* Donate popup */}
      {showDonate && (
        <>
          <div
            className="md:hidden fixed inset-x-0 z-50"
            style={{ bottom: mobileDonateSheetBottom }}
          >
            {renderDonateContent('mobile')}
          </div>
          <div className="hidden md:block fixed inset-auto bottom-28 right-8 z-50">
            {renderDonateContent('desktop')}
          </div>
        </>
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
