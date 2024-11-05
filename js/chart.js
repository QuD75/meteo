//Fonction de générations du graphique
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
function createChartOM(elementId, x, y, title, xAxisLabel, yAxisLabel, round, chartType, borderColor, backgroundColor, secondaryDataWind = null, secondaryDataTemp = null) {
    const ctx = document.getElementById(elementId).getContext('2d');
    const datasets = createDatasets(title, y, borderColor, backgroundColor, secondaryDataWind, secondaryDataTemp);

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
                    text: `${title}`,
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