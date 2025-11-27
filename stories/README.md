# Story Format Guide

This guide explains how to add new stories to the tokens platform.

## File Structure

Each story is a markdown file in the `/stories` directory.

### File Naming
- Use lowercase with hyphens: `my-story-title.md`
- Example: `a-humble-soul.md`, `the-vicars-wife.md`

### Story Structure

```markdown
# story title

## chapter one: chapter title here

Paragraph text goes here. Each paragraph should be separated by a blank line.

This is a second paragraph. Keep paragraphs together as complete thoughts. The system will automatically break pages based on rendered height.

## chapter two: next chapter title

Start each new chapter with ## followed by the chapter title.

Paragraphs continue the same way.
```

## Adding a New Story

### Step 1: Create the Markdown File

1. Create a new `.md` file in `/stories/`
2. Follow the format above
3. Use `# title` for the main title (only once at the top)
4. Use `## chapter name` for each chapter
5. Separate paragraphs with blank lines

### Step 2: Register the Story

Edit `/lib/stories.js` and add your story to the `storyFiles` array:

```javascript
const storyFiles = [
  { id: 1, filename: 'the-vicars-wife.md', title: 'the vicars wife' },
  { id: 2, filename: 'a-humble-soul.md', title: 'a humble soul' },
  // Add your new story here:
  { id: 7, filename: 'your-story-name.md', title: 'your story title' },
];
```

**Important:**
- `id` must be unique and sequential
- `filename` must match your `.md` file exactly
- `title` is what displays on the homepage (use lowercase for consistency)

## Formatting Guidelines

### Paragraphs
- Keep related sentences together in one paragraph
- Separate paragraphs with a blank line (double newline)
- Don't worry about page breaks - the system handles this automatically

### Line Length
- Can be any length - the system handles text wrapping
- For easy editing, you can wrap lines at ~80 characters using:
  ```bash
  fold -s -w 80 your-file.md > your-file-wrapped.md
  ```

### Chapters
- Always start with `## ` (two hashtags and a space)
- Chapter titles display large on the first page, small on subsequent pages
- Use lowercase and colons for consistency: `## chapter one: the title`

### What NOT to Do
- Don't use `### ` (three hashtags) - only `#` for title and `##` for chapters
- Don't add manual page breaks or dividers
- Don't use special formatting (bold, italic) - keep it simple

## Example Story Template

```markdown
# [story title]

## chapter one: [first chapter title]

Opening paragraph of the story. This sets the scene and introduces the main character or situation.

Second paragraph continues the narrative. Keep paragraphs focused on complete thoughts or moments.

More paragraphs as needed.

## chapter two: [second chapter title]

New chapter begins here. Each chapter can have as many paragraphs as needed.

The pagination system will automatically break pages based on how much text fits in the visible area, accounting for line wrapping, spacing, and font size.
```

## Quick Process for Adding Stories

When you provide raw text:

1. I'll format it according to this guide
2. Create the `.md` file in `/stories/`
3. Add the entry to `/lib/stories.js`
4. Test it on localhost
5. Commit and push the changes

That's it! The story will automatically appear on the homepage and be fully paginated.
