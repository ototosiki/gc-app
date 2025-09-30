import Image from "next/image";
import Auth from '../components/Auth'

export default function Home() {
  const key = process.env.SAMPLE_SECRET_KEY;
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 bg-black">
      <h1></h1>
      <Auth />
    </div>
  );
}
