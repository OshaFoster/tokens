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
      size = 450 + Math.random() * 150;
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
  const [activeStory, setActiveStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [animateAbout, setAnimateAbout] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [animateDonate, setAnimateDonate] = useState(false);
  const circlePositions = useRef({});

  const paginateStory = (story) => {
    if (!story) return [];

    const pages = [];
    const charsPerPage = 800;

    story.chapters.forEach((chapter, chapterIndex) => {
      const words = chapter.content.split(' ');
      let currentPageText = '';

      words.forEach((word) => {
        if ((currentPageText + ' ' + word).length > charsPerPage) {
          pages.push({
            content: currentPageText.trim(),
            chapterTitle: chapter.title,
            chapterIndex: chapterIndex
          });
          currentPageText = word;
        } else {
          currentPageText += (currentPageText ? ' ' : '') + word;
        }
      });

      if (currentPageText) {
        pages.push({
          content: currentPageText.trim(),
          chapterTitle: chapter.title,
          chapterIndex: chapterIndex
        });
      }
    });

    return pages;
  };

  const stories = [
    {
      id: 1,
      title: 'the vicars wife',
      chapters: [
        {
          title: 'Chapter 1',
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
        },
        {
          title: 'Chapter 2',
          content: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.'
        },
        {
          title: 'Chapter 3',
          content: 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.'
        }
      ]
    },
    {
      id: 2,
      title: 'a humble soul',
      chapters: [
        {
          title: 'chapter one: the sky\'s lure',
          content: 'The sky had always lied.\n\nNot in the way a con man lies--slick, deliberate--but with the seduction of a dream that gleams too brightly to question. From childhood, he\'d looked up and believed it was his destiny to conquer the stars.\n\nNow, at 64, sitting in a vast steel-and-glass sanctum orbiting the Earth, Elon knew the truth.\n\nHe wasn\'t going to Mars.\n\nIt wasn\'t the rocket fuel or the engineering. Those were always solvable problems. No, the real blockade was humanity itself. He had spent decades trying to bend nature to his will, to outrun the entropy of Earth. He had tried to launch humanity forward on the tip of a Falcon\'s flame. But people, it turned out, didn\'t scale. They broke, they scattered, they lost interest. They needed air and food and affection. And they died.\n\nHe leaned back in his chair--high-backed, carbon-fiber, absurdly overengineered--watching a slow blue curve of Earth rotate across the viewport. A storm churned over the South Pacific like cream in coffee.\n\nBeneath him, the planet he\'d tried to escape spun on. He felt it now not as something to transcend but as something he had abandoned.\n\nThe mission--Project Aether--had been delayed. Again. A solar flare had knocked out three drones on the Martian test surface. The colony prototype--more PR fantasy than science--was in tatters.\n\nThe latest crew return capsule was scheduled to dock at Nova Station in twenty-two hours. They were coming back early, again.\n\n"Psychological strain," the report said. Elon had read between the lines: loneliness, fear, grief.\n\nPeople weren\'t meant for red deserts and titanium bunkers. Not yet.\n\nHe exhaled.\n\nHis mind flicked backward--uninvited--to Talulah\'s voice, sharp and brittle over a call from years ago.\n\n"You\'ve built a world no one can live in, Elon. Not even you."\n\nShe had been crying. He remembered only the silence afterward, and the sense that some wire inside him--vital, tender--had been severed.\n\nThe hum of the station deepened. Machines whispered around him, always working. Unlike people. Unlike himself.\n\nHis assistant, a polished but irritating AI named Lucent, pinged into his ear.\n\n"Mr. Musk, would you like the updated resource matrix for Terraforming Phase Four?"\n\n"No."\n\n"Would you like a cognitive modulation suite to reduce prefrontal strain?"\n\n"No."\n\nHe stood and walked toward the observation deck.\n\nEarth gleamed in radiant stillness. Cities were just glimmers. There was no sign of the billion fires his industries had lit, no echo of the women he\'d left, the children he had tried to mold into soldiers of purpose. Grimes\' face drifted into his memory like vapor. She had said once, in her strange poetic way, that he was trying to become a god because he didn\'t know how to be a man.\n\nHe hadn\'t understood then. He did now.\n\nSomething inside him was shifting.\n\nNot all at once.\n\nNot like ignition.\n\nBut like soil cracking, letting the seed breathe.\n\nHe tapped the console beside the viewport and pulled up a live feed from Cape Canaveral. There was no launch today--just a pale sky, gulls wheeling, salt air thick with heat.\n\nBelow, the world lived. Flawed, chaotic, burning--and alive.\n\nElon Musk, the man who had once sold the planet a dream of ascension, now felt the slow gravity of Earth drawing him home.\n\nAnd for the first time in a long, long while, he let it.'
        },
        {
          title: 'chapter two: the weight of return',
          content: 'The reentry capsule landed off-course, in a patch of desert just outside Socorro, New Mexico. Elon had insisted on no media, no motorcade. Just a black solar SUV and a single assistant--flesh and blood this time, not circuitry.\n\nHis boots crunched into the dust as he stepped out. The sun was ruthless here, even in late autumn. It reminded him of Mars.\n\n"Welcome back to Earth, sir," murmured the assistant, handing him a water canister. The man\'s name was Jonah. He was in his forties, former Navy, polite in a way that suggested careful distance.\n\nElon drank.\n\nHe hadn\'t been planetside in nearly two years. The air was heavier than he remembered. Or maybe he was.\n\n"Where to first?" Jonah asked.\n\nElon looked around at the nothingness. Scrub brush. Sand. A power line humming in the distance. He thought about saying "the lab," or "the summit," or "the South Bay site." Instead, he said:\n\n"Pasadena. My son\'s dorm."\n\nJonah raised an eyebrow but didn\'t question it. Elon appreciated that. The SUV whirred to life.\n\nAs they drove, Elon watched the land stretch out, uncurated, unpredictable. No algorithms had painted this. There was decay here. Cracks. Color. Things he hadn\'t let himself see in years.\n\nHis mind wandered.\n\nHe\'d spoken to Xavier--no, Jenna, now--only once since the transition. The call had ended with long silence and then a click. Elon hadn\'t followed up. He\'d told himself he was "giving space." But space had always been his crutch. Distance was easier than reckoning.\n\nHe tapped on the window, restless.\n\n"How far are we?"\n\n"About four hours," Jonah replied.\n\n"Would you like some music?"\n\nElon almost said no. But something inside him, tender and strange, said yes.\n\nJonah cued up a playlist. Not synth-heavy tech music. Not space-themed orchestral. Just a guitar. Raw, unplugged. Dylan. A little out of tune.\n\nElon closed his eyes.\n\nHe remembered Justine\'s hands on the piano, back before the first million, before Tesla, before PayPal. Back when his dreams had been just that--dreams. He had loved her once. Or maybe he had loved the idea of being loved.\n\nHe didn\'t know anymore. But he intended to find out.\n\nThe desert gave way to scrub, then to roads and signage and life. Pasadena emerged like a ghost from the haze.\n\nThe campus was clean, sharp-edged, modern. He hated it.\n\nStudents walked in groups, laughing, heads bent over phones. A few glanced at the SUV, recognizing him. The beard didn\'t hide much. He was still a symbol. Still an artifact of the world before.\n\nHe waited outside the dorm.\n\nFive minutes passed.\n\nThen Jenna walked out.\n\nShe was taller than he remembered. Hair buzzed short, shoulders squared. She wore a shirt that said NO GODS, NO MASTERS and met his gaze with cool detachment.\n\n"Hey," he said.\n\n"Hey."\n\n"Can we talk?"\n\nShe hesitated.\n\n"You flew all the way down here to talk?"\n\n"I fell back here," he said. "But yeah. I think it\'s time."\n\nThere was a long pause. Then she shrugged.\n\n"I\'ve got thirty minutes. There\'s a bench over there."\n\nThey sat.\n\nThe wind picked up a little, carrying with it the faint scent of eucalyptus.\n\nAnd for the first time in a long while, Elon Musk listened more than he spoke.'
        },
        {
          title: 'chapter three: the museum of himself',
          content: 'The Tesla factory didn\'t smell like anything anymore. It used to smell like ozone and lithium, like sweat and ambition. Now it was filtered, regulated. Even the robots moved with softened edges--no hiss, no spark. Just motion.\n\nElon walked the observation corridor like a tourist. Nobody stopped him. A few recognized him, but it was a recognition filtered through years of news cycles and memes. He was history now. A strange part of the lore.\n\nThe displays had changed. New models, new colors. The old Roadster was mounted behind glass, its placard reading "The Beginning." As if the beginning hadn\'t been rage and late nights and lawsuits and duct tape.\n\nHe passed a young guide leading a tour of high schoolers.\n\n"...revolutionized transport and energy in the 2010s. Some call it the first wave of planetary retooling. But of course, that\'s before the Water Equity Act and the Ground Rights Movement--"\n\nElon didn\'t stop walking.\n\nOutside, the air was hot and clean. California still tried to pretend the apocalypse had been averted. Trees lined the streets. Silent EVs glided past in algorithms. It was beautiful. But it felt... curated.\n\nJonah waited in the car, half-asleep behind polarized lenses.\n\n"Next stop?"\n\nElon hesitated. "SpaceX."\n\nThe old Hawthorne campus was a satellite now--operations had moved to OceanGate and the Cascades--but they still ran simulations here. The guard at the gate blinked when she saw him. She let them through without a word.\n\nInside, the hangars were darker than he remembered. The Falcon 9 mockup stood in the lobby like a relic of a god whose worshippers had quietly moved on. Elon reached out, touched the cool carbon. A tech walked by, nodded politely, didn\'t stop.\n\nHe went into the control room. It had been redesigned. More minimal, more glass. Someone had replaced the old patched leather chairs with ergonomic mesh.\n\nOn a central screen, a looping replay of the first Mars test mission ran silently.\n\nThey had named the capsule Genesis.\n\nIt had made it to orbit. It had failed within the week.\n\nHe watched it burn up, frame by frame.\n\nNo one interrupted him.\n\nLater, they stopped for lunch at a roadside diner halfway to Bel Air. The server didn\'t recognize him. That felt right. He ate quietly--grilled cheese, tomato soup, black coffee. Simple.\n\nWhen they pulled up to the old house, it was barely visible behind the hedge. He remembered planting that hedge. It had been small. Grimes had called it "the great green wall of ego."\n\nShe hadn\'t been wrong.\n\nHe buzzed the gate. No one answered. He didn\'t try again.\n\nThey sat in silence for a moment.\n\nJonah finally asked, "You want to go in?"\n\nElon shook his head. "No. I just wanted to see it."\n\nThey drove back to the rental house in the desert as the light started to fade. Elon didn\'t say much. He scrolled briefly through old texts on his phone--names he hadn\'t read in years.\n\nHe didn\'t write to anyone. Not yet.\n\nThat night, he walked outside. The stars were out. He didn\'t look at them.\n\nHe looked at the ground.\n\nThere were weeds growing near the porch. He found a trowel in the shed and knelt down to clear them.\n\nOne root at a time.'
        },
        {
          title: 'chapter four: the light grid',
          content: 'The plane touched down on a strip of red earth outside Matam, near the Senegal River. It wasn\'t a formal airport--just a leveled field with a comms trailer and a windsock--but it worked. Elon stepped out into heat that shimmered without apology.\n\nNo reception. No headlines. Just a tall woman in cargo pants and mirrored shades, holding a clipboard.\n\n"You\'re early," she said.\n\n"I didn\'t want to make an entrance," Elon replied.\n\nShe didn\'t laugh. Just nodded and walked.\n\nThey passed through rows of vertical panels--thin, dark, and shimmering slightly at the edges. At first glance, they looked like standard solar, but they weren\'t. These were photonic striders--a next-gen relay system that didn\'t convert sunlight into heat, but used it to route light directly through filaments, like a nervous system made of mirrors.\n\nThe tech had started as a fringe theory in Taiwan, matured in Ghana, and now quietly ran power to five villages in eastern Senegal. No transformers. No wires. Just light, channeled like water.\n\n"This is node six," she said. "We call it the heartbeat."\n\nThe unit looked almost too simple: a black slab, waist-high, standing on four posts. A young technician--maybe twenty--was calibrating something on the touchscreen.\n\n"Energy loss?" Elon asked.\n\n"Less than three percent over five kilometers."\n\nHe let out a low whistle.\n\n"Better than anything we had in the Valley."\n\n"We know," she said. Not unkindly.\n\nThe technician noticed him then. Squinted.\n\n"Wait--are you--"\n\nElon shook his head. Then, as if correcting himself, he nodded.\n\nThe kid blinked, unsure what that meant.\n\nThey moved on.\n\nInside the central dome--a canvas structure cooled with passive airflow--engineers hunched over live feeds from the surrounding villages. Each home showed steady current. A school. A clinic. An irrigation pump. No fanfare. Just working.\n\n"You don\'t own this?" the woman asked, not looking up.\n\n"No."\n\n"You didn\'t brand it?"\n\n"No."\n\n"Why fund it?"\n\nHe thought about that for a moment. Looked out through the mesh flap at the shimmer of panels, the curve of the river, the dusty horizon.\n\n"Because it\'s elegant," he said. "And I spent most of my life building things that left heat and noise."\n\nA breeze lifted the edge of the tent. The day was ending.\n\nThe woman finally looked at him. "We\'ve got a spare unit going live at a refugee site next month. You want to come?"\n\n"I think I do," he said.\n\nLater, alone in the darkened dome, Elon stood by the main monitor. The energy flow lit up the screen in pulses--soft, golden lines mapping the ground like veins.\n\nHe touched the screen, then pulled his hand back.\n\nOutside, a few children were kicking a deflated soccer ball in the dusk. Someone was laughing.\n\nThe lights stayed on.\n\nHe didn\'t take a photo.\n\nHe just watched the light move.'
        },
        {
          title: 'chapter five: the hole',
          content: 'The neighborhood was the kind Oakland real estate blogs once called "emerging" and locals called "ours." The school was a pilot site for a community-funded micro-school: three classrooms in a converted library, solar-powered and sensor-linked. The students were learning microbial gardening, open-source coding, and how to turn waste into energy. A little futuristic. A little handmade. The kind of place that didn\'t promise escape--just resilience.\n\nIt was a bright day, but the light was kind. The kind that made old brick glow and turned kids\' laughter into something worth pausing for.\n\nThe ribbon-cutting wasn\'t ceremonial. More like a neighborhood errand. A few teachers. A city council rep. Parents with iced coffee. A Bluetooth speaker that kept dropping the connection.\n\nThere was a fruit tree in a black nursery tub--fig, according to the label.\n\nElon stood near the back. Baseball cap, plain shirt, no entourage. Just Jonah, leaning against the fence, arms crossed.\n\nAt the front, a woman with sun-seamed skin and a clipboard held up the tree.\n\n"This tree," she said, "is for our children\'s children. That\'s what we say when we don\'t know who\'s going to water it."\n\nSoft laughter rolled through the group.\n\n"We\'re going to plant it now. Anyone want to come dig the hole?"\n\nNot embarrassed silence. Just the quiet shuffle of a crowd who didn\'t expect to do anything. A few looked at each other. One dad adjusted his sunglasses. A kid tapped something sticky on their shoe.\n\nElon raised his hand.\n\nNo big gesture. Just a quiet lift, like answering a question no one had studied for.\n\nThe woman nodded. He walked forward. Picked up the shovel.\n\nThe dirt was stubborn--sunbaked and packed--but he worked slowly, methodically. No rush. A little girl wandered over and handed him a plastic trowel.\n\n"Thanks," he said.\n\nShe stayed. Dug beside him with solemn intensity.\n\nWhen the hole was ready, the woman asked gently, "Would you like to say something?"\n\nElon brushed his hands on his jeans.\n\n"No," he said. "I just wanted to dig the hole."\n\nShe nodded. "That\'s enough."\n\nThey planted the tree.\n\nNo one clapped.\n\nLater, as folding chairs scraped over pavement and leftover juice boxes sagged in the sun, Elon sat on the edge of the planter beside Jonah.\n\nThey didn\'t say much.\n\nBehind them, the fig tree stood in its new place. Young, uncertain, reaching.'
        }
      ]
    },
    {
      id: 3,
      title: 'thanos protocal',
      chapters: [
        {
          title: 'Chapter 1',
          content: 'And here\'s your third story. You can add as many stories as you like.'
        }
      ]
    }
  ];

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

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-700 ${
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
        <div className={`fixed inset-0 flex items-center justify-center p-4 transition-opacity duration-700 pointer-events-none ${
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
              const pages = paginateStory(story);
              const currentPageData = pages[currentPage] || {};

              return (
                <>
                  <div className="flex-shrink-0" style={{ padding: '32px 32px 16px 32px' }}>
                    <button
                      onClick={handleClose}
                      className="text-gray-500 hover:text-black transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto" style={{ padding: '0 32px' }}>
                    {/* Show chapter title only on first page of chapter */}
                    {(currentPage === 0 || pages[currentPage - 1]?.chapterIndex !== currentPageData.chapterIndex) && (
                      <p className="text-sm text-gray-500 mb-16">
                        {currentPageData.chapterTitle}
                      </p>
                    )}
                    <p className="text-lg leading-normal text-gray-700 whitespace-pre-line">
                      {currentPageData.content}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-between" style={{ padding: '12px 32px' }}>
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
            <span className="text-white text-xl leading-none font-normal">✕</span>
          </div>
        </div>
      </div>

      {/* Donate popup */}
      {showDonate && (
        <div className="fixed bottom-24 right-8 bg-white rounded-lg shadow-lg w-[320px] animate-slide-up overflow-hidden border border-white z-50" style={{ padding: '32px' }}>
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
