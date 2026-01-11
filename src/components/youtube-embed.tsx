'use client';

interface YoutubeEmbedProps {
  url: string;
}

const getYouTubeVideoId = (url: string) => {
  let videoId = '';
  const urlObj = new URL(url);
  if (urlObj.hostname === 'youtu.be') {
    videoId = urlObj.pathname.slice(1);
  } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
    videoId = urlObj.searchParams.get('v') || '';
  }
  return videoId;
};

export function YoutubeEmbed({ url }: YoutubeEmbedProps) {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return (
      <div className="aspect-video w-full bg-muted flex items-center justify-center">
        <p className="text-destructive">Invalid YouTube URL</p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full">
      <iframe
        className="w-full h-full rounded-t-lg"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}
