/* selection */
function getRefers(ids) {
    var que = ids.slice(),
        refs = ids.slice();
    while (que.length > 0) {
        var search = que.pop(),
            referred = twtLinks.filter(function (e) {
                return e.target == search;
            })
            .map(function (s) {
                return s.id
            });
        referred.forEach(function (r) {
            if (!refs.includes(r)) {
                refs.push(r);
                que.push(r);
            }
        });
    }
    return refs;
}

/* filter */
function filterNodes() {
    if (!selected && !selectQuery &&
        selectRetweet && selectQuote && selectReply) {
        return nodes;
    }
    if (selected) {
        selectedGrp = isAgged ?
            aggs
            .filter(a => a.id == selected)[0]
            .nodes : [selected];
        selectedUsers = new Set(selectedGrp.map(function (g) {
            return nodes.filter(n => n.id == g)[0].user_id;
        }));
    }
    var res = [],
        connected = selected ? getRefers(selectedGrp) : [];

    res = nodes.filter(function (n) {
        var s = selected ? connected.includes(n.id) : true,
            t = selectRetweet ? true : (n.type != "retweeted"),
            q = selectQuote ? true : (n.type != "quoted"),
            r = selectReply ? true : (n.type != "reply"),
            g = selectQuery ? n[grpBy] == selectQuery : true;
        return (s && t && q && r && g);
    });
    return res;
}

/* brush */
function brushed() {
    var s = d3.event.selection || timeline.range();
    selectedRange = s.map(timeline.invert, timeline);
    transitionX();
}
