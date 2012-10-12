var BLACK = 'black';
var RED = 'red';

var Die = function(obj) {
  this.obj = obj;
  this.value = 1;
}

Die.prototype = {
  roll: function() {
    this.obj.removeAttr('disabled');
    var nv, last, x;
    nv = Math.round(Math.random() * 5 + 1);

    var w = 49;
    nv = Math.round(Math.random() * 5 + 1);

    x = -nv * w + 48
    this.obj.css('background-position-x', x + 'px');
    this.value = nv;
  }
  
};

var Checker = function(id, color, html) {
  this.id = id;
  this.color = color;
  this.obj = $(html);
  this.last_point = null;
  var c = this;
}

Checker.prototype = {
  init: function() {
    var c = this;
    this.obj.draggable({ 
      snap: '.board-point-block', 
      snapMode: "outer",
      start: function() {
        c.start_x = c.obj.position().left;
        c.start_y = c.obj.position().top;
      },
      stop: function() {
        var x = c.obj.position().left + 25;
        var y = c.obj.position().top + 25;

        var point = the_board.get_point_at(x, y);
        //var point = the_board.get_point_by_id(24);
        if (point == null) {
          c.obj.animate({top: c.start_y, left: c.start_x}, 500);
        } else {
          if(point.can_accept(c)) {
            if (point.has_blot(c.color)) {
              var blot = point.checkers[0];
              point.checkers = [];
              var jail = the_board[blot.color + '_jail'];
              jail.add(blot);
              if (blot.color == BLACK)
                blot.obj.animate({top: jail.obj.position().top, left: jail.obj.position().left}, 500);
              else
                blot.obj.animate({top: jail.obj.position().top + 200, left: jail.obj.position().left}, 500);
            }
            var tmp = c.last_point.id;
            c.last_point.remove_checker(c.id)
            point.add_checker(c);
            if (Math.abs(tmp - point.id) == die1.value) {
              die1.value = 0;
              die1.obj.attr('disabled', 'disabled');
            } else if (Math.abs(tmp - point.id) == die2.value) {
              die2.value = 0;
              die2.obj.attr('disabled', 'disabled');
            } else {
              die1.value = 0;
              die1.obj.attr('disabled', 'disabled');
              die2.value = 0;
              die2.obj.attr('disabled', 'disabled');
            }
          } else {
            c.obj.animate({top: c.start_y, left: c.start_x}, 500);
          }
        }
      }
    });
  }
};

var Point = function(id, html) {
  this.id = id;
  this.obj = $(html);
  this.checkers = [];
}

Point.prototype = {
  add_checker: function(checker, animate) {
    if (animate == undefined) {
      animate = true;
    }
    var i,
        new_y,
        len = this.checkers.length, 
        top = this.obj.hasClass('top'),
        x = this.obj.position().left,
        y = this.obj.position().top;
        
    this.checkers.push(checker);
    the_board.field.append(checker.obj);
    if (top) {
      new_y = y + (50 * len);
    } else {
      new_y = y + 200 - (50 * len);
    }
    if (animate) {
      checker.obj.animate({top: new_y, left: x}, 500, 'linear', function() {the_board.validate(checker.color);});
    } else {
      checker.obj.animate({top: new_y, left: x}, -1);
    }
    checker.last_point = this;
    
  },
  remove_checker: function(id) {
    var i, c, len = this.checkers.length, tmp = [];
    for (i = 0; i < len; i++) {
      c = this.checkers[i];
      if (c.id == id) {
        continue;
      }
      tmp.push(c);
    }
    this.checkers = tmp;
  },
  can_accept: function(c) {
    var len = this.checkers.length;
    if (len != 1 && len != 0 && this.checkers[0].color != c.color) {
      return false;
    }
    
    if (c.color == BLACK && (c.last_point.id == 25 || c.last_point.id < this.id)) {
        if (c.last_point.id == (this.id - die1.value))
          return true;
        if (c.last_point.id == (this.id - die2.value))
          return true;        
        if(c.last_point.id == (this.id - die1.value - die2.value))
          return true;
    } else if (c.color == RED && (c.last_point.id == 0 || c.last_point.id > this.id)) {
        if (c.last_point.id == (this.id + die1.value))
          return true;
        if (c.last_point.id == (this.id + die2.value))
          return true;        
        if(c.last_point.id == (this.id + die1.value + die2.value))
          return true;
    }
    
    return false;
  },
  has_blot: function(hiting_color) {
    return this.checkers.length == 1 && this.checkers[0].color != hiting_color;
  }
}

var Jail = function(html) {
  this.obj = $(html);
  this.checkers = [];
}
Jail.prototype = {
  add: function(c) {
    if (c.color == BLACK)
      c.last_point = new Point(25, '');
    if (c.color == RED)
      c.last_point = new Point(0, '');
    this.checkers.push(c);
  }
};
var Board = function() {
  this.points = [];
  this.field = $('#field');
}

Board.prototype = {
  validate: function(color) {
    $('.checker').draggable('disable');
    if (color == undefined) 
      return
    if (color == BLACK && this.black_jail.checkers.length > 0) {
      var len = this.black_jail.checkers.length;
      this.black_jail.checkers[len - 1].obj.draggable('enable');
      return;
    }
    if (color == RED && this.red_jail.checkers.length > 0) {
      var len = this.red_jail.checkers.length;
      this.red_jail.checkers[len - 1].obj.draggable('enable');
      return;
    }
    var i, p, c, len = this.points.length, available_points;
    for (i = 0; i < len; i++) {
      p = this.points[i];
      if (p.checkers.length == 0) 
        continue
      c = p.checkers[p.checkers.length - 1]
      if (c.color != color)
        continue
      
      available_points = this.get_available_moves_for(c);
      if (available_points.length > 0) {
        c.obj.draggable('enable');
      }
    }
  },
  get_available_moves_for: function(c) {
    var i, p,
        valid = [], 
        curr = c.last_point.id,
        len = this.points.length;
    
    for(i = 0; i < len; i++) {
      p = this.points[i];
      var b = p.can_accept(c);
      if (!b)
        continue;
      valid.push(p)
    }
    
    return valid;
  },
  init: function() {
    var i = 13;
    var tmp;
    for(; i <= 18; i++) {
      this.init_point(i);
    }
    this.black_jail = new Jail('<div class="board-point-block board-frame" sytle="width: 40px"></div>');
    this.field.append(this.black_jail.obj);
    for(i = 19; i <= 24; i++) {
      this.init_point(i);
    }
    
    //bottom line
    for(i = 12; i >= 7; i--) {
      this.init_point(i);
    }
    this.red_jail = new Jail('<div class="board-point-block board-frame" sytle="width: 40px"></div>');
    this.field.append(this.red_jail.obj);
    for(i = 6; i >= 1; i--) {
      this.init_point(i);
    }
  },
  init_point: function(i) {
    var side = 'top';
    if (i < 13) {
      side = 'bottom';
    }
      
    if (i % 2 == 0) {
      tmp = new Point(i, '<div id="point-' + i + '" class="board-point-block point-' + side + '-even ' + side + '"></div>');
      this.field.append(tmp.obj);
    } else {
      tmp = new Point(i, '<div id="point-' + i + '" class="board-point-block point-' + side + '-odd ' + side + '"></div>');
      this.field.append(tmp.obj);
    }
    this.points.push(tmp);
    
  },
  init_checkers: function() {
    //init black checkers
    p = this.get_point_by_id(1);
    for (i = 0; i < 2; i++) {
      c = new Checker(i, BLACK, '<img id="black-' + i+ '" src="images/checker_black.png" class="checker" />');
      p.add_checker(c, false);
      c.init();
    }
    p = this.get_point_by_id(12);
    for (; i < 7; i++) {
      c = new Checker(i, BLACK, '<img id="black-' + i+ '" src="images/checker_black.png" class="checker" />');
      p.add_checker(c, false);
      c.init();
    }
    p = this.get_point_by_id(17);
    for (; i < 10; i++) {
      c = new Checker(i, BLACK, '<img id="black-' + i+ '" src="images/checker_black.png" class="checker" />');
      p.add_checker(c, false);
      c.init();
    }
    p = this.get_point_by_id(19);
    for (; i < 15; i++) {
      c = new Checker(i, BLACK, '<img id="black-' + i+ '" src="images/checker_black.png" class="checker" />');
      p.add_checker(c, false);
      c.init();
    }
    //Init red checkers
    var c, p = this.get_point_by_id(24);
    for (i = 0; i < 2; i++) {
      c = new Checker(i, RED, '<img id="red-' + i+ '" src="images/checker_red.png" class="checker" />');
      p.add_checker(c, false);
      c.init();
    }
    p = this.get_point_by_id(13);
    for (; i < 7; i++) {
      c = new Checker(i, RED, '<img id="red-' + i+ '" src="images/checker_red.png" class="checker" />');
      p.add_checker(c, false);
      c.init();
    }
    p = this.get_point_by_id(8);
    for (; i < 10; i++) {
      c = new Checker(i, RED, '<img id="red-' + i+ '" src="images/checker_red.png" class="checker" />');
      p.add_checker(c, false);
      c.init();
    }
    p = this.get_point_by_id(6);
    for (; i < 15; i++) {
      c = new Checker(i, RED, '<img id="red-' + i+ '" src="images/checker_red.png" class="checker" />');
      p.add_checker(c, false);
      c.init();
    }
  },
  get_point_at: function(x, y) {
    var i, p, w = 50, h = 250;
    for(i = 0; i < this.points.length; i++) {
      
      p = this.points[i].obj.position();
      if (p.left < x && p.left + w > x) {
        if (p.top < y && p.top + h > y) {
          return this.points[i];
        }
      }
    }
  },
  
  get_point_by_id: function(id) {
  var i, p;
  for(i = 0; i < this.points.length; i++) {
    p = this.points[i];
    if (p.id == id) {
      return p;
    }
  }
}
  
};