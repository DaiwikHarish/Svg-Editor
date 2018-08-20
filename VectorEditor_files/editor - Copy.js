var mobilesafari = /AppleWebKit.*Mobile/.test(navigator.userAgent);


function VectorEditor(elem, width, height){
  if (typeof(Raphael) != "function") { //check for the renderer
      return alert("Error! Renderer is Missing!"); //if renderer isn't there, return false;
  }
  




  this.container = elem;
  this.draw = Raphael(elem, width, height);
  


  this.draw.editor = this;
  
  this.onHitXY = [0,0];
  this.offsetXY = [0,0];
  this.tmpXY = [0,0];

  //cant think of any better way to do it
  this.prop = {
    "src": "",
    "stroke-width": 3,
    "stroke": "#F5DEB3",
    "fill": "#FF6347",
    "stroke-opacity": 1,
    "fill-opacity": 0.7,
    "text": "Paper Maker"

};

  this.mode = "select";
  this.selectbox = null;
  this.selected = []
  
  this.action = "";
  
  this.selectadd = false;
  
  this.shapes = [];
  this.trackers = [];
  
  this.listeners = {};
  
  
  var draw = this.draw;
  
  
  //THE FOLLOWING LINES ARE MOSTLY POINTLESS!
  
  function offset(){
    //technically, vX.pos works too and I should probably use whatever I built here, but I have jQuery instead.
 
      var pos = jQuery(elem).offset();
      return [pos.left, pos.top];
    }
 
  
  function bind(fn, scope){
    return function(){return fn.apply(scope, array(arguments))}
  }

  function array(a){
    for(var b=a.length,c=[];b--;)c.push(a[b]);
    return c;
  }
  if(window.Ext){
      Ext.get(elem).on("mousedown", function (event) {
     
      event.preventDefault()
      
      if(event.button == 2){
        //this.lastmode = this.mode;
        this.setMode("select") //tempselect
      }
      if(event.button == 1){
        return;
      }
      this.onMouseDown(event.getPageX() - offset()[0], event.getPageY() - offset()[1], event.getTarget())
      return false;
    }, this);
    Ext.get(elem).on("mousemove",function(event){
      event.preventDefault()
      this.onMouseMove(event.getPageX()  - offset()[0], event.getPageY()- offset()[1], event.getTarget())
      return false;
    }, this)
    Ext.get(elem).on("mouseup",function(event){
      event.preventDefault()
      this.onMouseUp(event.getPageX() - offset()[0], event.getPageY() - offset()[1], event.getTarget())
      return false;
    }, this)
    Ext.get(elem).on("dblclick",function(event){
      event.preventDefault()
      this.onDblClick(event.getPageX() - offset()[0], event.getPageY()- offset()[1], event.getTarget())
      return false;
    }, this)
  }else if(window.jQuery){
    $(elem).mousedown(bind(function(event){
      event.preventDefault()
      
      if(event.button == 2){
        //this.lastmode = this.mode;
        this.setMode("select") //tempselect
      }
      this.onMouseDown(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).mousemove(bind(function(event){
      event.preventDefault()
      this.onMouseMove(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).mouseup(bind(function(event){
      event.preventDefault()
      this.onMouseUp(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    $(elem).dblclick(bind(function(event){
      event.preventDefault()
      this.onDblClick(event.clientX - offset()[0], event.clientY - offset()[1], event.target)
    }, this));
    if(mobilesafari){
    elem.addEventListener("touchstart", bind(function(event){
      event.preventDefault()
      this.onMouseDown(event.touches[0].pageX - offset()[0], event.touches[0].pageY - offset()[1], event.target)
    }, this) ,false)
    
    elem.addEventListener("touchmove", bind(function(event){
      event.preventDefault()
      this.onMouseMove(event.touches[0].pageX - offset()[0], event.touches[0].pageY - offset()[1], event.target)
    }, this), false);
    elem.addEventListener("touchend", bind(function(event){
      event.preventDefault()
      this.onMouseUp(0, 0, event.target)
    }, this), false);
	elem.addEventListener("selectstart", function(event){
      event.preventDefault()
	  return false
    }, false);
   }
  }
}

VectorEditor.prototype.setMode = function (mode) {
   
  this.fire("setmode",mode)
  if(mode == "select+"){
    this.mode = "select";
    this.selectadd = true;
    this.unselect()
    var svg = this.draw.canvas.parentNode.innerHTML;
    $("#svgvalues:text").val(svg);
  }else if(mode == "select"){
    this.mode = mode;
    this.unselect()
    var svg = this.draw.canvas.parentNode.innerHTML;
    $("#svgvalues:text").val(svg);
    this.selectadd = false;
  }else if(mode == "delete"){
    this.deleteSelection();
    this.mode = mode;

    var svg = this.draw.canvas.parentNode.innerHTML;
    $("#svgvalues:text").val(svg);


  }else{
    this.unselect()
    this.mode = mode; 
  }
}

VectorEditor.prototype.on = function(event, callback){
  if(!this.listeners[event]){
    this.listeners[event] = []
  }
  
  if(this.in_array(callback,this.listeners[event])  ==  -1){
    this.listeners[event].push(callback);
  }
}


VectorEditor.prototype.returnRotatedPoint = function(x,y,cx,cy,a){
    // http://mathforum.org/library/drmath/view/63184.html
    
    // radius using distance formula
    var r = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
    // initial angle in relation to center
    var iA = Math.atan2((y-cy),(x-cx)) * (180/Math.PI);

    var nx = r * Math.cos((a + iA)/(180/Math.PI));
    var ny = r * Math.sin((a + iA)/(180/Math.PI));

    return [cx+nx,cy+ny];
}

VectorEditor.prototype.fire = function(event){
  if(this.listeners[event]){
    for(var i = 0; i < this.listeners[event].length; i++){
      if(this.listeners[event][i].apply(this, arguments)===false){
        return false;
      }
    }
  }
}

VectorEditor.prototype.un = function(event, callback){
  if(!this.listeners[event])return;
  var index = 0;
  while((index = this.in_array(callback,this.listeners[event])) != -1){
    this.listeners[event].splice(index,1);
  }
}

//from the vXJS JS Library
VectorEditor.prototype.in_array = function(v,a){
  for(var i=a.length;i--&&a[i]!=v;);
  return i
}

//from vX JS, is it at all strange that I'm using my own work?
VectorEditor.prototype.array_remove = function(e, o){
  var x=this.in_array(e,o);
  x!=-1?o.splice(x,1):0
}


VectorEditor.prototype.is_selected = function(shape){
  return this.in_array(shape, this.selected) != -1;
}

VectorEditor.prototype.set_attr = function(){
  for(var i = 0; i < this.selected.length; i++){
    this.selected[i].attr.apply(this.selected[i], arguments)
  }
}

VectorEditor.prototype.set = function(name, value){
  this.prop[name] = value;
  this.set_attr(name, value);
}

VectorEditor.prototype.onMouseDown = function (x, y, target) {
   
  this.fire("mousedown")
  this.tmpXY = this.onHitXY = [x,y]
  
  if(this.mode == "select" && !this.selectbox){

    var shape_object = null
    if(target.shape_object){
      shape_object = target.shape_object
    }else if(target.parentNode.shape_object){
      shape_object = target.parentNode.shape_object
    }else if(!target.is_tracker){
      if(!this.selectadd) this.unselect();
      this.selectbox = this.draw.rect(x, y, 0, 0)
        .attr({"fill-opacity": 0.15, 
              "stroke-opacity": 0.5, 
              "fill": "#007fff", //mah fav kolur!
              "stroke": "#007fff"});
      return; 
    }else{
      return; //die trackers die!
    }
    
    
    if(this.selectadd){
      this.selectAdd(shape_object);
      this.action = "move";
    }else if(!this.is_selected(shape_object)){
      this.select(shape_object);
      this.action = "move";
    }else{
      this.action = "move";
    }
    this.offsetXY = [shape_object.attr("x") - x,shape_object.attr("y") - y]
    
  }else if(this.mode == "delete" && !this.selectbox){
    var shape_object = null
    if(target.shape_object){
      shape_object = target.shape_object
    }else if(target.parentNode.shape_object){
      shape_object = target.parentNode.shape_object
    }else if(!target.is_tracker){
      this.selectbox = this.draw.rect(x, y, 0, 0)
        .attr({"fill-opacity": 0.15, 
              "stroke-opacity": 0.5, 
              "fill": "#ff0000", //oh noes! its red and gonna asplodes!
              "stroke": "#ff0000"});
      return;
    }else{
      return; //likely tracker
    }
    this.deleteShape(shape_object)
    this.offsetXY = [shape_object.attr("x") - x,shape_object.attr("y") - y]
  }else if(this.selected.length == 0){
    var shape = null;
    if (this.mode == "rect" || this.mode == "rectn" || this.mode == "hrect") {
      shape = this.draw.rect(x, y, 0, 0);
  } else if (this.mode == "ellipse" || this.mode == "ellipsen") {
      shape = this.draw.ellipse(x, y, 0, 0);
  } else if (this.mode == "path" || this.mode == "hpath" || this.mode == "hpath1") {
      shape = this.draw.path("M{0},{1}",x,y)
  } else if (this.mode == "line" || this.mode == "arrowline") {
      shape = this.draw.path("M{0},{1}",x,y)
      shape.subtype = "line"
    } else if (this.mode == "polygon" || this.mode == "FreeHandPolygon") {
      shape = this.draw.path("M{0},{1}",x,y)
      shape.polypoints = [[x,y]]
      shape.subtype = "polygon"
    }
    //else if (this.mode == "bimage") {
    //    shape = this.draw.image("http://localhost:1826/all_folder/hari@gmail.com/Cabinet_jkjk/drawer_dfsfds/Folder_ssssssss/logo.jpg", 0, 0, 1000, 500);
    //}
    else if (this.mode == "image") {
        shape = this.draw.image("/all_folder/g@ggg.com/rubberstamp/output.png", x, y, 0, 0);

        //WARNING NEXT IS A HACK!!!!!!
        //shape.attr("src",this.prop.src); //raphael won't return src correctly otherwise
    }
    else if (this.mode == "stamp") {
    
        var ima = $('#DropDownList1').val() + '.png';
      //  alert($('#LinkButton1').text());
        shape = this.draw.image("/all_folder/" + $('#LinkButton1').text() + "/rubberstamp/" + ima, x, y, 0, 0);

        //WARNING NEXT IS A HACK!!!!!!
        //shape.attr("src",this.prop.src); //raphael won't return src correctly otherwise
    }
    else if (this.mode == "stickimg") {

   
        shape = this.draw.image("/all_folder/" + $('#LinkButton1').text() + "/temper/sticky.png", x, y, 0, 0);

      
    }
    else if (this.mode == "text" || this.mode == "text1") {
        shape = this.draw.text(x, y, this.prop['text']).attr('font-size', 0)
        shape.text = this.prop['text'];
        //WARNING NEXT IS A HACK!!!!!!
        //shape.attr("text",this.prop.text); //raphael won't return src correctly otherwise
    }
    if(shape){
        shape.id = this.generateUUID();
        if (this.mode == "ellipsen" || this.mode == "rectn" || this.mode == "line" || this.mode == "FreeHandPolygon" || this.mode == "hpath" || this.mode == "hpath1") {
            shape.attr({
                "fill": "none",
                "stroke": this.prop.stroke,
                "stroke-width": this.prop['stroke-width'],
                "fill-opacity": this.prop['fill-opacity'],
                "stroke-opacity": this.prop["stroke-opacity"]
            })
        } else if (this.mode == "hrect") {
            shape.attr({
                "fill": this.prop.fill,
                "stroke":"none",
                "stroke-width": "none",
                "fill-opacity": "0.3",
                "stroke-opacity": this.prop["stroke-opacity"]
            })
        }else
        if (this.mode == "arrowline") {
            shape.attr({

                "stroke-width": this.prop['stroke-width'],
                "fill-opacity": this.prop['fill-opacity'],
                "arrow-end": "block-medium-medium",
                "stroke-opacity": this.prop["stroke-opacity"]
            })
        }

        else {
            shape.attr({
                "fill": this.prop.fill,
                "stroke": this.prop.stroke,
                "stroke-width": this.prop["stroke-width"],
                "fill-opacity": this.prop['fill-opacity'],
                "stroke-opacity": this.prop["stroke-opacity"]
            })

        }
      this.addShape(shape)
    }
  }else{
    
  }
  return false;
}

VectorEditor.prototype.onMouseMove = function(x, y, target){


  this.fire("mousemove")
  if(this.mode == "select" || this.mode == "delete"){
    if(this.selectbox){
      this.resize(this.selectbox, x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "select"){
      if(this.action == "move"){
        for(var i = 0; i < this.selected.length; i++){
          this.move(this.selected[i], x - this.tmpXY[0], y - this.tmpXY[1])
        }
        //this.moveTracker(x - this.tmpXY[0], y - this.tmpXY[1])
        this.updateTracker();
        this.tmpXY = [x, y];
        
      }else if(this.action == "rotate"){
        //no multi-rotate
        var box = this.selected[0].getBBox()
        var rad = Math.atan2(y - (box.y + box.height/2), x - (box.x + box.width/2))
        var deg = ((((rad * (180/Math.PI))+90) % 360)+360) % 360;
        this.selected[0].rotate(deg, true); //absolute!
        //this.rotateTracker(deg, (box.x + box.width/2), (box.y + box.height/2))
        this.updateTracker();
      }else if(this.action.substr(0,4) == "path"){
        var num = parseInt(this.action.substr(4))
        var pathsplit = Raphael.parsePathString(this.selected[0].attr("path"))
        if(pathsplit[num]){
          pathsplit[num][1] = x
          pathsplit[num][2] = y
          this.selected[0].attr("path", pathsplit)
          this.updateTracker()
        }
      }else if(this.action == "resize"){
        if(!this.onGrabXY){ //technically a misnomer
            if (this.selected[0].type == "ellipse" || this.selected[0].type == "ellipsen") {
          this.onGrabXY = [
            this.selected[0].attr("cx"),
            this.selected[0].attr("cy")
          ]
          }else if(this.selected[0].type == "path"){
            this.onGrabXY = [
              this.selected[0].getBBox().x,
              this.selected[0].getBBox().y,
              this.selected[0].getBBox().width,
              this.selected[0].getBBox().height
            ]
          }else{
            this.onGrabXY = [
              this.selected[0].attr("x"),
              this.selected[0].attr("y")
            ]
          }
          //this.onGrabBox = this.selected[0].getBBox()
        }
        var box = this.selected[0].getBBox()
        var nxy = this.returnRotatedPoint(x, y, box.x + box.width/2, box.y + box.height/2, -this.selected[0].attr("rotation"))
        x = nxy[0] - 5
        y = nxy[1] - 5
        if (this.selected[0].type == "rect" || this.selected[0].type == "rectn" || this.selected[0].type == "hrect") {
          this.resize(this.selected[0], x - this.onGrabXY[0], y - this.onGrabXY[1], this.onGrabXY[0], this.onGrabXY[1])
        }else if(this.selected[0].type == "image"){
          this.resize(this.selected[0], x - this.onGrabXY[0], y - this.onGrabXY[1], this.onGrabXY[0], this.onGrabXY[1])
        }
        else if (this.selected[0].type == "stamp" || this.selected[0].type == "stickimg") {
            this.resize(this.selected[0], x - this.onGrabXY[0], y - this.onGrabXY[1], this.onGrabXY[0], this.onGrabXY[1])
        }

        else if (this.selected[0].type == "ellipse" || this.selected[0].type == "ellipsen") {
          this.resize(this.selected[0], x - this.onGrabXY[0], y - this.onGrabXY[1], this.onGrabXY[0], this.onGrabXY[1])
        }else if(this.selected[0].type == "text"){
          this.resize(this.selected[0], x - this.onGrabXY[0], y - this.onGrabXY[1], this.onGrabXY[0], this.onGrabXY[1])
        } else if (this.selected[0].type == "path" || this.selected[0].type == "hpath" || this.selected[0].type == "hpath1") {
          this.selected[0].scale((x - this.onGrabXY[0])/this.onGrabXY[2], (y - this.onGrabXY[1])/this.onGrabXY[3], this.onGrabXY[0], this.onGrabXY[1])
        }
        this.newTracker(this.selected[0])
      }
    }
  }else if(this.selected.length == 1){
      if (this.mode == "rect" || this.mode == "rectn" || this.mode == "hrect") {
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }else if(this.mode == "image"){
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    } else if (this.mode == "stamp" || this.mode == "stickimg") {
        this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    }

      


    else if (this.mode == "ellipse" || this.mode == "ellipsen") {
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    
    } else if (this.mode == "text" || this.mode == "text1") {
      this.resize(this.selected[0], x - this.onHitXY[0], y - this.onHitXY[1], this.onHitXY[0], this.onHitXY[1])
    } else if (this.mode == "path" || this.mode == "hpath" || this.mode == "hpath1") {
      //this.selected[0].lineTo(x, y);
      this.selected[0].attr("path", this.selected[0].attrs.path + 'L'+x+' '+y)
  }else if(this.mode == "polygon" || this.mode == "arrowline" || this.mode == "line"|| this.mode == "FreeHandPolygon"){
      //this.selected[0].path[this.selected[0].path.length - 1].arg[0] = x
      //this.selected[0].path[this.selected[0].path.length - 1].arg[1] = y
      //this.selected[0].redraw();
      //var pathsplit = this.selected[0].attr("path").split(" ");
      
      //theres a few freaky bugs that happen due to this new IE capable way that is probably better
    
      var pathsplit = Raphael.parsePathString(this.selected[0].attr("path"))
      if(pathsplit.length > 1){
        //var hack = pathsplit.reverse().slice(3).reverse().join(" ")+' ';
        
        //console.log(pathsplit)
          if (this.mode == "line" || this.mode == "arrowline") {
          //safety measure, the next should work, but in practice, no
          pathsplit.splice(1)
        }else{
          var last = pathsplit[pathsplit.length -1];
          //console.log(this.selected[0].polypoints.length, pathsplit.length)
          if(this.selected[0].polypoints.length < pathsplit.length){
          //if(Math.floor(last[1]) == this.lastpointsX && Math.floor(last[2]) == this.lastpointsY){
            pathsplit.splice(pathsplit.length - 1, 1);
            }
          //}else{
          //  console.log(last[1], last[2], this.lastpointsX, this.lastpointsY)
          //}
        }
        //this.lastpointsX = x; //TO FIX A NASTY UGLY BUG
        //this.lastpointsY = y; //SERIOUSLY
        
        this.selected[0].attr("path", pathsplit.toString() + 'L'+x+' '+y)
        
      }else{
        //console.debug(pathsplit)
        //normally when this executes there's somethign strange that happened
        this.selected[0].attr("path", this.selected[0].attrs.path + 'L'+x+' '+y)
      }
      //this.selected[0].lineTo(x, y)
    }
  }
  
  return false;
}


VectorEditor.prototype.getMarkup = function(){
    return this.draw.canvas.parentNode.innerHTML;
}


VectorEditor.prototype.onDblClick = function(x, y, target){
  this.fire("dblclick")
  if(this.selected.length == 1){
    if(this.selected[0].getBBox().height == 0 && this.selected[0].getBBox().width == 0){
      this.deleteShape(this.selected[0])
    }
    if (this.mode == "polygon" || this.mode == "FreeHandPolygon") {
      //this.selected[0].andClose()
      this.unselect()
    }
  }
  return false;
}



VectorEditor.prototype.onMouseUp = function (x, y, target) {
    this.fire("mouseup")
    this.onGrabXY = null;

    if (this.mode == "select" || this.mode == "delete") {
        if (this.selectbox) {
            var sbox = this.selectbox.getBBox()
            var new_selected = [];
            for (var i = 0; i < this.shapes.length; i++) {
                if (this.rectsIntersect(this.shapes[i].getBBox(), sbox)) {
                    new_selected.push(this.shapes[i])
                }
            }

            if (new_selected.length == 0 || this.selectadd == false) {
                this.unselect()
            }

            if (new_selected.length == 1 && this.selectadd == false) {
                this.select(new_selected[0])
            } else {
                for (var i = 0; i < new_selected.length; i++) {
                    this.selectAdd(new_selected[i])
                }
            }
            if (this.selectbox.node.parentNode) {
                this.selectbox.remove()
            }
            this.selectbox = null;

            if (this.mode == "delete") {
                this.deleteSelection();
              
            }

        } else {
            this.action = "";
        }

    } else if (this.selected.length == 1) {
        if (this.selected[0].getBBox().height == 0 && this.selected[0].getBBox().width == 0) {
            if (this.selected[0].subtype != "polygon" || this.selected[0].subtype != "FreeHandPolygon") {
                this.deleteShape(this.selected[0])
            }
        }
        if (this.mode == "rect" || this.mode == "rectn" || this.mode == "hrect") {
            this.unselect()

            var svg = this.draw.canvas.parentNode.innerHTML;
            $("#svgvalues:text").val(svg);
            //var draw = this.draw;
        } else if (this.mode == "ellipse" || this.mode == "ellipsen") {
            this.unselect()
            //var c = document.getElementById("myCanvas");
            //var ctx = c.getContext("2d");
            //var img = document.getElementById("canvas");
            //ctx.drawImage(img, 30, 5);


            var svg = this.draw.canvas.parentNode.innerHTML;
            $("#svgvalues:text").val(svg);

            //alert($("#svgvalues:text").val(svg));
            //$("#imgoriginal").html(svg);
            //var ss = window.location.href.split("?");
            //alert('Image.aspx?editor=imgoriginal&' + ss[1]) ;
            //window.location = 'Image.aspx?editor=imgoriginal&' + ss[1] ;




            // var svg_xml = (new XMLSerializer).serializeToString(svg);
            //    alert(svg);
            //  copies();
            //canvas.toDataURL("image/png");
            //header('Content-Type: image/png');
            //header('Content-Disposition: attachment;filename="chart.png"');
            //header('Cache-Control: max-age=0');
            //exit;
            //var img = document.getElementById("imgoriginal");
            //img.setAttribute("src", "data:image/svg+xml;base64," + window.btoa(svg));

         
            //var data = new FormData();
            //data.append("data", svg);
            //alert(data.valueOf("data"));
            //var xhr = (window.XMLHttpRequest) ? new XMLHttpRequest() : new activeXObject("Microsoft.XMLHTTP");
            //xhr.open('post', 'Image.aspx', true);
            //xhr.send(data);


     


        } else if (this.mode == "path" || this.mode == "hpath" || this.mode == "hpath1") {
            this.unselect()
            var svg = this.draw.canvas.parentNode.innerHTML;
            $("#svgvalues:text").val(svg);
        } else if (this.mode == "line" || this.mode == "arrowline") {
            this.unselect()
            var svg = this.draw.canvas.parentNode.innerHTML;
            $("#svgvalues:text").val(svg);
        } else if (this.mode == "image" || this.mode == "stamp" || this.mode == "stickimg") {
            this.unselect()
            var svg = this.draw.canvas.parentNode.innerHTML;
            $("#svgvalues:text").val(svg);
        } else if (this.mode == "text" || this.mode == "text1") {
            this.unselect()
            var svg = this.draw.canvas.parentNode.innerHTML;
            $("#svgvalues:text").val(svg);
        } else if (this.mode == "polygon" || this.selected[0].subtype != "FreeHandPolygon") {
            //this.selected[0].lineTo(x, y)
            this.selected[0].attr("path", this.selected[0].attrs.path + 'L' + x + ' ' + y)
            if (!this.selected[0].polypoints) this.selected[0].polypoints = [];
            this.selected[0].polypoints.push([x, y])
            var svg = this.draw.canvas.parentNode.innerHTML;
            $("#svgvalues:text").val(svg);
        }
        if (this.mode == "delete") {
           
            var svg = this.draw.canvas.parentNode.innerHTML;
            $("#svgvalues:text").val(svg);
           
        }
    }
    if (this.lastmode) {
        this.setMode(this.lastmode);
        //this.mode = this.lastmode //not selectmode becasue that unselects
        delete this.lastmode; var svg = this.draw.canvas.parentNode.innerHTML;
        $("#svgvalues:text").val(svg);
        alert(svg);
    }
    return false;
}
//end editor
//image script not a editor.

function stampdel() {

    var lin = window.location.href.split('?');
    window.location = 'Image.aspx?' + lin[1] + '&stamp=del';
}



//function sd()
//{
   
//        var dialog, form,

//      password = $("#stamptext"),
//      allFields = $([]).add(password),
//      tips = $(".validateTips");

//        function updateTips(t) {
//            tips
//          .text(t)
//          .addClass("ui-state-highlight");
//            setTimeout(function () {
//                tips.removeClass("ui-state-highlight", 1500);
//            }, 500);
//        }

//        function checkLength(o, n, min, max) {
//            if (o.val().length > max || o.val().length < min) {
//                o.addClass("ui-state-error");
//                updateTips("Length of " + n + " must be between " +
//              min + " and " + max + ".");
//                return false;
//            } else {
//                return true;
//            }
//        }

//        function checkRegexp(o, regexp, n) {
//            if (!(regexp.test(o.val()))) {
//                o.addClass("ui-state-error");
//                updateTips(n);
//                return false;
//            } else {
//                return true;
//            }
//        }

//        function addUser() {

//            var valid = true;

//            if(password.val()!="")
//                {
//            if (valid) {
//                $("#users tbody").append("<tr>" +
//                  "<td>" + password.val() + "</td>" +
//                "</tr>");
//                //alert(password.val());
//               var stp = '<svg xmlns = "http://www.w3.org/2000/svg" version = "1.1" width = "106%"  height = "110%" > < rect  width = "603.9256"  height = "214.5594"   x = "125.90062"  y = "19.035069" transform = "matrix(0.9795658,0.20112396,-0.36164378,0.93231635,0,0)"  id = "rect2998" style = "opacity:0.61061946;fill:none;fill-opacity:1;stroke:#308233;stroke-width:71.43535614;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" />< text x = "385.15317" y = "163.06389"  transform = "matrix(0.98097318,0.20841091,-0.26542014,0.9630065,0,0)" id = "text3000" xml: space = "preserve" style = "font-size:70.75537109px;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;line-height:461.99989319%;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;font-family:Times New Roman;-inkscape-font-specification:Times New Roman"  linespacing = "461.99989%" >< tspan  x = "385.57767"  y = "163.06389" id = "tspan3002" style = "font-size:120.44412231px;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;text-align:center;line-height:461.99989319%;letter-spacing:0.84906477px;writing-mode:lr-tb;text-anchor:middle;font-family:Times New Roman;-inkscape-font-specification:Times New Roman" > textsvg </ tspan ></ text ></ svg >';
//                   $("#rubberstampsvg").val(stp);
//               // alert( $("#rubberstampsvg:text").val());
//                    var lin = window.location.href.split('?');
//                    window.location = 'Image.aspx?'+lin[1]+'&stamptext=' + password.val(); 
//                dialog.dialog("close");
                
//            }
//            return valid;

//            } else {
//                alert("Text Can't be blank");
//            }
//        }

//        dialog = $("#dialog-form1").dialog({
//            autoOpen: false,
//            height: 250,
//            width: 350,
//            modal: true,
//            buttons: {
//                "Ok": addUser,
//                Cancel: function () {
//                    dialog.dialog("close");
//                }
//            },
//            close: function () {
//                form[0].reset();
//                allFields.removeClass("ui-state-error");
//            }
//        });

//        form = dialog.find("form").on("submit", function (event) {
//            event.preventDefault();
//            addUser();
//        });

//        dialog.dialog("open");

   
//}



