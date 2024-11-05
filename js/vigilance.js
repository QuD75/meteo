//Fonctions pour la vigilance météo
function displayDataVigilance(dataVigilance, mobile) {
    document.getElementById('loading-message-vigilance').style.display = 'none';
    document.getElementById('vigilance-encart').style.display = 'block';

    fillVigilance(dataVigilance, mobile);
}
function fillVigilance(data, mobile) {
    if (data.results && data.results.length > 0) {
        data.results.sort(() => Math.random() - 0.5);
        const highestVigilanceLevel = data.results[0].color_id;
        const highestVigilanceColor = data.results[0].color;

        const vigilanceDetails = document.getElementById('vigilance-details');
        const vigilanceIcon = document.getElementById('vigilance-icon');
        const vigilanceTitle = document.getElementById('vigilance-title');

        if (highestVigilanceLevel === 1) {
            document.getElementById('vigilance-encart').style.setProperty('display', 'none', 'important');
            return;
        }

        const colorMap = {
            2: { color: '#ffd700', icon: '/icons/44/44_jaune.svg' },
            3: { color: '#ff8800', icon: '/icons/44/44_orange.svg' },
            4: { color: '#f00020', icon: '/icons/44/44_rouge.svg' }
        };

        if (highestVigilanceLevel in colorMap) {
            const colorHex = colorMap[highestVigilanceLevel].color;
            const vigilanceEncart = document.getElementById('vigilance-encart');
            vigilanceEncart.style.setProperty('border', '4px solid ' + colorHex);
            vigilanceEncart.style.setProperty('box-shadow', '0 4px 10px ' + colorHex);
            if (mobile) {
                const textContainer = document.getElementById('text-container');
                vigilanceIcon.style.setProperty('width', '80px');
                vigilanceEncart.style.setProperty('width', '100%');
                vigilanceEncart.style.setProperty('margin-left', '0');
                textContainer.style.setProperty('font-size', '0.7em');
                textContainer.style.setProperty('padding-right', '10px');
            }
            vigilanceIcon.src = colorMap[highestVigilanceLevel].icon;
            vigilanceTitle.style.color = colorHex;
            vigilanceTitle.textContent = `Vigilance ${highestVigilanceColor}`;
        }

        const highestVigilances = data.results.filter(vigilance => vigilance.color_id === highestVigilanceLevel);
        const vigilanceGroups = {};

        highestVigilances.forEach(vigilance => {
            const key = `${vigilance.phenomenon}-${vigilance.color_id}`;
            if (!vigilanceGroups[key]) {
                vigilanceGroups[key] = {
                    phenomenon: vigilance.phenomenon,
                    color_id: vigilance.color_id,
                    periods: []
                };
            }
            vigilanceGroups[key].periods.push({
                begin_time: new Date(vigilance.begin_time),
                end_time: new Date(vigilance.end_time)
            });
        });

        const mergedVigilances = Object.values(vigilanceGroups).map(group => {
            const mergedPeriods = mergePeriods(group.periods);
            return {
                phenomenon: group.phenomenon,
                color_id: group.color_id,
                periods: mergedPeriods
            };
        });

        vigilanceDetails.innerHTML = mergedVigilances.map(vigilance =>
            `<div>
                <strong>Phénomène :</strong> ${vigilance.phenomenon}<br>
                <strong>Période :</strong> ${vigilance.periods.map(period =>
                `du ${formatDate(period.begin_time, false, true, true, true, false)} au ${formatDate(period.end_time, false, true, true, true, false)}`
            ).join('<br>')}
            </div><br>`
        ).join('');

        document.getElementById('vigilance-encart').style.display = 'block';
    } else {
        document.getElementById('vigilance-encart').style.display = 'none';
    }
}
function mergePeriods(periods) {
    periods.sort((a, b) => a.begin_time - b.begin_time);
    const merged = [];
    let currentPeriod = periods[0];
    for (let i = 1; i < periods.length; i++) {
        if (currentPeriod.end_time >= periods[i].begin_time) {
            currentPeriod.end_time = new Date(Math.max(currentPeriod.end_time, periods[i].end_time));
        } else {
            merged.push(currentPeriod);
            currentPeriod = periods[i];
        }
    }
    merged.push(currentPeriod);
    return merged;
}