/* fit and reset */
function toggleReset() {
    disableControllers()
    selectedNodes = nodes;
    selectedTwtLinks = twtLinks;
    grpBy = null;
    linBy = null;
    updateCatLgd();
    // filters
    selected = null;
    tweet.style("display", "none");
    selectedGrp = [];
    selectedUsers = new Set();
    selectRetweet = true;
    selectQuote = true;
    selectReply = true;
    allLinks = false;
    removeLinks();
    removeTrends();
    removeBars();
    rankDots(nodes);
    // animate with dots
    updateDots(selectedNodes);
    fit();
    brushG.call(brush.move, x.range());
    setTimeout(function () {
        setAllLinks();
        setTimeScaleCtrl();
        setIsAggedCtrl();
        setScaleByCtrl();
        setTypeCtrl();
        ctrlGrpBy.property("value", 0);
        ctrlLinBy.property("value", 0);
        enableControllers();
    }, 2 * duration);
}

/* change time scale */
function setTimeScaleCtrl() {
    switch (timeScale) {
        case 1:
            ctrlTimeScale.property("value", 1);
            break;
        case 6:
        case 15:
            ctrlTimeScale.property("value", 0.25);
            break;
        case 12:
        case 30:
            ctrlTimeScale.property("value", 0.5);
            break;
        default:
            ctrlTimeScale.property("value", 1);
            timeScale = 1;
    }
    switch (timeInt) {
        case d3.timeSecond:
            ctrlTimeInt.property("value", 1);
            break;
        case d3.timeMinute:
            if (timeScale > 1) {
                ctrlTimeInt.property("value", 2);
            } else {
                ctrlTimeInt.property("value", 1);
            }
            break;
        case d3.timeHour:
            if (timeScale > 1) {
                ctrlTimeInt.property("value", 3);
            } else {
                ctrlTimeInt.property("value", 2);
            }
            break;
        default:
            ctrlTimeInt.property("value", 1);
            timeInt = d3.tiemMinute;
    }
}

function toggleScaleX() {
    stopAllTransition();
    disableControllers()
    var s = parseFloat(ctrlTimeScale.property("value")),
        i = parseFloat(ctrlTimeInt.property("value"));
    switch (i) {
        case 3:
            timeScale = (s == 1) ? 1 : (s == 0.5 ? 12 : 6);
            timeInt = s == 1 ? d3.timeDay : d3.timeHour;
            break;
        case 2:
            timeScale = (s == 1) ? 1 : (s == 0.5 ? 30 : 15);
            timeInt = s == 1 ? d3.timeHour : d3.timeMinute;
            break;
        case 1:
            timeScale = (s == 1) ? 1 : (s == 0.5 ? 30 : 15);
            timeInt = s == 1 ? d3.timeMinute : d3.timeSecond;
            break;
    }
    if (isAgged) {
        removeBars();
        updateDots(selectedNodes);
    }
    selectedNodes.forEach(function (d) {
        d.dateInd = timeInt.every(timeScale).floor(d.date);
    });
    nodes.forEach(function (d) {
        d.dateInd = timeInt.every(timeScale).floor(d.date);
    });
    selectedRange = d3.extent(
        selectedNodes,
        function (d) {
            return d.dateInd;
        });
    transitionX();
    setTimeout(function () {
        rankDots(selectedNodes, grpBy, linBy);
        transitionY();
        setTimeout(function () {
            if (isAgged) {
                aggs = aggregate(selectedNodes);
                removeDots();
                updateBars(aggs);
            }
            updateTrends();
            enableControllers();
        }, duration);
    }, duration);
}

ctrlTimeScale.on("change", toggleScaleX);
ctrlTimeInt.on("change", toggleScaleX);

/* change count scale */
function setScaleByCtrl() {
    ctrlScaleBy.property("value", scaleBy);
}

function toggleScaleY() {
    stopAllTransition();
    disableControllers();
    scaleBy = parseInt(ctrlScaleBy.property("value"), 10);
    transitionY();
    setTimeout(function () {
        if (isAgged) {
            if (!selected) {
                removeBars();
                aggs = aggregate(selectedNodes);
            }
            updateBars(aggs);
        }
        updateTrends();
        enableControllers();
    }, duration);
}

ctrlScaleBy.on("input", toggleScaleY);

/* change colour */
function toggleColour() {
    stopAllTransition();
    disableControllers();
    mapLinCols(nodes);
    mapLinAggCols(aggs);
    mapCatCols(nodes);
    if (isAgged) {
        removeBars();
        updateDots(selectedNodes);
    }
    updateDots(selectedNodes);
    if (selected) {
        rankVertices(selectedNodes, grpBy, linBy);
    } else {
        rankDots(selectedNodes, byC = grpBy, byN = linBy);
    }
    transitionY();
    updateTrends();
    if (isAgged) {
        setTimeout(function () {
            aggs = aggregate(selectedNodes);
            selected ? null : removeDots();
            updateBars(aggs);
            setTimeout(enableControllers, duration);
        }, duration);
    } else {
        setTimeout(enableControllers, duration);
    }
}

function toggleLinScale() {
    var i = parseInt(ctrlLinBy.property("value"), 10);
    switch (i) {
        case 1:
            linBy = "num_referred";
            break;
        case 2:
            linBy = "polarity";
            break;
        default:
            linBy = null;
    }
    toggleColour();
}

function toggleCatScale() {
    var i = parseInt(ctrlGrpBy.property("value"), 10);
    switch (i) {
        case 1:
            grpBy = "topics";
            break;
        case 2:
            grpBy = "type";
            break;
        default:
            grpBy = null;
    }
    toggleColour();
    updateCatLgd();
}

ctrlLinBy.on("change", toggleLinScale);
ctrlGrpBy.on("change", toggleCatScale);

/* enable/disable animated transition */
function toggleAnimate() {
    duration = duration > 0 ? 0 : 500;
}

ctrlAnimate.on("change", toggleAnimate);

/* show/hide all links */
function setAllLinks() {
    ctrlAllLinks.property("checked", allLinks);
}

function toggleAllLinks() {
    allLinks = ctrlAllLinks.property("checked");
    stopAllTransition();
    disableControllers()
    if (allLinks) {
        updateLinks(selectedNodes, selectedTwtLinks);
        setTimeout(enableControllers, duration);
    } else {
        links.selectAll("path").remove();
        enableControllers();
    }
}

ctrlAllLinks.on("change", toggleAllLinks);

/* select */
function toggleFilter() {
    stopAllTransition();
    disableControllers();
    selectedNodes = filterNodes();
    selectedTwtLinks = twtLinks.filter(function (e) {
        return selectedNodes.map(function (n) {
                return n.id;
            })
            .includes(e.id);
    });
    removeBars();
    updateDots(selectedNodes);
    if (selected) {
        allLinks = false;
        setAllLinks();
        if (isAgged) {
            aggs = aggs.filter(function (a) {
                return a.id == selected;
            });
            updateBars(aggs);
        }
        updateLinks(selectedNodes, selectedTwtLinks);
        rankVertices(selectedNodes);
        transitionY();
    } else {
        rankDots(selectedNodes, byC = grpBy, byN = linBy);
        transitionY();
        if (isAgged) {
            aggs = aggregate(selectedNodes);
            setTimeout(function () {
                removeDots();
                updateBars(aggs);
            }, duration);
        }
    }
    setTimeout(function () {
        updateTrends();
        enableControllers();
    }, duration);
}

function selectHandler(n) {
    isAgged = n.user_id ? false : true;
    selected = n.id;
    setIsAggedCtrl();
    toggleFilter();
    if (!isAgged) {
        console.log(n);
        switch (n.type) {
            case "retweeted":
                var twt_context = "Retweeted";
                break;
            case "quoted":
                var twt_context = "Quoted";
                break;
            case "reply":
                var twt_context = "Reply to";
                break;
            default:
                var twt_context = "Tweeted";
        }
        tweet.style("display", "block");
        tweet.select(".user").html("@" + n.user_screen_name);
        tweet.select(".context").html(
            twt_context + " on " + formatTime(n.date)
        );
        tweet.select(".text")
            .html(n.text);
        tweet.select(".link")
            .attr("href", n.tweet_url);
        tweet.raise();
    }
}

function deselectHandler() {
    if (selected) {
        selected = null;
        selectedGrp = [];
        selectedUsers = new Set();
        toggleFilter();
        removeLinks();
        tweet.style("display", "none");
    }
}

function setTypeCtrl() {
    ctrlSelectRetweet.property("checked", selectRetweet);
    ctrlSelectQuote.property("checked", selectQuote);
    ctrlSelectReply.property("checked", selectReply);
}

function toggleType() {
    selectRetweet = ctrlSelectRetweet.property("checked");
    selectQuote = ctrlSelectQuote.property("checked");
    selectReply = ctrlSelectReply.property("checked");
    toggleFilter();
}

ctrlSelectRetweet.on("change", toggleType);
ctrlSelectQuote.on("change", toggleType);
ctrlSelectReply.on("change", toggleType);

/* toggle between aggregate bars and single dots */
function setIsAggedCtrl() {
    ctrlIsAgged.property("checked", isAgged);
}

function toggleIsAgged() {
    stopAllTransition();
    disableControllers();
    isAgged = ctrlIsAgged.property("checked");
    if (isAgged) {
        aggs = aggregate(selectedNodes);
        removeDots();
        updateBars(aggs);
    } else {
        removeBars();
        updateDots(selectedNodes);
    }
    setTimeout(enableControllers, duration);
}

ctrlIsAgged.on("change", toggleIsAgged);

/* legend */
function catHoverHandler(d) {
    tooltip.html(d)
        .style("opacity", 1)
        .style("top", (d3.event.pageY - 15) + "px")
        .style("left", (d3.event.pageX + 15) + "px")
        .style("border-color", catScale(d));
}

function mouseOutHanlder() {
    tooltip.html(null)
        .style("opacity", 0);
}

function catClickHandler(d) {
    if (selectQuery == d) {
        selectQuery = null;
        catLgd.selectAll("circle")
            .join("circle")
            .style("opacity", 1);
        catLgd.selectAll("text")
            .join("text")
            .style("opacity", 1);
    } else {
        selectQuery = d;
        catLgd.selectAll("circle")
            .join("circle")
            .style("opacity", function (c) {
                return c == d ? 1 : 0.3;
            });
        catLgd.selectAll("text")
            .join("text")
            .style("opacity", function (c) {
                return c == d ? 1 : 0.3;
            });

    }
    toggleFilter();
}

// TODO: 
// arrange layout
