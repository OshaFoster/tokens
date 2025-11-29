import fs from 'fs';
import path from 'path';

export function getStories() {
  const storiesDirectory = path.join(process.cwd(), 'stories');

  const storyFiles = [
    { id: 4, filename: 'husband.md', title: 'husband' },
    { id: 2, filename: 'a-humble-soul.md', title: 'a humble soul' },
    { id: 3, filename: 'thanos-protocol.md', title: 'thanos protocol' },
    { id: 1, filename: 'the-vicars-wife.md', title: 'the vicars wife' },
    { id: 5, filename: 'a-good-steward.md', title: 'a good steward' },
    { id: 6, filename: 'light.md', title: 'light' },
  ];

  const stories = storyFiles.map(({ id, filename, title }) => {
    const fullPath = path.join(storiesDirectory, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Parse markdown into chapters
    const chapters = parseMarkdownChapters(fileContents);

    return {
      id,
      title,
      chapters
    };
  });

  return stories;
}

function parseMarkdownChapters(markdown) {
  // Split by ## headers (chapter markers)
  const lines = markdown.split('\n');
  const chapters = [];
  let currentChapter = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a chapter header (## but not #)
    if (line.startsWith('## ') && !line.startsWith('### ')) {
      // Save previous chapter if exists
      if (currentChapter) {
        chapters.push({
          title: currentChapter,
          content: processContent(currentContent)
        });
      }

      // Start new chapter
      currentChapter = line.replace('## ', '').trim();
      currentContent = [];
    } else if (currentChapter && !line.startsWith('# ')) {
      // Add content to current chapter (skip the main title)
      currentContent.push(line);
    }
  }

  // Save last chapter
  if (currentChapter) {
    chapters.push({
      title: currentChapter,
      content: processContent(currentContent)
    });
  }

  return chapters;
}

function processContent(lines) {
  // Join lines and split into paragraphs (separated by blank lines)
  const text = lines.join('\n').trim();
  // Split by double newlines (blank lines) to get paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  // Within each paragraph, replace single newlines with spaces
  const processedParagraphs = paragraphs.map(p => p.replace(/\n/g, ' ').trim());
  // Join paragraphs with double newlines
  return processedParagraphs.join('\n\n');
}
