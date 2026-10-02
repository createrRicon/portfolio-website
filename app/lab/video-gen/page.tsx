import type { Metadata } from "next";
import VideoGenStudio from "@/components/video-gen/VideoGenStudio";

export const metadata: Metadata = {
  title: "视频生成入口 · 交互 Mockup | 龚力康",
  description: "从一片黑暗和一个光标开始：边输入边识别提示词里的元素，点击下划线即可细化。",
};

export default function VideoGenLabPage() {
  return <VideoGenStudio />;
}
