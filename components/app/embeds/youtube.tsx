export default function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="w-full aspect-video">
      <iframe
        className="w-full h-full rounded-lg"
        src={`https://www.youtube.com/embed/${videoId}`}
        allowFullScreen
      ></iframe>
    </div>
  );
}