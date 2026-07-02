/* eslint-disable @next/next/no-img-element */

type QuestionImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function QuestionImage({ src, alt, className }: QuestionImageProps) {
  return <img src={src} alt={alt} className={className} />;
}
