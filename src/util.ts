export const getEnv = (key) => {
    const value = process.env[key];
    if (value === undefined) {
        throw new Error(`Missing required environment variable ${key}`);
    }
    return value;
};