/** Human-written captions, intentionally tied to the numbered private memory sequence.
 * Media binaries are not committed yet; this file may live in the public source repo.
 * Quotes avoid guessing events or circumstances that images alone cannot establish.
 */
export const memoryStory = [
  {
    "file": "001-memory.jpg",
    "title": "Where it all began",
    "quote": "Every beautiful journey is made of moments that once seemed ordinary."
  },
  {
    "file": "002-memory.jpg",
    "title": "A quiet kind of beauty",
    "quote": "There has always been something precious about simply being you."
  },
  {
    "file": "003-memory.jpg",
    "title": "The little things",
    "quote": "The moments that pass so quickly often become the ones we treasure most."
  },
  {
    "file": "004-memory.jpg",
    "title": "Growing into yourself",
    "quote": "You never had to become anyone else to be worthy of love."
  },
  {
    "file": "005-memory.jpg",
    "title": "The gift of today",
    "quote": "Even the simplest day belongs in the story of your life."
  },
  {
    "file": "006-memory.jpg",
    "title": "A light of your own",
    "quote": "There is a warmth in your presence that no photograph could fully hold."
  },
  {
    "file": "007-memory.jpg",
    "title": "Memories worth keeping",
    "quote": "Some chapters deserve to be revisited, not because they were perfect, but because they were yours."
  },
  {
    "file": "008-memory.jpg",
    "title": "The beauty of becoming",
    "quote": "Little by little, you have been writing a story that is entirely your own."
  },
  {
    "file": "009-memory.jpg",
    "title": "Unwritten chapters",
    "quote": "You could not have known every place this journey would take you."
  },
  {
    "file": "010-memory.jpg",
    "title": "The person you are",
    "quote": "Your story has always been about more than how the world sees you."
  },
  {
    "file": "011-memory.jpg",
    "title": "Moments of grace",
    "quote": "May you always remember that your worth is never measured by a single season."
  },
  {
    "file": "012-memory.jpg",
    "title": "An unfolding testimony",
    "quote": "A life of faith is woven through both the ordinary and extraordinary."
  },
  {
    "file": "013-memory-video.mp4",
    "title": "A moment in motion",
    "quote": "Not everything meaningful can be held inside a photograph."
  },
  {
    "file": "014-memory.jpg",
    "title": "Courage in the everyday",
    "quote": "Every time you showed up, you made room for the next chapter."
  },
  {
    "file": "015-memory.jpg",
    "title": "The dreams you carry",
    "quote": "May you never lose the courage to imagine the future God has placed before you."
  },
  {
    "file": "016-memory.jpg",
    "title": "A beautiful presence",
    "quote": "Strength and gentleness can belong to the same person."
  },
  {
    "file": "017-memory.jpg",
    "title": "Finding your voice",
    "quote": "Your thoughts, your hopes, and your voice deserve room to grow."
  },
  {
    "file": "018-memory.jpg",
    "title": "Seasons of joy",
    "quote": "May the happy moments remind you how much there is to be grateful for."
  },
  {
    "file": "019-memory.jpg",
    "title": "A little more of you",
    "quote": "Every chapter reveals something new without taking away who you were."
  },
  {
    "file": "020-memory.jpg",
    "title": "Under the same grace",
    "quote": "Through changing seasons, you can still find a place to rest in God's love."
  },
  {
    "file": "021-memory.jpg",
    "title": "Remember this feeling",
    "quote": "One day, you may look back and be glad this moment was kept."
  },
  {
    "file": "022-memory.jpg",
    "title": "Beautifully unfinished",
    "quote": "You do not have to have everything figured out to be becoming someone remarkable."
  },
  {
    "file": "023-memory.jpg",
    "title": "Every step matters",
    "quote": "The journey is not only in the big milestones, but in all the steps between."
  },
  {
    "file": "024-memory-video.mp4",
    "title": "Life, as it happened",
    "quote": "Here is a moment that gets to breathe again, just as it was."
  },
  {
    "file": "025-memory.jpg",
    "title": "The courage to bloom",
    "quote": "May you always find the freedom to grow in your own time."
  },
  {
    "file": "026-memory.jpg",
    "title": "A life full of meaning",
    "quote": "There is significance in the path you have walked, even when no one else saw every step."
  },
  {
    "file": "027-memory.jpg",
    "title": "Loved through every season",
    "quote": "You have been worthy of tenderness in every version of your story."
  },
  {
    "file": "028-memory.jpg",
    "title": "Still becoming",
    "quote": "There are dreams you have not yet dreamed and memories you have not yet made."
  },
  {
    "file": "029-memory.jpg",
    "title": "The story continues",
    "quote": "The most beautiful thing about your journey is that there is still more ahead."
  }
] as const;
export function memoryCaption(name:string){return memoryStory.find(scene=>scene.file===name);}
