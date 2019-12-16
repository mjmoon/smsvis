/* control variables */
var selectorq = "#dottednetworkvis",
    nodesFile = "data/nodes_climate-change_2500.json",
    edgesFile = "data/edges_climate-change_2500.json",
//    nodesFile = "data/nodes_climate-change_200.json",
//    edgesFile = "data/edges_climate-change.json",
    allLinks = false,
    // scale
    selectedRange = null,
    timeInt = d3.timeMinute,
    timeScale = 1,
    scaleBy = 1,
    vn = 50,
    vBy = 5,
    hn = 15,
    // aggregate
    isAgged = false,
    // group and sort
    grpBy = null,
    linBy = null,
    // filters
    selected = null,
    selectedGrp = [],
    selectedUsers = new Set(),
    selectRetweet = true,
    selectQuote = true,
    selectReply = true,
    selectQuery = null,
    // tweet
    tweet = d3.select("#tweet")
    .style("display", "none"),
    // animation
    duration = 500;

/* margins and graphical parameters */
var margin = {
        top: 20,
        right: 45,
        bottom: 20,
        left: 15
    },
    timelineHeight = 40,
    radius = 5,
    dotStrokeWidth = 1,
    dashType = {
        retweeted: 4,
        quoted: 1,
        reply: 0
    };

/* containers */
var container = d3.select(selectorq)
    .append("div")
    .attr("class", "chart-container"),
    currDim = container
    .node()
    .getBoundingClientRect(),
    outerWidth = currDim.width,
    outerHeight = currDim.height,
    innerWidth = outerWidth - margin.left - margin.right,
    innerHeight = outerHeight - margin.top - margin.bottom,
    svg = container
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .classed("svg-content-responsive", true)
    .attr("width", outerWidth)
    .attr("height", outerHeight),
    containerTimeline = d3.select(selectorq)
    .append("div")
    .attr("class", "timeline-container"),
    timelineSvg = containerTimeline
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .classed("svg-content-responsive", true)
    .attr("height", timelineHeight)
    .attr("width", outerWidth),
    main = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("class", "main");

/* axes */
var x = d3.scaleTime()
    .rangeRound([0, innerWidth]),
    yScale = {},
    x0 = main.append("line")
    .attr("class", "axis x-axis")
    .attr("x1", 0)
    .attr("x2", innerWidth)
    .attr("y1", innerHeight / 2)
    .attr("y2", innerHeight / 2);

/* drawing groups */
// grids
var grids = main.append("g")
    .attr("class", "grids"),
    xGrids = grids
    .append("g")
    .attr("class", "vertical")
    .attr(
        "transform",
        "translate(0," + (-margin.top) + ")"
    ),
    xAxis = d3.axisTop(x)
    .ticks(hn)
    .tickSizeInner(-outerHeight);
/* timeline */
var timelineTrendG = timelineSvg.append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .attr("class", "trend timeline"),
    timelineAxisG = timelineSvg.append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .attr("class", "axis x-axis timeline"),
    timeline = d3.scaleTime()
    .range([0, innerWidth]),
    timelineY = d3.scaleLinear()
    .range(
        [timelineHeight / 2, timelineHeight]
    ),
    timelineAxis = d3.axisTop(timeline)
    .tickSizeInner(-timelineHeight),
    brush = d3.brushX()
    .extent([[0, 0], [innerWidth, timelineHeight]]),
    brushG = timelineSvg.append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(brush)
    .call(brush.move, x.range());
// trends
var trends = main.append("g")
    .attr("class", "trends");

var defs = svg.append("defs")

defs.append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 0 5 5")
    .attr("refX", 0)
    .attr("refY", 2.5)
    .attr("markerWidth", 5)
    .attr("markerHeight", 5)
    .attr("orient", "0")
    .append("path")
    .attr("d", "M0,0 L0,5 L5,2.5 z");

// bg for click handling
var bg = main.append("rect")
    .attr("class", "bg")
    .attr("width", innerWidth)
    .attr("height", innerHeight);

// bars 
var bars = main.append("g")
    .attr("class", "bars");
// dots
var dots = main.append("g")
    .attr("class", "dots");
// links
var links = main.append("g")
    .attr("class", "links");


/* drawings */
var nodes = [],
    aggs = [],
    twtLinks = [],
    usrLinks = [],
    selectedNodes = [],
    selectedTwtLinks = [],
    selectedUsrLinks = [];

/* controllers */
var ctrlTimeScale = d3.select("#timeScale"),
    ctrlTimeInt = d3.select("#timeInt"),
    ctrlIsAgged = d3.select("#isAgged"),
    ctrlScaleBy = d3.select("#scaleBy"),
    ctrlLinBy = d3.select("#linBy"),
    ctrlGrpBy = d3.select("#grpBy"),
    ctrlSelectRetweet = d3.select("#retweeted"),
    ctrlSelectQuote = d3.select("#quoted"),
    ctrlSelectReply = d3.select("#reply"),
    ctrlAllLinks = d3.select("#allLinks"),
    ctrlAnimate = d3.select("#animate"),
    ctrlReset = d3.select("#reset");

/* colour */
var colS = 0.8,
    colL = 0.3,
    colPos = d3.hsl(180, colS, colL), // teal
    colNeg = d3.hsl(350, colS, colL), // crimson
    // pick lightness based on network attribute
    // e.g., num_referred
    lRange = [3, 0],
    colScale = d3.scaleLinear().range(lRange).clamp(true),
    colScaleAgg = d3.scaleLinear().range(lRange).clamp(true),
    // pick hue based on category
    // e.g., user community
    hMax = 360,
    catScale = d3.scaleOrdinal();

/* legend */
var linLgd = d3.select('#linLegend')
    .append("svg")
    .attr("width", "100%")
    .attr("height", "30px"),
    linDots = d3.range((lRange[0]) * 4 + 1)
    .map(a => a / 2)
    .reverse(),
    catLgdBox = d3.select('#catLegend')
    .style("display", "none"),
    catLgd = catLgdBox
    .append("svg")
    .attr("width", 300),
    tooltip = d3.select('#tooltip')
    .style("opacity", 0);
