/* aggregate */
function aggregate(data) {
    var agged = [],
        byN = linBy ? linBy : "polarity",
        nested = d3.nest()
        .key(byDateInd)
        .key(byPolarity)
        .key(byAggregate)
        .entries(data);
    nested.forEach(function (d) {
        d.values.forEach(function (p) {
            p.values.forEach(function (a) {
                var arr = a.values;
                arr = arr.sort(function (a, b) {
                    return l = byN ?
                        Math.abs(a[byN]) - Math.abs(b[byN]) :
                        a.date - b.date;
                });
                var pAvg = d3.mean(
                        arr.map(v => v.polarity)
                    ),
                    minInd = d3.scan(
                        a.values,
                        function (a, b) {
                            return yScale[a.id] - yScale[b.id];
                        }
                    );
                var nodes = arr
                    .map(d => d.id),
                    item = {
                        "dateInd": new Date(d.key),
                        "num_referred": aggCentrality(a.values),
                        "polarity": pAvg,
                        "length": arr.length,
                        "id": arr[minInd].id,
                        "nodes": nodes
                    };
                if (grpBy) {
                    item[grpBy] = a.key;
                }
                agged.push(item);
            })
        });
    });
    return agged;
}

/* sort */
function byPolarity(d) {
    return d.polarity > 0 ? 1 : -1;
}

function byDateInd(d) {
    return d.dateInd;
}

function byAggregate(d) {
    if (!grpBy) {
        return Math.floor(yScale[d.id] / scaleBy);
    }
    return d[grpBy];
}

function rankDots(data, byC = null, byN = null) {
    var out = {};
    var polarised = d3.nest()
        .key(byDateInd)
        .key(byPolarity)
        .entries(data);
    polarised.forEach(function (d) {
        d.values.forEach(function (v) {
            var arr = v.values;
            arr = arr.sort(function (a, b) {
                var c = byC ? a[byC].localeCompare(b[byC]) : 0,
                    l = byN ?
                    Math.abs(a[byN]) - Math.abs(b[byN]) :
                    a.date - b.date;
                return c || l;
            });
            arr.forEach(function (p, i) {
                out[p.id] = i;
            });
        });
    });
    yScale = out;
}

function rankVertices(data) {
    var out = {},
        l = selectedUsers.size,
        polarised = d3.nest()
        .key(byDateInd)
        .key(byPolarity)
        .entries(data);
    polarised.forEach(function (d) {
        d.values.forEach(function (v) {
            v.values.sort(function (a, b) {
                return a.id == selected ?
                    -1 : b.id == selected ?
                    1 : a.user_id - b.user_id;
            });
            // TODO: layout
            v.values.forEach(function (p, i) {
                if (selectedUsers.has(p.user_id)) {
                    out[p.id] = i;
                } else {
                    out[p.id] = i + l;
                }
            });
        });
    });
    yScale = out;
}
