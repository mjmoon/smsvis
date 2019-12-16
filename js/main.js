Promise
    .all([
    d3.json(nodesFile).then(function (data) {
            data.forEach(function (d) {
                d.date = parseTime(d.date);
                d.dateInd = timeInt.every(timeScale).floor(d.date);
                d.polarity = +d.polarity;
            });
            return data
        }).catch(function (error) {
            if (error) throw error;
        }),
    d3.json(edgesFile)
])
    .then(function (data) {
        currDim = container
            .node()
            .getBoundingClientRect();
        data[0].forEach(function (d) {

        });
        nodes = data[0];
        twtLinks = data[1];
        nodes.forEach(function (d) {
            var link = data[1].filter(e => e.id == d.id);
            if (link.length > 0) {
                d.type = link[0].type;
            } else {
                d.type = "original";
            }
            d.num_referred = getCentrality(d);
        });
        selectedNodes = nodes;
        selectedTwtLinks = twtLinks;
        timelineAxis.ticks(5);
        selectedRange = timeRange = d3.extent(
            nodes,
            function (d) {
                return d.dateInd;
            });
        rankDots(nodes);
        aggs = aggs = aggregate(selectedNodes);
        drawGrids();
        drawBg();
        updateDots(nodes);
        toggleReset();
        drawTimeline();
    });
