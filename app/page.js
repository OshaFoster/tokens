'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';

function DriftingCircle({ index, total }) {
  const [mounted, setMounted] = useState(false);
  const [init, setInit] = useState(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const velocity = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const size = 450 + Math.random() * 150; // Large circles: 450-600px

    // Divide screen into sections to spread circles out
    const sectionWidth = window.innerWidth / total;
    const sectionX = sectionWidth * index;
    const posX = sectionX + Math.random() * (sectionWidth - size);
    const posY = Math.random() * (window.innerHeight - size);

    const velX = (Math.random() - 0.5) * 0.15; // Very slow movement
    const velY = (Math.random() - 0.5) * 0.15;

    setInit({ size, posX, posY });
    velocity.current = { x: velX, y: velY };
    x.set(posX);
    y.set(posY);
    setMounted(true);
  }, [index, total]);

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
  });

  if (!mounted || !init) return null;

  return (
    <motion.div
      className="absolute rounded-full border border-black opacity-30"
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
  const [activeStory, setActiveStory] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [animateAbout, setAnimateAbout] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [animateDonate, setAnimateDonate] = useState(false);

  const stories = [
    {
      id: 1,
      title: 'the vicars wife',
      content: 'This is where your first story will go. Click on different tabs to switch between stories.'
    },
    {
      id: 2,
      title: 'a humble soul',
      content: 'Your second story will appear here. Each story can be as long as you want.'
    },
    {
      id: 3,
      title: 'thanos protocal',
      content: 'And here\'s your third story. You can add as many stories as you like.'
    }
  ];

  const handleStoryClick = (storyId) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveStory(storyId);
    }, 500);
  };

  const handleClose = () => {
    setActiveStory(null);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-700 ${
      isTransitioning || activeStory ? 'bg-black' : 'bg-white'
    }`}>
      {/* Floating circles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <DriftingCircle key={i} index={i} total={3} />
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
              className="absolute bottom-[-155px] right-[-315px] bg-white w-72 h-40 rounded-lg overflow-hidden animate-slide-down"
              style={{ padding: '32px' }}
            >
              <div className={`absolute inset-0 bg-black rounded-lg ${animateAbout ? 'animate-fill-top-down' : 'opacity-0'}`}></div>
              <p className="text-xs leading-relaxed relative z-10 text-white">
                This is where your about text will go. You can write a brief description about yourself, your writing, or this platform.
              </p>
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="bg-white border border-black rounded-lg relative z-10" style={{ padding: '60px' }}>
            <div className="flex gap-12 justify-center items-center">
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
        <div className={`fixed inset-0 flex items-center justify-center p-8 transition-opacity duration-700 ${
          activeStory ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-white p-16 max-w-3xl w-full rounded-lg shadow-2xl">
            <button
              onClick={handleClose}
              className="mb-8 text-gray-500 hover:text-black transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-2xl mb-6" style={{ fontFamily: 'Chillax' }}>
              {stories.find(s => s.id === activeStory)?.title}
            </h2>
            <p className="text-lg leading-relaxed text-gray-700">
              {stories.find(s => s.id === activeStory)?.content}
            </p>
          </div>
        </div>
      )}

      {/* Donate button */}
      <div className="fixed bottom-8 right-8 group cursor-pointer" onClick={() => {
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
          <div className={`absolute right-0 top-0 w-[60px] h-[60px] rounded-full bg-black border border-black flex items-center justify-center transition-all ${
            showDonate
              ? 'opacity-0 duration-300 pointer-events-none'
              : 'opacity-100 duration-300 group-hover:opacity-0'
          }`}>
            <span className="text-white text-xl leading-none font-normal">$</span>
          </div>

          {/* X circle (shows when popup is open) */}
          <div
            className={`absolute right-0 top-0 w-[60px] h-[60px] rounded-full bg-black border border-black flex items-center justify-center cursor-pointer transition-all ${
              showDonate
                ? 'opacity-100 duration-500 delay-200'
                : 'opacity-0 duration-300 pointer-events-none'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setShowDonate(false);
              setAnimateDonate(false);
            }}
          >
            <span className="text-white text-xl leading-none font-normal">✕</span>
          </div>
        </div>
      </div>

      {/* Donate popup */}
      {showDonate && (
        <div className="fixed bottom-24 right-8 bg-white rounded-lg shadow-lg w-[320px] animate-slide-up overflow-hidden" style={{ padding: '32px' }}>
          <div className={`absolute inset-0 bg-black rounded-lg ${animateDonate ? 'animate-fill-bottom-up' : 'opacity-0'}`}></div>
          <p className="text-base text-white mb-6 leading-relaxed relative z-10">
            Thanks for your support! Every bit helps keep the stories coming.
          </p>
          <p className="text-sm font-medium mb-2 text-gray-300 relative z-10">Venmo</p>
          <p className="text-lg text-white relative z-10">@your-venmo</p>
        </div>
      )}
    </div>
  );
}
