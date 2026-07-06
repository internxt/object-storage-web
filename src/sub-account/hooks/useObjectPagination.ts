import { useState } from "react";

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

export function useObjectPagination() {
    const [pages, setPages] = useState<PagesState>(firstPage);
    const [pageSize, setPageSizeState] = useState(100);
    const [isTruncated, setIsTruncated] = useState(false);

    const reset = () => {
        setPages(firstPage);
        setIsTruncated(false);
    };

    const setPageSize = (size: number) => {
        setPageSizeState(size);
        setPages(firstPage);
    };

    const goToPrevPage = () =>
        setPages((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: prev.pageIndex - 1 }));
    const goToNextPage = () =>
        setPages((prev) => (prev.markers[prev.pageIndex + 1] ? { ...prev, pageIndex: prev.pageIndex + 1 } : prev));

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
        reset,
    };
}
