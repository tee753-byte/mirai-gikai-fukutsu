import Image from "next/image";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";

export function Hero() {
  // SVGはnext/imageの最適化対象外（変換すると400になる）。拡大しても粗くならないのでそのまま出す
  const isVector = siteConfig.heroImage.endsWith(".svg");

  return (
    <div className="relative w-full h-[80vh] min-h-[400px] md:h-[70vh]">
      <Image
        src={siteConfig.heroImage}
        alt={`${siteConfig.cityName}の風景`}
        fill
        priority
        className="object-cover"
        sizes="100vw"
        quality={85}
        unoptimized={isVector}
      />

      {/*
        見出しは黒文字なので、写真の暗い部分に重なると読めなくなる。
        下側だけ白をうすく重ねて、写真の印象は残したまま文字を読めるようにする。
      */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.58) 42%, rgba(255,255,255,0.18) 72%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div className="absolute bottom-[30vh] left-0 right-0 py-4">
        <Container>
          {/*
            ページで唯一の大見出し。h1が無いと、検索エンジンにも読み上げソフトにも
            「このページが何のページか」が伝わらないため p ではなく h1 にする。
            見た目は変えていない。
          */}
          <h1 className="font-bold text-xl md:text-2xl leading-relaxed">
            いま{siteConfig.councilName}で議論されていること <br />
            やさしい言葉で説明します
          </h1>
          <p className="mt-2 font-lexend text-xs">
            {/* 表示したい場合は `powered by ${siteConfig.operator.name}` とかで*/}
            {siteConfig.features.showTeamMiraiSection
              ? "powered by Team Mirai & AI"
              : ""}
          </p>
        </Container>
      </div>

      {/* スクロールインジケーター */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-gentle">
        <div className="w-[1px] h-[34px] bg-black"></div>
        <p className="mt-2 font-lexend text-[10px] leading-[20px] text-black">
          Scroll
        </p>
      </div>
    </div>
  );
}
