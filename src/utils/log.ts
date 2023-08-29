export const log = (message?: any, ...optionalParams: any[]) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`, ...optionalParams);
};
