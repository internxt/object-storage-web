import {
    CaretDownIcon,
    CaretLeftIcon,
    CaretRightIcon,
} from "@phosphor-icons/react";
import { Dropdown } from "./Dropdown";
import { T } from "../sub-account/tokens";

interface PaginationProps {
    pageSize: number;
    pageSizeOptions: number[];
    onPageSizeChange: (size: number) => void;
    pageNumber: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    onPrev: () => void;
    onNext: () => void;
}

export const Pagination = ({
    pageSize,
    pageSizeOptions,
    onPageSizeChange,
    pageNumber,
    hasPrevPage,
    hasNextPage,
    onPrev,
    onNext,
}: PaginationProps) => {
    const isPrevDisabled = !hasPrevPage;
    const isNextDisabled = !hasNextPage;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "10px 20px",
                gap: 12,
                borderBottom: `1px solid ${T.gray15}`,
            }}
        >
            <Dropdown
                button={
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            height: 32,
                            padding: "0 10px",
                            border: `1px solid ${T.gray20}`,
                            borderRadius: 6,
                            background: "#fff",
                            color: T.gray80,
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {pageSize} per page <CaretDownIcon size={12} />
                    </span>
                }
                items={pageSizeOptions.map((size) => ({
                    label: `${size} per page`,
                    onClick: () => onPageSizeChange(size),
                }))}
            />
            <span
                style={{ fontSize: 13, color: T.gray60, whiteSpace: "nowrap" }}
            >
                Page {pageNumber}
            </span>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                    border: `1px solid ${T.gray20}`,
                    borderRadius: 6,
                }}
            >
                <button
                    disabled={isPrevDisabled}
                    onClick={onPrev}
                    aria-label="Previous page"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        border: "none",
                        background: "transparent",
                        color: isPrevDisabled ? T.gray20 : T.gray80,
                        cursor: isPrevDisabled ? "not-allowed" : "pointer",
                    }}
                >
                    <CaretLeftIcon size={14} weight="bold" />
                </button>
                <div style={{ width: 1, height: 18, background: T.gray20 }} />
                <button
                    disabled={isNextDisabled}
                    onClick={onNext}
                    aria-label="Next page"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        border: "none",
                        background: "transparent",
                        color: isNextDisabled ? T.gray20 : T.gray80,
                        cursor: isNextDisabled ? "not-allowed" : "pointer",
                    }}
                >
                    <CaretRightIcon size={14} weight="bold" />
                </button>
            </div>
        </div>
    );
};
