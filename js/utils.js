//Fonction pour le format des dates
function formatDate(date, hasYear, hasMonth, hasDay, hasHour, hasMinute) {
    const options = {
        year: hasYear ? 'numeric' : undefined,
        month: hasMonth ? '2-digit' : undefined,
        day: hasDay ? '2-digit' : undefined,
        hour: hasHour ? '2-digit' : undefined,
        minute: hasMinute ? '2-digit' : undefined,
        hour12: false,
    };
    let formattedDate = date.toLocaleString('fr-FR', options);
    if (hasHour && !hasMinute) {
        let length = formattedDate.length;
        formattedDate = formattedDate.slice(0, -2) + formattedDate.charAt(length - 1);
        if (formattedDate.charAt(length - 4) === '0') {
            formattedDate = formattedDate.slice(0, -3) + formattedDate.slice(-2);
        }
    }
    return formattedDate;
}
//Fonction pour arrondir les valeurs
function roundToNearestMultiple(value, decimals, floor) {
    const factor = Math.pow(10, decimals);
    if (decimals != null) value = Math.round((value * factor)) / factor;
    if (floor != null) value = Math.round(value / floor) * floor;
    return value;
}