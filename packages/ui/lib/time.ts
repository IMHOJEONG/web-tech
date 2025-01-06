import dayjs from "dayjs"

const getTime = (isoString: string) => {
    return dayjs(isoString).format("YYYY.MM.DD")
}

export { getTime }