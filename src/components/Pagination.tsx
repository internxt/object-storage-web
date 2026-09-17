import { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import {
    CaretDownIcon,
    CaretLeftIcon,
    CaretRightIcon,
} from "@phosphor-icons/react";
import { Dropdown } from "./Dropdown";
import { T } from "../sub-account/tokens";

const navButtonStyle = (isDisabled?: boolean): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: "none",
    background: "transparent",
    color: isDisabled ? T.gray20 : T.gray80,
    cursor: isDisabled ? "not-allowed" : "pointer",
});

interface PaginationProps {
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageSizeChange?: (size: number) => void;
    pageNumber: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    onPrev: () => void;
    onNext: () => void;
    isLoading?: boolean;
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
    isLoading,
}: PaginationProps) => {
    const { t } = useTranslation("common");
    const isPrevDisabled = !hasPrevPage || isLoading;
    const isNextDisabled = !hasNextPage || isLoading;
    const hasPageSizeSelector =
        pageSize !== undefined &&
        pageSizeOptions !== undefined &&
        onPageSizeChange !== undefined;

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
            {hasPageSizeSelector && (
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
                            {t("pagination.perPage", { count: pageSize })} <CaretDownIcon size={12} />
                        </span>
                    }
                    items={pageSizeOptions.map((size) => ({
                        label: t("pagination.perPage", { count: size }),
                        onClick: () => onPageSizeChange(size),
                    }))}
                />
            )}
            <span
                style={{ fontSize: 13, color: T.gray60, whiteSpace: "nowrap" }}
            >
                {t("pagination.page", { number: pageNumber })}
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
                    type="button"
                    disabled={isPrevDisabled}
                    onClick={onPrev}
                    aria-label={t("pagination.previousPage")}
                    style={navButtonStyle(isPrevDisabled)}
                >
                    <CaretLeftIcon size={14} weight="bold" />
                </button>
                <div style={{ width: 1, height: 18, background: T.gray20 }} />
                <button
                    type="button"
                    disabled={isNextDisabled}
                    onClick={onNext}
                    aria-label={t("pagination.nextPage")}
                    style={navButtonStyle(isNextDisabled)}
                >
                    <CaretRightIcon size={14} weight="bold" />
                </button>
            </div>
        </div>
    );
};
