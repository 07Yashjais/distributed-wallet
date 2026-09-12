const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validateEmail = (email) => {
    if (typeof email !== "string") return false;
    const trimmed = email.trim();
    return EMAIL_REGEX.test(trimmed) && trimmed.length <= 255;
};

const validatePassword = (password) => {
    return typeof password === "string" && password.length >= 6 && password.length <= 128;
};

const validateName = (name) => {
    if (typeof name !== "string") return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
};

const validateAmount = (amount) => {
    if (amount === undefined || amount === null || amount === "") return null;
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0 || num > 10000000) return null;
    // Disallow more than 2 decimal places (e.g. 10.005)
    const parts = num.toString().split(".");
    if (parts.length > 1 && parts[1].length > 2) return null;
    return Math.round(num * 100) / 100;
};

const validateUUID = (id) => {
    return typeof id === "string" && UUID_REGEX.test(id.trim());
};

const validateIdempotencyKey = (key) => {
    if (!key || typeof key !== "string") return null;
    const trimmed = key.trim();
    if (trimmed.length === 0 || trimmed.length > 255) return null;
    return trimmed;
};

module.exports = {
    validateEmail,
    validatePassword,
    validateName,
    validateAmount,
    validateUUID,
    validateIdempotencyKey
};
