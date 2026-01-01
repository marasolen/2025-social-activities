let data, activities;
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const setupVisualization = () => {
    const containerWidth = document.getElementById("visualization").clientWidth;
    const containerHeight = document.getElementById("visualization").clientHeight;

    const margin = {
        top: 0.03 * containerHeight,
        right: 0.05 * containerWidth,
        bottom: 0 * containerHeight,
        left: 0.05 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);
    
    const biggestDay = d3.max(data, d => d.total) + 0.2;
    const xScale = d3.scaleBand().domain(weekdays).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, biggestDay]).range([0, height]);

    const categoryColours = {
        "group exercise": "rgb(63, 81, 181)",
        "team sports": "rgb(244, 81, 30)",
        "one on one hangout": "rgb(246, 191, 38)",
        "group hangout": "rgb(11, 128, 67)",
        "big group party": "rgb(213, 0, 0)",
        "event": "rgb(3, 155, 229)",
        "date": "#B18FCF"
    };

    const categoryNames = {
        "group exercise": "group fitness",
        "team sports": "team sports",
        "one on one hangout": "1-on-1 hangout",
        "group hangout": "group hangout",
        "big group party": "party",
        "event": "event",
        "date": "date"
    };

    const svg = d3.select("#visualization");

    svg.selectAll("text")
        .data(weekdays)
        .join("text")
        .attr("font-weight", 400)
        .attr("text-multiplier", 0.8)
        .attr("text-anchor", "left")
        .attr("dominant-baseline", "hanging")
        .attr("transform", d => `translate(${xScale(d) + 1.2 * margin.left}, 0)`)
        .text(d => d.substring(0, 3).toUpperCase());

    svg.selectAll("line.horizontal-line")
        .data([0.125, 0.375, 0.625, 0.875, 1.125, 1.375, 1.625])
        .join("line")
        .attr("class", ".horizontal-line")
        .attr("x1", 0)
        .attr("x2", containerWidth)
        .attr("y1", d => margin.top + yScale(d))
        .attr("y2", d => margin.top + yScale(d))
        .attr("stroke", "#bbbbbb")
        .attr("stroke-width", height / 800)

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const weekdayGroups = chart.selectAll("g")
        .data(data)
        .join("g")
        .attr("transform", d => `translate(${xScale(d.weekday)}, 0)`);

    const activityGroups = weekdayGroups.selectAll("g")
        .data(d => d.activities)
        .join("g")
        .attr("transform", (a, i) => `translate(0, ${yScale(a.start) + i * ((biggestDay - a.total)/ biggestDay) * height / (a.count - 1)})`);

    activityGroups.selectAll("rect.background-block")
        .data(d => [d])
        .join("rect")
        .attr("class", "background-block")
        .attr("width", d => (d.scheduled ? 0.9 : 0.7) * xScale.bandwidth())
        .attr("height", d => yScale(d.average))
        .attr("fill-opacity", 1)
        .attr("rx", width * 0.004)
        .attr("ry", width * 0.004)
        .attr("fill", "white");

    activityGroups.selectAll("rect.foreground-block")
        .data(d => [d])
        .join("rect")
        .attr("class", "foreground-block")
        .attr("width", d => (d.scheduled ? 0.9 : 0.7) * xScale.bandwidth())
        .attr("height", d => yScale(d.average))
        .attr("fill-opacity", d => d.scheduled ? 1 : 0.3)
        .attr("rx", width * 0.004)
        .attr("ry", width * 0.004)
        .attr("fill", d => categoryColours[d.activity]);

    activityGroups.selectAll("text")
        .data(d => [d])
        .join("text")
        .attr("text-multiplier", 0.55)
        .attr("fill", d => d.scheduled ? "white" : "#222222")
        .attr("dominant-baseline", "hanging")
        .attr("transform", d => `translate(${width / 200}, ${height / 200})`)
        .text(d => categoryNames[d.activity]);
};

const renderVisualization = () => {
    setupVisualization();
};

const resizeAndRender = () => {
    d3.selectAll("svg > *").remove();

    d3.selectAll("#visualization")
        .attr("height", "60vh")
        .attr("width", "100%");

    renderVisualization();

    d3.selectAll("text")
        .attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.03 * document.getElementById("visualization").clientHeight });
};

window.onresize = resizeAndRender;

Promise.all([d3.csv('data/data.csv')]).then(([_data]) => {
    data = _data;
    activities = Object.keys(data[0]).filter(k => k !== "weekday");

    data = data.map(d => {
        const newObject = {
            "weekday": d["weekday"]
        };
        let total = 0;
        const dayActivities = activities.map(a => {
            const dayActivity = {
                "activity": a,
                "start": total,
                "average": +d[a] % 1,
                "scheduled": +d[a] > 1
            };
            total += +d[a] % 1;
            return dayActivity;
        }).filter(a => a.average > 0);
        dayActivities.forEach(a => a["total"] = total);
        dayActivities.forEach(a => a["count"] = dayActivities.length);
        newObject.activities = dayActivities;
        newObject["total"] = total;
        return newObject;
    });

    resizeAndRender();
});