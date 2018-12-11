//
// Document Ready, Let's Play
//
$(function() {

  App.init()

})

var App = {

  triangles: [], // array of triangles

  group: null,
  tool: null,
  cc: 'blue',
  cc_s: 0,

  collection: null,

  init: function(){

    var self = this;
    var canvas = $('<canvas/>', {
      id: 'add-new-button',
      Width: 325,
      Height: 300
    })
    $('#triangle-container').append(canvas);

    $('#'+canvas.attr('id')).on('mouseover', function(){
      self.activateTool();
    })

    // initialize paper.js
    paper.setup( canvas[0] )

    this.initContent()

    var tool = new paper.Tool()
    this.tool = tool;

    tool.onMouseDown = function(event){

      var ht = self.text_close.hitTest(event.point, {center: true, tolerance: 8})
      if ( !ht ){
        self.triangles.push( new Triangle() )
        self.activateTool()
      }      
      self.reset()

    }

    tool.onMouseMove = function(event){
      // if (event.count % 3 != 0) return;
      var content = ["\u25B3", "\u2661", "+", "$"]
      // if (event.count % 10 == 0){
      //   self.cc_s++;
      //   if (self.cc_s >= content.length) self.cc_s = 0
      // }
      self.cc.hue += 2;
      var mouse = event.point
      mouse.y += 20
      var c = new paper.PointText({
        point: mouse,
        justification: 'center',
        fontSize: 80,
        fillColor: 'white',
        strokeWidth: .5,
        strokeColor: self.cc,
        // content: content[self.cc_s]
        content: content[0]
      })

      self.group.bringToFront()
      self.text_close.bringToFront()
    }
   
    paper.view.draw()

    // load the collection from localStorage
    this.collection = new LDB.Collection('tri')

    // initialize any triangles we may have from localStorage
    this.initTriangles()

  },

  helpers: {
    uuid: function(){
      var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      return id.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      })
    }
  },

  activateTool: function(){
    this.tool.activate()
    paper.project = paper.projects[0]
    paper.project.activate()
  },

  initContent: function(){
    var self = this
    var c = '#28a7dc'
    var b = '#b2b2b2'

    var text_plus = new paper.PointText({
      point: new paper.Point(0, 0),
      justification: 'center',
      fontSize: 80,
      fillColor: c,
      content: "+"
    });
    var text_add_new = new paper.PointText({
      point: new paper.Point(0, 50),
      justification: 'center',
      fontSize: 20,
      fillColor: c,
      content: 'New Triangle'
    })

    this.text_close = new paper.PointText({
      point: new paper.Point( paper.view.bounds.width-10, 15),
      justification: 'center',
      fontSize: 18,
      fontWeight: 900,
      shadowColor: '#fff',
      shadowBlur: 4,
      shadowOffset: new paper.Point(0,0),
      fillColor: '#b2b2b2',
      content: "\u00D7"
    })

    this.cc = text_plus.fillColor

    this.group = new paper.Group([text_plus, text_add_new])
    this.group.position = paper.view.center;

    // paper.view.draw()
  },

  initTriangles: function(){
    var self = this;
    this.collection.find({}, function(results){
      for(var i in results){
        self.triangles.push( new Triangle({data: results[i].data}) )
      }
      self.activateTool()
    })
  },

  removeTriangle: function(id){
    this.triangles.remove(function(o){ 
      return o.data.id == id
    })
  },

  reset: function(){
    paper.projects[0].activeLayer.removeChildren()
    this.initContent()
  }
}

var Triangle = function(o){

  this.width = 245;
  this.height = 200;

  this.center = 0;
  this.tool = null;
  this.label = null;

  this.data = {
    id: null,
    label: '',
    love: null,
    cash: null,
    growth: null
  }

  this.toString = function(){
    return this.data
  }

  this.hitOptions = {
    segments: true,
    tolerance: 12
  }

  this.init = function(options){
    options = options || {}
    var self = this

    var id = App.helpers.uuid()
    var cclabel = 'Label'

    if (options && options.data && options.data.id){
      id = options.data.id
      cclabel = options.data.label
    }
    
    var canvas = $('<canvas/>', {
      id: 'tri-'+ id,
      Width: self.width + 80,
      Height: self.height + 100
    })

    var cc = $('<div/>', { id: 'cc-'+ id, 'class': 'tri-container' })
    var _label = $('<input/>', { val: cclabel, type: 'text'})
    cc.append(canvas)
    cc.append(_label)

    this.data = options.data || this.data;
    this.data.id = id;
    this.data.label = cclabel;

    $('#triangle-container').append(cc);

    $('#'+canvas.attr('id')).on('mouseover', function(){
      self.activateTool()
    })

    _label.on('input', function(){
      self.saveLabel( $(this).val() )
    })

    // initialize paper.js
    paper.setup( canvas[0] )

    this.tool = new paper.Tool();

    this.renderTriangle()

    paper.view.draw()

  }

  this.activateTool = function(){
    this.tool.activate()
  }

  this.getCenter = function(t){
    var x = (t[0].x + t[1].x + t[2].x) / 3;
    var y = (t[0].y + t[1].y + t[2].y) / 3;
    return new paper.Point(x,y)
  }

  this.getSlope = function(line){
    var dx = line[0].point.x - line[1].point.x
    var dy = line[0].point.y - line[1].point.y
    return dy / dx
  }

  this.saveData = function(triangle, skip){
    if (!skip){
      var segments = triangle.segments
      this.data.love = [segments[0].point.x, segments[0].point.y]
      this.data.cash = [segments[1].point.x, segments[1].point.y]
      this.data.growth = [segments[2].point.x, segments[2].point.y]
    }
    var id = this.data.id;
    var data = this.data
    App.collection.find({id: id}, function(doc){
      if (!doc.length) {
        App.collection.save({id: id, data: data})
      } else {
        doc[0].data = data
        doc[0].save()
      }
    })
  }

  this.saveLabel = function(label){
    this.data.label = label;
    this.saveData(null, true)
  }

  this.remove = function(){
    var id = this.data.id
    // remove from localStorage collection
    App.collection.find({id: id}, function(items){
      for (var i in items){
        items[i].delete()
      }
    })

    // animate canvas out and then remove from DOM
    $('#cc-'+ id).addClass('remove')
    setTimeout(function(){
      $('#cc-'+ id).remove()
    }, 500)

    // remove from parent triangle list
    App.removeTriangle(id)
  }


  this.renderTriangle = function(){
    var self = this

    // Base triangle
    var baseTri = [
      new paper.Point(self.width/2, 0),
      new paper.Point(self.width, self.height),
      new paper.Point(0, self.height)
    ]
    var base = new paper.Path({
      segments: baseTri,
      strokeColor: '#333',
      strokeWidth: 2.5,
      fillColor: '#fcfcfc', 
      closed: true
    });

    var center = this.getCenter(baseTri)

    this.center = center;

    // Top line
    var top = new paper.Path({
      segments: [new paper.Point(self.width/2, 0), center],
      strokeColor: '#555',
      strokeWidth: .4
    })

    // Left line
    var left = new paper.Path({
      segments: [new paper.Point(0, self.height), center],
      strokeColor: '#555',
      strokeWidth: .4
    })
    var lslope = self.getSlope(left.segments)

    // Right line
    var right = new paper.Path({
      segments: [center, new paper.Point(self.width, self.height)],
      strokeColor: '#555',
      strokeWidth: .4
    })
    var rslope = self.getSlope(right.segments)

    // Text Nodes
    var text_love = new paper.PointText({
      point: new paper.Point(self.width/2, -10),
      justification: 'center',
      fontSize: 18,
      fillColor: '#c1272d',
      content: "\u2665"
    });
    text_love.scale(1, .85);

    var text_cash = new paper.PointText({
      point: new paper.Point(self.width+15, self.height+15),
      justification: 'center',
      fontSize: 18,
      fontWeight: 900,
      fillColor: '#8cc63f',
      content: "$"
    });

    var text_growth = new paper.PointText({
      point: new paper.Point(-15, self.height+15),
      justification: 'center',
      fontSize: 25,
      fontWeight: 900,
      fillColor: '#b2b2b2',
      content: "+"
    });

    var text_close = new paper.PointText({
      point: new paper.Point( paper.view.bounds.width-10, 15),
      justification: 'center',
      fontSize: 18,
      fontWeight: 900,
      fillColor: '#ccc',
      content: "\u00D7"
    })


    var handle = null;
    // Adjustable Triangle
    var triangle = new paper.Path({
      segments: [
        new paper.Point(self.width/2, self.height/4),
        right.getPointAt(70),
        left.getPointAt(72)
      ],
      // strokeColor: '#025990',
      // fillColor: '#29a9df',

      strokeColor: '#888',
      fillColor: {
        gradient: {
          stops: ['#f4bccc', '#e1e8fa', '#cdf4b8'],
        },
        origin: [self.width/2,0],
        destination: [self.width, self.height]
      },

      blendMode: 'multiply',
      strokeWidth: 1.4,
      closed: true,
      fullySelected: true,
      selectedColor: '#888'
    })

    // Group our project together and center it inside the canvas
    var group = new paper.Group([base, top, left, right, triangle, text_love, text_cash, text_growth])
    group.position = paper.view.center

    // update position of newly created triangle from data
    if (this.data.love){
      var segments = [
        new paper.Point(this.data.love[0], this.data.love[1]),
        new paper.Point(this.data.cash[0], this.data.cash[1]),
        new paper.Point(this.data.growth[0], this.data.growth[1])
      ]
      triangle.segments = segments
    }
    // save copy of triangle and save the data to localStorage
    this._triangle = triangle
    this.saveData(triangle)


    var PI2 = Math.PI/1.9


    text_close.onMouseDown = function(ev){
      if (window.confirm("Delete this Triangle?")) { 
        self.remove()
      }
    }

    this.tool.onMouseUp = function(event){
      self.saveData(triangle)
    }

    this.tool.onMouseDown = function(event){

      handle = null;
      // Do a hit test on path for handles:
      var hitResult = triangle.hitTest(event.point, self.hitOptions);
      if (hitResult && hitResult.type == 'segment'){
        handle = hitResult.segment;
        return
      }

      // Snap to top
      var op = {stroke: true, tolerance: 8}
      var hitTop = top.hitTest(event.point, op)
      if (hitTop){
        handle = triangle.segments[0]
        handle.point.y = (event.point.y > top.segments[1].point.y) 
          ? top.segments[1].point.y 
          : event.point.y;
        return;
      }

      // Snap to right
      var hitRight = right.hitTest(event.point, op)
      if (hitRight){
        handle = triangle.segments[1]
        var percent = (event.point.x - right.segments[0].point.x) / (rslope * PI2)
          handle.point = right.getPointAt(percent)
        return;
      }

      // Snap to left
      var hitLeft = left.hitTest(event.point, op)
      if (hitLeft){
        handle = triangle.segments[2]
        var percent = (event.point.x - left.segments[1].point.x) / (lslope * PI2)
        handle.point = left.getPointAt(left.length-percent)
        return;
      }

    }

    this.tool.onMouseDrag = function(event) {
      // If we hit a handle before, move it:
      if (!handle) return;

      // top handle
      if (handle.index == 0){
        var s = top.segments
        handle.point.y = event.point.y;
        if (handle.point.y > s[1].point.y) handle.point.y = s[1].point.y
        else if (handle.point.y < s[0].point.y) handle.point.y = s[0].point.y
        return
      }

      // right handle
      if (handle.index == 1){
        var s = right.segments
        if (event.point.x > s[1].point.x) {
          handle.point = s[1].point;
        }
        else if (event.point.x < s[0].point.x) {
          handle.point = s[0].point;
        }
        else if (event.point.x > s[0].point.x && event.point.x < s[1].point.x){
          var percent = (event.point.x - s[0].point.x) / (rslope * PI2)
          handle.point = right.getPointAt(percent)
        }
        return
      }

      // left handle
      if (handle.index == 2){
        var s = left.segments
        if (event.point.x > s[1].point.x) {
          handle.point = s[1].point;
        }
        else if (event.point.x < s[0].point.x) {
          handle.point = s[0].point;
        }
        else if (event.point.x > s[0].point.x && event.point.x < s[1].point.x){
          var percent = (event.point.x - s[1].point.x) / (lslope * PI2)
          handle.point = left.getPointAt(left.length-percent)
        }
        return
      }
      
    }
  }

  this.init(o)
}
