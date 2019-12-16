/* scale axes */
function transitionY() {
    var t = d3.transition().duration(duration);
    // bars
    bars.selectAll("path")
        .join("path")
        .transition(t)
        .attr("d", function (d) {
            return dBar(d, innerHeight);
        });
    // dots
    dots.selectAll("ellipse")
        .join("ellipse")
        .transition(t)
        .attr("cy", function (d) {
            return y(d, innerHeight);
        })
        .attr("ry", radius / scaleBy);
    // links
    links.selectAll("path")
        .join("path")
        .transition(t)
        .attr("d", function (d) {
            return dLink(d);
        });
    // grids
    grids.selectAll("line.horizontal")
        .join("line")
        .transition(t)
        .attr("y1", yLine)
        .attr("y2", yLine)
        .style("opacity", function (v) {
            return v % (scaleBy * vBy) == 0 ? 1 : 0;
        });
    grids.selectAll("rect.horizontal")
        .join("rect")
        .transition(t)
        .attr("y", function (j) {
            return yLine(j) - 5;
        })
        .style("opacity", function (v) {
            return v % (scaleBy * vBy) == 0 ? 1 : 0;
        });
    grids.selectAll("text.horizontal")
        .join("text")
        .transition(t)
        .attr("y", yLine)
        .style("opacity", function (v) {
            return v % (scaleBy * vBy) == 0 ? 1 : 0;
        });
    // trends
    removeTrends();
}

function transitionX() {
    var t = d3.transition().duration(duration);
    x.domain(selectedRange);
    // bars
    bars.selectAll("path")
        .join("path")
        .transition(t)
        .attr("d", function (d) {
            return dBar(d, innerHeight);
        });
    // dots
    dots.selectAll("ellipse")
        .join("ellipse")
        .transition(t)
        .attr("cx", function (d) {
            return x(d.dateInd);
        });
    // links
    links.selectAll("path")
        .join("path")
        .transition(t)
        .attr("d", function (d) {
            return dLink(d);
        });
    // trends
    removeTrends();
    // grids
    xGrids.transition(t).call(xAxis);
}
