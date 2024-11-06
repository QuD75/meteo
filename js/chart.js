//Fonction de générations du graphique
function createDatasets(x, y, borderColor, backgroundColor, secondaryDataWind, secondaryDataTemp) {
    const datasets = [{
        x,
        data: y,
        borderColor,
        backgroundColor,
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.5,
        cubicInterpolationMode: 'monotone',
        fill: secondaryDataWind ? true : secondaryDataTemp ? false : 'start'
    }];

    if (secondaryDataWind) {
        datasets.push({
            x: 'Wind Data',
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
            x: 'Temperature Data',
            pointRadius: 0,
            data: secondaryDataTemp,
            borderColor: 'red',
            tension: 0.5,
            cubicInterpolationMode: 'monotone',
        });
    }

    return datasets;
}
function createChart(elementId, x, y, step, title, xAxisLabel, yAxisLabel, round, chartType, borderColor, backgroundColor, secondaryDataWind = null, secondaryDataTemp = null) {
    const ctx = document.getElementById(elementId).getContext('2d');
    const datasets = createDatasets(x, y, borderColor, backgroundColor, secondaryDataWind, secondaryDataTemp);

    new Chart(ctx, {
        type: chartType,
        data: {
            labels: x, // Utilise x comme labels pour l'axe des abscisses
            datasets: datasets // y et les données supplémentaires comme datasets
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
                },
                y: {
                    title: { display: true, text: yAxisLabel },
                    ticks: {
                        stepSize: step,
                        callback: value => value.toFixed(round)
                    }
                }
            }
        }
    });
}