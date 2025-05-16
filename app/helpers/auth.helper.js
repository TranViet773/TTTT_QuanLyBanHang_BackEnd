const isValidEmail = (user, email) => {

    const now = new Date();
    return user.LIST_EMAIL.some(e =>
        e.EMAIL === email &&
        e.FROM_DATE <= now &&
        (e.THRU_DATE === null || e.THRU_DATE > now)
    );
}

module.exports = {
    isValidEmail,
}