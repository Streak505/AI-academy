const getImagePrefix = () => {
    return "";
};

const formatAcademyDate = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recent";

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone: "UTC",
    }).format(date);
};

export { formatAcademyDate, getImagePrefix };