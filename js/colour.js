function mapLinCols(d) {
    if (linBy) {
        var r = d3.extent(
            d.map(k => Math.abs(k[linBy]))
        );
        colScale.domain(r);
    }
}

function mapLinAggCols(d) {
    if (linBy) {
        var r = d3.extent(
            d.map(k => Math.abs(k[linBy]))
        );
        colScaleAgg.domain(r);
    }
}

function mapCatCols(d) {
    if (grpBy) {
        var cats = d3.nest()
            .key(k => k[grpBy])
            .entries(d)
            .map(v => v.key),
            o = hMax / cats.length;
        var r = cats.map(function (d, i) {
            return d3.hsl(o * i, colS, colL);
        })
        catScale.range(r).domain(cats);
    }
}

function fill(d) {
    var p = colPos,
        n = colNeg;

    if (grpBy) {
        n = p = catScale(d[grpBy]);
    }

    if (!linBy) {
        return d.polarity > 0 ? p : n;
    }
    var k = Math.abs(colScale(d[linBy]));
    if (d[linBy] == 0) {
        return isAgged && selectedGrp.includes(d.id) ?
            "none" : "white";
    }
    return d.polarity > 0 ?
        // increase l by a factor of (1/0.7)^k
        p.brighter(k) : n.brighter(k);
}

function fillBar(d) {
    var p = colPos,
        n = colNeg;
    if (selected) {
        return "none";
    }
    if (grpBy) {
        n = p = catScale(d[grpBy]);
    }

    if (!linBy) {
        return d.polarity > 0 ? p : n;
    }
    var k = Math.abs(colScaleAgg(d[linBy]));
    if (d[linBy] == 0) {
        return "white";
    }
    return d.polarity > 0 ?
        // increase l by a factor of (1/0.7)^k
        p.brighter(k) : n.brighter(k);
}

function stroke(d) {
    if (grpBy) {
        return catScale(d[grpBy]);
    }
    return (d.polarity > 0 ? colPos : colNeg);
}

function strokeBar(d) {
    if (grpBy) {
        return catScale(d[grpBy]);
    }
    return (d.polarity > 0 ? colPos : colNeg);
}
