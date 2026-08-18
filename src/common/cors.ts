export const corsOptions = {
    origin: true,
    credentials: true,
};

export function getProductionCorsOptions() {
    return {
        origin: process.env.CLIENT_URL,
        credentials: true,
    };
}

export function getSocketCorsOptions() {
    // if (process.env.NODE_ENV === 'production') {
    //     return getProductionCorsOptions();
    // }

    return corsOptions;
}
