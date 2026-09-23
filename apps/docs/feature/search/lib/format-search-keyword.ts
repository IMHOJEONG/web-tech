const SEARCH_KEYWORD_UI_MAX_LENGTH = 18

export function formatSearchKeyword(keyword: string) {
    const trimmedKeyword = keyword.trim()

    const characters = Array.from(trimmedKeyword)
    if (characters.length <= SEARCH_KEYWORD_UI_MAX_LENGTH) {
        return trimmedKeyword
    }

    return `${characters.slice(0, SEARCH_KEYWORD_UI_MAX_LENGTH).join('')}...`
}
