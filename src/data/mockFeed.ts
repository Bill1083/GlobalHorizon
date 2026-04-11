export type FeedItem = {
  id: string;
  title: string;
  location: string;
  image: string;
  creator: string;
  likes: number;
  tags: string[];
};

export const mockFeed: FeedItem[] = [
  {
    id: '1',
    title: 'Sunset Panorama',
    location: 'Bali, Indonesia',
    image:
      'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=80',
    creator: 'Maya F.',
    likes: 1342,
    tags: ['cinematic', 'landscape', 'travel']
  },
  {
    id: '2',
    title: 'Dune Horizon',
    location: 'Sahara Desert',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    creator: 'Ezra K.',
    likes: 980,
    tags: ['desert', 'wideangle', 'night']
  },
  {
    id: '3',
    title: 'Coastal Drive',
    location: 'Amalfi Coast',
    image:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80',
    creator: 'Jules R.',
    likes: 1784,
    tags: ['coast', 'ocean', 'travel']
  },
  {
    id: '4',
    title: 'Mountain Runway',
    location: 'Swiss Alps',
    image:
      'https://images.unsplash.com/photo-1500534623283-2f09d6b4e24e?auto=format&fit=crop&w=1600&q=80',
    creator: 'Noor A.',
    likes: 1120,
    tags: ['mountain', 'roadtrip', 'landscape']
  }
];
