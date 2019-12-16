/* network calc */
function getCentrality(d) {
    return twtLinks
        .filter(
            e => e.target == d.id
        )
        .length;
}

function aggCentrality(d) {
    var c = d.map(v => v.num_referred);
    return d3.sum(c);
}

/* responsive */
function fit() {
    var minutes = d3.timeMinute
        .count(selectedRange[0], selectedRange[1]),
        days = d3.timeDay
        .count(selectedRange[0], selectedRange[1]),
        maxDotsX = Math.ceil(
            innerWidth / (radius + dotStrokeWidth)
        );

    // calc
    switch (true) {
        case (4 * minutes <= maxDotsX):
            timeInt = d3.timeSecond;
            timeScale = 15;
            break;
        case (2 * minutes <= maxDotsX):
            timeInt = d3.timeSecond;
            timeScale = 30;
            break;
        case (minutes <= maxDotsX):
            timeInt = d3.timeMinute;
            timeScale = 1;
            break;
        case (Math.floor(minutes / 15) <= maxDotsX):
            timeInt = d3.timeMinute;
            timeScale = 15;
            break;
        case (Math.floor(minutes / 30) <= maxDotsX):
            timeInt = d3.timeMinute;
            timeScale = 30;
            break;
        case (minutes <= maxDotsX):
            timeInt = d3.timeMinute;
            timeScale = 1;
            break;
        case (24 * days <= maxDotsX):
            timeInt = d3.timeHour;
            timeScale = 1;
            break;
        case (4 * days <= maxDotsX):
            timeInt = d3.timeHour;
            timeScale = 6;
            break;
        case (2 * days <= maxDotsX):
            timeInt = d3.timeHour;
            timeScale = 12;
            break;
        default:
            timeInt = d3.timeDay;
            timeScale = 1;
    }

    // scale X axis
    selectedNodes.forEach(function (d) {
        d.dateInd = timeInt.every(timeScale).floor(d.date);
    });
    selectedRange = d3.extent(
        selectedNodes,
        function (d) {
            return d.dateInd;
        });
    var ns = d3.nest()
        .key(byPolarity)
        .key(byDateInd)
        .rollup(v => v.length)
        .entries(nodes)
        .map(function (d) {
            return d.values.map(v => v.value);
        }),
        maxN = d3.max(ns.map(d => d3.max(d))),
        maxDotsY = Math.ceil(
            innerHeight / (4 * (radius + dotStrokeWidth))
        );
    scaleBy = Math.ceil(maxN / maxDotsY);
    isAgged = (scaleBy > 1);
    transitionX();
    // scale Y axis
    setTimeout(function () {
        rankDots(selectedNodes, grpBy, linBy);
        transitionY();
        if (isAgged) {
            aggs = aggregate(selectedNodes);
            setTimeout(function () {
                removeDots();
                updateBars(aggs);
            }, duration);
        }
    }, duration);
}

function resize() {
    currDim = container
        .node()
        .getBoundingClientRect();
    outerWidth = currDim.width;
    outerHeight = currDim.height;
    innerWidth = outerWidth - margin.left - margin.right;
    innerHeight = outerHeight - margin.top - margin.bottom;
    resizeTimeline();
    resizeMain();
    setTimeout(transitionX, transitionY() * duration);
}

function resizeMain() {
    // rescale box
    svg.attr("width", outerWidth)
        .attr("height", outerHeight);
    x.rangeRound([0, innerWidth]);
    x0.attr("x2", innerWidth)
        .attr("y1", innerHeight / 2)
        .attr("y2", innerHeight / 2);
    grids.selectAll("line.horizontal")
        .attr("x2", innerWidth);
    grids.selectAll("rect.horizontal")
        .attr("x", innerWidth - 30 - 8);
    grids.selectAll("text.horizontal")
        .attr("x", innerWidth - 30);
    bg.attr("width", innerWidth)
        .attr("height", outerHeight)
}

function resizeTimeline() {
    timelineSvg.attr("width", innerWidth);
    brush.extent([[0, 0], [innerWidth, timelineHeight]]);
    timeline.range([0, innerWidth]);
    timelineAxisG.call(timelineAxis)
        .selectAll(".text")
        .attr("dy", "1.5em");;
}

/* helper funcitons */
var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S"),
    formatTime = d3.timeFormat("%b %d, %Y %H:%M:%S %Z");

function removeDots() {
    dots.selectAll("ellipse").remove();
}

function removeBars() {
    bars.selectAll("path").remove();
}

function removeLinks() {
    links.selectAll("path").remove();
}

function removeTrends() {
    trends.selectAll("path").remove();
}

function stopAllTransition() {
    dots.interrupt();
    bars.interrupt();
    links.interrupt();
    trends.interrupt();
    grids.interrupt();
    xGrids.interrupt();
}

function disableControllers() {
    ctrlTimeInt.property("disabled", true);
    ctrlTimeScale.property("disabled", true);
    ctrlIsAgged.property("disabled", true);
    ctrlLinBy.property("disabled", true);
    ctrlGrpBy.property("disabled", true);
}

function enableControllers() {
    ctrlTimeInt.property("disabled", false);
    ctrlTimeScale.property("disabled", false);
    ctrlIsAgged.property(
        "disabled", selected ? true : false);
    ctrlLinBy.property("disabled", false);
    ctrlGrpBy.property(
        "disabled", isAgged && selected ? true : false);
}
