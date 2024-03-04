import { Transcription } from "@/app/types";

export type VoiceItemProps = {
  transcription: Transcription;
  isSelected: boolean;
};

const VoiceItem = ({ transcription, isSelected }: VoiceItemProps) => {
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex flex-row items-center gap-[12px] text-sm font-bold">
        <div className="w-[16px] h-[16px] rounded-full bg-[#d0888c]" />
        Speaker {transcription.speaker}
        <div className="text-sm font-thin text-gray-400">
          {transcription.timestamp}
        </div>
      </div>
      <div className={`pl-[32px] ${isSelected ? "text-red-500 underline" : "text-gray-500"}`}>{transcription.transcript}</div>
    </div>
  );
};

export default VoiceItem;
