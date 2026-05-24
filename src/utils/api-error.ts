type ApiErrorData = {
    detail?: string;
    message?: string;
    error?: string;
    msg?: string;
};

export function getApiErrorMessage(err: unknown, fallback: string): string {
    const data = (err as { response?: { data?: ApiErrorData } })?.response?.data;
    return data?.detail || data?.message || data?.error || data?.msg || fallback;
}
