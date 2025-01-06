import { Metadata } from "~/lib/util";
import Image from "next/image";
import { getTime } from "@web-tech/ui/lib/time";

const MainCard = ({ doc }: { doc: Partial<Metadata>}) => { 
    const { title, date, summary, slug, content } = doc;
    return (
        <div className="flex flex-col gap-3 p-3 rounded-lg">
            <Image src={'/default/no-image.webp'} alt={title ?? ''} 
                width={200} height={200}
                className="rounded-lg"
            />
            <div>{title}</div>
            <div>{summary}</div>
            {/* <div>{date}</div> */}
            <div>{getTime(date ?? '')}</div>
        </div>
    )
}

export default MainCard;