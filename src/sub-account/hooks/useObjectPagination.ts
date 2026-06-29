import { useEffect, useState } from "react";

interface PageMarker {
    continuationToken?: string;
    keyMarker?: string;
    versionIdMarker?: string;
}

interface PageResult {
    isTruncated: boolean;
    continuationToken?: string;
    keyMarker?: string;
    versionIdMarker?: string;
}

interface PagesState {
    pageIndex: number;
    markers: PageMarker[];
}

const firstPage: PagesState = { pageIndex: 0, markers: [{}] };

export function useObjectPagination(resetDeps: unknown[]) {
    const [pages, setPages] = useState<PagesState>(firstPage);
    const [pageSize, setPageSizeState] = useState(100);
    const [isTruncated, setIsTruncated] = useState(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => setPages(firstPage), resetDeps);

    const setPageSize = (size: number) => {
        setPageSizeState(size);
        setPages(firstPage);
    };

    const goToPrevPage = () =>
        setPages((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
    const goToNextPage = () =>
        setPages((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }));

    const recordPage = (result: PageResult) => {
        setIsTruncated(result.isTruncated);
        if (!result.isTruncated) return;
        setPages((prev) => {
            if (prev.markers[prev.pageIndex + 1]) return prev;
            const nextMarker = {
                continuationToken: result.continuationToken,
                keyMarker: result.keyMarker,
                versionIdMarker: result.versionIdMarker,
            };
            return { ...prev, markers: [...prev.markers, nextMarker] };
        });
    };

    return {
        state: {
            pageNumber: pages.pageIndex + 1,
            pageSize,
            hasPrevPage: pages.pageIndex > 0,
            hasNextPage: isTruncated,
            pageMarker: pages.markers[pages.pageIndex],
        },
        setPageSize,
        goToPrevPage,
        goToNextPage,
        recordPage,
    };
}
