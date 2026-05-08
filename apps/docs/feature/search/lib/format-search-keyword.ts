const SEARCH_KEYWORD_UI_MAX_LENGTH = 18

export function formatSearchKeyword(keyword: string) {
    const trimmedKeyword = keyword.trim()

    if (trimmedKeyword.length <= SEARCH_KEYWORD_UI_MAX_LENGTH) {
        return trimmedKeyword
    }

    return `${trimmedKeyword.slice(0, SEARCH_KEYWORD_UI_MAX_LENGTH)}...`
}
