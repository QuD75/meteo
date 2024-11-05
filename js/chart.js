import Chart from 'https://cdn.jsdelivr.net/npm/chart.js';

//Fonction de générations du graphique
function createChart(elementId, label, xAxisLabel, yAxisLabel, data, round, chartType, borderColor, backgroundColor, secondaryDataWind = null, secondaryDataTemp = null) {
    const ctx = document.getElementById(elementId).getContext('2d');
    const labels = getChartLabels(elementId, data);
    const values = getChartValues(data, label);
    const datasets = createDatasets(label, values, borderColor, backgroundColor, secondaryDataWind, secondaryDataTemp);

    new Chart(ctx, {
        type: chartType,
        data: {
            labels,
            datasets
        },
        options: {
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `Évolution ${label}`,
                    font: { size: 20 }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: xAxisLabel },
                    ticks: { maxRotation: 30, minRotation: 30 },
                    barPercentage: 1.0
                },
                y: {
                    title: { display: true, text: yAxisLabel },
                    ticks: { callback: value => value.toFixed(round) }
                }
            }
        }
    });
}
function getChartLabels(elementId, data) {
    return elementId.includes('day')
        ? data.dates.map(date => formatDate(new Date(date.date), false, false, false, true, false))
        : data.dates.map(date => {
            const day = new Date(date.date);
            day.setDate(day.getDate() - 1);
            return formatDate(day.toLocaleDateString('fr-FR', { weekday: 'long' }));
        });
}
function getChartValues(data, label) {
    return data.dates.map(date => date.value * (label.includes('vent') ? 3.6 : 1));
}
function createDatasets(label, values, borderColor, backgroundColor, secondaryDataWind, secondaryDataTemp) {
    const datasets = [{
        label,
        data: values,
        borderColor,
        backgroundColor,
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.5,
        cubicInterpolationMode: 'monotone',
        fill: secondaryDataWind ? true : 'start'
    }];

    if (secondaryDataWind) {
        datasets.push({
            pointRadius: 0,
            data: secondaryDataWind,
            borderColor: 'rgba(255, 140, 0, 1)',
            backgroundColor: 'rgba(255, 140, 0, 0.2)',
            fill: '-1',
            tension: 0.5,
            cubicInterpolationMode: 'monotone',
        });
    }

    if (secondaryDataTemp) {
        datasets.push({
            pointRadius: 0,
            data: secondaryDataTemp,
            borderColor: 'rgba(139, 0, 0, 1)',
            tension: 0.5,
            cubicInterpolationMode: 'monotone',
        });
    }

    return datasets;
}
function createChartOM(elementId, x, y, label, xAxisLabel, yAxisLabel, round, chartType, borderColor, backgroundColor, secondaryDataWind = null, secondaryDataTemp = null) {
    const ctx = document.getElementById(elementId).getContext('2d');
    const datasets = createDatasets(label, y, borderColor, backgroundColor, secondaryDataWind, secondaryDataTemp);

    new Chart(ctx, {
        type: chartType,
        data: {
            x,
            datasets
        },
        options: {
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `${label}`,
                    font: { size: 20 }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: xAxisLabel },
                    ticks: { maxRotation: 30, minRotation: 30 },
                    barPercentage: 1.0
                },
                y: {
                    title: { display: true, text: yAxisLabel },
                    ticks: { callback: value => value.toFixed(round) }
                }
            }
        }
    });
}