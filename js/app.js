(function(){
  //UI configuration
  var itemSize = 20,
    cellSize = itemSize-1,
    width = 800,
    height = 500,
    margin = {top:20,right:20,bottom:20,left:25};

  //formats
  var hourFormat = d3.time.format('%H'),
    dayFormat = d3.time.format('%j'),
    timeFormat = d3.time.format('%Y-%m-%dT%X'),
    monthDayFormat = d3.time.format('%m.%d');

  //data vars for rendering
  var dateExtent = null,
    data = null,
    dayOffset = 0,
    colorCalibration = ['#f6faaa','#FEE08B','#FDAE61','#F46D43','#D53E4F','#9E0142'],
    dailyValueExtent = {};

  //axises and scales
  var axisWidth = 0 ,
    axisHeight = itemSize*24,
    xAxisScale = d3.time.scale(),
    xAxis = d3.svg.axis()
      .orient('top')
      .ticks(d3.time.days,4)
      .tickFormat(monthDayFormat),
    yAxisScale = d3.scale.linear()
      .range([0,axisHeight])
      .domain([0,24]),
    yAxis = d3.svg.axis()
      .orient('left')
      .ticks(8)
      .tickFormat(d3.format('02d'))
      .scale(yAxisScale);

  initCalibration();

  var svg = d3.select('[role="heatmap"]');
  var heatmap = svg
    .attr('width',width)
    .attr('height',height)
  .append('g')
    .attr('width',width-margin.left-margin.right)
    .attr('height',height-margin.top-margin.bottom)
    .attr('transform','translate('+margin.left+','+margin.top+')');
  var rect = null;

  d3.json('../file/mobile.json',function(err,data){
    data = data.data;
    data.forEach(function(valueObj){
      valueObj['date'] = timeFormat.parse(valueObj['timestamp']);
      var day = valueObj['day'] = monthDayFormat(valueObj['date']);

      var dayData = dailyValueExtent[day] = (dailyValueExtent[day] || [1000,-1]);
      var pmValue = valueObj['value']['Activity'];
      dayData[0] = d3.min([dayData[0],pmValue]);
      dayData[1] = d3.max([dayData[1],pmValue]);
    });

    dateExtent = d3.extent(data,function(d){
      return d.date;
    });

    axisWidth = itemSize*(dayFormat(dateExtent[1])-dayFormat(dateExtent[0])+1);

    //render axises
    xAxis.scale(xAxisScale.range([0,axisWidth]).domain([dateExtent[0],dateExtent[1]]));
    svg.append('g')
      .attr('transform','translate('+margin.left+','+margin.top+')')
      .attr('class','x axis')
      .call(xAxis)
    .append('text')
      .text('date')
      .attr('transform','translate('+axisWidth+',-10)');

    svg.append('g')
      .attr('transform','translate('+margin.left+','+margin.top+')')
      .attr('class','y axis')
      .call(yAxis)
    .append('text')
      .text('time')
      .attr('transform','translate(-10,'+axisHeight+') rotate(-90)');

    //render heatmap rects
    dayOffset = dayFormat(dateExtent[0]);
    rect = heatmap.selectAll('rect')
      .data(data)
    .enter().append('rect')
      .attr('width',cellSize)
      .attr('height',cellSize)
      .attr('x',function(d){
        return itemSize*(dayFormat(d.date)-dayOffset);
      })
      .attr('y',function(d){
        return hourFormat(d.date)*itemSize;
      })
      .attr('fill','#ffffff')
      .on("mouseover", function() {
            d3.select(this)
                .attr("fill", "blue");
        })
    .on("mouseout", function(d, i) {
           d3.select(this).attr("fill", function(){
             //choose color dynamicly
             var colorIndex = d3.scale.quantize()
               .range([0,1,2,3,4,5])
               .domain([0,500]);
             return colorCalibration[colorIndex(d.value['Activity'])];
           });
       });

    rect.filter(function(d){ return d.value['Activity']>0;})
      .append('title')
      .text(function(d){
          var colorIndex = d3.scale.quantize()
            .range(["Stationary","Moving","Walking","Running","Partially Driving","Driving"])
            .domain([0,500]);
        return 'Date: '+ monthDayFormat(d.date) + '\n'+'Hour: '+ hourFormat(d.date)+'\n'+'State: '+colorIndex(d.value['Activity']);
    });

    renderColor();
  });

  function initCalibration(){
    d3.select('[role="calibration"] [role="example"]').select('svg')
      .selectAll('rect').data(colorCalibration).enter()
    .append('rect')
      .attr('width',cellSize)
      .attr('height',cellSize)
      .attr('x',function(d,i){
        return i*itemSize;
      })
      .attr('fill',function(d){
        return d;
      });

    //bind click event
    d3.selectAll('[role="calibration"] [name="displayType"]').on('click',function(){
      renderColor();
    });
  }

  function renderColor(){
    var renderByCount = document.getElementsByName('displayType')[0].checked;

    rect
      .filter(function(d){
        return (d.value['Activity']>=0);
      })
      .transition()
      .delay(function(d){
        return (dayFormat(d.date)-dayOffset)*15;
      })
      .duration(500)
      .attrTween('fill',function(d,i,a){
        //choose color dynamicly
        var colorIndex = d3.scale.quantize()
          .range([0,1,2,3,4,5])
          .domain([0,500]);

        return d3.interpolate(a,colorCalibration[colorIndex(d.value['Activity'])]);
      })
      ;
  }

  //extend frame height in `http://bl.ocks.org/`
  d3.select(self.frameElement).style("height", "600px");
})();
