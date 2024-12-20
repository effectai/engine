export const calculateStakeAge = (timestamp: number) => {
    const now = Date.now() / 1000;
    return (now - timestamp) / 100;
}