function drawGrids() {
    // horizontal
    var va = d3
        .range(vn % 2 == 0 ? vn : vn + 1)
        .map(v => (v - Math.floor(vn / 2)) * vBy)
        .filter(v => v != 0);
    grids.selectAll(".horizontal").remove();
    grids.selectAll("line.horizontal")
        .data(va)
        .enter().append("line")
        .attr("class", "grid horizontal")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", yLine)
        .attr("y2", yLine)
        .style("opacity", function (v) {
            return v % scaleBy == 0 ? 1 : 0;
        });
    grids.selectAll("rect.horizontal")
        .data(va)
        .enter().append("rect")
        .attr("class", "bg horizontal")
        .attr("x", innerWidth - 30 - 8)
        .attr("y", function (j) {
            return yLine(j) - 5;
        })
        .attr("width", 16)
        .attr("height", 8)
        .style("opacity", function (v) {
            return v % scaleBy == 0 ? 1 : 0;
        });
    grids.selectAll("text.horizontal")
        .data(va)
        .enter().append("text")
        .attr("class", "label horizontal")
        .attr("x", innerWidth - 30)
        .attr("y", yLine)
        .text(function (j) {
            return Math.abs(j);
        })
        .style("opacity", function (v) {
            return v % scaleBy == 0 ? 1 : 0;
        });
    // vertical
    x.domain(d3.extent(nodes, function (d) {
        return d.dateInd;
    }));
    xGrids.call(xAxis)
        .selectAll("text")
        .attr("dx", "2em")
        .attr("dy", ".5em");
    xGrids.selectAll(".tick")
        .join("rect").append("rect")
        .attr("class", "bg")
        .attr("x", ".5em")
        .attr("y", "-.4em")
        .attr("width", "4em")
        .attr("height", 10);
    xGrids.selectAll("text").raise();
    xGrids.raise();
}

function dTimeline(t, neg = false) {
    return d3.area()
        .x(function (d) {
            return timeline(new Date(d.key));
        })
        .y0(timelineHeight / 2)
        .y1(function (d) {
            return neg ? timelineY(d.value) :
                timelineY(-d.value);
        })
        .curve(d3.curveStep)(t);
}

function drawTimeline() {
    var pos = d3.nest()
        .key(d => d.dateInd)
        .rollup(v => v.length)
        .entries(
            nodes
            .filter(d => d.polarity > 0)
        ),
        neg = d3.nest()
        .key(d => d.dateInd)
        .rollup(v => v.length)
        .entries(
            nodes
            .filter(d => d.polarity <= 0)
        );
    timeline.domain(selectedRange);
    timelineY.domain(
        [
            0, d3.max(pos.map(d => d.value)
                .concat(neg.map(d => d.value)))
        ]
    );
    timelineTrendG.append("path")
        .datum(pos)
        .attr("class", "trend positive")
        .attr("d", dTimeline)
        .attr("fill", colPos);
    timelineTrendG.append("path")
        .datum(neg)
        .attr("class", "trend negative")
        .attr("d", function (t) {
            return dTimeline(t, true);
        })
        .attr("fill", colNeg);
    
    timelineAxisG.call(timelineAxis)
        .selectAll("text")
        .attr("dy", "1.5em")
        .attr("dx", ".1em");
    
    brush.on("brush end", brushed);
}

function drawBg() {
    bg.attr("width", innerWidth)
        .attr("height", outerHeight)
        .on("click", deselectHandler);
}

function yLine(j) {
    var o = (radius + dotStrokeWidth),
        c = innerHeight / 2;
    return c - 2 * j * o / scaleBy;
}

function dTrend(t, neg = false) {
    return d3.area()
        .x(function (d) {
            return x(new Date(d.key));
        })
        .y0(innerHeight / 2)
        .y1(function (d) {
            return neg ? yLine(-d.value) : yLine(d.value);
        })
        .curve(d3.curveStep)(t);
}

function updateTrends() {
    var inPeriod = nodes
        .filter(n =>
            n.date >= x.domain()[0] &&
            n.date <= x.domain()[1]),
        pos = d3.nest()
        .key(d => d.dateInd)
        .rollup(v => v.length)
        .entries(
            inPeriod
            .filter(d => d.polarity > 0)
        ),
        neg = d3.nest()
        .key(d => d.dateInd)
        .rollup(v => v.length)
        .entries(
            inPeriod
            .filter(d => d.polarity <= 0)
        );
    trends.selectAll("path").remove();
    if (selected ||
        !(selectRetweet && selectQuote && selectReply)) {
        trends.append("path")
            .datum(pos)
            .attr("class", "trend positive")
            .attr("d", dTrend)
            .attr("fill", colPos);
        trends.append("path")
            .datum(neg)
            .attr("class", "trend negative")
            .attr("d", function (t) {
                return dTrend(t, true);
            })
            .attr("fill", colNeg);
    }
}

function dLink(e) {
    var i0 = x(e.from.dateInd),
        i1 = x(e.to.dateInd);
    if (scaleBy == 1) {
        var j0 = y(e.from, innerHeight),
            j1 = y(e.to, innerHeight);
    } else {
        var j0 = y(e.from, innerHeight),
            j1 = y(e.to, innerHeight);
    }

    if (i0 == i1) {
        i0 = i0 - radius;
        i1 = i1 - radius - 7;
        var i = d3.max([x(
                timeInt
                .offset(e.from.dateInd, -timeScale)
            ), i0 - 3 * radius]),
            j = (j0 + j1) / 2;
        return "M" + i0 + "," + j0 +
            "Q" + i + "," + j +
            " " + i1 + "," + j1;
    } else {
        var i = (i0 + i1) / 2;
        i0 = i0 + radius;
        i1 = i1 - radius - 5;
        return "M" + i0 + "," + j0 +
            "C" + i + "," + j0 +
            " " + i + "," + j1 +
            " " + i1 + "," + j1;
        return path;
    }
}

function updateLinks(n, e) {
    e.forEach(function (j) {
        j.to = n.filter(function (i) {
            return i.id == j.id;
        })[0];
        j.from = n.filter(function (i) {
            return i.id == j.target;
        })[0];
    });
    // filter out edges orginated from 
    // tweets not in the current data set
    e = e.filter(function (j) {
        return j.from;
    });
    links.selectAll("path")
        .data(e)
        .join(
            //enter
            enter => enter.append("path")
            .attr("class", "link")
            .attr("marker-end", "url(#arrow)")
            .style("stroke-dasharray", function (d) {
                return dashType[d.type];
            })
            .attr("d", function (d) {
                return dLink(d);
            }),
            // update
            update => update
            .attr("d", function (d) {
                return dLink(d);
            }),
            // exit
            exit => exit.remove()
        );
}

function dBar(d, h) {
    var p = d.polarity > 0 ? 1 : -1,
        i = x(d.dateInd),
        j = yScale[d.id] ? yScale[d.id] : 0,
        o = (radius + dotStrokeWidth),
        l = d.length,
        c = h / 2;
    var i0 = i - radius,
        i1 = i + radius,
        os = l > scaleBy ? o : o * l / scaleBy,
        rx = radius,
        ry = (l > scaleBy ? radius : radius * l / scaleBy),
        j0 = c - 2 * p * j * o / scaleBy - p * os,
        j1 = c - 2 * p * (j + l) * o / scaleBy + p * os;
    var path = "M" + i0 + "," + j0 +
        "L" + i0 + "," + j1 +
        "A" + rx + "," + ry +
        " 0 0 " +
        d3.max([0, p]) + " " + i1 + "," + j1 +
        "L" + i1 + "," + j0 +
        "A" + rx + "," + ry +
        " 0 0 " +
        d3.max([0, p]) + " " + i0 + "," + j0 +
        "Z";
    return path;
}

function y(d, h) {
    var j = yScale[d.id] ? yScale[d.id] : 0,
        o = (radius + dotStrokeWidth),
        c = h / 2;
    return (
        d.polarity > 0 ?
        c - 2 * (j + 0.5) * o / scaleBy :
        c + 2 * (j + 0.5) * o / scaleBy
    );
}

function updateBars(data) {
    bars.selectAll("path")
        .data(data)
        .join(
            enter => enter.append("path")
            .attr("class", "agg")
            .attr("d", function (d) {
                return dBar(d, innerHeight);
            })
            .attr("fill", fillBar)
            .attr("stroke", strokeBar)
            .on("click", selectHandler),
            update => update
            .attr("d", function (d) {
                return dBar(d, innerHeight);
            })
            .attr("fill", fillBar)
            .attr("stroke", strokeBar),
            exit => exit.remove()
        );
}

function updateDots(data) {
    dots.selectAll("ellipse")
        .data(data)
        .join(
            // enter
            enter => enter.append("ellipse")
            .attr("class", "dot")
            .attr("rx", radius -
                (isAgged ? dotStrokeWidth : 0)
            )
            .attr("ry", radius / scaleBy -
                (isAgged ? dotStrokeWidth : 0)
            )
            .attr("cy", function (d) {
                return y(d, innerHeight);
            })
            .attr("cx", function (d) {
                return x(d.dateInd);
            })
            .style("fill", fill)
            .style("stroke", stroke)
            .on("click", selectHandler),
            // update
            update => update
            .style("fill", fill)
            .style("stroke", stroke)
            .attr("rx", radius -
                (isAgged ? dotStrokeWidth : 0)
            )
            .attr("ry", radius / scaleBy -
                (isAgged ? dotStrokeWidth : 0)
            )
            .attr("cy", function (d) {
                return y(d, innerHeight);
            })
            .attr("cx", function (d) {
                return x(d.dateInd);
            }),
            // exit
            exit => exit.remove()
        );
}
