interface EmptySearchResultProps {
    keyword: string
}

export const EmptySearchResult = ({ keyword }: EmptySearchResultProps) => {
    return (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
            <p className="text-lg font-medium">
                {keyword}에 맞는 결과가 없습니다
            </p>
            <p className="text-sm">다른 키워드로 검색해보세요</p>
        </div>
    )
}
