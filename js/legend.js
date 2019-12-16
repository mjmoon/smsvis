linLgd.append("path")
    .attr("class", "symbol")
    .attr("transform", "translate(0,15)")
    .attr("stroke", d3.hsl(0, 0, colL))
    .attr("d", "M0,0 L5,0");
linLgd.append("path")
    .attr("class", "symbol")
    .attr(
        "transform", "translate(" +
        (7 + 1.2 * (linDots.length + 1) *
            (radius + dotStrokeWidth)) +
        ",15)"
    )
    .attr("stroke", d3.hsl(0, 0, colL))
    .attr("d", "M-2.5,0 L2.5,0 M0,-2.5 L0,2.5");
linLgd.selectAll("circle")
    .data(linDots)
    .enter().append("circle")
    .attr("transform", "translate(5,15)")
    .attr("class", "dot")
    .attr("r", radius)
    .attr("cx", function (d, i) {
        var o = radius + dotStrokeWidth;
        return 7 + o * i * 1.2;
    })
    .attr("cy", 0)
    .attr("stroke", d3.hsl(0, 0, colL))
    .attr("fill", function (d, i) {
        if (i == 0) {
            return "white";
        }
        return d3.hsl(0, 0, colL).brighter(d);
    });

function updateCatLgd() {
    catLgd.selectAll(".cat").remove();
    if (grpBy) {
        var colorCats = catScale.domain(),
            catLgdG = catLgd.append("g")
            .attr("class", "cat");
        catLgdG.selectAll("text")
            .data(colorCats)
            .enter().append("text")
            .text(function (c) {
                return c.length > 15 ?
                    c.substr(0, 15) + '...' :
                    c;
            })
            .attr("class", "label")
            .attr("transform", "translate(10,15)")
            .attr("x", 2 * radius + 4)
            .attr("y", function (d, i) {
                var o = radius + dotStrokeWidth;
                return o * i * 3;
            })
            .on("mouseover", catHoverHandler)
            .on("mouseout", mouseOutHanlder);
        catLgdG.selectAll("circle")
            .data(colorCats)
            .enter().append("circle")
            .attr("transform", "translate(10,15)")
            .attr("r", radius)
            .attr("cx", 0)
            .attr("cy", function (d, i) {
                var o = radius + dotStrokeWidth;
                return o * i * 3;
            })
            .attr("stroke", function (d) {
                return catScale(d);
            })
            .attr("fill", "white")
            .on("mouseover", catHoverHandler)
            .on("mouseout", mouseOutHanlder)
            .on("click", catClickHandler);
        catLgdBox.style("display", "block");
        catLgd.attr(
            "height", catLgdG.node().getBBox().height + 15);
    } else {
        catLgdBox.style("display", "none");
    }
}
