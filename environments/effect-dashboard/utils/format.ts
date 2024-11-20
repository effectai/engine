export const sliceBoth = (str: string) => {
	if(str.length <= 12) return str;
	return `${str.slice(0, 6)}...${str.slice(-6)}`;
};

    